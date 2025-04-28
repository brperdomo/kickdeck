import { useState, useRef, useCallback } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamCsvUploaderProps {
  eventId: number;
  onUploadSuccess: (teams: any[]) => void;
}

export function TeamCsvUploader({ eventId, onUploadSuccess }: TeamCsvUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        setError("Please upload a CSV file.");
        return;
      }
      setFile(file);
      setError(null);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onDrop(files);
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
        setError("Please upload a CSV file.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventId', eventId.toString());

      const response = await fetch('/api/admin/import/teams', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle validation errors
        if (response.status === 400 && errorData.invalidRecords) {
          throw new Error(`${errorData.invalidRecords.length} records failed validation. Please fix the CSV file and try again.`);
        }
        
        // Handle age group validation errors
        if (response.status === 400 && errorData.invalidAgeGroups) {
          // Create a more detailed error message with the available age groups
          let errorMsg = `${errorData.invalidAgeGroups.length} records contain invalid age groups.`;
          
          // If availableAgeGroups data is included in the response, include it in the error message
          if (errorData.availableAgeGroups) {
            if (errorData.availableAgeGroups.standardFormats && errorData.availableAgeGroups.standardFormats.length > 0) {
              errorMsg += `\n\nValid age groups for this event are:\n${errorData.availableAgeGroups.standardFormats.join(', ')}`;
            }
            
            if (errorData.availableAgeGroups.divisionCodes && errorData.availableAgeGroups.divisionCodes.length > 0) {
              errorMsg += `\n\nValid division codes:\n${errorData.availableAgeGroups.divisionCodes.join(', ')}`;
            }
          }
          
          // Include which records had problems
          if (errorData.invalidAgeGroups.length > 0) {
            const invalidTeams = errorData.invalidAgeGroups.map((item: any) => 
              `"${item.record.name}" with age group "${item.record.ageGroup}"`
            ).join(', ');
            
            errorMsg += `\n\nInvalid entries: ${invalidTeams}`;
          }
          
          throw new Error(errorMsg);
        }
        
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      
      onUploadSuccess(data.teams);
      setFile(null);
      
      toast({
        title: "Upload Successful",
        description: `Added ${data.teams.length} teams to the event.`,
      });
    } catch (error: any) {
      setError(error.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}
      
      <div 
        className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleBrowseClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Drag and drop your CSV file here, or <span className="text-[#2C5282] font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-500">
          CSV files only (.csv)
        </p>
      </div>
      
      {file && (
        <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {file.name}
            </span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => setFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <a
          href={`/api/admin/import/template?eventId=${eventId}`}
          download="team-import-template.csv"
          className="flex items-center text-[#2C5282] hover:underline text-sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          Download Template
        </a>
        
        <Button
          type="button"
          onClick={uploadFile}
          disabled={!file || isUploading}
          className="flex items-center"
        >
          {isUploading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Teams
            </>
          )}
        </Button>
      </div>
    </div>
  );
}