import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CustomFormStepProps {
  eventId: number;
  teamId?: number;
  onComplete: (formData: Record<string, any>) => void;
  onSkip: () => void;
}

interface FormField {
  id: number;
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  validation?: any;
  options?: Array<{
    id: number;
    label: string;
    value: string;
    order: number;
  }>;
}

interface FormTemplate {
  id: number;
  name: string;
  description: string;
  fields: FormField[];
}

export function CustomFormStep({ eventId, teamId, onComplete, onSkip }: CustomFormStepProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch the form template for this event
  const templateQuery = useQuery<FormTemplate | null>({
    queryKey: ['/api/events', eventId, 'form-template'],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/form-template`);
      if (!response.ok) throw new Error('Failed to fetch form template');
      return response.json();
    }
  });

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    if (!templateQuery.data) return true;
    
    const newErrors: Record<string, string> = {};
    
    templateQuery.data.fields.forEach(field => {
      if (field.required && (!formData[field.fieldId] || formData[field.fieldId] === '')) {
        newErrors[field.fieldId] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onComplete(formData);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.fieldId] || '';
    const hasError = !!errors[field.fieldId];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldId} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Input
              id={field.fieldId}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={value}
              onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? 'border-red-500' : ''}
            />
            {field.helpText && (
              <p className="text-sm text-gray-400">{field.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.fieldId]}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldId} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Textarea
              id={field.fieldId}
              value={value}
              onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={hasError ? 'border-red-500' : ''}
            />
            {field.helpText && (
              <p className="text-sm text-gray-400">{field.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.fieldId]}
              </p>
            )}
          </div>
        );

      case 'select':
      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldId} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.fieldId, val)}
            >
              <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.sort((a, b) => a.order - b.order).map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-sm text-gray-400">{field.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.fieldId]}
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-3">
            <Label className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => handleFieldChange(field.fieldId, val)}
              className={hasError ? 'border-red-500 rounded-md p-2' : ''}
            >
              {field.options?.sort((a, b) => a.order - b.order).map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.fieldId}-${option.id}`} />
                  <Label htmlFor={`${field.fieldId}-${option.id}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {field.helpText && (
              <p className="text-sm text-gray-400">{field.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.fieldId]}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.fieldId}
                checked={!!value}
                onCheckedChange={(checked) => handleFieldChange(field.fieldId, checked)}
              />
              <Label htmlFor={field.fieldId} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-red-400">*</span>}
              </Label>
            </div>
            {field.helpText && (
              <p className="text-sm text-gray-400 ml-6">{field.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-400 flex items-center gap-1 ml-6">
                <AlertCircle className="h-4 w-4" />
                {errors[field.fieldId]}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldId} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Input
              id={field.fieldId}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? 'border-red-500' : ''}
            />
            {field.helpText && (
              <p className="text-sm text-gray-400">{field.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.fieldId]}
              </p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldId} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Input
              id={field.fieldId}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {field.helpText && (
              <p className="text-sm text-gray-400">{field.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors[field.fieldId]}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // If no template found, show skip option
  if (templateQuery.isLoading) {
    return (
      <Card className="rounded-xl" style={{ background: 'rgba(15,15,35,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!templateQuery.data) {
    // No custom form for this event, skip to next step
    onSkip();
    return null;
  }

  const template = templateQuery.data;

  return (
    <Card className="rounded-xl" style={{ background: 'rgba(15,15,35,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="h-5 w-5" />
          {template.name}
        </CardTitle>
        {template.description && (
          <p className="text-gray-400">{template.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {template.fields
          .sort((a, b) => a.order - b.order)
          .map(field => renderField(field))}

        <Separator className="bg-white/10" />

        <div className="flex gap-3">
          <Button onClick={handleSubmit} className="flex-1">
            Continue to Payment
          </Button>
          <Button variant="outline" onClick={onSkip} className="border-white/20 text-gray-300 hover:text-white hover:bg-white/5">
            Skip This Step
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}