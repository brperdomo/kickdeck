import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, AlertTriangle, CheckCircle, X, FileText, Users, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportPreview {
  totalRows: number;
  validRows: number;
  errors: Array<{
    row: number;
    field: string;
    value: string;
    message: string;
  }>;
  preview: Array<any>;
  fieldMappings: { [key: string]: number };
  teamMappings: { [key: string]: { exists: boolean; teamId?: number; name: string } };
}

interface GameImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onImportComplete: () => void;
}

export function GameImportModal({ isOpen, onClose, eventId, onImportComplete }: GameImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [conflictCheckEnabled, setConflictCheckEnabled] = useState(true);
  const [createMissingFields, setCreateMissingFields] = useState(false);
  const [createMissingTeams, setCreateMissingTeams] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('csvFile', selectedFile);

    try {
      const response = await fetch(`/api/admin/events/${eventId}/import-games/preview`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process CSV file');
      }

      const previewData = await response.json();
      setPreview(previewData);
      setStep('preview');
      
      toast({
        title: "CSV processed successfully",
        description: `${previewData.validRows}/${previewData.totalRows} valid rows found`
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to process CSV",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setStep('importing');
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('csvFile', selectedFile);
    formData.append('conflictCheckEnabled', conflictCheckEnabled.toString());
    formData.append('createMissingFields', createMissingFields.toString());
    formData.append('createMissingTeams', createMissingTeams.toString());

    try {
      const response = await fetch(`/api/admin/events/${eventId}/import-games/execute`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to import games');
      }

      const result = await response.json();
      setImportResult(result);
      setStep('complete');
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${result.gamesImported} games`
      });

      // Trigger refresh of parent component
      onImportComplete();
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import games",
        variant: "destructive"
      });
      setStep('preview'); // Return to preview step
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreview(null);
    setImportResult(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      'game_id,date,time,field_name,home_team_id,home_team_name,away_team_id,away_team_name,age_group,flight,round,duration,notes',
      'G001,2025-08-16,10:00,Field 1,T001,Eagles FC,T002,Tigers United,U14,Nike Elite,1,90,Pool Play',
      'G002,2025-08-16,11:30,Field 2,T003,Sharks SC,T004,Wolves FC,U14,Nike Elite,1,90,Pool Play',
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Game Schedule
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
              <p className="text-gray-600 mb-4">
                Import games from another tournament management system
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button onClick={downloadTemplate} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
              </div>
              
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Required CSV Columns:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>• game_id (unique identifier)</div>
                <div>• date (YYYY-MM-DD)</div>
                <div>• time (HH:MM 24-hour)</div>
                <div>• field_name</div>
                <div>• home_team_id, home_team_name</div>
                <div>• away_team_id, away_team_name</div>
                <div>• age_group, flight</div>
                <div>• round, duration (optional)</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handlePreview} 
                disabled={!selectedFile || isLoading}
                className="w-32"
              >
                {isLoading ? 'Processing...' : 'Preview Import'}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-6 flex-1 overflow-hidden">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{preview.validRows}</div>
                <div className="text-sm text-gray-600">Valid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{preview.errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{preview.totalRows}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
            </div>

            {preview.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {preview.errors.length} validation errors found. Fix these issues in your CSV file.
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {/* Field Mappings */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Field Mappings
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(preview.fieldMappings).map(([fieldName, fieldId]) => (
                      <div key={fieldName} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{fieldName}</span>
                        {fieldId === -1 ? (
                          <Badge variant="secondary">Will Create</Badge>
                        ) : (
                          <Badge variant="outline">Exists</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Mappings */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Mappings
                  </h4>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {Object.entries(preview.teamMappings).map(([teamId, mapping]) => (
                      <div key={teamId} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">
                          {mapping.name} ({teamId})
                        </span>
                        {mapping.exists ? (
                          <Badge variant="outline">Exists</Badge>
                        ) : (
                          <Badge variant="secondary">Will Create</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Data */}
                <div>
                  <h4 className="font-medium mb-2">Preview (First 5 rows)</h4>
                  <div className="border rounded overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">Field</th>
                          <th className="p-2 text-left">Home Team</th>
                          <th className="p-2 text-left">Away Team</th>
                          <th className="p-2 text-left">Flight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{row.date}</td>
                            <td className="p-2">{row.time}</td>
                            <td className="p-2">{row.field_name}</td>
                            <td className="p-2">{row.home_team_name}</td>
                            <td className="p-2">{row.away_team_name}</td>
                            <td className="p-2">{row.flight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Validation Errors */}
                {preview.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Validation Errors</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {preview.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>
                            <strong>Row {error.row}:</strong> {error.message} 
                            (Field: {error.field}, Value: "{error.value}")
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Import Options</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="conflictCheck"
                  checked={conflictCheckEnabled}
                  onCheckedChange={setConflictCheckEnabled}
                />
                <Label htmlFor="conflictCheck">Check for schedule conflicts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createFields"
                  checked={createMissingFields}
                  onCheckedChange={setCreateMissingFields}
                />
                <Label htmlFor="createFields">Create missing fields automatically</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createTeams"
                  checked={createMissingTeams}
                  onCheckedChange={setCreateMissingTeams}
                />
                <Label htmlFor="createTeams">Create missing teams automatically</Label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={preview.errors.length > 0}
                className="w-32"
              >
                Import Games
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Importing Games...</h3>
            <p className="text-gray-600">Please wait while we process your schedule</p>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Import Completed</h3>
              <p className="text-gray-600 mb-6">Your games have been successfully imported</p>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{importResult.gamesImported}</div>
                <div className="text-sm text-gray-600">Games Imported</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{importResult.fieldsCreated}</div>
                <div className="text-sm text-gray-600">Fields Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{importResult.teamsCreated}</div>
                <div className="text-sm text-gray-600">Teams Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{importResult.conflicts?.length || 0}</div>
                <div className="text-sm text-gray-600">Conflicts Detected</div>
              </div>
            </div>

            {importResult.conflicts?.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {importResult.conflicts.length} schedule conflicts detected. 
                  Review the calendar interface to resolve these issues.
                </AlertDescription>
              </Alert>
            )}

            {importResult.errors?.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {importResult.errors.length} rows failed to import. Check the details above.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose} className="w-32">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}