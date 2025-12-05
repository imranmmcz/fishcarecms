import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingUp, Printer, Download } from "lucide-react";
import { toast } from "sonner";

interface IncomeRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  pondName?: string;
  fishType?: string;
  fishWeight?: number;
  fishPrice?: number;
}

const incomeCategories = [
  "মাছ বিক্রয়",
  "পোনা বিক্রয়",
  "ডিম বিক্রয়",
  "চিংড়ি বিক্রয়",
  "কাঁকড়া বিক্রয়",
  "শামুক/ঝিনুক বিক্রয়",
  "জলজ উদ্ভিদ বিক্রয়",
  "মাছের খাবার বিক্রয়",
  "সার বিক্রয়",
  "যন্ত্রপাতি ভাড়া",
  "প্রশিক্ষণ ফি",
  "সরকারি অনুদান",
  "ব্যাংক সুদ",
  "বীমা দাবি",
  "অন্যান্য আয়",
];

export default function DashboardIncome() {
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pondName, setPondName] = useState("");
  const [ponds, setPonds] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const savedRecords = JSON.parse(localStorage.getItem("farmerIncomes") || "[]");
    setRecords(savedRecords);

    const savedPonds = JSON.parse(localStorage.getItem("farmerPonds") || "[]");
    setPonds(savedPonds);
  }, []);

  const saveRecords = (newRecords: IncomeRecord[]) => {
    localStorage.setItem("farmerIncomes", JSON.stringify(newRecords));
    setRecords(newRecords);
  };

  const handleAdd = () => {
    if (!date || !category || !amount) {
      toast.error("তারিখ, ক্যাটাগরি এবং পরিমাণ দিন");
      return;
    }

    const newRecord: IncomeRecord = {
      id: Date.now().toString(),
      date,
      category,
      amount: parseFloat(amount),
      description,
      pondName,
    };

    const newRecords = [...records, newRecord];
    saveRecords(newRecords);
    toast.success("আয় যোগ করা হয়েছে");

    setCategory("");
    setAmount("");
    setDescription("");
    setPondName("");
  };

  const handleDelete = (id: string) => {
    const newRecords = records.filter((r) => r.id !== id);
    saveRecords(newRecords);
    toast.success("রেকর্ড মুছে ফেলা হয়েছে");
  };

  const totalIncome = records.reduce((sum, r) => sum + r.amount, 0);

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>আয়ের রিপোর্ট</title>
          <style>
            body { font-family: 'Noto Sans Bengali', sans-serif; padding: 20px; }
            h1 { color: #16a34a; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f0fdf4; color: #166534; }
            .total { font-weight: bold; color: #16a34a; font-size: 18px; text-align: right; margin-top: 20px; }
            .amount { text-align: right; color: #16a34a; }
          </style>
        </head>
        <body>
          <h1>আয়ের রিপোর্ট</h1>
          <table>
            <thead>
              <tr><th>তারিখ</th><th>ক্যাটাগরি</th><th>পুকুর</th><th>বিবরণ</th><th>পরিমাণ</th></tr>
            </thead>
            <tbody>
              ${records.map(r => `<tr><td>${r.date}</td><td>${r.category}</td><td>${r.pondName || '-'}</td><td>${r.description || '-'}</td><td class="amount">৳${r.amount.toLocaleString('bn-BD')}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="total">মোট আয়: ৳${totalIncome.toLocaleString('bn-BD')}</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['তারিখ', 'ক্যাটাগরি', 'পুকুর', 'বিবরণ', 'পরিমাণ'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => [r.date, r.category, r.pondName || '', r.description || '', r.amount].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `আয়ের_রিপোর্ট_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV ডাউনলোড হয়েছে');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">আয় ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground">আপনার সকল আয়ের রেকর্ড রাখুন</p>
          </div>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              নতুন আয় যোগ করুন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>তারিখ</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ক্যাটাগরি</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>পরিমাণ (টাকা)</Label>
                <Input
                  type="number"
                  placeholder="০"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>পুকুর (ঐচ্ছিক)</Label>
                <Select value={pondName} onValueChange={setPondName}>
                  <SelectTrigger>
                    <SelectValue placeholder="পুকুর নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {ponds.map((pond) => (
                      <SelectItem key={pond.id} value={pond.name}>{pond.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>বিবরণ (ঐচ্ছিক)</Label>
                <Input
                  placeholder="বিবরণ লিখুন"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              যোগ করুন
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span>আয়ের তালিকা</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint} disabled={records.length === 0}>
                  <Printer className="h-4 w-4 mr-1" /> প্রিন্ট
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={records.length === 0}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <span className="text-green-600 font-bold">মোট: ৳{totalIncome.toLocaleString("bn-BD")}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">কোনো আয়ের রেকর্ড নেই</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>ক্যাটাগরি</TableHead>
                      <TableHead>পুকুর</TableHead>
                      <TableHead>বিবরণ</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.slice().reverse().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          {record.category}
                          {record.fishType && (
                            <span className="text-xs text-muted-foreground block">
                              {record.fishType}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{record.pondName || "-"}</TableCell>
                        <TableCell>
                          {record.fishWeight && record.fishPrice ? (
                            <span className="text-xs">
                              {record.fishWeight} কেজি @ ৳{record.fishPrice}/কেজি
                              {record.description && <span className="block">{record.description}</span>}
                            </span>
                          ) : (
                            record.description || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          +৳{record.amount.toLocaleString("bn-BD")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
