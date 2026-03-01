import { useState, useEffect } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function POSShifts() {
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    const { data } = await supabase
      .from("pos_shifts")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(50);
    if (data) setShifts(data);
  };

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6" /> শিফট ইতিহাস
          </h1>
          <p className="text-muted-foreground text-sm">সকল শিফটের বিস্তারিত তথ্য</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিফট নং</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">প্রারম্ভিক</TableHead>
                  <TableHead className="text-right">ক্যাশ বিক্রি</TableHead>
                  <TableHead className="text-right">মোবাইল বিক্রি</TableHead>
                  <TableHead className="text-right">মোট বিক্রি</TableHead>
                  <TableHead className="text-center">ট্রানজেকশন</TableHead>
                  <TableHead className="text-right">সমাপনী</TableHead>
                  <TableHead>শুরু</TableHead>
                  <TableHead>শেষ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map(shift => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-mono text-xs">{shift.shift_number}</TableCell>
                    <TableCell>
                      <Badge variant={shift.status === "open" ? "default" : "secondary"}>
                        {shift.status === "open" ? "চলছে" : "বন্ধ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">৳{shift.opening_amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">৳{shift.cash_sales?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">৳{shift.mobile_banking_sales?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">৳{shift.total_sales?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{shift.total_transactions}</TableCell>
                    <TableCell className="text-right">{shift.closing_amount != null ? `৳${shift.closing_amount.toLocaleString()}` : "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(shift.opened_at).toLocaleString("bn-BD")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{shift.closed_at ? new Date(shift.closed_at).toLocaleString("bn-BD") : "-"}</TableCell>
                  </TableRow>
                ))}
                {shifts.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">কোনো শিফট পাওয়া যায়নি</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}
