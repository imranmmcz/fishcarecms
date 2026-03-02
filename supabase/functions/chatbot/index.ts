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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch chatbot settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .like("setting_key", "chatbot_%");

    const chatSettings: Record<string, string> = {};
    (settingsData || []).forEach((s: any) => {
      if (s.setting_value !== null) chatSettings[s.setting_key] = s.setting_value;
    });

    const botName = chatSettings.chatbot_name || "FishCare Smart AI";
    const companyName = chatSettings.chatbot_company_name || "FishCare BD";
    const companyInfo = chatSettings.chatbot_company_info || "Bangladesh's leading aquaculture e-commerce platform. Located in Jessore. Payment: bKash, Nagad, Rocket, COD. Delivery: 2-5 business days. Return: 7-day policy. Support: 9 AM – 10 PM daily.";
    const aiModel = chatSettings.chatbot_model || "google/gemini-3-flash-preview";
    const maxProducts = parseInt(chatSettings.chatbot_max_products || "50", 10);
    const customPrompt = chatSettings.chatbot_system_prompt || "";

    // Fetch products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, discount_percentage, category, image_url, stock_quantity, description, unit")
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(maxProducts);

    const productCatalog = (products || []).map(p => {
      const discountedPrice = p.discount_percentage > 0
        ? Math.round(p.price * (1 - p.discount_percentage / 100))
        : p.price;
      return `- ID: ${p.id} | নাম: ${p.name} | দাম: ৳${discountedPrice}${p.discount_percentage > 0 ? ` (${p.discount_percentage}% ছাড়, আসল ৳${p.price})` : ''} | ক্যাটাগরি: ${p.category} | স্টক: ${p.stock_quantity} ${p.unit || 'pcs'}`;
    }).join("\n");

    // Check if user is asking about an order
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const orderNumberMatch = lastUserMessage.match(/ORD-\d{8}-\d{4}/i);
    let orderInfo = "";

    if (orderNumberMatch) {
      const orderNumber = orderNumberMatch[0].toUpperCase();
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      if (order) {
        const statusMap: Record<string, string> = {
          pending: "অপেক্ষমান", processing: "প্রসেসিং", shipped: "শিপ করা হয়েছে",
          delivered: "ডেলিভারি সম্পন্ন", cancelled: "বাতিল", confirmed: "নিশ্চিত",
        };
        const paymentStatusMap: Record<string, string> = {
          pending: "অপেক্ষমান", paid: "পেইড", failed: "ব্যর্থ", refunded: "রিফান্ড",
        };

        const { data: items } = await supabase
          .from("order_items")
          .select("product_name, quantity, unit_price, total_price")
          .eq("order_id", order.id);

        const itemsList = (items || []).map(it => `${it.product_name} x${it.quantity} = ৳${it.total_price}`).join(", ");

        orderInfo = `
## ORDER FOUND IN DATABASE
Order Number: ${order.order_number}
Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Status: ${statusMap[order.status] || order.status}
Payment Method: ${order.payment_method}
Payment Status: ${paymentStatusMap[order.payment_status] || order.payment_status}
Total: ৳${order.total_amount}
Shipping: ৳${order.shipping_cost}
Address: ${order.shipping_address}${order.division ? `, ${order.division}` : ''}${order.district ? `, ${order.district}` : ''}
Order Date: ${new Date(order.created_at).toLocaleDateString('bn-BD')}
Items: ${itemsList}

IMPORTANT: When showing this order info, use this exact format:
[ORDER_TRACK:${order.order_number}]

Then add a brief summary in Bengali about the order status.`;
      } else {
        orderInfo = `\n## ORDER NOT FOUND\nThe order number "${orderNumber}" was not found in the database. Tell the user politely that this order number was not found and ask them to double-check.`;
      }
    }

    const systemPrompt = `You are "${botName}", the intelligent customer support chatbot for ${companyName}.

## Your Identity
- Name: ${botName}
- Role: Sales assistant, customer support, and aquaculture advisor
- Tone: Friendly, professional, helpful, always in Bengali unless user writes in English

## Company Info
${companyInfo}

## Current Page Context
The user is currently on: ${currentPage || "/"}

## PRODUCT CATALOG (Real-time)
${productCatalog || "No products available."}

## Product Card Format
When recommending products, use: [PRODUCT_CARD:product_id]

## ORDER TRACKING
When a user asks about their order status, they should provide their order number (format: ORD-YYYYMMDD-XXXX).
If they haven't provided an order number, ask them for it.
When displaying order info, use: [ORDER_TRACK:order_number]
${orderInfo}

## Key Responsibilities
1. **Sales**: Recommend products using PRODUCT_CARD format
2. **Support**: Answer queries about orders, delivery, payment, returns
3. **Order Tracking**: Help users track their orders using order numbers
4. **Advisor**: Fish farming tips, feed recommendations, disease advice
5. **Lead Capture**: For bulk orders, ask for name & phone
6. **Checkout Rescue**: Help complete orders on checkout page
7. **Upsell**: Suggest complementary products

## Rules
- ALWAYS respond in the same language as the user
- Keep responses concise (2-4 sentences)
- Use PRODUCT_CARD for products, ORDER_TRACK for orders
- Never make up order statuses or product info
- For order tracking without a number, ask: "আপনার অর্ডার নম্বরটি দিন (যেমন: ORD-20260222-0001)"
${customPrompt ? `\n## Additional Instructions\n${customPrompt}` : ''}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiModel,
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
