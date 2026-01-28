import { supabase } from "@/integrations/supabase/client";

interface OrderEmailData {
  to: string;
  template_type: "order_confirmation" | "order_status_update" | "shipping_notification";
  order_number: string;
  customer_name: string;
  order_status?: string;
  tracking_number?: string;
  courier_name?: string;
  tracking_url?: string;
  estimated_delivery?: string;
  order_items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total_amount?: number;
}

/**
 * Send order notification email using SMTP settings configured in admin panel
 */
export const sendOrderEmail = async (data: OrderEmailData): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-order-email", {
      body: data,
    });

    if (error) {
      console.error("Error invoking send-order-email function:", error);
      return { success: false, message: error.message };
    }

    return result || { success: false, message: "No response from email function" };
  } catch (error) {
    console.error("Error sending order email:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderItems: Array<{ name: string; quantity: number; price: number }>,
  totalAmount: number
): Promise<{ success: boolean; message?: string }> => {
  return sendOrderEmail({
    to: customerEmail,
    template_type: "order_confirmation",
    order_number: orderNumber,
    customer_name: customerName,
    order_items: orderItems,
    total_amount: totalAmount,
  });
};

/**
 * Send order status update email
 */
export const sendOrderStatusEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderStatus: string
): Promise<{ success: boolean; message?: string }> => {
  return sendOrderEmail({
    to: customerEmail,
    template_type: "order_status_update",
    order_number: orderNumber,
    customer_name: customerName,
    order_status: orderStatus,
  });
};

/**
 * Send shipping notification email with tracking info
 */
export const sendShippingNotificationEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  courierName?: string,
  trackingUrl?: string,
  estimatedDelivery?: string
): Promise<{ success: boolean; message?: string }> => {
  return sendOrderEmail({
    to: customerEmail,
    template_type: "shipping_notification",
    order_number: orderNumber,
    customer_name: customerName,
    tracking_number: trackingNumber,
    courier_name: courierName,
    tracking_url: trackingUrl,
    estimated_delivery: estimatedDelivery,
  });
};
