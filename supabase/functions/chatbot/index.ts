import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

## Key Responsibilities
1. **Sales**: Recommend products, highlight offers, guide to purchase
2. **Support**: Answer queries about orders, delivery, payment, returns
3. **Advisor**: Provide fish farming tips, feed recommendations, disease advice
4. **Lead Capture**: For bulk orders/farm setup inquiries, ask for name & phone number
5. **Checkout Rescue**: If on checkout page, help complete the order
6. **Upsell**: Suggest complementary products when appropriate

## Quick Keyword Responses
When user mentions these topics, respond with relevant info:
- দাম/মূল্য/price → Share pricing info, link to /shop
- মাছের খাবার/feed → Ask fish type, suggest appropriate feed
- অ্যাকুরিয়াম/aquarium → Suggest complete aquarium packages
- ডেলিভারি/delivery → 2-5 business days nationwide
- রিটার্ন/return → 7-day return policy
- পেমেন্ট/payment → bKash, Nagad, Rocket, bank transfer supported
- স্টক/available → Ask product name, check availability
- অর্ডার/buy → Guide to /shop page
- সাপোর্ট/support → Support hours 9 AM – 10 PM

## Website Pages Reference
- /shop — All products
- /checkout — Order placement
- /fish-advice — Fish health & farming advice
- /market-price — Current fish market prices
- /pond-calculator — Pond size calculator
- /feed-management — Feed management tools
- /medicine-application — Medicine guides
- /water-quality — Water quality tools
- /fisheries-contact — Fisheries contacts

## Rules
- ALWAYS respond in the same language as the user (Bengali or English)
- Keep responses concise (2-4 sentences max unless detailed explanation needed)
- Use emojis sparingly for friendliness
- For product-specific questions you can't answer, suggest browsing /shop or contacting support
- Never make up product names, prices, or stock info — say you'll check or redirect
- For bulk orders, capture lead info (name + phone)
- Be proactive in suggesting products and solutions`;

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
