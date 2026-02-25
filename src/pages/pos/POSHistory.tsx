import { useState, useEffect } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { History, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function POSHistory() {
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const { data } = await supabase
      .from("pos_sales")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setSales(data);
  };

  const filtered = sales.filter(s =>
    (s.sale_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_phone || "").includes(search)
  );

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="h-6 w-6" /> বিক্রি ইতিহাস
          </h1>
          <p className="text-muted-foreground text-sm">সকল POS বিক্রির রেকর্ড</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="রিসিপ্ট নং, কাস্টমার নাম বা ফোন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>রিসিপ্ট নং</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>পেমেন্ট</TableHead>
                  <TableHead className="text-right">সাবটোটাল</TableHead>
                  <TableHead className="text-right">ডিসকাউন্ট</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead>তারিখ ও সময়</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.sale_number}</TableCell>
                    <TableCell>{sale.customer_name || "-"}</TableCell>
                    <TableCell className="text-xs">{sale.customer_phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={sale.payment_method === "cash" ? "default" : "secondary"}>
                        {sale.payment_method === "cash" ? "নগদ" : "মোবাইল"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">৳{sale.subtotal}</TableCell>
                    <TableCell className="text-right text-red-500">{sale.discount_amount > 0 ? `-৳${sale.discount_amount}` : "-"}</TableCell>
                    <TableCell className="text-right font-bold">৳{sale.total_amount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleString("bn-BD")}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">কোনো বিক্রি পাওয়া যায়নি</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}
