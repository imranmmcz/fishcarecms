import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function POSVariations() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products-variations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, price, discount_percentage, stock_quantity, unit, category")
        .order("category")
        .order("name");
      return data || [];
    },
  });

  // Group by category for variation view
  const grouped = products.reduce((acc: Record<string, any[]>, p: any) => {
    const cat = p.category || "অন্যান্য";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <POSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-500" /> পণ্যের ভ্যারিয়েশন
          </h1>
          <p className="text-muted-foreground text-sm">ক্যাটাগরি অনুযায়ী পণ্যের ভ্যারিয়েশন দেখুন</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">লোড হচ্ছে...</div>
        ) : Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="text-sm">{category}</Badge>
                <span className="text-muted-foreground text-sm font-normal">({(items as any[]).length} টি পণ্য)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>পণ্যের নাম</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>ইউনিট</TableHead>
                    <TableHead>দাম (৳)</TableHead>
                    <TableHead>ডিসকাউন্ট</TableHead>
                    <TableHead>স্টক</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as any[]).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.sku || "-"}</TableCell>
                      <TableCell>{p.unit || "pcs"}</TableCell>
                      <TableCell>৳ {p.price?.toLocaleString("bn-BD")}</TableCell>
                      <TableCell>
                        {p.discount_percentage > 0 ? (
                          <Badge className="bg-orange-100 text-orange-700">{p.discount_percentage}%</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.stock_quantity > 10 ? "default" : "destructive"}>
                          {p.stock_quantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </POSLayout>
  );
}
