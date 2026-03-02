import { AdminLayout } from '@/components/AdminLayout';
import { AdSenseSettings } from '@/components/admin/AdSenseSettings';
import { Tv } from 'lucide-react';

const AdminAds = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tv className="h-6 w-6 text-primary" />
            বিজ্ঞাপন ব্যবস্থাপনা (Advertisements)
          </h1>
          <p className="text-muted-foreground mt-1">
            Google AdSense সেটিংস কনফিগার করুন
          </p>
        </div>
        <AdSenseSettings />
      </div>
    </AdminLayout>
  );
};

export default AdminAds;
