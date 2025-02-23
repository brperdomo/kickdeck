
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AccountingCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (code: { code: string; description: string }) => void;
  onDelete?: () => void;
  initialData?: { code: string; description: string };
}

export function AccountingCodeModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  initialData,
}: AccountingCodeModalProps) {
  const [code, setCode] = useState(initialData?.code || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ code, description });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit' : 'Add'} Accounting Code</DialogTitle>
            <DialogDescription>
              Enter the accounting code details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              {initialData && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open('/reports/accounting-code/' + code, '_blank')}
                  >
                    View Report
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </Button>
                </>
              )}
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the accounting code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onDelete?.();
              setShowDeleteConfirm(false);
              onOpenChange(false);
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
