import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

interface FertilizerReport {
  fertilizers: {
    urea: string;
    tsp: string;
    lime: string;
    oilcake?: string;
    cowdung?: string; // Legacy support
  };
  schedule: string;
  pondType: string;
  date: string;
  area: number;
  depth: number;
}

const Reports = () => {
  const [reports, setReports] = useState<FertilizerReport[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const savedReports = JSON.parse(localStorage.getItem("fertilizerReports") || "[]");
    setReports(savedReports.reverse()); // Show newest first
  };

  const deleteReport = (index: number) => {
    const savedReports = JSON.parse(localStorage.getItem("fertilizerReports") || "[]");
    savedReports.splice(savedReports.length - 1 - index, 1); // Adjust for reversed array
    localStorage.setItem("fertilizerReports", JSON.stringify(savedReports));
    loadReports();
  };

  const clearAllReports = () => {
    if (confirm("সকল রিপোর্ট মুছে ফেলতে চান?")) {
      localStorage.removeItem("fertilizerReports");
      setReports([]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">সার প্রয়োগ রিপোর্ট</h1>
              <p className="text-muted-foreground">তারিখ অনুযায়ী সার প্রয়োগের ইতিহাস দেখুন</p>
            </div>
          </div>

          {reports.length > 0 && (
            <div className="flex justify-end">
              <Button variant="destructive" onClick={clearAllReports} size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                সকল রিপোর্ট মুছুন
              </Button>
            </div>
          )}

          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">কোন রিপোর্ট নেই</h3>
                <p className="text-muted-foreground">সার প্রয়োগ করলে এখানে রিপোর্ট দেখা যাবে</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          {format(new Date(report.date), "PPP", { locale: bn })}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {report.pondType} • আয়তন: {report.area} শতক • গভীরতা: {report.depth} ফুট
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReport(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">ইউরিয়া</div>
                        <div className="text-lg font-bold text-foreground">{report.fertilizers.urea} কেজি</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">টিএসপি</div>
                        <div className="text-lg font-bold text-foreground">{report.fertilizers.tsp} কেজি</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">চুন</div>
                        <div className="text-lg font-bold text-foreground">{report.fertilizers.lime} কেজি</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">খৈল</div>
                        <div className="text-lg font-bold text-foreground">{report.fertilizers.oilcake || report.fertilizers.cowdung || '0'} কেজি</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <strong className="text-blue-900">প্রয়োগ সময়সূচী:</strong>{" "}
                      <span className="text-blue-800">{report.schedule}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Reports;