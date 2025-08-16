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
import { Upload, AlertTriangle, CheckCircle, X, FileText, Users, MapPin, Clock, Download } from 'lucide-react';
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
  fieldMappings: { [key: string]: { exists: boolean; fieldId?: number } };
  teamMappings: { [key: string]: { exists: boolean; teamId?: number; name: string } };
  teamMatches?: Array<{
    csvName: string;
    matches: Array<{
      teamId: number;
      teamName: string;
      confidence: number;
      matchType: string;
      suggestion: string;
    }>;
    warnings: string[];
    selected?: number;
  }>;
  missingFields: string[];
  missingTeams: string[];
  matchingWarnings?: string[];
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
  const [createMissingFields, setCreateMissingFields] = useState(false);
  const [createMissingTeams, setCreateMissingTeams] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetModal = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreview(null);
    setImportResult(null);
    setCreateMissingFields(false);
    setCreateMissingTeams(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file (.csv)",
        variant: "destructive"
      });
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('csvFile', selectedFile);
    formData.append('eventId', eventId);

    try {
      // Use relative URL for all environments (production and development)
      const apiUrl = '/api/admin/csv-import/preview';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process CSV file');
      }

      const previewData = await response.json();
      setPreview(previewData);
      setStep('preview');

      toast({
        title: "CSV Preview Ready",
        description: `Found ${previewData.totalRows} rows, ${previewData.validRows} valid`,
      });

    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Failed to preview CSV file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !preview) return;

    setIsLoading(true);
    setStep('importing');
    
    const formData = new FormData();
    formData.append('csvFile', selectedFile);
    formData.append('eventId', eventId);
    formData.append('createMissingFields', createMissingFields.toString());
    formData.append('createMissingTeams', createMissingTeams.toString());

    try {
      // Use relative URL for all environments (production and development)
      const apiUrl = '/api/admin/csv-import/execute';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import CSV file');
      }

      const result = await response.json();
      setImportResult(result);
      setStep('complete');

      toast({
        title: "Import Successful",
        description: `Imported ${result.gamesImported} games successfully`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CSV file",
        variant: "destructive"
      });
      setStep('preview'); // Go back to preview on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onImportComplete();
    handleClose();
  };

  const downloadTemplate = () => {
    // Create sample CSV template with proper headers and example data
    const csvTemplate = [
      'Date,Time,Home Team,Away Team,Age Group,Field,Status',
      '2025-08-15,09:00,Team Alpha,Team Beta,U14 Boys,Field 1,Scheduled',
      '2025-08-15,10:30,Team Gamma,Team Delta,U14 Boys,Field 2,Scheduled',
      '2025-08-15,12:00,Team Echo,Team Foxtrot,U16 Girls,Field 1,Scheduled',
      '2025-08-15,13:30,Team Golf,Team Hotel,U16 Girls,Field 3,Scheduled'
    ].join('\n');

    // Create downloadable blob
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'game-schedule-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been saved to your downloads folder",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Game Schedule from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: File Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <div>
                      <strong>CSV Format Required:</strong> Your CSV file must have these columns: Date, Time, Home Team, Away Team, Age Group, Field, Status
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      className="ml-4 flex items-center gap-1 text-xs"
                    >
                      <Download className="h-3 w-3" />
                      Download Template
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Label htmlFor="csvFile">Select CSV File</Label>
                <Input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                />
                
                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePreview} 
                    disabled={!selectedFile || isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Preview Import'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview and Configuration */}
          {step === 'preview' && preview && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{preview.totalRows}</div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{preview.validRows}</div>
                  <div className="text-sm text-gray-600">Valid Rows</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{preview.errors.length}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{preview.errors.length} validation errors found:</strong>
                    <ScrollArea className="h-32 mt-2">
                      <div className="space-y-1">
                        {preview.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="text-xs">
                            Row {error.row}: {error.message} (Field: {error.field})
                          </div>
                        ))}
                        {preview.errors.length > 10 && (
                          <div className="text-xs italic">
                            ...and {preview.errors.length - 10} more errors
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {/* Missing Fields */}
              {preview.missingFields.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Missing Fields ({preview.missingFields.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {preview.missingFields.map((field, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="createFields" 
                      checked={createMissingFields}
                      onCheckedChange={(checked) => setCreateMissingFields(checked as boolean)}
                    />
                    <Label htmlFor="createFields" className="text-sm">
                      Create missing fields automatically
                    </Label>
                  </div>
                </div>
              )}

              {/* Missing Teams */}
              {preview.missingTeams.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Missing Teams ({preview.missingTeams.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {preview.missingTeams.slice(0, 20).map((team, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {team}
                      </Badge>
                    ))}
                    {preview.missingTeams.length > 20 && (
                      <Badge variant="secondary" className="text-xs">
                        +{preview.missingTeams.length - 20} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="createTeams" 
                      checked={createMissingTeams}
                      onCheckedChange={(checked) => setCreateMissingTeams(checked as boolean)}
                    />
                    <Label htmlFor="createTeams" className="text-sm">
                      Create missing teams automatically
                    </Label>
                  </div>
                </div>
              )}

              {/* Enhanced Team Matching Validation */}
              {preview.matchingWarnings && preview.matchingWarnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <strong>Team Matching Warnings ({preview.matchingWarnings.length}):</strong>
                      <ScrollArea className="h-32">
                        <div className="space-y-1">
                          {preview.matchingWarnings.map((warning, index) => (
                            <div key={index} className="text-xs bg-red-50 p-2 rounded border border-red-200">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Detailed Team Match Analysis */}
              {preview.teamMatches && preview.teamMatches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Team Matching Analysis</span>
                  </div>
                  <ScrollArea className="h-64 border rounded-lg p-3">
                    <div className="space-y-3">
                      {preview.teamMatches.map((teamMatch, index) => (
                        <div key={index} className="border-b pb-2 last:border-b-0">
                          <div className="font-medium text-sm mb-1">"{teamMatch.csvName}"</div>
                          {teamMatch.matches.length > 0 ? (
                            <div className="space-y-1">
                              {teamMatch.matches.slice(0, 3).map((match, matchIndex) => (
                                <div key={matchIndex} className="flex items-center justify-between text-xs">
                                  <span className="flex-1">→ {match.teamName}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={match.confidence > 0.9 ? "default" : match.confidence > 0.7 ? "secondary" : "destructive"}
                                      className="text-xs"
                                    >
                                      {Math.round(match.confidence * 100)}%
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {match.matchType}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                              {teamMatch.matches.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{teamMatch.matches.length - 3} more matches
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600">No matches found</div>
                          )}
                          {teamMatch.warnings.length > 0 && (
                            <div className="mt-1">
                              {teamMatch.warnings.map((warning, warnIndex) => (
                                <div key={warnIndex} className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                  ⚠️ {warning}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Sample Data Preview */}
              <div>
                <h4 className="font-medium mb-2">Sample Data (First 5 Rows)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-48">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">Home Team</th>
                          <th className="p-2 text-left">Away Team</th>
                          <th className="p-2 text-left">Age Group</th>
                          <th className="p-2 text-left">Field</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{row.Date}</td>
                            <td className="p-2">{row.Time}</td>
                            <td className="p-2">{row['Home Team']}</td>
                            <td className="p-2">{row['Away Team']}</td>
                            <td className="p-2">{row['Age Group']}</td>
                            <td className="p-2">{row.Field}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={preview.errors.length > 0 || isLoading}
                >
                  {isLoading ? 'Importing...' : `Import ${preview.validRows} Games`}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="text-center space-y-4">
              <Clock className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <div>
                <h3 className="text-lg font-medium">Importing Games...</h3>
                <p className="text-gray-600">Processing your CSV file and creating games</p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && importResult && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-bold text-green-600">Import Complete!</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.gamesImported}</div>
                  <div className="text-sm text-gray-600">Games Imported</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResult.teamsCreated}</div>
                  <div className="text-sm text-gray-600">Teams Created</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{importResult.errors.length} rows had errors:</strong>
                    <ScrollArea className="h-32 mt-2">
                      <div className="space-y-1">
                        {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                          <div key={index} className="text-xs">{error}</div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div className="text-xs italic">
                            ...and {importResult.errors.length - 5} more errors
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All imported games are ready for scoring and will appear in standings calculations.
                  You can now use the scoring interface to enter game results.
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <Button onClick={handleComplete} className="w-full">
                  Complete Import
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}