import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, symptoms, fishType, pondInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch known diseases from DB for reference
    const { data: diseases } = await supabase
      .from("fish_diseases")
      .select("name, name_en, category, severity, symptoms, causes, prevention, treatment, affected_fish, season")
      .eq("is_active", true);

    const diseaseReference = (diseases || []).map(d =>
      `- ${d.name} (${d.name_en}): লক্ষণ: ${(d.symptoms || []).join(', ')}; তীব্রতা: ${d.severity}; ক্যাটাগরি: ${d.category}; প্রতিকার: ${JSON.stringify(d.treatment)}`
    ).join("\n");

    // Fetch recommended products for diseases
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, discount_percentage, image_url, category")
      .gt("stock_quantity", 0)
      .limit(30);

    const productList = (products || []).map(p => {
      const dp = p.discount_percentage && p.discount_percentage > 0
        ? Math.round(p.price * (1 - p.discount_percentage / 100))
        : p.price;
      return `- ID:${p.id} | ${p.name} | ৳${dp} | ${p.category}`;
    }).join("\n");

    const systemPrompt = `You are an expert aquaculture veterinary AI assistant for Bangladeshi fish farmers. Your task is to analyze fish disease symptoms (and optionally images) and provide a comprehensive diagnosis.

## Known Disease Database
${diseaseReference}

## Available Products for Treatment
${productList}

## Response Format (MUST be valid JSON)
Respond ONLY with a JSON object (no markdown, no backticks) in this exact format:
{
  "detected_diseases": [
    {
      "name": "রোগের নাম (বাংলা)",
      "name_en": "Disease Name (English)",
      "confidence": 85,
      "severity": "high/medium/low",
      "description": "রোগ সম্পর্কে বিস্তারিত বর্ণনা বাংলায়",
      "symptoms_matched": ["লক্ষণ ১", "লক্ষণ ২"],
      "causes": ["কারণ ১", "কারণ ২"],
      "treatment": [
        {"method": "চিকিৎসা পদ্ধতি", "dosage": "মাত্রা", "duration": "সময়কাল"}
      ],
      "prevention": ["প্রতিরোধ ১", "প্রতিরোধ ২"],
      "recommended_product_ids": ["product-uuid-1"],
      "urgency": "immediate/soon/routine"
    }
  ],
  "general_advice": "সামগ্রিক পরামর্শ বাংলায়",
  "water_quality_tips": "পানির গুণমান সম্পর্কে পরামর্শ",
  "feeding_advice": "খাদ্য ব্যবস্থাপনা পরামর্শ"
}

## Rules
- ALWAYS respond in Bengali (বাংলা) for descriptions and advice
- Match symptoms against the known disease database first
- Provide confidence percentage (0-100) for each disease
- If image is provided, analyze visual signs (spots, color changes, lesions, fin rot, etc.)
- Recommend products from the available list when applicable
- If unsure, say so honestly and suggest consulting a local fisheries officer
- Consider fish type, pond conditions, and season in your diagnosis`;

    const userContent: any[] = [];

    // Build user message
    let textPrompt = "";
    if (symptoms && symptoms.length > 0) {
      textPrompt += `লক্ষণসমূহ: ${symptoms.join(", ")}\n`;
    }
    if (fishType) {
      textPrompt += `মাছের প্রজাতি: ${fishType}\n`;
    }
    if (pondInfo) {
      textPrompt += `পুকুরের তথ্য: ${pondInfo}\n`;
    }
    if (!textPrompt && !imageBase64) {
      textPrompt = "আমার মাছের সমস্যা শনাক্ত করুন।";
    }

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` }
      });
      textPrompt += "\nউপরের ছবি বিশ্লেষণ করে মাছের রোগ শনাক্ত করুন।";
    }

    userContent.push({ type: "text", text: textPrompt });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "সার্ভিস সাময়িকভাবে অনুপলব্ধ।" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse AI response" };
    } catch {
      result = { raw_response: content, error: "Failed to parse structured response" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("disease-detect error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
