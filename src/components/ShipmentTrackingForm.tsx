/**
 * Shipment Tracking Form Component
 * Admin panel-এ কুরিয়ার তথ্য ও ট্র্যাকিং নম্বর যোগ করার ফর্ম
 */

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient, CourierService, Order } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Truck, ExternalLink, Calendar } from "lucide-react";
import { sendShippingNotificationEmail } from "@/lib/emailService";

interface ShipmentTrackingFormProps {
  order: Order;
  onSuccess: () => void;
}

const defaultCouriers: CourierService[] = [
  { id: 1, name: 'Sundarban Courier', name_bn: 'সুন্দরবন কুরিয়ার', tracking_url_template: null, is_active: true, display_order: 1 },
  { id: 2, name: 'SA Paribahan', name_bn: 'এসএ পরিবহন', tracking_url_template: null, is_active: true, display_order: 2 },
  { id: 3, name: 'Pathao Courier', name_bn: 'পাঠাও কুরিয়ার', tracking_url_template: null, is_active: true, display_order: 3 },
  { id: 4, name: 'RedX', name_bn: 'রেডএক্স', tracking_url_template: 'https://redx.com.bd/track-parcel/?trackingId={tracking_number}', is_active: true, display_order: 4 },
  { id: 5, name: 'Steadfast', name_bn: 'স্টেডফাস্ট', tracking_url_template: null, is_active: true, display_order: 5 },
  { id: 6, name: 'eCourier', name_bn: 'ইকুরিয়ার', tracking_url_template: null, is_active: true, display_order: 6 },
  { id: 7, name: 'Paperfly', name_bn: 'পেপারফ্লাই', tracking_url_template: null, is_active: true, display_order: 7 },
  { id: 8, name: 'Other', name_bn: 'অন্যান্য', tracking_url_template: null, is_active: true, display_order: 100 },
];

export const ShipmentTrackingForm = ({ order, onSuccess }: ShipmentTrackingFormProps) => {
  const { language } = useLanguage();
  const [couriers, setCouriers] = useState<CourierService[]>(defaultCouriers);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [courierName, setCourierName] = useState(order.courier_name || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(order.estimated_delivery || "");

  const translations = {
    title: language === "bn" ? "শিপমেন্ট ট্র্যাকিং" : "Shipment Tracking",
    courierName: language === "bn" ? "কুরিয়ার সার্ভিস" : "Courier Service",
    selectCourier: language === "bn" ? "কুরিয়ার সিলেক্ট করুন" : "Select Courier",
    trackingNumber: language === "bn" ? "ট্র্যাকিং নম্বর" : "Tracking Number",
    trackingNumberPlaceholder: language === "bn" ? "ট্র্যাকিং নম্বর লিখুন" : "Enter tracking number",
    trackingUrl: language === "bn" ? "ট্র্যাকিং লিংক (ঐচ্ছিক)" : "Tracking URL (Optional)",
    trackingUrlPlaceholder: language === "bn" ? "https://courier.com/track/..." : "https://courier.com/track/...",
    estimatedDelivery: language === "bn" ? "আনুমানিক ডেলিভারি তারিখ" : "Estimated Delivery",
    save: language === "bn" ? "সংরক্ষণ করুন" : "Save",
    saving: language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...",
    success: language === "bn" ? "শিপমেন্ট তথ্য সংরক্ষণ হয়েছে" : "Shipment info saved",
    error: language === "bn" ? "সংরক্ষণ করতে সমস্যা হয়েছে" : "Failed to save",
  };

  useEffect(() => {
    const fetchCouriers = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getCourierServices();
        if (response.data?.couriers && response.data.couriers.length > 0) {
          setCouriers(response.data.couriers);
        }
      } catch (error) {
        console.error("Failed to fetch couriers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCouriers();
  }, []);

  const handleCourierChange = (value: string) => {
    setCourierName(value);
    // Auto-fill tracking URL template if available
    const selectedCourier = couriers.find(c => c.name === value);
    if (selectedCourier?.tracking_url_template && trackingNumber) {
      setTrackingUrl(selectedCourier.tracking_url_template.replace('{tracking_number}', trackingNumber));
    }
  };

  const handleTrackingNumberChange = (value: string) => {
    setTrackingNumber(value);
    // Update tracking URL if template exists
    if (courierName) {
      const selectedCourier = couriers.find(c => c.name === courierName);
      if (selectedCourier?.tracking_url_template && value) {
        setTrackingUrl(selectedCourier.tracking_url_template.replace('{tracking_number}', value));
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.updateOrderShipping(String(order.id), {
        courier_name: courierName || undefined,
        tracking_number: trackingNumber || undefined,
        tracking_url: trackingUrl || undefined,
        estimated_delivery: estimatedDelivery || undefined,
      });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      // Send shipping notification email if tracking number is provided
      if (trackingNumber && order.customer_email) {
        sendShippingNotificationEmail(
          order.customer_email,
          order.customer_name || order.shipping_name,
          order.order_number,
          trackingNumber,
          courierName,
          trackingUrl,
          estimatedDelivery
        ).then(result => {
          if (result.success) {
            console.log("Shipping notification email sent successfully");
          } else {
            console.log("Email not sent:", result.message);
          }
        });
      }
      
      toast.success(translations.success);
      onSuccess();
    } catch (error) {
      console.error("Failed to save shipping info:", error);
      toast.error(translations.error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <Truck className="h-4 w-4" />
        {translations.title}
      </h4>
      
      <div className="grid gap-4">
        {/* Courier Selection */}
        <div className="space-y-2">
          <Label>{translations.courierName}</Label>
          <Select value={courierName} onValueChange={handleCourierChange}>
            <SelectTrigger>
              <SelectValue placeholder={translations.selectCourier} />
            </SelectTrigger>
            <SelectContent>
              {couriers.map((courier) => (
                <SelectItem key={courier.id} value={courier.name}>
                  {language === "bn" && courier.name_bn ? courier.name_bn : courier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tracking Number */}
        <div className="space-y-2">
          <Label>{translations.trackingNumber}</Label>
          <Input
            value={trackingNumber}
            onChange={(e) => handleTrackingNumberChange(e.target.value)}
            placeholder={translations.trackingNumberPlaceholder}
          />
        </div>

        {/* Tracking URL */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            {translations.trackingUrl}
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </Label>
          <Input
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder={translations.trackingUrlPlaceholder}
          />
        </div>

        {/* Estimated Delivery */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {translations.estimatedDelivery}
          </Label>
          <Input
            type="date"
            value={estimatedDelivery}
            onChange={(e) => setEstimatedDelivery(e.target.value)}
          />
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {translations.saving}
          </>
        ) : (
          translations.save
        )}
      </Button>
    </div>
  );
};

export default ShipmentTrackingForm;
