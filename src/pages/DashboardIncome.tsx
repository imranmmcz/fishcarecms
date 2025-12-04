import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface IncomeRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  pondName?: string;
}

const incomeCategories = [
  "মাছ বিক্রয়",
  "পোনা বিক্রয়",
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
            <CardTitle className="flex justify-between items-center">
              <span>আয়ের তালিকা</span>
              <span className="text-green-600">মোট: ৳{totalIncome.toLocaleString("bn-BD")}</span>
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
                        <TableCell>{record.category}</TableCell>
                        <TableCell>{record.pondName || "-"}</TableCell>
                        <TableCell>{record.description || "-"}</TableCell>
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
