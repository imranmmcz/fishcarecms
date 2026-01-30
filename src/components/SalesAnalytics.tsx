import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from "date-fns";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  reorder_level: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  order_date: string;
  company_id: string;
}

interface StockAdjustment {
  id: string;
  product_id: string;
  adjustment_type: string;
  quantity_change: number;
  created_at: string;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16'];

export function SalesAnalytics() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, adjustmentsRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('purchase_orders').select('*').order('order_date', { ascending: false }),
        supabase.from('stock_adjustments').select('*').order('created_at', { ascending: false })
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (ordersRes.data) setPurchaseOrders(ordersRes.data);
      if (adjustmentsRes.data) setStockAdjustments(adjustmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.reorder_level || 10));
  const totalPurchaseOrders = purchaseOrders.length;
  const totalPurchaseValue = purchaseOrders
    .filter(po => po.status === 'received')
    .reduce((sum, po) => sum + po.total_amount, 0);

  // Category distribution
  const categoryData = products.reduce((acc: { name: string; value: number; count: number }[], product) => {
    const existing = acc.find(item => item.name === product.category);
    if (existing) {
      existing.value += product.price * product.stock_quantity;
      existing.count += 1;
    } else {
      acc.push({ 
        name: product.category === 'medicine' ? 'ঔষধ' : 
              product.category === 'food' ? 'খাবার' : 
              product.category === 'accessories' ? 'এক্সেসরিজ' : product.category, 
        value: product.price * product.stock_quantity,
        count: 1
      });
    }
    return acc;
  }, []);

  // Purchase orders by status
  const orderStatusData = purchaseOrders.reduce((acc: { name: string; value: number }[], order) => {
    const statusName = order.status === 'pending' ? 'অপেক্ষমান' :
                       order.status === 'ordered' ? 'অর্ডার করা' :
                       order.status === 'received' ? 'গৃহীত' :
                       order.status === 'cancelled' ? 'বাতিল' : order.status;
    const existing = acc.find(item => item.name === statusName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: statusName, value: 1 });
    }
    return acc;
  }, []);

  // Monthly purchase trend
  const monthlyPurchaseData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      const monthName = format(monthStart, 'MMM');
      
      const monthOrders = purchaseOrders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const totalAmount = monthOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const receivedAmount = monthOrders
        .filter(o => o.status === 'received')
        .reduce((sum, order) => sum + order.total_amount, 0);
      
      months.push({
        month: monthName,
        total: totalAmount,
        received: receivedAmount,
        count: monthOrders.length
      });
    }
    return months;
  })();

  // Stock movement data
  const stockMovementData = (() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'EEE');
      
      const dayAdjustments = stockAdjustments.filter(adj => 
        adj.created_at.startsWith(dateStr)
      );
      
      const incoming = dayAdjustments
        .filter(a => a.quantity_change > 0)
        .reduce((sum, a) => sum + a.quantity_change, 0);
      
      const outgoing = dayAdjustments
        .filter(a => a.quantity_change < 0)
        .reduce((sum, a) => sum + Math.abs(a.quantity_change), 0);
      
      last7Days.push({
        day: dayName,
        incoming,
        outgoing
      });
    }
    return last7Days;
  })();

  // Top products by stock value
  const topProductsByValue = [...products]
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      value: p.price * p.stock_quantity,
      stock: p.stock_quantity
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Low stock products chart
  const lowStockChartData = lowStockProducts
    .slice(0, 5)
    .map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      current: p.stock_quantity,
      reorder: p.reorder_level || 10
    }));

  const summaryCards = [
    {
      title: "মোট পণ্য",
      value: totalProducts.toString(),
      change: `${lowStockProducts.length} কম স্টক`,
      icon: Package,
      color: "from-violet-500 to-purple-600",
      positive: lowStockProducts.length === 0,
    },
    {
      title: "স্টক মূল্য",
      value: `৳${totalStockValue.toLocaleString('bn-BD')}`,
      change: `${products.filter(p => p.stock_quantity > 0).length} আইটেম`,
      icon: DollarSign,
      color: "from-emerald-500 to-green-600",
      positive: true,
    },
    {
      title: "ক্রয় অর্ডার",
      value: totalPurchaseOrders.toString(),
      change: `৳${totalPurchaseValue.toLocaleString('bn-BD')} গৃহীত`,
      icon: ShoppingCart,
      color: "from-cyan-500 to-blue-600",
      positive: true,
    },
    {
      title: "সতর্কতা",
      value: lowStockProducts.length.toString(),
      change: "কম স্টক পণ্য",
      icon: TrendingDown,
      color: lowStockProducts.length > 0 ? "from-rose-500 to-red-600" : "from-emerald-500 to-green-600",
      positive: lowStockProducts.length === 0,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">ডেটা লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">সেলস ও ইনভেন্টরি অ্যানালিটিক্স</h2>
          <p className="text-sm text-muted-foreground">রিয়েল-টাইম ডেটা বিশ্লেষণ</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          রিফ্রেশ
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {card.positive ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <p className={`text-xs ${card.positive ? "text-green-500" : "text-red-500"}`}>
                      {card.change}
                    </p>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">সারসংক্ষেপ</TabsTrigger>
          <TabsTrigger value="inventory">ইনভেন্টরি</TabsTrigger>
          <TabsTrigger value="purchases">ক্রয়</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-violet-500" />
                  ক্যাটাগরি অনুযায়ী পণ্য
                </CardTitle>
                <CardDescription>স্টক মূল্য বিতরণ</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `৳${value.toLocaleString('bn-BD')}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    কোনো ডেটা নেই
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-cyan-500" />
                  অর্ডার স্ট্যাটাস
                </CardTitle>
                <CardDescription>ক্রয় অর্ডার অবস্থা</CardDescription>
              </CardHeader>
              <CardContent>
                {orderStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    কোনো অর্ডার নেই
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                শীর্ষ পণ্য (স্টক মূল্য অনুযায়ী)
              </CardTitle>
              <CardDescription>সর্বোচ্চ স্টক মূল্যের পণ্যসমূহ</CardDescription>
            </CardHeader>
            <CardContent>
              {topProductsByValue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsByValue} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'value' ? `৳${value.toLocaleString('bn-BD')}` : value,
                        name === 'value' ? 'মূল্য' : 'স্টক'
                      ]}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" name="মূল্য" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  কোনো পণ্য নেই
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Stock Movement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  স্টক মুভমেন্ট (৭ দিন)
                </CardTitle>
                <CardDescription>ইনকামিং ও আউটগোয়িং স্টক</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={stockMovementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="incoming" fill="#10b981" name="ইনকামিং" />
                    <Bar dataKey="outgoing" fill="#ef4444" name="আউটগোয়িং" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  কম স্টক সতর্কতা
                </CardTitle>
                <CardDescription>রিঅর্ডার লেভেলের নিচে</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={lowStockChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#ef4444" name="বর্তমান স্টক" />
                      <Bar dataKey="reorder" fill="#f59e0b" name="রিঅর্ডার লেভেল" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-green-500">
                    <Package className="h-8 w-8 mr-2" />
                    সব পণ্যে পর্যাপ্ত স্টক আছে
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stock Value by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-500" />
                ক্যাটাগরি অনুযায়ী স্টক মূল্য
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'value' ? `৳${value.toLocaleString('bn-BD')}` : value,
                      name === 'value' ? 'মূল্য' : 'পণ্য সংখ্যা'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5cf6" name="স্টক মূল্য" />
                  <Bar dataKey="count" fill="#06b6d4" name="পণ্য সংখ্যা" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          {/* Monthly Purchase Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                মাসিক ক্রয় ট্রেন্ড
              </CardTitle>
              <CardDescription>গত ৬ মাসের ক্রয় বিশ্লেষণ</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyPurchaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `৳${value.toLocaleString('bn-BD')}`,
                      name === 'total' ? 'মোট' : name === 'received' ? 'গৃহীত' : name
                    ]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3} 
                    name="মোট অর্ডার"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="received" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3} 
                    name="গৃহীত"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Purchase Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-cyan-500" />
                সাম্প্রতিক ক্রয় অর্ডার
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchaseOrders.slice(0, 5).map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.order_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">৳{order.total_amount.toLocaleString('bn-BD')}</p>
                      <Badge 
                        variant={
                          order.status === 'received' ? 'default' :
                          order.status === 'cancelled' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {order.status === 'pending' ? 'অপেক্ষমান' :
                         order.status === 'ordered' ? 'অর্ডার করা' :
                         order.status === 'received' ? 'গৃহীত' :
                         order.status === 'cancelled' ? 'বাতিল' : order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {purchaseOrders.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    কোনো ক্রয় অর্ডার নেই
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
