import { useState } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListOrdered, Search, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export default function POSPurchaseList() {
  const [search, setSearch] = useState("");

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["pos-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchase_orders")
        .select("*, companies(name), purchase_order_items(quantity, total_cost)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "অপেক্ষমান", variant: "secondary" },
    ordered: { label: "অর্ডার করা", variant: "outline" },
    received: { label: "গৃহীত", variant: "default" },
    cancelled: { label: "বাতিল", variant: "destructive" },
  };

  const filtered = purchases.filter((p: any) =>
    !search || p.order_number?.toLowerCase().includes(search.toLowerCase()) || p.companies?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <POSLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ListOrdered className="h-6 w-6 text-emerald-500" /> ক্রয় তালিকা
            </h1>
            <p className="text-muted-foreground text-sm">সকল ক্রয় অর্ডারের তালিকা দেখুন</p>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/pos/purchases/new">নতুন ক্রয়</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="অর্ডার নম্বর বা সাপ্লায়ার দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {isLoading ? (
                <p className="text-center py-8">লোড হচ্ছে...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">কোনো ক্রয় অর্ডার পাওয়া যায়নি</p>
              ) : filtered.map((p: any) => {
                const st = statusLabels[p.status] || { label: p.status, variant: "outline" as const };
                return (
                  <Card key={p.id}>
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-xs">{p.order_number}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{p.companies?.name || "-"}</span>
                        <span className="font-semibold">৳ {p.total_amount?.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(p.order_date).toLocaleDateString("bn-BD")}</span>
                        <span>{p.purchase_order_items?.length || 0} টি আইটেম</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>অর্ডার নম্বর</TableHead>
                  <TableHead>সাপ্লায়ার</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>আইটেম</TableHead>
                  <TableHead>মোট (৳)</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">লোড হচ্ছে...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো ক্রয় অর্ডার পাওয়া যায়নি</TableCell></TableRow>
                ) : filtered.map((p: any) => {
                  const st = statusLabels[p.status] || { label: p.status, variant: "outline" as const };
                  const itemCount = p.purchase_order_items?.length || 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-semibold">{p.order_number}</TableCell>
                      <TableCell>{p.companies?.name || "-"}</TableCell>
                      <TableCell>{new Date(p.order_date).toLocaleDateString("bn-BD")}</TableCell>
                      <TableCell>{itemCount} টি</TableCell>
                      <TableCell className="font-semibold">৳ {p.total_amount?.toLocaleString("en-IN")}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}
