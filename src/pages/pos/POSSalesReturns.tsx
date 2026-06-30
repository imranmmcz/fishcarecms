import { useState, useEffect } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw } from "lucide-react";
import { posRepo } from "@/repositories/pos";

export default function POSSalesReturns() {
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const data = await posRepo.sales.list({ status: "refunded", limit: 50 });
        setSales(data);
      } catch { /* ignore */ }
    };
    fetchReturns();
  }, []);

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="h-6 w-6" /> বিক্রি রিটার্ন
          </h1>
          <p className="text-muted-foreground text-sm">রিটার্নকৃত বিক্রির তালিকা</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>সেল নম্বর</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead>পেমেন্ট</TableHead>
                  <TableHead>তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.sale_number}</TableCell>
                    <TableCell>{s.customer_name || "-"}</TableCell>
                    <TableCell className="text-right font-bold">৳{s.total_amount?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary">{s.payment_method}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("bn-BD")}</TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">কোনো রিটার্ন পাওয়া যায়নি</TableCell></TableRow>
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
