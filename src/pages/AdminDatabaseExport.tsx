import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Database, FileJson, FileCode, Loader2 } from "lucide-react";

interface TableConfig {
  name: string;
  label: string;
  labelBn: string;
}

const TABLES: TableConfig[] = [
  { name: "market_prices", label: "Market Prices", labelBn: "বাজার দর" },
  { name: "products", label: "Products", labelBn: "পণ্যসমূহ" },
  { name: "page_content", label: "Page Content", labelBn: "পেজ কন্টেন্ট" },
  { name: "ad_settings", label: "Ad Settings", labelBn: "বিজ্ঞাপন সেটিংস" },
  { name: "system_settings", label: "System Settings", labelBn: "সিস্টেম সেটিংস" },
  { name: "profiles", label: "User Profiles", labelBn: "ব্যবহারকারী প্রোফাইল" },
  { name: "user_roles", label: "User Roles", labelBn: "ব্যবহারকারী রোল" },
];

export default function AdminDatabaseExport() {
  const [selectedTables, setSelectedTables] = useState<string[]>(TABLES.map(t => t.name));
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "mysql">("json");

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => {
    setSelectedTables(TABLES.map(t => t.name));
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const fetchTableData = async (tableName: string) => {
    const { data, error } = await supabase
      .from(tableName as any)
      .select("*");
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    return data || [];
  };

  const generateMySQLSchema = (tableName: string, data: any[]): string => {
    if (data.length === 0) return `-- No data in table: ${tableName}\n`;

    const sample = data[0];
    const columns = Object.keys(sample);
    
    let sql = `-- =============================================\n`;
    sql += `-- Table: ${tableName}\n`;
    sql += `-- =============================================\n`;
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n\n`;
    sql += `CREATE TABLE \`${tableName}\` (\n`;
    
    const columnDefs = columns.map(col => {
      const value = sample[col];
      let type = "TEXT";
      
      if (col === "id" || col.endsWith("_id")) {
        type = "CHAR(36)";
      } else if (typeof value === "number") {
        type = Number.isInteger(value) ? "INT" : "DECIMAL(10,2)";
      } else if (typeof value === "boolean") {
        type = "TINYINT(1)";
      } else if (col.includes("_at") || col.includes("date")) {
        type = col.includes("date") && !col.includes("_at") ? "DATE" : "TIMESTAMP";
      } else if (typeof value === "object" && value !== null) {
        type = "JSON";
      } else if (typeof value === "string" && value.length < 255) {
        type = "VARCHAR(255)";
      }
      
      const nullable = value === null ? "DEFAULT NULL" : "NOT NULL";
      const isPrimary = col === "id" ? " PRIMARY KEY" : "";
      
      return `  \`${col}\` ${type} ${nullable}${isPrimary}`;
    });
    
    sql += columnDefs.join(",\n");
    sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
    
    // Generate INSERT statements
    if (data.length > 0) {
      sql += `-- Data for ${tableName}\n`;
      
      data.forEach(row => {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return "NULL";
          if (typeof val === "boolean") return val ? "1" : "0";
          if (typeof val === "number") return val.toString();
          if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        
        sql += `INSERT INTO \`${tableName}\` (\`${columns.join("`, `")}\`) VALUES (${values.join(", ")});\n`;
      });
      
      sql += "\n";
    }
    
    return sql;
  };

  const exportData = async () => {
    if (selectedTables.length === 0) {
      toast.error("অন্তত একটি টেবিল নির্বাচন করুন");
      return;
    }

    setLoading(true);
    
    try {
      const allData: Record<string, any[]> = {};
      
      for (const tableName of selectedTables) {
        const data = await fetchTableData(tableName);
        allData[tableName] = data;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === "json") {
        content = JSON.stringify({
          exportDate: new Date().toISOString(),
          tables: allData
        }, null, 2);
        filename = `fishcare_database_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = "application/json";
      } else {
        let sql = `-- =============================================\n`;
        sql += `-- FishCare Pro Database Export - MySQL Format\n`;
        sql += `-- Generated: ${new Date().toISOString()}\n`;
        sql += `-- =============================================\n\n`;
        sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
        
        for (const tableName of selectedTables) {
          sql += generateMySQLSchema(tableName, allData[tableName]);
        }
        
        sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
        sql += `\n-- =============================================\n`;
        sql += `-- END OF DATABASE EXPORT\n`;
        sql += `-- =============================================\n`;
        
        content = sql;
        filename = `fishcare_database_export_${new Date().toISOString().split('T')[0]}.sql`;
        mimeType = "text/plain";
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${selectedTables.length}টি টেবিল সফলভাবে এক্সপোর্ট হয়েছে`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("এক্সপোর্ট করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            ডাটাবেজ এক্সপোর্ট
          </h1>
          <p className="text-muted-foreground mt-1">
            ডাটাবেজের ডেটা MySQL বা JSON ফরম্যাটে ডাউনলোড করুন
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Table Selection */}
          <Card>
            <CardHeader>
              <CardTitle>টেবিল নির্বাচন করুন</CardTitle>
              <CardDescription>
                যে টেবিলগুলো এক্সপোর্ট করতে চান সেগুলো নির্বাচন করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  সব নির্বাচন
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  সব বাতিল
                </Button>
              </div>
              
              <div className="space-y-3">
                {TABLES.map(table => (
                  <div key={table.name} className="flex items-center space-x-3">
                    <Checkbox
                      id={table.name}
                      checked={selectedTables.includes(table.name)}
                      onCheckedChange={() => toggleTable(table.name)}
                    />
                    <Label htmlFor={table.name} className="cursor-pointer flex-1">
                      <span className="font-medium">{table.labelBn}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({table.name})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>এক্সপোর্ট অপশন</CardTitle>
              <CardDescription>
                ফরম্যাট নির্বাচন করে ডাউনলোড করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">ফরম্যাট নির্বাচন করুন</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setExportFormat("json")}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      exportFormat === "json"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileJson className="h-5 w-5 text-green-600" />
                      <span className="font-medium">JSON</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      সহজে পড়া যায়, API এ ব্যবহার উপযোগী
                    </p>
                  </div>
                  
                  <div
                    onClick={() => setExportFormat("mysql")}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      exportFormat === "mysql"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileCode className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">MySQL</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      SQL ফাইল, অন্য ডাটাবেজে ইম্পোর্ট করুন
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Tables Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">নির্বাচিত টেবিল</span>
                  <span className="text-primary font-bold">{selectedTables.length}টি</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedTables.length === 0 
                    ? "কোনো টেবিল নির্বাচন করা হয়নি"
                    : selectedTables.map(t => TABLES.find(table => table.name === t)?.labelBn).join(", ")
                  }
                </p>
              </div>

              {/* Export Button */}
              <Button
                onClick={exportData}
                disabled={loading || selectedTables.length === 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    এক্সপোর্ট হচ্ছে...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {exportFormat === "json" ? "JSON" : "MySQL"} ফরম্যাটে ডাউনলোড করুন
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📌 এক্সপোর্ট সম্পর্কে তথ্য
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• JSON ফরম্যাট সহজে পড়া যায় এবং অন্য অ্যাপ্লিকেশনে ব্যবহার করা যায়</li>
              <li>• MySQL ফরম্যাট সরাসরি MySQL/MariaDB ডাটাবেজে ইম্পোর্ট করা যায়</li>
              <li>• সংবেদনশীল ডেটা সুরক্ষিত রাখুন এবং নিরাপদ স্থানে সংরক্ষণ করুন</li>
              <li>• এক্সপোর্ট করা ফাইল আপনার ডিভাইসে সরাসরি ডাউনলোড হবে</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
