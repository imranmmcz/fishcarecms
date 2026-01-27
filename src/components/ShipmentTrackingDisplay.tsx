/**
 * Shipment Tracking Display Component
 * Customer-এর জন্য শিপমেন্ট ট্র্যাকিং তথ্য দেখানোর কম্পোনেন্ট
 */

import { useLanguage } from "@/contexts/LanguageContext";
import type { Order } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Truck, 
  ExternalLink, 
  Calendar, 
  Package,
  MapPin,
  Clock,
  CheckCircle
} from "lucide-react";

interface ShipmentTrackingDisplayProps {
  order: Order;
  compact?: boolean;
}

export const ShipmentTrackingDisplay = ({ order, compact = false }: ShipmentTrackingDisplayProps) => {
  const { language } = useLanguage();

  const translations = {
    trackingInfo: language === "bn" ? "ট্র্যাকিং তথ্য" : "Tracking Info",
    courier: language === "bn" ? "কুরিয়ার" : "Courier",
    trackingNumber: language === "bn" ? "ট্র্যাকিং নম্বর" : "Tracking No",
    estimatedDelivery: language === "bn" ? "আনুমানিক ডেলিভারি" : "Est. Delivery",
    trackOrder: language === "bn" ? "অর্ডার ট্র্যাক করুন" : "Track Order",
    noTracking: language === "bn" ? "ট্র্যাকিং তথ্য এখনো যোগ করা হয়নি" : "Tracking info not yet available",
    shipped: language === "bn" ? "শিপড" : "Shipped",
    inTransit: language === "bn" ? "পথে আছে" : "In Transit",
  };

  // No tracking info available
  if (!order.courier_name && !order.tracking_number) {
    if (compact) return null;
    
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Package className="h-4 w-4" />
        {translations.noTracking}
      </div>
    );
  }

  // Compact view for table rows
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {order.tracking_number && (
          <Badge variant="outline" className="font-mono text-xs">
            <Truck className="h-3 w-3 mr-1" />
            {order.tracking_number}
          </Badge>
        )}
        {order.tracking_url && (
          <a
            href={order.tracking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  // Full tracking display
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          {translations.trackingInfo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tracking Timeline Visual */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
              <CheckCircle className="h-2 w-2 text-primary-foreground" />
            </div>
            <span className="text-muted-foreground">{language === "bn" ? "অর্ডার" : "Order"}</span>
          </div>
          <div className="flex-1 h-0.5 bg-primary" />
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-primary' : 'bg-muted'}`}>
              {(order.status === 'shipped' || order.status === 'delivered') && (
                <CheckCircle className="h-2 w-2 text-primary-foreground" />
              )}
            </div>
            <span className="text-muted-foreground">{translations.shipped}</span>
          </div>
          <div className={`flex-1 h-0.5 ${order.status === 'delivered' ? 'bg-primary' : 'bg-muted'}`} />
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-primary' : 'bg-muted'}`}>
              {order.status === 'delivered' && (
                <CheckCircle className="h-2 w-2 text-primary-foreground" />
              )}
            </div>
            <span className="text-muted-foreground">{language === "bn" ? "ডেলিভারড" : "Delivered"}</span>
          </div>
        </div>

        {/* Courier Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {order.courier_name && (
            <div>
              <p className="text-muted-foreground text-xs">{translations.courier}</p>
              <p className="font-medium">{order.courier_name}</p>
            </div>
          )}
          
          {order.tracking_number && (
            <div>
              <p className="text-muted-foreground text-xs">{translations.trackingNumber}</p>
              <p className="font-mono font-medium">{order.tracking_number}</p>
            </div>
          )}
          
          {order.estimated_delivery && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {translations.estimatedDelivery}
              </p>
              <p className="font-medium">
                {new Date(order.estimated_delivery).toLocaleDateString(
                  language === "bn" ? "bn-BD" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
            </div>
          )}
        </div>

        {/* Track Button */}
        {order.tracking_url && (
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {translations.trackOrder}
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ShipmentTrackingDisplay;
