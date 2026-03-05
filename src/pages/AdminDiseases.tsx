import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Pencil, Trash2, RefreshCw, Stethoscope, Search, Eye, EyeOff, Pill } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Treatment {
  method: string;
  dosage: string;
  duration: string;
}

interface FishDiseaseRow {
  id: string;
  name: string;
  name_en: string;
  category: string;
  affected_fish: string[];
  season: string[];
  severity: string;
  symptoms: string[];
  causes: string[];
  prevention: string[];
  treatment: Treatment[];
  image_url: string | null;
  image_description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const emptyDisease: Omit<FishDiseaseRow, 'id' | 'created_at'> = {
  name: '',
  name_en: '',
  category: 'bacterial',
  affected_fish: [],
  season: [],
  severity: 'medium',
  symptoms: [],
  causes: [],
  prevention: [],
  treatment: [{ method: '', dosage: '', duration: '' }],
  image_url: '',
  image_description: '',
  is_active: true,
  display_order: 0,
};

const categories = [
  { value: 'bacterial', label: 'ব্যাক্টেরিয়াজনিত' },
  { value: 'fungal', label: 'ছত্রাকজনিত' },
  { value: 'parasitic', label: 'পরজীবীজনিত' },
  { value: 'viral', label: 'ভাইরাসজনিত' },
  { value: 'nutritional', label: 'পুষ্টিজনিত' },
];

const severities = [
  { value: 'low', label: 'হালকা' },
  { value: 'medium', label: 'মাঝারি' },
  { value: 'high', label: 'গুরুতর' },
  { value: 'critical', label: 'মারাত্মক' },
];

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const AdminDiseases = () => {
  const { language } = useLanguage();
  const [diseases, setDiseases] = useState<FishDiseaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDisease);

  // Text array helpers
  const [symptomsText, setSymptomsText] = useState('');
  const [causesText, setCausesText] = useState('');
  const [preventionText, setPreventionText] = useState('');
  const [affectedFishText, setAffectedFishText] = useState('');
  const [seasonText, setSeasonText] = useState('');

  // Product recommendation
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; image_url: string | null }[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const fetchDiseases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fish_diseases')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      toast({ title: 'লোড করতে সমস্যা', variant: 'destructive' });
    } else {
      setDiseases((data || []) as unknown as FishDiseaseRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDiseases(); fetchAllProducts(); }, []);

  const fetchAllProducts = async () => {
    const { data } = await supabase.from('products').select('id, name, image_url').order('name');
    setAllProducts(data || []);
  };

  const fetchRecommendedProducts = async (diseaseId: string) => {
    const { data } = await supabase
      .from('disease_recommended_products')
      .select('product_id')
      .eq('disease_id', diseaseId)
      .order('display_order');
    setSelectedProductIds((data || []).map((d: any) => d.product_id));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyDisease);
    setSymptomsText('');
    setCausesText('');
    setPreventionText('');
    setAffectedFishText('');
    setSeasonText('');
    setSelectedProductIds([]);
    setProductSearch('');
    setDialogOpen(true);
  };

  const openEdit = (d: FishDiseaseRow) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      name_en: d.name_en,
      category: d.category,
      affected_fish: d.affected_fish,
      season: d.season,
      severity: d.severity,
      symptoms: d.symptoms,
      causes: d.causes,
      prevention: d.prevention,
      treatment: d.treatment?.length ? d.treatment : [{ method: '', dosage: '', duration: '' }],
      image_url: d.image_url || '',
      image_description: d.image_description || '',
      is_active: d.is_active,
      display_order: d.display_order,
    });
    setSymptomsText(d.symptoms.join('\n'));
    setCausesText(d.causes.join('\n'));
    setPreventionText(d.prevention.join('\n'));
    setAffectedFishText(d.affected_fish.join(', '));
    setSeasonText(d.season.join(', '));
    setProductSearch('');
    fetchRecommendedProducts(d.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.name_en) {
      toast({ title: 'নাম পূরণ করুন', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      name_en: form.name_en,
      category: form.category,
      affected_fish: affectedFishText.split(',').map(s => s.trim()).filter(Boolean),
      season: seasonText.split(',').map(s => s.trim()).filter(Boolean),
      severity: form.severity,
      symptoms: symptomsText.split('\n').map(s => s.trim()).filter(Boolean),
      causes: causesText.split('\n').map(s => s.trim()).filter(Boolean),
      prevention: preventionText.split('\n').map(s => s.trim()).filter(Boolean),
      treatment: form.treatment.filter(t => t.method) as unknown as Record<string, string>[],
      image_url: form.image_url || null,
      image_description: form.image_description || null,
      is_active: form.is_active,
      display_order: form.display_order,
    };

    let error;
    let savedId = editingId;
    if (editingId) {
      ({ error } = await supabase.from('fish_diseases').update(payload).eq('id', editingId));
    } else {
      const { data: insertedData, error: insertError } = await supabase.from('fish_diseases').insert(payload).select('id').single();
      error = insertError;
      if (insertedData) savedId = insertedData.id;
    }

    if (error) {
      toast({ title: 'সংরক্ষণে সমস্যা', description: error.message, variant: 'destructive' });
    } else {
      // Save recommended products
      if (savedId) {
        await supabase.from('disease_recommended_products').delete().eq('disease_id', savedId);
        if (selectedProductIds.length > 0) {
          const rows = selectedProductIds.map((pid, i) => ({
            disease_id: savedId!,
            product_id: pid,
            display_order: i,
          }));
          await supabase.from('disease_recommended_products').insert(rows);
        }
      }
      toast({ title: editingId ? 'আপডেট সফল' : 'যোগ করা সফল' });
      setDialogOpen(false);
      fetchDiseases();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই রোগটি মুছে ফেলতে চান?')) return;
    const { error } = await supabase.from('fish_diseases').delete().eq('id', id);
    if (error) {
      toast({ title: 'মুছতে সমস্যা', variant: 'destructive' });
    } else {
      toast({ title: 'মুছে ফেলা হয়েছে' });
      fetchDiseases();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('fish_diseases').update({ is_active: !current }).eq('id', id);
    fetchDiseases();
  };

  const updateTreatment = (index: number, field: keyof Treatment, value: string) => {
    const updated = [...form.treatment];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, treatment: updated });
  };

  const addTreatment = () => {
    setForm({ ...form, treatment: [...form.treatment, { method: '', dosage: '', duration: '' }] });
  };

  const removeTreatment = (index: number) => {
    setForm({ ...form, treatment: form.treatment.filter((_, i) => i !== index) });
  };

  const filtered = diseases.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.name_en.toLowerCase().includes(search.toLowerCase())
  );

  const getCatLabel = (cat: string) => categories.find(c => c.value === cat)?.label || cat;
  const getSevLabel = (sev: string) => severities.find(s => s.value === sev)?.label || sev;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6" />
              রোগ ব্যবস্থাপনা
            </h1>
            <p className="text-muted-foreground text-sm">মাছের রোগ শনাক্তকরণ গাইড পরিচালনা করুন</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchDiseases} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              রিফ্রেশ
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              নতুন রোগ যোগ
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="রোগের নাম দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">রোগের নাম</th>
                  <th className="text-left p-3 hidden md:table-cell">ক্যাটেগরি</th>
                  <th className="text-left p-3 hidden md:table-cell">তীব্রতা</th>
                  <th className="text-center p-3">সক্রিয়</th>
                  <th className="text-center p-3">ক্রম</th>
                  <th className="text-right p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {d.image_url && <img src={d.image_url} alt="" className="h-10 w-14 rounded object-cover" />}
                        <div>
                          <p className="font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.name_en}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant="outline">{getCatLabel(d.category)}</Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge className={severityColors[d.severity]}>{getSevLabel(d.severity)}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Switch checked={d.is_active} onCheckedChange={() => toggleActive(d.id, d.is_active)} />
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{d.display_order}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">কোনো রোগ পাওয়া যায়নি</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'রোগ সম্পাদনা' : 'নতুন রোগ যোগ'}</DialogTitle>
            <DialogDescription>মাছের রোগের তথ্য পূরণ করুন</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>রোগের নাম (বাংলা) *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>রোগের নাম (ইংরেজি) *</Label>
                  <Input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>ক্যাটেগরি</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>তীব্রতা</Label>
                  <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {severities.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>প্রদর্শন ক্রম</Label>
                  <Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>ছবির URL</Label>
                  <Input value={form.image_url || ''} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>ছবির বর্ণনা</Label>
                  <Input value={form.image_description || ''} onChange={e => setForm({ ...form, image_description: e.target.value })} />
                </div>
              </div>

              {/* Affected Fish & Season */}
              <div>
                <Label>আক্রান্ত মাছ (কমা দিয়ে আলাদা করুন)</Label>
                <Input value={affectedFishText} onChange={e => setAffectedFishText(e.target.value)} placeholder="রুই, কাতলা, মৃগেল" />
              </div>
              <div>
                <Label>প্রাদুর্ভাবের সময় (কমা দিয়ে আলাদা করুন)</Label>
                <Input value={seasonText} onChange={e => setSeasonText(e.target.value)} placeholder="শীত (ডিসেম্বর-ফেব্রুয়ারি)" />
              </div>

              {/* Symptoms */}
              <div>
                <Label>লক্ষণসমূহ (প্রতি লাইনে একটি)</Label>
                <Textarea rows={4} value={symptomsText} onChange={e => setSymptomsText(e.target.value)} placeholder="শরীরে লালচে দাগ&#10;ক্ষতের চারপাশ ফুলে ওঠে" />
              </div>

              {/* Causes */}
              <div>
                <Label>কারণসমূহ (প্রতি লাইনে একটি)</Label>
                <Textarea rows={3} value={causesText} onChange={e => setCausesText(e.target.value)} />
              </div>

              {/* Prevention */}
              <div>
                <Label>প্রতিরোধ (প্রতি লাইনে একটি)</Label>
                <Textarea rows={3} value={preventionText} onChange={e => setPreventionText(e.target.value)} />
              </div>

              {/* Treatment */}
              <div>
                <Label className="mb-2 block">চিকিৎসা</Label>
                <div className="space-y-3">
                  {form.treatment.map((t, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-muted/50">
                      <Input placeholder="পদ্ধতি" value={t.method} onChange={e => updateTreatment(i, 'method', e.target.value)} />
                      <Input placeholder="মাত্রা" value={t.dosage} onChange={e => updateTreatment(i, 'dosage', e.target.value)} />
                      <Input placeholder="সময়কাল" value={t.duration} onChange={e => updateTreatment(i, 'duration', e.target.value)} />
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeTreatment(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTreatment}>
                    <Plus className="h-4 w-4 mr-1" /> চিকিৎসা যোগ করুন
                  </Button>
                </div>
              </div>

              {/* Recommended Products */}
              <div>
                <Label className="mb-2 block flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  প্রস্তাবিত ঔষধ/পণ্য নির্বাচন করুন
                </Label>
                <Input
                  placeholder="পণ্য খুঁজুন..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {allProducts
                    .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map(product => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProductIds(prev => [...prev, product.id]);
                            } else {
                              setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                            }
                          }}
                        />
                        {product.image_url && (
                          <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                        )}
                        <span className="text-sm">{product.name}</span>
                      </label>
                    ))}
                  {allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">কোনো পণ্য পাওয়া যায়নি</p>
                  )}
                </div>
                {selectedProductIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedProductIds.length}টি পণ্য নির্বাচিত</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>সক্রিয়</Label>
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'সংরক্ষণ হচ্ছে...' : editingId ? 'আপডেট করুন' : 'যোগ করুন'}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDiseases;
