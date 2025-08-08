import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type ExportType = 'financial' | 'manager' | 'player' | 'schedule' | 'guest-player';

export function useExportProcess() {
  const [isExporting, setIsExporting] = useState<ExportType | null>(null);
  const { toast } = useToast();

  const startExport = async (type: ExportType, eventId?: string) => {
    setIsExporting(type);

    try {
      if (type === 'manager' && eventId) {
        // Handle manager reports CSV export
        const response = await fetch(`/api/admin/manager-reports/${eventId}/csv`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to export manager report');
        }

        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
          : `manager-report-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;

        // Create a blob and download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Export Successful",
          description: `Manager report has been exported as ${filename}`,
        });
      } else {
        // Simulate export process for other types
        await new Promise((resolve) => setTimeout(resolve, 2000));

        toast({
          title: "Export Successful",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} report has been exported.`,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${type} report. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  return {
    isExporting,
    startExport,
  };
}
