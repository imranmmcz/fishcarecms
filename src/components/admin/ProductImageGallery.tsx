import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { appStorage } from "@/lib/appStorage";
import { Button } from "@/components/ui/button";
import { Button3D } from "@/components/ui/button-3d";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, Trash2, Star, GripVertical, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  alt_text: string | null;
}

interface ProductImageGalleryProps {
  productId: string;
}

export const ProductImageGallery = ({ productId }: ProductImageGalleryProps) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching images:", error);
    } else {
      setImages(data || []);
    }
    setIsLoading(false);
  }, [productId]);

  useEffect(() => {
    if (productId) fetchImages();
  }, [productId, fetchImages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: ProductImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await appStorage
          .from("product-images")
          .upload(fileName, file, { upsert: false });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`আপলোড ব্যর্থ: ${file.name}`);
          continue;
        }

        const { data: urlData } = appStorage
          .from("product-images")
          .getPublicUrl(fileName);

        const maxOrder = images.length > 0 
          ? Math.max(...images.map(img => img.display_order)) + 1 + i
          : i;

        const { data: insertData, error: insertError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: urlData.publicUrl,
            display_order: maxOrder,
            is_primary: images.length === 0 && i === 0,
            alt_text: null,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error("ডাটাবেসে সংরক্ষণ ব্যর্থ");
        } else if (insertData) {
          newImages.push(insertData as ProductImage);
        }
      }

      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
        toast.success(`${newImages.length}টি ছবি আপলোড হয়েছে`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("আপলোড করতে সমস্যা হয়েছে");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleDelete = async (image: ProductImage) => {
    setIsDeletingId(image.id);
    try {
      // Extract file path from URL
      const urlParts = image.image_url.split("/product-images/");
      if (urlParts.length > 1) {
        const filePath = decodeURIComponent(urlParts[1]);
        await appStorage.from("product-images").remove([filePath]);
      }

      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", image.id);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== image.id));
      toast.success("ছবি মুছে ফেলা হয়েছে");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("ছবি মুছতে সমস্যা হয়েছে");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      // Unset all primary
      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);

      // Set new primary
      const { error } = await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", imageId);

      if (error) throw error;

      setImages(prev =>
        prev.map(img => ({ ...img, is_primary: img.id === imageId }))
      );
      toast.success("প্রাইমারি ছবি সেট করা হয়েছে");
    } catch (error) {
      console.error("Set primary error:", error);
      toast.error("প্রাইমারি সেট করতে সমস্যা হয়েছে");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const newImages = [...images];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newImages.length) return;

    // Swap display_order values
    const tempOrder = newImages[index].display_order;
    newImages[index].display_order = newImages[swapIdx].display_order;
    newImages[swapIdx].display_order = tempOrder;

    // Swap positions
    [newImages[index], newImages[swapIdx]] = [newImages[swapIdx], newImages[index]];
    setImages(newImages);

    // Update in DB
    try {
      await Promise.all([
        supabase.from("product_images").update({ display_order: newImages[index].display_order }).eq("id", newImages[index].id),
        supabase.from("product_images").update({ display_order: newImages[swapIdx].display_order }).eq("id", newImages[swapIdx].id),
      ]);
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("অর্ডার পরিবর্তন করতে সমস্যা হয়েছে");
      fetchImages(); // Revert
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="font-semibold text-sm text-muted-foreground">পণ্যের ছবি গ্যালারি</h4>
        <Separator />
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                image.is_primary ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              <div className="aspect-square">
                <img
                  src={image.image_url}
                  alt={image.alt_text || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Primary badge */}
              {image.is_primary && (
                <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  প্রাইমারি
                </Badge>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {/* Reorder */}
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={() => handleMoveOrder(index, "up")}
                    disabled={index === 0}
                  >
                    <GripVertical className="h-3 w-3 rotate-90" />
                    <span className="sr-only">উপরে</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={() => handleMoveOrder(index, "down")}
                    disabled={index === images.length - 1}
                  >
                    <GripVertical className="h-3 w-3 -rotate-90" />
                    <span className="sr-only">নিচে</span>
                  </Button>
                </div>

                {/* Set primary */}
                {!image.is_primary && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={() => handleSetPrimary(image.id)}
                    title="প্রাইমারি সেট করুন"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}

                {/* Delete */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => handleDelete(image)}
                  disabled={isDeletingId === image.id}
                >
                  {isDeletingId === image.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* Order number */}
              <div className="absolute bottom-1.5 right-1.5 bg-background/80 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-xl">
          <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">কোন ছবি নেই। নিচে থেকে আপলোড করুন।</p>
        </div>
      )}

      {/* Upload Button */}
      <div>
        <Label
          htmlFor={`product-image-upload-${productId}`}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Button3D
              variant="primary"
              size="sm"
              className="gap-2"
              disabled={isUploading}
              onClick={() => document.getElementById(`product-image-upload-${productId}`)?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড করুন"}
            </Button3D>
            <span className="text-xs text-muted-foreground">
              (একাধিক ছবি নির্বাচন করা যাবে)
            </span>
          </div>
        </Label>
        <input
          id={`product-image-upload-${productId}`}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};
