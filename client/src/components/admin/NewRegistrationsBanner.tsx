import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/use-user';

export function NewRegistrationsBanner() {
  const { user } = useUser();
  const [visible, setVisible] = useState(true);
  const queryClient = useQueryClient();

  // Only fetch registrations for admin users
  const isAdmin = user?.isAdmin === true;

  // Query to get the count of new registrations
  const registrationsQuery = useQuery({
    queryKey: ['/api/admin/registrations/new-count'],
    queryFn: async () => {
      const response = await fetch('/api/admin/registrations/new-count');
      if (!response.ok) {
        throw new Error('Failed to fetch new registrations count');
      }
      return response.json();
    },
    // Only fetch for admin users and when the banner is visible
    enabled: isAdmin && visible,
    // Refetch every minute to keep the count updated
    refetchInterval: 60000,
  });

  // Mutation to acknowledge the new registrations
  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/registrations/acknowledge', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to acknowledge new registrations');
      }
      return response.json();
    },
    onSuccess: () => {
      // Hide the banner and invalidate the query to update the count
      setVisible(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/registrations/new-count'] });
    },
  });

  // Hide the banner if there are no new registrations
  useEffect(() => {
    if (registrationsQuery.data?.count === 0) {
      setVisible(false);
    } else if (registrationsQuery.data?.count > 0) {
      setVisible(true);
    }
  }, [registrationsQuery.data?.count]);

  // Don't render anything if the user is not an admin or there's no new registrations
  if (!isAdmin || !visible || registrationsQuery.isLoading || registrationsQuery.data?.count === 0) {
    return null;
  }

  // Format the "last viewed" timestamp
  const lastViewedText = registrationsQuery.data?.lastViewed 
    ? `Last checked ${formatDistanceToNow(new Date(registrationsQuery.data.lastViewed), { addSuffix: true })}`
    : 'New registrations available';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Alert variant="default" className="border-blue-300 bg-blue-50">
            <BellRing className="h-5 w-5 text-blue-500" />
            <div className="ml-3 flex-1">
              <AlertTitle className="text-blue-700 font-medium">
                New Team Registrations
              </AlertTitle>
              <AlertDescription className="text-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{registrationsQuery.data?.count}</span> new team registrations since your last check.
                    <div className="text-xs text-blue-500 mt-1">{lastViewedText}</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-blue-300 hover:border-blue-400 hover:bg-blue-100 text-blue-600"
                      onClick={() => acknowledgeMarkAsSeen()}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Mark as seen
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                      onClick={() => setVisible(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Function to handle acknowledging the registrations
  function acknowledgeMarkAsSeen() {
    acknowledgeMutation.mutate();
  }
}