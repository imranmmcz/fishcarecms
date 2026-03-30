import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_number, phone, action } = await req.json();

    if (!order_number || !phone) {
      return new Response(
        JSON.stringify({ error: "অর্ডার নম্বর এবং ফোন নম্বর প্রয়োজন" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clean phone number
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("88")) cleanPhone = cleanPhone.substring(2);
    if (!cleanPhone.startsWith("0")) cleanPhone = "0" + cleanPhone;

    // Find order matching number and phone
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, status, payment_method, payment_status, total_amount, shipping_cost, created_at, updated_at")
      .eq("order_number", order_number.trim().toUpperCase())
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "অর্ডার পাওয়া যায়নি। অর্ডার নম্বর চেক করুন।" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify phone matches (check various formats)
    const { data: orderFull } = await supabase
      .from("orders")
      .select("customer_phone")
      .eq("id", order.id)
      .single();

    if (orderFull) {
      let orderPhone = orderFull.customer_phone.replace(/[^0-9]/g, "");
      if (orderPhone.startsWith("88")) orderPhone = orderPhone.substring(2);
      if (!orderPhone.startsWith("0")) orderPhone = "0" + orderPhone;

      if (orderPhone !== cleanPhone) {
        return new Response(
          JSON.stringify({ error: "ফোন নম্বর মেলেনি। সঠিক ফোন নম্বর দিন।" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle cancel action
    if (action === "cancel") {
      if (order.status !== "pending") {
        return new Response(
          JSON.stringify({ error: "শুধুমাত্র পেন্ডিং অর্ডার বাতিল করা যায়" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "অর্ডার বাতিল করতে সমস্যা হয়েছে" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, message: "অর্ডার সফলভাবে বাতিল করা হয়েছে" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get order items
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price, total_price, product_image")
      .eq("order_id", order.id);

    // Get Steadfast consignment if exists
    const { data: consignment } = await supabase
      .from("steadfast_consignments")
      .select("consignment_id, tracking_code, status, delivery_status, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        order: {
          order_number: order.order_number,
          customer_name: order.customer_name,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          total_amount: order.total_amount,
          shipping_cost: order.shipping_cost,
          created_at: order.created_at,
          updated_at: order.updated_at,
        },
        items: items || [],
        tracking: consignment || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Track order error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
