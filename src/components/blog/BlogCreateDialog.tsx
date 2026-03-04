import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBlogActions, BLOG_CATEGORIES } from "@/hooks/useBlog";
import { useLanguage } from "@/contexts/LanguageContext";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const BlogCreateDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { language } = useLanguage();
  const { createPost } = useBlogActions();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const result = await createPost({ title, content, category, tags, imageFiles: images });
    setSubmitting(false);
    if (result) {
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{language === "bn" ? "নতুন প্রশ্ন / পোস্ট" : "New Question / Post"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{language === "bn" ? "শিরোনাম" : "Title"} *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={language === "bn" ? "আপনার প্রশ্নের শিরোনাম" : "Your question title"} />
          </div>

          <div>
            <Label>{language === "bn" ? "বিস্তারিত" : "Description"} *</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder={language === "bn" ? "বিস্তারিত লিখুন..." : "Write details..."} />
          </div>

          <div>
            <Label>{language === "bn" ? "ক্যাটাগরি" : "Category"}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOG_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{language === "bn" ? c.label_bn : c.label_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{language === "bn" ? "ট্যাগ" : "Tags"}</Label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddTag())} placeholder={language === "bn" ? "ট্যাগ লিখে Enter চাপুন" : "Type tag & press Enter"} />
              <Button type="button" variant="outline" onClick={handleAddTag}>{language === "bn" ? "যোগ" : "Add"}</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>{language === "bn" ? "ছবি" : "Images"}</Label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
            <Button type="button" variant="outline" className="gap-2 w-full" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> {language === "bn" ? "ছবি যোগ করুন" : "Add Images"}
            </Button>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative group">
                    <img src={p} alt="" className="w-full h-24 object-cover rounded-md" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !content.trim()} className="w-full gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {language === "bn" ? "পোস্ট করুন" : "Submit Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogCreateDialog;
