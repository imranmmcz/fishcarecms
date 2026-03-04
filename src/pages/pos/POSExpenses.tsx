import { useState } from "react";
import { POSLayout } from "@/components/POSLayout";
import { usePosExpenses, ExpenseCategory } from "@/hooks/usePosExpenses";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, DollarSign, Tag } from "lucide-react";
import { format } from "date-fns";

export default function POSExpenses() {
  const { language } = useLanguage();
  const bn = language === "bn";
  const {
    categories, expenses, loading,
    createCategory, updateCategory, deleteCategory,
    createExpense, deleteExpense,
  } = usePosExpenses();

  // Category form
  const [catDialog, setCatDialog] = useState(false);
  const [editCat, setEditCat] = useState<ExpenseCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catNameBn, setCatNameBn] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Expense form
  const [expDialog, setExpDialog] = useState(false);
  const [expCatId, setExpCatId] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expDate, setExpDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expPayment, setExpPayment] = useState("cash");
  const [expRef, setExpRef] = useState("");

  const resetCatForm = () => { setCatName(""); setCatNameBn(""); setCatDesc(""); setEditCat(null); };
  const resetExpForm = () => { setExpCatId(""); setExpAmount(""); setExpDesc(""); setExpDate(format(new Date(), "yyyy-MM-dd")); setExpPayment("cash"); setExpRef(""); };

  const handleCatSubmit = async () => {
    if (!catName || !catNameBn) return;
    try {
      if (editCat) {
        await updateCategory(editCat.id, { name: catName, name_bn: catNameBn, description: catDesc || null });
      } else {
        await createCategory({ name: catName, name_bn: catNameBn, description: catDesc || undefined });
      }
      resetCatForm();
      setCatDialog(false);
    } catch {}
  };

  const handleExpSubmit = async () => {
    if (!expAmount || parseFloat(expAmount) <= 0) return;
    try {
      await createExpense({
        category_id: expCatId || undefined,
        amount: parseFloat(expAmount),
        description: expDesc || undefined,
        expense_date: expDate,
        payment_method: expPayment,
        reference_no: expRef || undefined,
      });
      resetExpForm();
      setExpDialog(false);
    } catch {}
  };

  const openEditCat = (cat: ExpenseCategory) => {
    setEditCat(cat);
    setCatName(cat.name);
    setCatNameBn(cat.name_bn);
    setCatDesc(cat.description || "");
    setCatDialog(true);
  };

  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <POSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{bn ? "খরচ ব্যবস্থাপনা" : "Expense Management"}</h1>
            <p className="text-muted-foreground text-sm">{bn ? "ব্যবসার খরচ ট্র্যাক ও ক্যাটাগরি ব্যবস্থাপনা" : "Track business expenses & manage categories"}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10"><DollarSign className="h-6 w-6 text-destructive" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{bn ? "মোট খরচ" : "Total Expenses"}</p>
                <p className="text-2xl font-bold">৳{totalExpense.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10"><Tag className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{bn ? "ক্যাটাগরি" : "Categories"}</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/30"><DollarSign className="h-6 w-6 text-accent-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{bn ? "মোট এন্ট্রি" : "Total Entries"}</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses">
          <TabsList>
            <TabsTrigger value="expenses">{bn ? "খরচ তালিকা" : "Expenses"}</TabsTrigger>
            <TabsTrigger value="categories">{bn ? "ক্যাটাগরি" : "Categories"}</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{bn ? "খরচ তালিকা" : "Expense List"}</CardTitle>
                <Dialog open={expDialog} onOpenChange={(o) => { setExpDialog(o); if (!o) resetExpForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" />{bn ? "নতুন খরচ" : "Add Expense"}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{bn ? "নতুন খরচ যোগ করুন" : "Add New Expense"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>{bn ? "ক্যাটাগরি" : "Category"}</Label>
                        <Select value={expCatId} onValueChange={setExpCatId}>
                          <SelectTrigger><SelectValue placeholder={bn ? "ক্যাটাগরি নির্বাচন" : "Select category"} /></SelectTrigger>
                          <SelectContent>
                            {categories.filter(c => c.is_active).map(c => (
                              <SelectItem key={c.id} value={c.id}>{bn ? c.name_bn : c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{bn ? "পরিমাণ (৳)" : "Amount (৳)"}</Label>
                        <Input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0" />
                      </div>
                      <div>
                        <Label>{bn ? "তারিখ" : "Date"}</Label>
                        <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
                      </div>
                      <div>
                        <Label>{bn ? "পেমেন্ট মেথড" : "Payment Method"}</Label>
                        <Select value={expPayment} onValueChange={setExpPayment}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">{bn ? "ক্যাশ" : "Cash"}</SelectItem>
                            <SelectItem value="mobile_banking">{bn ? "মোবাইল ব্যাংকিং" : "Mobile Banking"}</SelectItem>
                            <SelectItem value="bank">{bn ? "ব্যাংক" : "Bank"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{bn ? "রেফারেন্স নং" : "Reference No"}</Label>
                        <Input value={expRef} onChange={e => setExpRef(e.target.value)} placeholder={bn ? "ঐচ্ছিক" : "Optional"} />
                      </div>
                      <div>
                        <Label>{bn ? "বিবরণ" : "Description"}</Label>
                        <Textarea value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder={bn ? "বিস্তারিত লিখুন..." : "Details..."} />
                      </div>
                      <Button onClick={handleExpSubmit} className="w-full">{bn ? "সংরক্ষণ করুন" : "Save"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">{bn ? "লোড হচ্ছে..." : "Loading..."}</p>
                ) : expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{bn ? "কোনো খরচ নেই" : "No expenses yet"}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{bn ? "তারিখ" : "Date"}</TableHead>
                          <TableHead>{bn ? "ক্যাটাগরি" : "Category"}</TableHead>
                          <TableHead>{bn ? "বিবরণ" : "Description"}</TableHead>
                          <TableHead>{bn ? "পেমেন্ট" : "Payment"}</TableHead>
                          <TableHead className="text-right">{bn ? "পরিমাণ" : "Amount"}</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map(exp => (
                          <TableRow key={exp.id}>
                            <TableCell>{format(new Date(exp.expense_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              {exp.category ? (
                                <Badge variant="outline">{bn ? exp.category.name_bn : exp.category.name}</Badge>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{exp.description || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {exp.payment_method === "cash" ? (bn ? "ক্যাশ" : "Cash") :
                                 exp.payment_method === "mobile_banking" ? (bn ? "মোবাইল ব্যাংকিং" : "Mobile Banking") :
                                 (bn ? "ব্যাংক" : "Bank")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">৳{Number(exp.amount).toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)}>
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
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{bn ? "খরচের ক্যাটাগরি" : "Expense Categories"}</CardTitle>
                <Dialog open={catDialog} onOpenChange={(o) => { setCatDialog(o); if (!o) resetCatForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" />{bn ? "নতুন ক্যাটাগরি" : "Add Category"}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{editCat ? (bn ? "ক্যাটাগরি সম্পাদনা" : "Edit Category") : (bn ? "নতুন ক্যাটাগরি" : "New Category")}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>{bn ? "নাম (ইংরেজি)" : "Name (English)"}</Label>
                        <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Rent" />
                      </div>
                      <div>
                        <Label>{bn ? "নাম (বাংলা)" : "Name (Bangla)"}</Label>
                        <Input value={catNameBn} onChange={e => setCatNameBn(e.target.value)} placeholder="যেমন: ভাড়া" />
                      </div>
                      <div>
                        <Label>{bn ? "বিবরণ" : "Description"}</Label>
                        <Textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} />
                      </div>
                      <Button onClick={handleCatSubmit} className="w-full">{editCat ? (bn ? "আপডেট" : "Update") : (bn ? "সংরক্ষণ" : "Save")}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{bn ? "কোনো ক্যাটাগরি নেই" : "No categories yet"}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{bn ? "নাম" : "Name"}</TableHead>
                        <TableHead>{bn ? "নাম (বাংলা)" : "Name (BN)"}</TableHead>
                        <TableHead>{bn ? "বিবরণ" : "Description"}</TableHead>
                        <TableHead>{bn ? "স্ট্যাটাস" : "Status"}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map(cat => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell>{cat.name_bn}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{cat.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={cat.is_active ? "default" : "secondary"}>
                              {cat.is_active ? (bn ? "সক্রিয়" : "Active") : (bn ? "নিষ্ক্রিয়" : "Inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditCat(cat)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </POSLayout>
  );
}
