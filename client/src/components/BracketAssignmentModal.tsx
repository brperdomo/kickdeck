import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BracketSuggestion {
  teamId: number;
  teamName: string;
  suggestedBracketId: number;
  suggestedBracketName: string;
  confidence: number;
  reasoning: string;
}

interface BracketAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  suggestions: BracketSuggestion[];
  isSuggesting: boolean;
  usingFallbackMode?: boolean;
}

export function BracketAssignmentModal({
  open,
  onOpenChange,
  eventId,
  suggestions,
  isSuggesting,
  usingFallbackMode = false
}: BracketAssignmentModalProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<number, boolean>>({});
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Toggle selection of a suggestion
  const toggleSelection = (teamId: number) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Select/deselect all suggestions
  const toggleSelectAll = () => {
    if (Object.keys(selectedSuggestions).length === suggestions.length) {
      // If all are selected, deselect all
      setSelectedSuggestions({});
    } else {
      // Otherwise, select all
      const allSelected: Record<number, boolean> = {};
      suggestions.forEach(suggestion => {
        allSelected[suggestion.teamId] = true;
      });
      setSelectedSuggestions(allSelected);
    }
  };

  // Count selected suggestions
  const selectedCount = Object.values(selectedSuggestions).filter(Boolean).length;

  // Apply selected bracket assignments
  const applyBracketAssignments = async () => {
    if (!eventId || selectedCount === 0) return;
    
    try {
      setIsApplying(true);
      
      // Prepare assignments to send to server
      const assignments = suggestions
        .filter(suggestion => selectedSuggestions[suggestion.teamId])
        .map(suggestion => ({
          teamId: suggestion.teamId,
          bracketId: suggestion.suggestedBracketId
        }));
      
      // Call API to update team brackets
      await axios.post(`/api/admin/events/${eventId}/update-team-brackets`, {
        assignments
      });
      
      // Show success toast
      toast({
        title: "Brackets assigned successfully",
        description: `Updated ${selectedCount} teams with their suggested brackets.`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', eventId, 'teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', eventId, 'unassigned-teams'] });
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying bracket assignments:', error);
      toast({
        title: "Failed to assign brackets",
        description: "There was an error updating team brackets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Render confidence badge with appropriate color
  const renderConfidenceBadge = (confidence: number) => {
    let variant = "outline";
    if (confidence >= 0.8) variant = "default";
    else if (confidence >= 0.6) variant = "secondary";
    else variant = "destructive";
    
    return (
      <Badge variant={variant as any}>
        {Math.round(confidence * 100)}%
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>AI Bracket Assignment</DialogTitle>
          <DialogDescription>
            Review and apply AI-suggested bracket assignments for teams
          </DialogDescription>
        </DialogHeader>

        {isSuggesting ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating bracket suggestions...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <>
            {usingFallbackMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Using Fallback Mode</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      These bracket suggestions are based on simple matching criteria. The AI-powered suggestions are currently unavailable due to rate limiting. The confidence scores and reasoning may be less accurate.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectedCount === suggestions.length && selectedCount > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">
                  Select All
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedCount} of {suggestions.length} suggestions selected
              </p>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Suggested Bracket</TableHead>
                    <TableHead className="w-[100px]">Confidence</TableHead>
                    <TableHead>Reasoning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map(suggestion => (
                    <TableRow key={suggestion.teamId}>
                      <TableCell>
                        <Checkbox
                          checked={!!selectedSuggestions[suggestion.teamId]}
                          onCheckedChange={() => toggleSelection(suggestion.teamId)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{suggestion.teamName}</TableCell>
                      <TableCell>{suggestion.suggestedBracketName}</TableCell>
                      <TableCell>
                        {renderConfidenceBadge(suggestion.confidence)}
                      </TableCell>
                      <TableCell className="text-sm">{suggestion.reasoning}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium mb-1">All Teams Assigned</p>
            <p className="text-sm text-muted-foreground text-center">
              All teams already have bracket assignments or there are no approved teams without brackets.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          
          {suggestions.length > 0 && (
            <Button
              onClick={applyBracketAssignments}
              disabled={selectedCount === 0 || isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>Apply Selected ({selectedCount})</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}