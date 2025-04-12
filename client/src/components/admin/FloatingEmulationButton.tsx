import { useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

/*
 * This component has been deprecated and is no longer in use.
 * Its functionality has been moved to the AdminBanner component.
 */
export function FloatingEmulationButton() {
  // Component is now disabled - returns null
  return null;
}