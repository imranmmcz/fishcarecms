import { POSLayout } from "@/components/POSLayout";
import { CategoryManagement } from "@/components/admin/CategoryManagement";

export default function POSCategories() {
  return (
    <POSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ক্যাটাগরি ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground text-sm">পণ্যের ক্যাটাগরি যোগ, সম্পাদনা ও মুছুন</p>
        </div>
        <CategoryManagement />
      </div>
    </POSLayout>
  );
}
