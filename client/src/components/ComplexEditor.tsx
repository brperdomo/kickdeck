import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Complex } from '@/types/complex';

// Form validation schema
const complexFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  latitude: z.string().min(1, 'Latitude is required'),
  longitude: z.string().min(1, 'Longitude is required'),
  openTime: z.string().min(1, 'Opening time is required'),
  closeTime: z.string().min(1, 'Closing time is required'),
  isOpen: z.boolean().default(true),
  isShared: z.boolean().default(false),
  rules: z.string().nullable().optional(),
  directions: z.string().nullable().optional()
});

type ComplexFormValues = z.infer<typeof complexFormSchema>;

interface ComplexEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (complex: Partial<Complex>) => Promise<void>;
  complex?: Complex;
  isEdit?: boolean;
}

export function ComplexEditor({
  isOpen,
  onClose,
  onSave,
  complex,
  isEdit = false
}: ComplexEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Default form values
  const defaultValues: ComplexFormValues = {
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    latitude: '',
    longitude: '',
    openTime: '08:00',
    closeTime: '20:00',
    isOpen: true,
    isShared: false,
    rules: '',
    directions: ''
  };

  // Initialize the form
  const form = useForm<ComplexFormValues>({
    resolver: zodResolver(complexFormSchema),
    defaultValues: complex ? { 
      ...defaultValues, 
      ...complex
    } : defaultValues
  });

  // Update form values when complex changes
  useEffect(() => {
    if (complex) {
      form.reset({ 
        name: complex.name,
        address: complex.address,
        city: complex.city,
        state: complex.state,
        country: complex.country, 
        latitude: complex.latitude || '',
        longitude: complex.longitude || '',
        openTime: complex.openTime,
        closeTime: complex.closeTime,
        isOpen: complex.isOpen,
        isShared: complex.isShared,
        rules: complex.rules || '',
        directions: complex.directions || ''
      });
    } else {
      form.reset(defaultValues);
    }
  }, [complex, form]);

  // Form submission handler
  const onSubmit = async (data: ComplexFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Convert form data to Complex data structure
      const complexData: Partial<Complex> = {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        openTime: data.openTime,
        closeTime: data.closeTime,
        isOpen: data.isOpen,
        isShared: data.isShared,
        rules: data.rules,
        directions: data.directions
      };
      
      // If editing, make sure to include the ID
      if (isEdit && complex) {
        complexData.id = complex.id;
      }
      
      await onSave(complexData);
      
      toast({
        title: `Complex ${isEdit ? 'Updated' : 'Created'} Successfully`,
        description: `${data.name} has been ${isEdit ? 'updated' : 'created'}.`,
      });
      
      form.reset(defaultValues);
      onClose();
    } catch (error) {
      console.error('Error saving complex:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} complex. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('latitude', position.coords.latitude.toString());
        form.setValue('longitude', position.coords.longitude.toString());
      },
      (error) => {
        toast({
          title: 'Geolocation Error',
          description: `Failed to get location: ${error.message}`,
          variant: 'destructive',
        });
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Complex</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Complex Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter complex name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* State */}
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state or province" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Map Location */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {/* Latitude */}
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 40.7128" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Longitude */}
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. -74.0060" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={getCurrentLocation}
                >
                  Use Current Location
                </Button>
              </div>
              
              {/* Opening Hours */}
              <FormField
                control={form.control}
                name="openTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Closing Hours */}
              <FormField
                control={form.control}
                name="closeTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Is Open */}
              <FormField
                control={form.control}
                name="isOpen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Complex is Open</FormLabel>
                      <FormDescription>
                        Whether the complex is currently open for games
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Is Shared */}
              <FormField
                control={form.control}
                name="isShared"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Share Across Instances</FormLabel>
                      <FormDescription>
                        Allow this complex to be shared with other system instances
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Directions */}
              <FormField
                control={form.control}
                name="directions"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Directions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter special directions to the complex (optional)" 
                        className="min-h-[80px]"
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Rules */}
              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Rules</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter complex rules (optional)" 
                        className="min-h-[80px]"
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update' : 'Create'} Complex
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}