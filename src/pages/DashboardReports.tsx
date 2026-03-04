import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, TrendingUp, TrendingDown, Calculator, Calendar, Printer, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePrintHeaderFooter } from "@/hooks/usePrintHeaderFooter";

interface Record { id: string; date: string; category: string; amount: number; description: string; pondName?: string; }

export default function DashboardReports() {
  const { user } = useAuth();
  const { printReport, siteName } = usePrintHeaderFooter();
  const footerData = getSectionContent<any>("footer");
  const [incomes, setIncomes] = useState<Record[]>([]);
  const [expenses, setExpenses] = useState<Record[]>([]);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterPond, setFilterPond] = useState("all");
  const [ponds, setPonds] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [incomesRes, expensesRes, pondsRes] = await Promise.all([
        supabase.from("farmer_incomes").select("*").eq("user_id", user.id),
        supabase.from("farmer_expenses").select("*").eq("user_id", user.id),
        supabase.from("farmer_ponds").select("id, name").eq("user_id", user.id),
      ]);
      setIncomes((incomesRes.data || []).map((i) => ({
        id: i.id, date: i.date, category: i.category, amount: Number(i.amount),
        description: i.description || "", pondName: i.pond_name || undefined,
      })));
      setExpenses((expensesRes.data || []).map((e) => ({
        id: e.id, date: e.date, category: e.category, amount: Number(e.amount),
        description: e.description || "", pondName: e.pond_name || undefined,
      })));
      setPonds((pondsRes.data || []).map((p) => ({ id: p.id, name: p.name })));
    };
    fetchData();
  }, [user]);

  const months = [
    { value: "01", label: "জানুয়ারি" }, { value: "02", label: "ফেব্রুয়ারি" },
    { value: "03", label: "মার্চ" }, { value: "04", label: "এপ্রিল" },
    { value: "05", label: "মে" }, { value: "06", label: "জুন" },
    { value: "07", label: "জুলাই" }, { value: "08", label: "আগস্ট" },
    { value: "09", label: "সেপ্টেম্বর" }, { value: "10", label: "অক্টোবর" },
    { value: "11", label: "নভেম্বর" }, { value: "12", label: "ডিসেম্বর" },
  ];

  const filterByMonth = (date: string) => filterMonth === "all" || date.substring(5, 7) === filterMonth;
  const filterByPond = (pondName?: string) => filterPond === "all" || pondName === filterPond;

  const filteredIncomes = incomes.filter((i) => filterByMonth(i.date) && filterByPond(i.pondName));
  const filteredExpenses = expenses.filter((e) => filterByMonth(e.date) && filterByPond(e.pondName));

  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalIncome - totalExpense;

  const incomeByCategory = filteredIncomes.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + i.amount; return acc; }, {} as { [k: string]: number });
  const expenseByCategory = filteredExpenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as { [k: string]: number });

  const siteLogoUrl = headerData?.logoUrl || '';
  const siteName = headerData?.companyName || footerData?.companyName || 'FishCare';
  const sitePhone = footerData?.phone || '+880 1978 865277';
  const siteEmail = footerData?.email || 'support@fishcare.com.bd';
  const siteAddress1 = footerData?.address_line1 || 'Manirampur, Jashore';
  const siteAddress2 = footerData?.address_line2 || 'Khulna, Bangladesh';
  const siteUrl = window.location.origin;

  const userName = user?.full_name || user?.email || '';
  const userMobile = user?.mobile || '';
  const userAddress = [user?.village, user?.upazila, user?.district, user?.division].filter(Boolean).join(', ');

  const handlePrintReport = () => {
    const printContent = `<html><head><title>আয়-ব্যয় রিপোর্ট</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Noto Sans Bengali',sans-serif;padding:0;color:#333}
      .print-header{display:flex;align-items:center;gap:16px;padding:20px 30px;border-bottom:3px solid #7c3aed}
      .print-header img{width:60px;height:60px;object-fit:contain;border-radius:8px}
      .print-header .logo-placeholder{width:60px;height:60px;background:linear-gradient(135deg,#7c3aed,#06b6d4);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:bold}
      .print-header .user-info{flex:1}
      .print-header .user-info h2{font-size:18px;color:#7c3aed;margin-bottom:2px}
      .print-header .user-info p{font-size:12px;color:#666}
      .print-header .report-title{text-align:right}
      .print-header .report-title h1{font-size:20px;color:#7c3aed}
      .print-header .report-title p{font-size:11px;color:#888}
      .content{padding:20px 30px}
      .summary{display:flex;justify-content:space-around;margin:15px 0;padding:15px;background:#f8f5ff;border-radius:8px;border:1px solid #e9e0ff}
      .summary div{text-align:center}
      .summary strong{display:block;font-size:13px;color:#555;margin-bottom:4px}
      .income{color:#16a34a}.expense{color:#dc2626}
      .profit{color:${profit >= 0 ? '#16a34a' : '#dc2626'}}
      table{width:100%;border-collapse:collapse;margin-top:15px;font-size:13px}
      th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left}
      th{background:#f3e8ff;color:#6b21a8;font-weight:600}
      .section-title{font-size:16px;font-weight:600;color:#7c3aed;margin:20px 0 8px;border-bottom:1px solid #e9e0ff;padding-bottom:4px}
      .print-footer{margin-top:30px;padding:15px 30px;border-top:2px solid #7c3aed;background:#f8f5ff;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#666}
      .print-footer .left p{margin-bottom:2px}
      .print-footer .right{text-align:right}
      .print-footer .site-name{font-weight:700;color:#7c3aed;font-size:13px}
      .print-footer .promo{font-size:10px;color:#888;margin-top:4px}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
      <div class="print-header">
        ${siteLogoUrl ? `<img src="${siteLogoUrl}" alt="${siteName}"/>` : `<div class="logo-placeholder">🐟</div>`}
        <div class="user-info">
          <h2>${userName}</h2>
          ${userMobile ? `<p>📱 ${userMobile}</p>` : ''}
          ${userAddress ? `<p>📍 ${userAddress}</p>` : ''}
        </div>
        <div class="report-title">
          <h1>আয়-ব্যয় রিপোর্ট</h1>
          <p>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
        </div>
      </div>
      <div class="content">
        <div class="summary">
          <div><strong>মোট আয়</strong><span class="income">৳${totalIncome.toLocaleString('bn-BD')}</span></div>
          <div><strong>মোট ব্যয়</strong><span class="expense">৳${totalExpense.toLocaleString('bn-BD')}</span></div>
          <div><strong>লাভ/ক্ষতি</strong><span class="profit">${profit >= 0 ? '+' : ''}৳${profit.toLocaleString('bn-BD')}</span></div>
        </div>
        ${Object.keys(incomeByCategory).length > 0 ? `
          <div class="section-title">ক্যাটাগরি অনুযায়ী আয়</div>
          <table><tr><th>ক্যাটাগরি</th><th style="text-align:right">পরিমাণ</th></tr>
          ${Object.entries(incomeByCategory).map(([cat, amt]) => `<tr><td>${cat}</td><td style="text-align:right" class="income">৳${amt.toLocaleString('bn-BD')}</td></tr>`).join('')}
          </table>` : ''}
        ${Object.keys(expenseByCategory).length > 0 ? `
          <div class="section-title">ক্যাটাগরি অনুযায়ী ব্যয়</div>
          <table><tr><th>ক্যাটাগরি</th><th style="text-align:right">পরিমাণ</th></tr>
          ${Object.entries(expenseByCategory).map(([cat, amt]) => `<tr><td>${cat}</td><td style="text-align:right" class="expense">৳${amt.toLocaleString('bn-BD')}</td></tr>`).join('')}
          </table>` : ''}
        <div class="section-title">সকল লেনদেন</div>
        <table><tr><th>তারিখ</th><th>ধরন</th><th>ক্যাটাগরি</th><th>পুকুর</th><th style="text-align:right">পরিমাণ</th></tr>
        ${[...filteredIncomes.map(i => ({ ...i, type: 'income' as const })), ...filteredExpenses.map(e => ({ ...e, type: 'expense' as const }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => `<tr><td>${item.date}</td><td>${item.type === 'income' ? 'আয়' : 'ব্যয়'}</td><td>${item.category}</td><td>${item.pondName || '-'}</td><td style="text-align:right" class="${item.type === 'income' ? 'income' : 'expense'}">${item.type === 'income' ? '+' : '-'}৳${item.amount.toLocaleString('bn-BD')}</td></tr>`).join('')}
        </table>
      </div>
      <div class="print-footer">
        <div class="left">
          <p>📍 ${siteAddress1}, ${siteAddress2}</p>
          <p>📱 ${sitePhone} | ✉️ ${siteEmail}</p>
        </div>
        <div class="right">
          <div class="site-name">${siteName}</div>
          <p>🌐 ${siteUrl}</p>
          <div class="promo">মাছ চাষিদের সেবায় নিবেদিত | ${siteName}</div>
        </div>
      </div>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

  const handleDownloadCSV = () => {
    const all = [...filteredIncomes.map(i => ({ ...i, type: 'আয়' })), ...filteredExpenses.map(e => ({ ...e, type: 'ব্যয়' }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const headers = ['তারিখ', 'ধরন', 'ক্যাটাগরি', 'পুকুর', 'বিবরণ', 'পরিমাণ'];
    const csv = [headers.join(','), ...all.map(t => [t.date, t.type, t.category, t.pondName || '', t.description || '', t.amount].join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `আয়_ব্যয়_রিপোর্ট_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url); toast.success('CSV ডাউনলোড হয়েছে');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full"><FileText className="h-6 w-6 text-purple-600" /></div>
            <div><h1 className="text-2xl font-bold">রিপোর্ট</h1><p className="text-muted-foreground">আয়-ব্যয়ের বিস্তারিত রিপোর্ট</p></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintReport}><Printer className="h-4 w-4 mr-2" /> প্রিন্ট</Button>
            <Button variant="outline" onClick={handleDownloadCSV}><Download className="h-4 w-4 mr-2" /> CSV ডাউনলোড</Button>
          </div>
        </div>

        <Card className="shadow-elegant"><CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />ফিল্টার</CardTitle></CardHeader>
          <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>মাস</Label><Select value={filterMonth} onValueChange={setFilterMonth}><SelectTrigger><SelectValue placeholder="সব মাস" /></SelectTrigger><SelectContent><SelectItem value="all">সব মাস</SelectItem>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>পুকুর</Label><Select value={filterPond} onValueChange={setFilterPond}><SelectTrigger><SelectValue placeholder="সব পুকুর" /></SelectTrigger><SelectContent><SelectItem value="all">সব পুকুর</SelectItem>{ponds.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></div>
          </div></CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-elegant"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">মোট আয়</CardTitle><TrendingUp className="h-5 w-5 text-green-600" /></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">৳{totalIncome.toLocaleString("bn-BD")}</p></CardContent></Card>
          <Card className="shadow-elegant"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">মোট ব্যয়</CardTitle><TrendingDown className="h-5 w-5 text-red-600" /></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">৳{totalExpense.toLocaleString("bn-BD")}</p></CardContent></Card>
          <Card className="shadow-elegant"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">লাভ/ক্ষতি</CardTitle><Calculator className="h-5 w-5" /></CardHeader><CardContent><p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{profit >= 0 ? "+" : ""}৳{profit.toLocaleString("bn-BD")}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-elegant"><CardHeader><CardTitle className="text-green-600 flex items-center gap-2"><TrendingUp className="h-5 w-5" />ক্যাটাগরি অনুযায়ী আয়</CardTitle></CardHeader><CardContent>{Object.keys(incomeByCategory).length === 0 ? <p className="text-center text-muted-foreground py-4">কোনো আয়ের রেকর্ড নেই</p> : <Table><TableHeader><TableRow><TableHead>ক্যাটাগরি</TableHead><TableHead className="text-right">পরিমাণ</TableHead></TableRow></TableHeader><TableBody>{Object.entries(incomeByCategory).map(([cat, amt]) => <TableRow key={cat}><TableCell>{cat}</TableCell><TableCell className="text-right text-green-600 font-medium">৳{amt.toLocaleString("bn-BD")}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
          <Card className="shadow-elegant"><CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><TrendingDown className="h-5 w-5" />ক্যাটাগরি অনুযায়ী ব্যয়</CardTitle></CardHeader><CardContent>{Object.keys(expenseByCategory).length === 0 ? <p className="text-center text-muted-foreground py-4">কোনো ব্যয়ের রেকর্ড নেই</p> : <Table><TableHeader><TableRow><TableHead>ক্যাটাগরি</TableHead><TableHead className="text-right">পরিমাণ</TableHead></TableRow></TableHeader><TableBody>{Object.entries(expenseByCategory).map(([cat, amt]) => <TableRow key={cat}><TableCell>{cat}</TableCell><TableCell className="text-right text-red-600 font-medium">৳{amt.toLocaleString("bn-BD")}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
        </div>

        <Card className="shadow-elegant"><CardHeader><CardTitle>সকল লেনদেন</CardTitle></CardHeader><CardContent>
          {filteredIncomes.length === 0 && filteredExpenses.length === 0 ? <p className="text-center text-muted-foreground py-8">কোনো লেনদেন নেই</p> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>তারিখ</TableHead><TableHead>ধরন</TableHead><TableHead>ক্যাটাগরি</TableHead><TableHead>পুকুর</TableHead><TableHead className="text-right">পরিমাণ</TableHead></TableRow></TableHeader><TableBody>
              {[...filteredIncomes.map(i => ({ ...i, type: "income" as const })), ...filteredExpenses.map(e => ({ ...e, type: "expense" as const }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                <TableRow key={item.id}><TableCell>{item.date}</TableCell><TableCell>{item.type === "income" ? <span className="text-green-600">আয়</span> : <span className="text-red-600">ব্যয়</span>}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.pondName || "-"}</TableCell><TableCell className={`text-right font-medium ${item.type === "income" ? "text-green-600" : "text-red-600"}`}>{item.type === "income" ? "+" : "-"}৳{item.amount.toLocaleString("bn-BD")}</TableCell></TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
