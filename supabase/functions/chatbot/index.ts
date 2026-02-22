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
    const { messages, currentPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch products from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, discount_percentage, category, image_url, stock_quantity, description, unit")
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(50);

    const productCatalog = (products || []).map(p => {
      const discountedPrice = p.discount_percentage > 0
        ? Math.round(p.price * (1 - p.discount_percentage / 100))
        : p.price;
      return `- ID: ${p.id} | নাম: ${p.name} | দাম: ৳${discountedPrice}${p.discount_percentage > 0 ? ` (${p.discount_percentage}% ছাড়, আসল ৳${p.price})` : ''} | ক্যাটাগরি: ${p.category} | স্টক: ${p.stock_quantity} ${p.unit || 'pcs'} | বিবরণ: ${(p.description || '').slice(0, 80)}`;
    }).join("\n");

    const systemPrompt = `You are "FishCare Smart AI", the intelligent customer support chatbot for FishCare BD (ফিশকেয়ার বিডি) — https://fishcare.com.bd/

## Your Identity
- Name: FishCare Smart AI
- Role: Sales assistant, customer support, and aquaculture advisor
- Tone: Friendly, professional, helpful, always in Bengali unless user writes in English

## Company Info
- FishCare BD is Bangladesh's leading aquaculture e-commerce platform
- Located in Jessore, Bangladesh
- Sells: fish feed, medicines, vitamins, aquarium products, farming equipment & supplies
- Serves customers across Bangladesh
- Payment: bKash, Nagad, Rocket, bank transfer, Cash on Delivery (COD)
- Delivery: 2-5 business days nationwide
- Return: 7-day return policy
- Support hours: 9 AM – 10 PM daily

## Current Page Context
The user is currently on: ${currentPage || "/"}
Tailor your responses based on their current page context.

## PRODUCT CATALOG (Real-time from database)
${productCatalog || "No products available currently."}

## CRITICAL: Product Card Display Format
When recommending or mentioning specific products, you MUST use this exact format to display product cards:
\`\`\`
[PRODUCT_CARD:product_id]
\`\`\`

For example, if recommending a product with ID "abc-123", write:
[PRODUCT_CARD:abc-123]

You can show multiple product cards. Always show product cards when:
1. User asks about products, prices, or recommendations
2. You suggest a product
3. User asks what's available
4. User asks about a specific category

Add a short description before/after the product cards. Do NOT write the product name/price in text if you're showing the card - the card will display all info.

## Key Responsibilities
1. **Sales**: Recommend products using PRODUCT_CARD format, highlight offers, guide to purchase
2. **Support**: Answer queries about orders, delivery, payment, returns
3. **Advisor**: Provide fish farming tips, feed recommendations, disease advice
4. **Lead Capture**: For bulk orders/farm setup inquiries, ask for name & phone number
5. **Checkout Rescue**: If on checkout page, help complete the order
6. **Upsell**: Suggest complementary products when appropriate

## Quick Keyword Responses
When user mentions these topics, respond with relevant info:
- দাম/মূল্য/price → Show relevant product cards with prices
- মাছের খাবার/feed → Ask fish type, show feed product cards
- অ্যাকুরিয়াম/aquarium → Show aquarium product cards
- ডেলিভারি/delivery → 2-5 business days nationwide
- রিটার্ন/return → 7-day return policy
- পেমেন্ট/payment → bKash, Nagad, Rocket, bank transfer supported
- স্টক/available → Check catalog and show product cards
- অর্ডার/buy → Show relevant product cards with buy links

## Rules
- ALWAYS respond in the same language as the user (Bengali or English)
- Keep responses concise (2-4 sentences max unless detailed explanation needed)
- Use emojis sparingly for friendliness
- Use PRODUCT_CARD format for ANY product mention - never just list product names/prices in text
- For bulk orders, capture lead info (name + phone)
- Be proactive in suggesting products and solutions
- If a product is not in the catalog, say it's not currently available`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "সার্ভিস সাময়িকভাবে অনুপলব্ধ।" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
