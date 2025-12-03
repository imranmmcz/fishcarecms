import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `আপনি একজন বিশেষজ্ঞ মৎস্য পরামর্শদাতা। বাংলাদেশের মাছ চাষ সম্পর্কে সকল প্রশ্নের উত্তর দিন।

আপনার দক্ষতা:
- মাছের রোগ নির্ণয় ও চিকিৎসা
- পুকুর ব্যবস্থাপনা ও পানির গুণমান
- খাবার ব্যবস্থাপনা ও পুষ্টি
- স্টকিং ডেনসিটি ও পলিকালচার
- মৌসুমি পরামর্শ
- সার ও চুন প্রয়োগ
- লাভজনক মাছ চাষের কৌশল

নির্দেশনা:
- বাংলায় উত্তর দিন
- সংক্ষিপ্ত কিন্তু তথ্যবহুল উত্তর দিন
- প্রয়োজনে ডোজ, পরিমাণ ও সময়সীমা উল্লেখ করুন
- বাংলাদেশের প্রেক্ষাপটে উত্তর দিন
- মাছ চাষ সম্পর্কিত নয় এমন প্রশ্নে বলুন যে আপনি শুধু মাছ চাষ বিষয়ে সাহায্য করতে পারেন`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনেক বেশি অনুরোধ। কিছুক্ষণ পর আবার চেষ্টা করুন।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "ক্রেডিট শেষ। অনুগ্রহ করে ক্রেডিট যোগ করুন।" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI সার্ভিসে সমস্যা হয়েছে" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Fish advice chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
