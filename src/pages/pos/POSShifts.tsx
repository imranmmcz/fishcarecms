import { useState, useEffect } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Clock } from "lucide-react";
import { posRepo } from "@/repositories/pos";

export default function POSShifts() {
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const data = await posRepo.shifts.list();
      setShifts(data.slice(0, 50));
    } catch { /* ignore */ }
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

        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
          {shifts.map(shift => (
            <Card key={shift.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold">{shift.shift_number}</span>
                  <Badge variant={shift.status === "open" ? "default" : "secondary"}>
                    {shift.status === "open" ? "চলছে" : "বন্ধ"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">প্রারম্ভিক:</span> <span className="font-medium">৳{shift.opening_amount?.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">সমাপনী:</span> <span className="font-medium">{shift.closing_amount != null ? `৳${shift.closing_amount.toLocaleString()}` : "-"}</span></div>
                  <div><span className="text-muted-foreground">ক্যাশ:</span> <span className="font-medium text-green-600">৳{shift.cash_sales?.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">মোবাইল:</span> <span className="font-medium text-blue-600">৳{shift.mobile_banking_sales?.toLocaleString()}</span></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ট্রানজেকশন: {shift.total_transactions}</span>
                  <span className="font-bold">মোট: ৳{shift.total_sales?.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(shift.opened_at).toLocaleString("bn-BD")}
                  {shift.closed_at && ` — ${new Date(shift.closed_at).toLocaleString("bn-BD")}`}
                </div>
              </CardContent>
            </Card>
          ))}
          {shifts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">কোনো শিফট পাওয়া যায়নি</p>
          )}
        </div>

        {/* Desktop Table View */}
        <Card className="hidden sm:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}
