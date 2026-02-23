import { useState, useEffect } from "react";
import { useSteadfast } from "@/hooks/useSteadfast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Truck, RefreshCw, ExternalLink } from "lucide-react";

interface SteadfastOrderButtonProps {
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    shipping_address: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    district?: string | null;
    division?: string | null;
  };
  onSuccess?: () => void;
}

const deliveryStatusMap: Record<string, { label: string; color: string }> = {
  in_review: { label: "রিভিউতে", color: "bg-yellow-500" },
  pending: { label: "পেন্ডিং", color: "bg-orange-500" },
  delivered: { label: "ডেলিভার্ড", color: "bg-green-500" },
  partial_delivered: { label: "আংশিক ডেলিভার্ড", color: "bg-blue-500" },
  cancelled: { label: "বাতিল", color: "bg-red-500" },
  hold: { label: "হোল্ড", color: "bg-gray-500" },
  unknown: { label: "অজানা", color: "bg-gray-400" },
};

export const SteadfastOrderButton = ({ order, onSuccess }: SteadfastOrderButtonProps) => {
  const { settings, createOrder, checkStatus, getConsignments } = useSteadfast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [consignment, setConsignment] = useState<any>(null);
  const [codAmount, setCodAmount] = useState(
    order.payment_method === "cod" ? order.total_amount : 0
  );
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadConsignment();
    }
  }, [isOpen]);

  const loadConsignment = async () => {
    const consignments = await getConsignments(order.id);
    if (consignments.length > 0) {
      setConsignment(consignments[0]);
    }
  };

  const handleSendToSteadfast = async () => {
    setIsSending(true);
    const result = await createOrder({
      order_id: order.id,
      invoice: order.order_number,
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      recipient_address: order.shipping_address,
      cod_amount: codAmount,
      note,
    });

    if (result.data?.status === 200) {
      await loadConsignment();
      onSuccess?.();
    }
    setIsSending(false);
  };

  const handleCheckStatus = async () => {
    if (!consignment?.consignment_id) return;
    setIsChecking(true);
    await checkStatus(consignment.consignment_id);
    await loadConsignment();
    setIsChecking(false);
  };

  if (!settings?.is_enabled) return null;

  const statusInfo = consignment
    ? deliveryStatusMap[consignment.delivery_status] || deliveryStatusMap.unknown
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Truck className="h-4 w-4" />
          {consignment ? "Steadfast" : "কুরিয়ারে পাঠান"}
          {statusInfo && (
            <Badge className={`${statusInfo.color} text-white text-[10px] px-1 ml-1`}>
              {statusInfo.label}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Steadfast কুরিয়ার — {order.order_number}
          </DialogTitle>
        </DialogHeader>

        {consignment ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">কনসাইনমেন্ট ID</p>
                <p className="font-medium">{consignment.consignment_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ট্র্যাকিং কোড</p>
                <p className="font-medium">{consignment.tracking_code || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">স্ট্যাটাস</p>
                <Badge className={`${statusInfo?.color} text-white`}>
                  {statusInfo?.label}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">COD পরিমাণ</p>
                <p className="font-medium">৳{consignment.cod_amount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">প্রাপক</p>
                <p className="font-medium">{consignment.recipient_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ফোন</p>
                <p className="font-medium">{consignment.recipient_phone}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCheckStatus}
                disabled={isChecking}
              >
                {isChecking ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                স্ট্যাটাস আপডেট
              </Button>
              {consignment.tracking_code && (
                <Button
                  variant="outline"
                  asChild
                >
                  <a
                    href={`https://steadfast.com.bd/t/${consignment.tracking_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    ট্র্যাক
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm space-y-2 p-3 rounded-lg bg-muted">
              <div className="flex justify-between">
                <span className="text-muted-foreground">প্রাপক:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ফোন:</span>
                <span className="font-medium">{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ঠিকানা:</span>
                <span className="font-medium text-right max-w-[200px]">{order.shipping_address}</span>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>COD পরিমাণ (টাকা)</Label>
                <Input
                  type="number"
                  value={codAmount}
                  onChange={(e) => setCodAmount(Number(e.target.value))}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  {order.payment_method === "cod"
                    ? "ক্যাশ অন ডেলিভারি — পুরো টাকা কালেক্ট হবে"
                    : "অনলাইন পেমেন্ট — COD ০ রাখুন"}
                </p>
              </div>
              <div className="grid gap-2">
                <Label>নোট (ঐচ্ছিক)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="কুরিয়ারের জন্য বিশেষ নির্দেশনা..."
                  rows={2}
                />
              </div>
            </div>

            <Button
              onClick={handleSendToSteadfast}
              disabled={isSending}
              className="w-full"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              Steadfast-এ পাঠান
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
