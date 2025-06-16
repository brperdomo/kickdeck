import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { MapboxAutocomplete } from "./MapboxAutocomplete";
import { GoogleMapsAutocomplete } from "./GoogleMapsAutocomplete";
import { Card } from "@/components/ui/card";

const complexSchema = z.object({
  name: z.string().min(1, "Complex name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2),
  country: z.string().min(2, "Country is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  openTime: z.string().min(1, "Open time is required"),
  closeTime: z.string().min(1, "Close time is required"),
  rules: z.string().optional(),
  directions: z.string().optional(),
  isOpen: z.boolean().default(true),
});

type ComplexFormValues = z.infer<typeof complexSchema>;

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: string;
  longitude?: string;
  openTime: string;
  closeTime: string;
  rules?: string;
  directions?: string;
  isOpen: boolean;
}

interface ComplexEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ComplexFormValues) => Promise<void>;
  complex?: Complex | null;
}

export function ComplexEditor({ open, onOpenChange, onSubmit, complex }: ComplexEditorProps) {
  const { toast } = useToast();

  const form = useForm<ComplexFormValues>({
    resolver: zodResolver(complexSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      country: 'USA',
      openTime: '06:00',
      closeTime: '22:00',
      rules: '',
      directions: '',
      isOpen: true,
    },
  });

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
        rules: complex.rules || '',
        directions: complex.directions || '',
        isOpen: complex.isOpen,
      });
    } else {
      form.reset({
        name: '',
        address: '',
        city: '',
        state: '',
        country: 'USA',
        latitude: '',
        longitude: '',
        openTime: '06:00',
        closeTime: '22:00',
        rules: '',
        directions: '',
        isOpen: true,
      });
    }
  }, [complex, form]);

  const handleSubmit = async (data: ComplexFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{complex ? 'Edit Complex' : 'Add New Complex'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complex Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter complex name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <MapboxAutocomplete
                      value={field.value}
                      onChange={(value, placeDetails) => {
                        // Update the address field
                        field.onChange(value);
                        
                        // If Mapbox returned place details with coordinates
                        if (placeDetails && placeDetails.extractedData) {
                          const { location, city, state, country } = placeDetails.extractedData;
                          
                          console.log("Mapbox place details received:", placeDetails.extractedData);
                          
                          // Update latitude and longitude fields
                          if (location) {
                            form.setValue('latitude', location.lat.toString(), { shouldValidate: true });
                            form.setValue('longitude', location.lng.toString(), { shouldValidate: true });
                            console.log("Set coordinates:", location.lat, location.lng);
                          }
                          
                          // Update city, state, country fields with validation
                          if (city) {
                            form.setValue('city', city, { shouldValidate: true });
                            console.log("Set city:", city);
                          }
                          if (state) {
                            form.setValue('state', state.toUpperCase(), { shouldValidate: true });
                            console.log("Set state:", state.toUpperCase());
                          }
                          if (country) {
                            form.setValue('country', country, { shouldValidate: true });
                            console.log("Set country:", country);
                          }
                          
                          // Force form re-render
                          setTimeout(() => {
                            form.trigger(['city', 'state', 'country', 'latitude', 'longitude']);
                          }, 100);
                          
                          console.log("Updated form with Mapbox data:", {
                            lat: location?.lat,
                            lng: location?.lng,
                            city, state, country,
                            placeId: placeDetails.extractedData.placeId
                          });
                        } else {
                          console.log("No place details or coordinates available from Mapbox");
                        }
                      }}
                      placeholder="Search for an address"
                      className="w-full"
                      types={['address', 'poi']}
                      country={['us', 'ca']}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="hidden">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CA"
                        maxLength={2}
                        {...field}
                        onChange={e => {
                          const value = e.target.value.toUpperCase();
                          if (value.length <= 2) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="openTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closeTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Close Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rules (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter complex rules" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="directions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Directions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter directions to complex" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isOpen"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Complex Status</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {complex ? 'Save Changes' : 'Create Complex'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}