import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Waves, Edit, Fish } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PondRecord {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  depth: number;
  depthUnit: string;
  fishTypes: string[];
  fishCount: number;
  stockingDate: string;
  status: string;
  notes: string;
}

const fishTypeOptions = [
  "রুই", "কাতলা", "মৃগেল", "সিলভার কার্প", "গ্রাস কার্প", 
  "কমন কার্প", "তেলাপিয়া", "পাঙ্গাস", "শিং", "মাগুর", "কই", "পাবদা"
];

const statusOptions = [
  { value: "active", label: "চলমান", color: "bg-green-500" },
  { value: "harvested", label: "আহরণ সম্পন্ন", color: "bg-blue-500" },
  { value: "preparation", label: "প্রস্তুতি", color: "bg-yellow-500" },
  { value: "empty", label: "খালি", color: "bg-gray-500" },
];

export default function DashboardMyPond() {
  const [ponds, setPonds] = useState<PondRecord[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPond, setEditingPond] = useState<PondRecord | null>(null);

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("শতক");
  const [depth, setDepth] = useState("");
  const [depthUnit, setDepthUnit] = useState("ফুট");
  const [fishTypes, setFishTypes] = useState<string[]>([]);
  const [fishCount, setFishCount] = useState("");
  const [stockingDate, setStockingDate] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const savedPonds = JSON.parse(localStorage.getItem("farmerPonds") || "[]");
    setPonds(savedPonds);
  }, []);

  const savePonds = (newPonds: PondRecord[]) => {
    localStorage.setItem("farmerPonds", JSON.stringify(newPonds));
    setPonds(newPonds);
  };

  const resetForm = () => {
    setName("");
    setArea("");
    setAreaUnit("শতক");
    setDepth("");
    setDepthUnit("ফুট");
    setFishTypes([]);
    setFishCount("");
    setStockingDate("");
    setStatus("active");
    setNotes("");
    setEditingPond(null);
  };

  const handleSubmit = () => {
    if (!name || !area || !depth) {
      toast.error("পুকুরের নাম, আয়তন ও গভীরতা দিন");
      return;
    }

    const pondData: PondRecord = {
      id: editingPond?.id || Date.now().toString(),
      name,
      area: parseFloat(area),
      areaUnit,
      depth: parseFloat(depth),
      depthUnit,
      fishTypes,
      fishCount: parseInt(fishCount) || 0,
      stockingDate,
      status,
      notes,
    };

    let newPonds: PondRecord[];
    if (editingPond) {
      newPonds = ponds.map((p) => (p.id === editingPond.id ? pondData : p));
      toast.success("পুকুর আপডেট করা হয়েছে");
    } else {
      newPonds = [...ponds, pondData];
      toast.success("পুকুর যোগ করা হয়েছে");
    }

    savePonds(newPonds);
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (pond: PondRecord) => {
    setEditingPond(pond);
    setName(pond.name);
    setArea(pond.area.toString());
    setAreaUnit(pond.areaUnit);
    setDepth(pond.depth.toString());
    setDepthUnit(pond.depthUnit);
    setFishTypes(pond.fishTypes);
    setFishCount(pond.fishCount.toString());
    setStockingDate(pond.stockingDate);
    setStatus(pond.status);
    setNotes(pond.notes);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("আপনি কি এই পুকুরটি মুছে ফেলতে চান?")) {
      const newPonds = ponds.filter((p) => p.id !== id);
      savePonds(newPonds);
      toast.success("পুকুর মুছে ফেলা হয়েছে");
    }
  };

  const toggleFishType = (fish: string) => {
    if (fishTypes.includes(fish)) {
      setFishTypes(fishTypes.filter((f) => f !== fish));
    } else {
      setFishTypes([...fishTypes, fish]);
    }
  };

  const getStatusInfo = (statusValue: string) => {
    return statusOptions.find((s) => s.value === statusValue) || statusOptions[0];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Waves className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">আমার পুকুর</h1>
              <p className="text-muted-foreground">আপনার সকল পুকুরের তথ্য</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                নতুন পুকুর যোগ করুন
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPond ? "পুকুর সম্পাদনা" : "নতুন পুকুর যোগ করুন"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>পুকুরের নাম *</Label>
                  <Input placeholder="যেমন: পশ্চিম পুকুর" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>স্ট্যাটাস</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>আয়তন *</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="০" value={area} onChange={(e) => setArea(e.target.value)} />
                    <Select value={areaUnit} onValueChange={setAreaUnit}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="শতক">শতক</SelectItem>
                        <SelectItem value="একর">একর</SelectItem>
                        <SelectItem value="বর্গমিটার">বর্গমিটার</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>গভীরতা *</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="০" value={depth} onChange={(e) => setDepth(e.target.value)} />
                    <Select value={depthUnit} onValueChange={setDepthUnit}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ফুট">ফুট</SelectItem>
                        <SelectItem value="মিটার">মিটার</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>মাছের সংখ্যা</Label>
                  <Input type="number" placeholder="০" value={fishCount} onChange={(e) => setFishCount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>মজুদের তারিখ</Label>
                  <Input type="date" value={stockingDate} onChange={(e) => setStockingDate(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>মাছের প্রজাতি</Label>
                  <div className="flex flex-wrap gap-2">
                    {fishTypeOptions.map((fish) => (
                      <Badge
                        key={fish}
                        variant={fishTypes.includes(fish) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleFishType(fish)}
                      >
                        {fish}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>নোট</Label>
                  <Input placeholder="অতিরিক্ত তথ্য লিখুন" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={handleSubmit}>
                {editingPond ? "আপডেট করুন" : "সংরক্ষণ করুন"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {ponds.length === 0 ? (
          <Card className="shadow-elegant">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Waves className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">কোনো পুকুর যোগ করা হয়নি</p>
              <p className="text-muted-foreground text-sm">উপরের বাটনে ক্লিক করে নতুন পুকুর যোগ করুন</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ponds.map((pond) => {
              const statusInfo = getStatusInfo(pond.status);
              return (
                <Card key={pond.id} className="shadow-elegant hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Waves className="h-5 w-5 text-blue-500" />
                          {pond.name}
                        </CardTitle>
                        <Badge className={`mt-2 ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(pond)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pond.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">আয়তন:</span>
                        <p className="font-medium">{pond.area} {pond.areaUnit}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">গভীরতা:</span>
                        <p className="font-medium">{pond.depth} {pond.depthUnit}</p>
                      </div>
                    </div>
                    {pond.fishCount > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Fish className="h-4 w-4 text-primary" />
                        <span>{pond.fishCount.toLocaleString("bn-BD")} টি মাছ</span>
                      </div>
                    )}
                    {pond.fishTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pond.fishTypes.map((fish) => (
                          <Badge key={fish} variant="secondary" className="text-xs">
                            {fish}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {pond.stockingDate && (
                      <p className="text-xs text-muted-foreground">
                        মজুদের তারিখ: {pond.stockingDate}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
