import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";

export default function POSPurchaseReturns() {
  return (
    <POSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-emerald-500" /> ক্রয় রিটার্ন
          </h1>
          <p className="text-muted-foreground text-sm">সাপ্লায়ারে ফেরত দেওয়া পণ্যের তালিকা</p>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">কোনো ক্রয় রিটার্ন নেই</p>
            <p className="text-muted-foreground text-sm mt-1">ক্রয় রিটার্ন থাকলে এখানে দেখাবে</p>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}
