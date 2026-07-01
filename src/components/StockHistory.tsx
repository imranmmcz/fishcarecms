import { useState, useEffect } from "react";
import { stockAdjustmentsRepo } from "@/repositories/stockAdjustments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Search, Package } from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

interface StockAdjustment {
  id: string;
  product_id: string;
  adjustment_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  product?: {
    name: string;
    sku: string | null;
  };
}

const adjustmentTypeLabels: Record<string, { label: string; color: string }> = {
  purchase: { label: "ক্রয়", color: "bg-green-500" },
  sale: { label: "বিক্রয়", color: "bg-blue-500" },
  adjustment: { label: "অ্যাডজাস্টমেন্ট", color: "bg-yellow-500" },
  return: { label: "রিটার্ন", color: "bg-purple-500" },
  damage: { label: "ক্ষতি", color: "bg-red-500" },
  transfer: { label: "ট্রান্সফার", color: "bg-cyan-500" },
};

export function StockHistory() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const rows = await stockAdjustmentsRepo.list({ includeProduct: true, limit: 100 });
      setAdjustments(rows as unknown as StockAdjustment[]);
    } catch (error) {
      console.error("Error fetching stock adjustments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdjustments = adjustments.filter((adj) => {
    const matchesSearch =
      adj.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || adj.adjustment_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const totalIn = adjustments
    .filter((a) => a.quantity_change > 0)
    .reduce((sum, a) => sum + a.quantity_change, 0);

  const totalOut = adjustments
    .filter((a) => a.quantity_change < 0)
    .reduce((sum, a) => sum + Math.abs(a.quantity_change), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-green-500" />
              মোট স্টক ইন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{totalIn}</div>
            <p className="text-xs text-muted-foreground">সর্বশেষ ১০০ এন্ট্রি</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
              মোট স্টক আউট
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{totalOut}</div>
            <p className="text-xs text-muted-foreground">সর্বশেষ ১০০ এন্ট্রি</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              মোট এন্ট্রি
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{adjustments.length}</div>
            <p className="text-xs text-muted-foreground">স্টক মুভমেন্ট</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            স্টক অ্যাডজাস্টমেন্ট হিস্ট্রি
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="পণ্য বা নোট দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="ধরন ফিল্টার করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল ধরন</SelectItem>
                {Object.entries(adjustmentTypeLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              লোড হচ্ছে...
            </div>
          ) : filteredAdjustments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              কোনো স্টক অ্যাডজাস্টমেন্ট পাওয়া যায়নি
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>তারিখ ও সময়</TableHead>
                    <TableHead>পণ্য</TableHead>
                    <TableHead>ধরন</TableHead>
                    <TableHead className="text-right">পরিবর্তন</TableHead>
                    <TableHead className="text-right">আগের স্টক</TableHead>
                    <TableHead className="text-right">নতুন স্টক</TableHead>
                    <TableHead>রেফারেন্স</TableHead>
                    <TableHead>নোট</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.map((adjustment) => {
                    const typeInfo = adjustmentTypeLabels[adjustment.adjustment_type] || {
                      label: adjustment.adjustment_type,
                      color: "bg-gray-500",
                    };
                    const isPositive = adjustment.quantity_change > 0;

                    return (
                      <TableRow key={adjustment.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(adjustment.created_at), "dd MMM yyyy", { locale: bn })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(adjustment.created_at), "hh:mm a", { locale: bn })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{adjustment.product?.name || "N/A"}</div>
                          {adjustment.product?.sku && (
                            <div className="text-xs text-muted-foreground">
                              SKU: {adjustment.product.sku}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${typeInfo.color} text-white`}>
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-bold ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {adjustment.quantity_change}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {adjustment.previous_quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {adjustment.new_quantity}
                        </TableCell>
                        <TableCell>
                          {adjustment.reference_type && (
                            <Badge variant="outline" className="text-xs">
                              {adjustment.reference_type === "purchase_order"
                                ? "ক্রয় অর্ডার"
                                : adjustment.reference_type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {adjustment.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
