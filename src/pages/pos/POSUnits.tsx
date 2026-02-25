import { useState } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ruler, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Units are derived from product data (distinct unit values)
export default function POSUnits() {
  const [search, setSearch] = useState("");

  const { data: unitStats = [], isLoading } = useQuery({
    queryKey: ["pos-units"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("unit, id");
      if (!data) return [];
      const unitMap: Record<string, number> = {};
      data.forEach((p: any) => {
        const u = p.unit || "pcs";
        unitMap[u] = (unitMap[u] || 0) + 1;
      });
      return Object.entries(unitMap)
        .map(([unit, count]) => ({ unit, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  const unitLabels: Record<string, string> = {
    pcs: "পিস (Pcs)",
    kg: "কেজি (Kg)",
    g: "গ্রাম (g)",
    l: "লিটার (L)",
    ml: "মিলিলিটার (mL)",
    box: "বক্স (Box)",
    pack: "প্যাক (Pack)",
    bottle: "বোতল (Bottle)",
    bag: "ব্যাগ (Bag)",
    set: "সেট (Set)",
  };

  const filtered = unitStats.filter(u =>
    !search || u.unit.toLowerCase().includes(search.toLowerCase()) || unitLabels[u.unit]?.includes(search)
  );

  return (
    <POSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ruler className="h-6 w-6 text-emerald-500" /> ইউনিট ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm">পণ্যে ব্যবহৃত ইউনিটগুলোর তালিকা</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="ইউনিট খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইউনিট কোড</TableHead>
                  <TableHead>ইউনিটের নাম</TableHead>
                  <TableHead>পণ্য সংখ্যা</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">লোড হচ্ছে...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">কোনো ইউনিট পাওয়া যায়নি</TableCell></TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.unit}>
                    <TableCell className="font-mono font-semibold">{u.unit}</TableCell>
                    <TableCell>{unitLabels[u.unit] || u.unit}</TableCell>
                    <TableCell><Badge variant="outline">{u.count} টি পণ্য</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}
