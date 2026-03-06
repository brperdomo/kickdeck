import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Eye, Calendar, Download, Filter, Search } from "lucide-react";

interface FormSubmission {
  id: number;
  templateId: number;
  templateName: string;
  teamId: number;
  teamName: string;
  teamStatus: string;
  submitterEmail: string;
  eventId: number;
  eventName: string;
  responses: Record<string, any>;
  templateVersion: number;
  submittedAt: string;
}

export const FormSubmissionsReport = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/admin/form-submissions/all', selectedEvent],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEvent && selectedEvent !== 'all') {
        params.append('eventId', selectedEvent);
      }
      
      const response = await fetch(`/api/admin/form-submissions/all?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form submissions');
      }
      const data = await response.json();
      return data.submissions as FormSubmission[];
    },
  });

  const { data: events } = useQuery({
    queryKey: ['/api/admin/events'],
    select: (data: any) => Array.isArray(data) ? data : data?.events ?? [],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderResponseValue = (value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value || 'N/A');
  };

  // Get unique template names for filtering
  const uniqueTemplates = submissions ? Array.from(new Set(submissions.map(s => s.templateName).filter(Boolean))) : [];

  // Filter submissions based on search and filters
  const filteredSubmissions = submissions?.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submitterEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTemplate = selectedTemplate === 'all' || submission.templateName === selectedTemplate;
    
    return matchesSearch && matchesTemplate;
  }) || [];

  const exportToCsv = () => {
    if (!filteredSubmissions.length) return;
    
    // Create CSV headers
    const headers = ['Team Name', 'Event', 'Template', 'Submitter Email', 'Team Status', 'Submitted Date', 'Responses'];
    
    // Create CSV rows
    const rows = filteredSubmissions.map(submission => [
      submission.teamName || '',
      submission.eventName || '',
      submission.templateName || '',
      submission.submitterEmail || '',
      submission.teamStatus || '',
      formatDate(submission.submittedAt),
      JSON.stringify(submission.responses || {})
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `form-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          Loading form submissions...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Form Template Submissions</h1>
            <p className="text-muted-foreground">View and manage all form template submissions across events</p>
          </div>
          <Button onClick={exportToCsv} disabled={!filteredSubmissions.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Form Submissions
              {filteredSubmissions.length > 0 && (
                <Badge variant="secondary">{filteredSubmissions.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search teams, templates, or emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {uniqueTemplates.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredSubmissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.teamName}</div>
                          <div className="text-sm text-muted-foreground">{submission.submitterEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{submission.eventName}</TableCell>
                      <TableCell className="font-medium">{submission.templateName}</TableCell>
                      <TableCell>
                        <Badge variant={
                          submission.teamStatus === 'approved' ? 'default' : 
                          submission.teamStatus === 'rejected' ? 'destructive' : 
                          'secondary'
                        }>
                          {submission.teamStatus?.toUpperCase() || 'REGISTERED'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(submission.submittedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {submissions?.length === 0 ? 
                  "No form template submissions found." : 
                  "No submissions match your current filters."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Submission Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.teamName} - {selectedSubmission?.templateName} - Submitted {selectedSubmission ? formatDate(selectedSubmission.submittedAt) : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium">Team</div>
                  <div className="text-sm text-muted-foreground">{selectedSubmission.teamName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Event</div>
                  <div className="text-sm text-muted-foreground">{selectedSubmission.eventName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Template</div>
                  <div className="text-sm text-muted-foreground">{selectedSubmission.templateName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="text-sm text-muted-foreground">{selectedSubmission.teamStatus?.toUpperCase()}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-3">Form Responses</div>
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.responses || {}).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-sm">
                        {renderResponseValue(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};