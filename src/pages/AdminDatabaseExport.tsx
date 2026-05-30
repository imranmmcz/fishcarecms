import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Database, FileJson, FileCode, Loader2, RefreshCw, AlertCircle, Server, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MySQLBackendSettings from "@/components/admin/MySQLBackendSettings";
import { Input } from "@/components/ui/input";

interface TableConfig {
  name: string;
  label: string;
  label_bn: string;
}

// Default tables as fallback
const DEFAULT_TABLES: TableConfig[] = [
  { name: "market_prices", label: "Market Prices", label_bn: "বাজার দর" },
  { name: "products", label: "Products", label_bn: "পণ্যসমূহ" },
  { name: "page_content", label: "Page Content", label_bn: "পেজ কন্টেন্ট" },
  { name: "ad_settings", label: "Ad Settings", label_bn: "বিজ্ঞাপন সেটিংস" },
  { name: "system_settings", label: "System Settings", label_bn: "সিস্টেম সেটিংস" },
  { name: "profiles", label: "User Profiles", label_bn: "ব্যবহারকারী প্রোফাইল" },
  { name: "user_roles", label: "User Roles", label_bn: "ব্যবহারকারী রোল" },
];

export default function AdminDatabaseExport() {
  const [tables, setTables] = useState<TableConfig[]>(DEFAULT_TABLES);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTables, setFetchingTables] = useState(true);
  const [exportFormat, setExportFormat] = useState<"json" | "mysql">("json");

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, any[]> | null>(null);
  const [importSelected, setImportSelected] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<"upsert" | "insert">("upsert");
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ table: string; ok: boolean; count: number; error?: string }[]>([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setFetchingTables(true);
    try {
      // Use the database function to get all public tables dynamically
      const { data, error } = await supabase.rpc('get_public_tables');
      
      if (error) {
        console.error("Error fetching tables:", error);
        // Use default tables as fallback
        setTables(DEFAULT_TABLES);
        setSelectedTables(DEFAULT_TABLES.map(t => t.name));
      } else if (data && data.length > 0) {
        setTables(data);
        setSelectedTables(data.map((t: TableConfig) => t.name));
      } else {
        setTables(DEFAULT_TABLES);
        setSelectedTables(DEFAULT_TABLES.map(t => t.name));
      }
    } catch (error) {
      console.error("Error:", error);
      setTables(DEFAULT_TABLES);
      setSelectedTables(DEFAULT_TABLES.map(t => t.name));
    } finally {
      setFetchingTables(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => {
    setSelectedTables(tables.map(t => t.name));
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
          exportedBy: "FishCare Pro Admin",
          totalTables: selectedTables.length,
          tables: allData
        }, null, 2);
        filename = `fishcare_database_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = "application/json";
      } else {
        let sql = `-- =============================================\n`;
        sql += `-- FishCare Pro Database Export - MySQL Format\n`;
        sql += `-- Generated: ${new Date().toISOString()}\n`;
        sql += `-- Total Tables: ${selectedTables.length}\n`;
        sql += `-- =============================================\n\n`;
        sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
        sql += `SET NAMES utf8mb4;\n\n`;
        
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportResults([]);
    setImportPreview(null);
    setImportSelected([]);
    if (!file) {
      setImportFile(null);
      return;
    }
    setImportFile(file);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const tablesData: Record<string, any[]> =
        parsed?.tables && typeof parsed.tables === "object" ? parsed.tables : parsed;
      const valid: Record<string, any[]> = {};
      Object.entries(tablesData).forEach(([k, v]) => {
        if (Array.isArray(v)) valid[k] = v as any[];
      });
      if (Object.keys(valid).length === 0) {
        toast.error("ফাইলে কোনো বৈধ টেবিল ডেটা পাওয়া যায়নি");
        return;
      }
      setImportPreview(valid);
      setImportSelected(Object.keys(valid));
      toast.success(`${Object.keys(valid).length}টি টেবিল ফাইলে পাওয়া গেছে`);
    } catch (err) {
      console.error(err);
      toast.error("JSON ফাইল পার্স করতে সমস্যা হয়েছে");
    }
  };

  const toggleImportTable = (name: string) => {
    setImportSelected(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const runImport = async () => {
    if (!importPreview || importSelected.length === 0) {
      toast.error("অন্তত একটি টেবিল নির্বাচন করুন");
      return;
    }
    if (!confirm("আপনি কি নিশ্চিত? এই অপারেশন বিদ্যমান ডেটা পরিবর্তন/প্রতিস্থাপন করতে পারে।")) return;

    setImporting(true);
    setImportResults([]);
    const results: { table: string; ok: boolean; count: number; error?: string }[] = [];

    for (const tableName of importSelected) {
      const rows = importPreview[tableName] || [];
      if (rows.length === 0) {
        results.push({ table: tableName, ok: true, count: 0 });
        continue;
      }
      try {
        const chunkSize = 500;
        let inserted = 0;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const query =
            importMode === "upsert"
              ? (supabase.from(tableName as any) as any).upsert(chunk, { onConflict: "id" })
              : (supabase.from(tableName as any) as any).insert(chunk);
          const { error } = await query;
          if (error) throw error;
          inserted += chunk.length;
        }
        results.push({ table: tableName, ok: true, count: inserted });
      } catch (err: any) {
        results.push({ table: tableName, ok: false, count: 0, error: err?.message || "Unknown error" });
      }
    }

    setImportResults(results);
    setImporting(false);
    const okCount = results.filter(r => r.ok).length;
    const failCount = results.length - okCount;
    if (failCount === 0) toast.success(`সফলভাবে ${okCount}টি টেবিল ইম্পোর্ট হয়েছে`);
    else toast.error(`${failCount}টি টেবিল ইম্পোর্ট ব্যর্থ হয়েছে`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            ডাটাবেজ এক্সপোর্ট ও ব্যাকএন্ড
          </h1>
          <p className="text-muted-foreground mt-1">
            ডাটাবেজ এক্সপোর্ট এবং MySQL ব্যাকএন্ড কনফিগারেশন
          </p>
        </div>

        <Tabs defaultValue="export" className="w-full">
          <TabsList>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              এক্সপোর্ট
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              ইম্পোর্ট
            </TabsTrigger>
            <TabsTrigger value="backend" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              ব্যাকএন্ড কানেকশন
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6 mt-4">

        {/* Auto-sync info */}
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            ✨ <strong>স্বয়ংক্রিয় সিঙ্ক:</strong> নতুন টেবিল তৈরি হলে সেগুলো স্বয়ংক্রিয়ভাবে এই তালিকায় যুক্ত হবে।
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Table Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>টেবিল নির্বাচন করুন</CardTitle>
                  <CardDescription>
                    যে টেবিলগুলো এক্সপোর্ট করতে চান সেগুলো নির্বাচন করুন
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTables}
                  disabled={fetchingTables}
                >
                  <RefreshCw className={`h-4 w-4 ${fetchingTables ? 'animate-spin' : ''}`} />
                </Button>
              </div>
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
              
              {fetchingTables ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">টেবিল লোড হচ্ছে...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {tables.map(table => (
                    <div key={table.name} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={table.name}
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={() => toggleTable(table.name)}
                      />
                      <Label htmlFor={table.name} className="cursor-pointer flex-1">
                        <span className="font-medium">{table.label_bn}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ({table.name})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  মোট টেবিল: <strong>{tables.length}টি</strong> | সনাক্তকৃত: স্বয়ংক্রিয়
                </p>
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
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectedTables.length === 0 
                    ? "কোনো টেবিল নির্বাচন করা হয়নি"
                    : selectedTables.map(t => tables.find(table => table.name === t)?.label_bn || t).join(", ")
                  }
                </p>
              </div>

              {/* Export Button */}
              <Button
                onClick={exportData}
                disabled={loading || selectedTables.length === 0 || fetchingTables}
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
              <li>• <strong>স্বয়ংক্রিয় সনাক্তকরণ:</strong> নতুন টেবিল তৈরি হলে সেটি স্বয়ংক্রিয়ভাবে তালিকায় যুক্ত হবে</li>
              <li>• JSON ফরম্যাট সহজে পড়া যায় এবং অন্য অ্যাপ্লিকেশনে ব্যবহার করা যায়</li>
              <li>• MySQL ফরম্যাট সরাসরি MySQL/MariaDB ডাটাবেজে ইম্পোর্ট করা যায়</li>
              <li>• সংবেদনশীল ডেটা সুরক্ষিত রাখুন এবং নিরাপদ স্থানে সংরক্ষণ করুন</li>
            </ul>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6 mt-4">
            <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                ⚠️ <strong>সতর্কতা:</strong> ইম্পোর্টের আগে অবশ্যই বর্তমান ডাটাবেজের ব্যাকআপ নিন। Upsert মোডে একই <code>id</code> থাকা রেকর্ড আপডেট হবে।
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    JSON ফাইল আপলোড করুন
                  </CardTitle>
                  <CardDescription>
                    এক্সপোর্ট করা JSON ফাইল (<code>tables</code> অবজেক্ট সহ) নির্বাচন করুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input type="file" accept="application/json,.json" onChange={handleFileSelect} />

                  {importFile && (
                    <p className="text-sm text-muted-foreground">
                      নির্বাচিত: <strong>{importFile.name}</strong> ({Math.round(importFile.size / 1024)} KB)
                    </p>
                  )}

                  <div className="space-y-3">
                    <Label className="text-base font-medium">ইম্পোর্ট মোড</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setImportMode("upsert")}
                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                          importMode === "upsert" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium mb-1">Upsert</div>
                        <p className="text-xs text-muted-foreground">একই id থাকলে আপডেট, না থাকলে নতুন তৈরি</p>
                      </div>
                      <div
                        onClick={() => setImportMode("insert")}
                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                          importMode === "insert" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium mb-1">Insert Only</div>
                        <p className="text-xs text-muted-foreground">শুধু নতুন রেকর্ড যোগ হবে (ডুপ্লিকেট হলে ব্যর্থ)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>টেবিল নির্বাচন ও ইম্পোর্ট</CardTitle>
                  <CardDescription>
                    ফাইল থেকে যে টেবিলগুলো ইম্পোর্ট করতে চান সেগুলো নির্বাচন করুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!importPreview ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      প্রথমে একটি JSON ফাইল আপলোড করুন
                    </p>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setImportSelected(Object.keys(importPreview))}>
                          সব নির্বাচন
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setImportSelected([])}>
                          সব বাতিল
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {Object.entries(importPreview).map(([name, rows]) => {
                          const result = importResults.find(r => r.table === name);
                          return (
                            <div key={name} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                              <Checkbox
                                id={`imp-${name}`}
                                checked={importSelected.includes(name)}
                                onCheckedChange={() => toggleImportTable(name)}
                              />
                              <Label htmlFor={`imp-${name}`} className="cursor-pointer flex-1 flex items-center justify-between">
                                <span>
                                  <span className="font-medium">{name}</span>
                                  <span className="text-muted-foreground text-sm ml-2">({rows.length}টি রেকর্ড)</span>
                                </span>
                                {result && (
                                  result.ok ? (
                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                      <CheckCircle2 className="h-4 w-4" /> {result.count}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs text-destructive" title={result.error}>
                                      <XCircle className="h-4 w-4" /> ব্যর্থ
                                    </span>
                                  )
                                )}
                              </Label>
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        onClick={runImport}
                        disabled={importing || importSelected.length === 0}
                        className="w-full"
                        size="lg"
                      >
                        {importing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ইম্পোর্ট হচ্ছে...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {importSelected.length}টি টেবিল ইম্পোর্ট করুন
                          </>
                        )}
                      </Button>

                      {importResults.some(r => !r.ok) && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            কিছু টেবিল ইম্পোর্ট ব্যর্থ হয়েছে। RLS পলিসি বা স্কিমা অমিল হতে পারে। বিস্তারিত: {" "}
                            {importResults.filter(r => !r.ok).map(r => `${r.table}: ${r.error}`).join(" | ")}
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backend" className="space-y-6 mt-4">
            <MySQLBackendSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
