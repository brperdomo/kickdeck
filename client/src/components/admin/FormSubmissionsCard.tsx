import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Eye, Calendar } from "lucide-react";

interface FormSubmission {
  id: number;
  templateId: number;
  templateName: string;
  responses: Record<string, any>;
  templateVersion: number;
  submittedAt: string;
  fields?: any;
}

interface FormSubmissionsCardProps {
  teamId: number;
}

export const FormSubmissionsCard = ({ teamId }: FormSubmissionsCardProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/admin/teams', teamId, 'form-submissions'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/teams/${teamId}/form-submissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch form submissions');
      }
      const data = await response.json();
      return data.submissions as FormSubmission[];
    },
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Template Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading form submissions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Template Submissions
            {submissions && submissions.length > 0 && (
              <Badge variant="secondary">{submissions.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.templateName || 'Unnamed Template'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(submission.submittedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{submission.templateVersion}</Badge>
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
            <div className="text-center py-4 text-muted-foreground">
              No form template submissions found for this team.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Submission Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.templateName} - Submitted {selectedSubmission ? formatDate(selectedSubmission.submittedAt) : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium">Template</div>
                  <div className="text-sm text-muted-foreground">{selectedSubmission.templateName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Version</div>
                  <div className="text-sm text-muted-foreground">v{selectedSubmission.templateVersion}</div>
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