import { Card } from "@/components/ui/card";
import { FileText, Download, Loader2 } from "lucide-react";
import { Card as NewCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

type ReportType = 'financial' | 'manager' | 'player' | 'schedule' | 'guest-player';

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('financial');
  const [isExporting, setIsExporting] = useState<ReportType | null>(null);

  const startExport = async (type: ReportType) => {
    setIsExporting(type);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      // TODO: Implement actual export functionality
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports and Financials</h2>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <NewCard className="col-span-1">
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              <Button
                variant={selectedReport === 'financial' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('financial')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Financial Reports
              </Button>
              <Button
                variant={selectedReport === 'manager' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('manager')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Manager Reports
              </Button>
              <Button
                variant={selectedReport === 'player' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedReport('player')}
                disabled={isExporting !== null}
              >
                <FileText className="mr-2 h-4 w-4" />
                Player Reports
              </Button>
            </div>
          </CardContent>
        </NewCard>

        <div className="col-span-3">
          <NewCard>
            <CardHeader>
              <CardTitle>
                {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">
                  Select options and click export to generate report
                </span>
                <Button
                  onClick={() => startExport(selectedReport)}
                  disabled={isExporting !== null}
                >
                  {isExporting === selectedReport ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-center">
                Report configuration options coming soon
              </p>
            </CardContent>
          </NewCard>
        </div>
      </div>
    </div>
  );
}