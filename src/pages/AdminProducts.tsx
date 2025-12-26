import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useProducts, getDiscountedPrice, Product } from "@/contexts/ProductsContext";
import { Button3D } from "@/components/ui/button-3d";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react";

const categories = [
  { value: "medicine", label: "ঔষধ" },
  { value: "food", label: "খাবার" },
  { value: "accessories", label: "সরঞ্জাম" },
];

const getCategoryLabel = (value: string) => {
  return categories.find((c) => c.value === value)?.label || value;
};

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  discount_percentage: 0,
  category: "medicine",
  image_url: "",
  external_link: "https://fishcare.com.bd",
};

const AdminProducts = () => {
  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!formData.name || formData.price <= 0) {
      return;
    }
    setIsSubmitting(true);
    const success = await addProduct({
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      discount_percentage: formData.discount_percentage,
      category: formData.category,
      image_url: formData.image_url || null,
      external_link: formData.external_link || null,
    });
    setIsSubmitting(false);
    if (success) {
      setFormData(emptyProduct);
      setIsAddOpen(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct || !formData.name || formData.price <= 0) {
      return;
    }
    setIsSubmitting(true);
    const success = await updateProduct(selectedProduct.id, {
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      discount_percentage: formData.discount_percentage,
      category: formData.category,
      image_url: formData.image_url || null,
      external_link: formData.external_link || null,
    });
    setIsSubmitting(false);
    if (success) {
      setIsEditOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    const success = await deleteProduct(selectedProduct.id);
    setIsSubmitting(false);
    if (success) {
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      discount_percentage: product.discount_percentage,
      category: product.category,
      image_url: product.image_url || "",
      external_link: product.external_link || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const ProductForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">পণ্যের নাম *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="পণ্যের নাম লিখুন"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">বিবরণ</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="পণ্যের বিবরণ লিখুন"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price">দাম (টাকা) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            placeholder="0"
            min={0}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="discount">ডিসকাউন্ট (%)</Label>
          <Input
            id="discount"
            type="number"
            value={formData.discount_percentage}
            onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
            placeholder="0"
            min={0}
            max={100}
          />
        </div>
      </div>
      {formData.discount_percentage > 0 && (
        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
          বিক্রয় মূল্য: ৳{getDiscountedPrice(formData.price, formData.discount_percentage)}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="category">ক্যাটাগরি</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image">ছবির URL</Label>
        <Input
          id="image"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="link">বাহ্যিক লিংক</Label>
        <Input
          id="link"
          value={formData.external_link}
          onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
          placeholder="https://fishcare.com.bd/product"
        />
      </div>
      <Button3D
        variant="success"
        onClick={onSubmit}
        disabled={isSubmitting || !formData.name || formData.price <= 0}
        className="mt-2"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {submitLabel}
      </Button3D>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">পণ্য ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground">শপের সকল পণ্য পরিচালনা করুন</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button3D variant="success" onClick={() => setFormData(emptyProduct)}>
                <Plus className="h-4 w-4" />
                নতুন পণ্য যোগ করুন
              </Button3D>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>নতুন পণ্য যোগ করুন</DialogTitle>
              </DialogHeader>
              <ProductForm onSubmit={handleAdd} submitLabel="পণ্য যোগ করুন" />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              পণ্য তালিকা ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                কোন পণ্য নেই। উপরের বাটন দিয়ে নতুন পণ্য যোগ করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ছবি</TableHead>
                      <TableHead>পণ্যের নাম</TableHead>
                      <TableHead>ক্যাটাগরি</TableHead>
                      <TableHead className="text-right">মূল দাম</TableHead>
                      <TableHead className="text-right">ডিসকাউন্ট</TableHead>
                      <TableHead className="text-right">বিক্রয় দাম</TableHead>
                      <TableHead className="text-center">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{getCategoryLabel(product.category)}</TableCell>
                        <TableCell className="text-right">৳{product.price}</TableCell>
                        <TableCell className="text-right">
                          {product.discount_percentage > 0 ? (
                            <span className="text-emerald-600 font-medium">
                              {product.discount_percentage}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ৳{getDiscountedPrice(product.price, product.discount_percentage)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button3D
                              variant="primary"
                              size="sm"
                              onClick={() => openEditDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button3D>
                            <Button3D
                              variant="danger"
                              size="sm"
                              onClick={() => openDeleteDialog(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button3D>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>পণ্য সম্পাদনা করুন</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleEdit} submitLabel="আপডেট করুন" />
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>পণ্য মুছে ফেলুন</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                আপনি কি নিশ্চিত যে আপনি "{selectedProduct?.name}" মুছে ফেলতে চান?
                এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button3D variant="primary" size="sm" onClick={() => setIsDeleteOpen(false)}>
                বাতিল
              </Button3D>
              <Button3D variant="danger" size="sm" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                মুছে ফেলুন
              </Button3D>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
