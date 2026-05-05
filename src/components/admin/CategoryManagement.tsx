import { useState } from 'react';
import { useCategories, Category, CategoryFormData } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, FolderOpen, Loader2, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CategoryManagement() {
  const { categories, loading, createCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_bn: '',
    slug: '',
    description: '',
    icon: '',
    is_active: true,
    display_order: 0,
    parent_id: null,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_bn: '',
      slug: '',
      description: '',
      icon: '',
      is_active: true,
      display_order: categories.length,
      parent_id: null,
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        name_bn: category.name_bn,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || '',
        is_active: category.is_active,
        display_order: category.display_order,
        parent_id: category.parent_id ?? null,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.name_bn) {
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      handleCloseDialog();
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setIsSaving(true);
    try {
      await deleteCategory(deletingCategory.id);
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    await toggleCategoryStatus(category.id, !category.is_active);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              ক্যাটাগরি ব্যবস্থাপনা
            </CardTitle>
            <CardDescription>
              পণ্যের ক্যাটাগরি যোগ, সম্পাদনা এবং মুছে ফেলুন
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            নতুন ক্যাটাগরি
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>কোনো ক্যাটাগরি পাওয়া যায়নি</p>
            <Button variant="link" onClick={() => handleOpenDialog()}>
              প্রথম ক্যাটাগরি যোগ করুন
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>নাম (ইংরেজি)</TableHead>
                  <TableHead>নাম (বাংলা)</TableHead>
                  <TableHead>স্লাগ</TableHead>
                  <TableHead>প্যারেন্ট</TableHead>
                  <TableHead className="text-center">স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.name_bn}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{category.slug}</code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {category.parent_id
                        ? categories.find((c) => c.id === category.parent_id)?.name_bn || '—'
                        : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={category.is_active}
                        onCheckedChange={() => handleToggleStatus(category)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingCategory(category);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'ক্যাটাগরির তথ্য আপডেট করুন'
                  : 'নতুন পণ্য ক্যাটাগরি যোগ করুন'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">নাম (ইংরেজি) *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="medicine"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_bn">নাম (বাংলা) *</Label>
                  <Input
                    id="name_bn"
                    value={formData.name_bn}
                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    placeholder="ওষুধ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">স্লাগ (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="medicine"
                  />
                  <p className="text-xs text-muted-foreground">
                    খালি রাখলে স্বয়ংক্রিয় তৈরি হবে
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">আইকন (Lucide)</Label>
                  <Input
                    id="icon"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="pill"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">বিবরণ</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ক্যাটাগরির বিবরণ..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_id">প্যারেন্ট ক্যাটাগরি (সাব ক্যাটাগরির জন্য)</Label>
                <Select
                  value={formData.parent_id || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent_id: value === 'none' ? null : value })
                  }
                >
                  <SelectTrigger id="parent_id">
                    <SelectValue placeholder="কোনোটি নয় (টপ লেভেল)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">কোনোটি নয় (টপ লেভেল)</SelectItem>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .filter((c) => !c.parent_id) // only allow top-level as parents (1 level subcategory)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name_bn} ({c.name})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  সাব ক্যাটাগরি বানাতে প্যারেন্ট ক্যাটাগরি নির্বাচন করুন
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">প্রদর্শন ক্রম</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">সক্রিয়</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                বাতিল
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || !formData.name || !formData.name_bn}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCategory ? 'আপডেট করুন' : 'যোগ করুন'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ক্যাটাগরি মুছে ফেলুন?</AlertDialogTitle>
              <AlertDialogDescription>
                আপনি কি নিশ্চিত যে আপনি "{deletingCategory?.name_bn}" ক্যাটাগরি মুছে ফেলতে চান?
                এই পদক্ষেপটি পূর্বাবস্থায় ফেরানো যাবে না।
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>বাতিল</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                মুছে ফেলুন
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
