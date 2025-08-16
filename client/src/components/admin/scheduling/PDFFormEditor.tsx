import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Move, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle,
  Save,
  Eye,
  Download,
  Copy,
  Trash2,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Minus,
  Maximize2,
  Minimize2
} from 'lucide-react';
import jsPDF from 'jspdf';

interface PDFElement {
  id: string;
  type: 'text' | 'placeholder' | 'image' | 'shape' | 'qr-code' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  placeholder?: string; // Database field reference
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  imageUrl?: string;
  shapeType?: 'rectangle' | 'circle';
  rotation?: number;
  // Line-specific properties
  x2?: number; // End point for lines
  y2?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  pageWidth: number;
  pageHeight: number;
  elements: PDFElement[];
  backgroundColor: string;
  backgroundImage?: string; // Base64 encoded background image
  backgroundImageScale?: 'fill' | 'fit' | 'stretch'; // How to scale the background image
  createdAt: string;
  updatedAt: string;
}

interface PDFFormEditorProps {
  eventId: string;
}

const DATABASE_FIELDS = [
  { key: 'gameNumber', label: 'Game Number', category: 'Game Info' },
  { key: 'homeTeamName', label: 'Home Team', category: 'Teams' },
  { key: 'awayTeamName', label: 'Away Team', category: 'Teams' },
  { key: 'fieldName', label: 'Field Name', category: 'Venue' },
  { key: 'scheduledTime', label: 'Scheduled Time', category: 'Schedule' },
  { key: 'gameDate', label: 'Game Date', category: 'Schedule' },
  { key: 'bracketName', label: 'Flight/Bracket', category: 'Tournament' },
  { key: 'round', label: 'Round', category: 'Game Info' },
  { key: 'homeScore', label: 'Home Score', category: 'Scores' },
  { key: 'awayScore', label: 'Away Score', category: 'Scores' },
  { key: 'status', label: 'Game Status', category: 'Game Info' },
  { key: 'tournamentName', label: 'Tournament Name', category: 'Tournament' },
  { key: 'qrCodeUrl', label: 'QR Code (Score Submission)', category: 'Special' }
];

export default function PDFFormEditor({ eventId }: PDFFormEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null);
  const [selectedElement, setSelectedElement] = useState<PDFElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedElement, setDraggedElement] = useState<PDFElement | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isCanvasMaximized, setIsCanvasMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundImageDimensions, setBackgroundImageDimensions] = useState<{width: number, height: number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync background image state when template changes
  React.useEffect(() => {
    if (selectedTemplate?.backgroundImage) {
      setBackgroundImage(selectedTemplate.backgroundImage);
      
      // Get image dimensions if we don't have them
      if (!backgroundImageDimensions) {
        const img = new Image();
        img.onload = () => {
          setBackgroundImageDimensions({ width: img.width, height: img.height });
        };
        img.src = selectedTemplate.backgroundImage;
      }
    } else {
      setBackgroundImage(null);
      setBackgroundImageDimensions(null);
    }
  }, [selectedTemplate?.backgroundImage]);

  // Fetch saved templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['pdf-templates', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/pdf-templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: Partial<PDFTemplate>) => {
      const response = await fetch(`/api/admin/events/${eventId}/pdf-templates`, {
        method: template.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (!response.ok) throw new Error('Failed to save template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-templates', eventId] });
      toast({ title: 'Template saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save template', variant: 'destructive' });
    }
  });

  // Create new template
  const createNewTemplate = () => {
    const newTemplate: PDFTemplate = {
      id: `template_${Date.now()}`,
      name: 'New Game Card Template',
      description: 'Custom game card template',
      pageWidth: 210, // A4 width in mm
      pageHeight: 297, // A4 height in mm
      elements: [],
      backgroundColor: '#ffffff',
      backgroundImage: undefined,
      backgroundImageScale: 'fit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  // Add element to template
  const addElement = (type: PDFElement['type']) => {
    if (!selectedTemplate) return;

    const newElement: PDFElement = {
      id: `element_${Date.now()}`,
      type,
      x: 20,
      y: 20,
      width: type === 'text' || type === 'placeholder' ? 100 : type === 'line' ? 100 : 50,
      height: type === 'text' || type === 'placeholder' ? 20 : type === 'line' ? 2 : 50,
      fontSize: 12,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#000000',
      backgroundColor: type === 'shape' ? '#f0f0f0' : 'transparent',
      borderColor: '#000000',
      borderWidth: type === 'line' ? 1 : 0,
      content: type === 'text' ? 'Sample Text' : '',
      shapeType: type === 'shape' ? 'rectangle' : undefined,
      rotation: 0,
      // Line-specific properties
      x2: type === 'line' ? 120 : undefined,
      y2: type === 'line' ? 22 : undefined,
      lineStyle: type === 'line' ? 'solid' : undefined
    };

    setSelectedTemplate({
      ...selectedTemplate,
      elements: [...selectedTemplate.elements, newElement],
      updatedAt: new Date().toISOString()
    });
    setSelectedElement(newElement);
  };

  // Update element properties
  const updateElement = (elementId: string, updates: Partial<PDFElement>) => {
    if (!selectedTemplate) return;

    setSelectedTemplate({
      ...selectedTemplate,
      elements: selectedTemplate.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
      updatedAt: new Date().toISOString()
    });

    if (selectedElement?.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    if (!selectedTemplate) return;

    setSelectedTemplate({
      ...selectedTemplate,
      elements: selectedTemplate.elements.filter(el => el.id !== elementId),
      updatedAt: new Date().toISOString()
    });

    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }

    toast({ title: 'Element deleted' });
  };

  // Handle canvas mouse events for drag and drop
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTemplate) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * selectedTemplate.pageWidth;
    const y = ((e.clientY - rect.top) / rect.height) * selectedTemplate.pageHeight;

    // Find element at click position
    const clickedElement = selectedTemplate.elements.find(el => 
      x >= el.x && x <= el.x + el.width && 
      y >= el.y && y <= el.y + el.height
    );

    if (clickedElement) {
      setSelectedElement(clickedElement);
      setDragOffset({ x: x - clickedElement.x, y: y - clickedElement.y });
      setIsDragging(true);
    } else {
      setSelectedElement(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedElement || !selectedTemplate) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * selectedTemplate.pageWidth;
    const y = ((e.clientY - rect.top) / rect.height) * selectedTemplate.pageHeight;

    const newX = Math.max(0, Math.min(selectedTemplate.pageWidth - selectedElement.width, x - dragOffset.x));
    const newY = Math.max(0, Math.min(selectedTemplate.pageHeight - selectedElement.height, y - dragOffset.y));

    updateElement(selectedElement.id, { x: newX, y: newY });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Handle background image upload
  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      // Create an image element to get dimensions
      const img = new Image();
      img.onload = () => {
        const dimensions = { width: img.width, height: img.height };
        const isHorizontal = img.width > img.height;
        
        // Auto-adjust template dimensions based on image orientation
        const newPageWidth = isHorizontal ? 297 : 210; // A4 landscape vs portrait
        const newPageHeight = isHorizontal ? 210 : 297;
        
        setBackgroundImageDimensions(dimensions);
        setBackgroundImage(base64);
        
        if (selectedTemplate) {
          setSelectedTemplate({
            ...selectedTemplate,
            backgroundImage: base64,
            backgroundImageScale: 'fit',
            pageWidth: newPageWidth,
            pageHeight: newPageHeight,
            updatedAt: new Date().toISOString()
          });
        }
        
        toast({ 
          title: `Background image uploaded (${isHorizontal ? 'Horizontal' : 'Vertical'})`,
          description: `Template adjusted to ${newPageWidth}x${newPageHeight}mm` 
        });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  // Remove background image
  const removeBackgroundImage = () => {
    setBackgroundImage(null);
    setBackgroundImageDimensions(null);
    
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        backgroundImage: undefined,
        backgroundImageScale: 'fit',
        updatedAt: new Date().toISOString()
      });
    }
    
    toast({ title: 'Background image removed' });
  };

  // Generate preview PDF
  const generatePreview = async () => {
    if (!selectedTemplate) return;

    const pdf = new jsPDF({
      unit: 'mm',
      format: [selectedTemplate.pageWidth, selectedTemplate.pageHeight]
    });

    // Set background color
    if (selectedTemplate.backgroundColor !== '#ffffff') {
      pdf.setFillColor(selectedTemplate.backgroundColor);
      pdf.rect(0, 0, selectedTemplate.pageWidth, selectedTemplate.pageHeight, 'F');
    }

    // Sample game data for preview
    const sampleData = {
      gameNumber: '1',
      homeTeamName: 'Home Team FC',
      awayTeamName: 'Away United',
      fieldName: 'Field 1',
      scheduledTime: '10:00 AM',
      gameDate: '2025-08-16',
      bracketName: 'U12 Boys',
      round: 'Pool Play',
      homeScore: '',
      awayScore: '',
      status: 'Scheduled',
      tournamentName: 'Sample Tournament',
      qrCodeUrl: 'https://example.com/game/123'
    };

    for (const element of selectedTemplate.elements) {
      pdf.setFontSize(element.fontSize || 12);
      pdf.setTextColor(element.color || '#000000');

      if (element.type === 'text') {
        pdf.text(element.content || '', element.x, element.y);
      } else if (element.type === 'placeholder') {
        const value = sampleData[element.placeholder as keyof typeof sampleData] || `{${element.placeholder}}`;
        pdf.text(value, element.x, element.y);
      } else if (element.type === 'shape') {
        pdf.setFillColor(element.backgroundColor || '#f0f0f0');
        pdf.setDrawColor(element.borderColor || '#000000');
        pdf.setLineWidth(element.borderWidth || 0);

        if (element.shapeType === 'rectangle') {
          pdf.rect(element.x, element.y, element.width, element.height, element.borderWidth ? 'FD' : 'F');
        } else if (element.shapeType === 'circle') {
          const radius = Math.min(element.width, element.height) / 2;
          pdf.circle(element.x + radius, element.y + radius, radius, element.borderWidth ? 'FD' : 'F');
        }
      }
    }

    pdf.save('game-card-preview.pdf');
  };

  const renderCanvas = () => {
    if (!selectedTemplate || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale factor for display
    const scale = 2;
    canvas.width = selectedTemplate.pageWidth * scale;
    canvas.height = selectedTemplate.pageHeight * scale;
    canvas.style.width = `${selectedTemplate.pageWidth}px`;
    canvas.style.height = `${selectedTemplate.pageHeight}px`;

    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, selectedTemplate.pageWidth, selectedTemplate.pageHeight);

    // Draw background
    ctx.fillStyle = selectedTemplate.backgroundColor;
    ctx.fillRect(0, 0, selectedTemplate.pageWidth, selectedTemplate.pageHeight);

    // Draw elements
    selectedTemplate.elements.forEach(element => {
      ctx.save();

      if (element.rotation) {
        ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-element.width / 2, -element.height / 2);
      }

      if (element.type === 'text' || element.type === 'placeholder') {
        ctx.fillStyle = element.color || '#000000';
        ctx.font = `${element.fontStyle === 'italic' ? 'italic ' : ''}${element.fontWeight === 'bold' ? 'bold ' : ''}${element.fontSize || 12}px ${element.fontFamily || 'Arial'}`;
        ctx.textAlign = element.textAlign as CanvasTextAlign || 'left';
        
        const text = element.type === 'text' 
          ? (element.content || '') 
          : `{${element.placeholder || 'placeholder'}}`;
        
        ctx.fillText(text, element.rotation ? 0 : element.x, element.rotation ? 0 : element.y + (element.fontSize || 12));
      } else if (element.type === 'shape') {
        if (element.backgroundColor) {
          ctx.fillStyle = element.backgroundColor;
          if (element.shapeType === 'rectangle') {
            ctx.fillRect(element.rotation ? -element.width / 2 : element.x, element.rotation ? -element.height / 2 : element.y, element.width, element.height);
          } else if (element.shapeType === 'circle') {
            ctx.beginPath();
            const radius = Math.min(element.width, element.height) / 2;
            ctx.arc(element.rotation ? 0 : element.x + radius, element.rotation ? 0 : element.y + radius, radius, 0, 2 * Math.PI);
            ctx.fill();
          }
        }

        if (element.borderWidth && element.borderWidth > 0) {
          ctx.strokeStyle = element.borderColor || '#000000';
          ctx.lineWidth = element.borderWidth;
          if (element.shapeType === 'rectangle') {
            ctx.strokeRect(element.rotation ? -element.width / 2 : element.x, element.rotation ? -element.height / 2 : element.y, element.width, element.height);
          } else if (element.shapeType === 'circle') {
            ctx.beginPath();
            const radius = Math.min(element.width, element.height) / 2;
            ctx.arc(element.rotation ? 0 : element.x + radius, element.rotation ? 0 : element.y + radius, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }
      } else if (element.type === 'line') {
        ctx.strokeStyle = element.borderColor || '#000000';
        ctx.lineWidth = element.borderWidth || 1;
        
        // Set line style
        if (element.lineStyle === 'dashed') {
          ctx.setLineDash([5, 5]);
        } else if (element.lineStyle === 'dotted') {
          ctx.setLineDash([2, 3]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.beginPath();
        ctx.moveTo(element.x, element.y);
        ctx.lineTo(element.x2 || element.x + element.width, element.y2 || element.y + element.height);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (element.type === 'image' && element.imageUrl) {
        // Draw placeholder for image
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(element.x, element.y, element.width, element.height);
        
        // Draw image icon placeholder
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🖼️', element.x + element.width / 2, element.y + element.height / 2);
      } else if (element.type === 'qr-code') {
        // Draw QR code placeholder
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(element.x, element.y, element.width, element.height);
        
        // Draw QR pattern
        const cellSize = element.width / 10;
        ctx.fillStyle = '#000';
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            if ((i + j) % 2 === 0) {
              ctx.fillRect(element.x + i * cellSize, element.y + j * cellSize, cellSize, cellSize);
            }
          }
        }
      }

      // Draw selection highlight
      if (selectedElement?.id === element.id) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(element.rotation ? -element.width / 2 - 2 : element.x - 2, element.rotation ? -element.height / 2 - 2 : element.y - 2, element.width + 4, element.height + 4);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  };

  // Update canvas when template or selection changes
  React.useEffect(() => {
    renderCanvas();
  }, [selectedTemplate, selectedElement]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PDF Game Card Designer</h2>
          <p className="text-muted-foreground">Create custom game cards with dynamic database fields</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewTemplate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
          {selectedTemplate && (
            <>
              <Button
                onClick={() => saveTemplateMutation.mutate(selectedTemplate)}
                disabled={saveTemplateMutation.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={generatePreview}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Preview PDF
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Templates</CardTitle>
            <CardDescription>Saved game card templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templatesLoading ? (
              <div>Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No templates yet. Create your first template!
              </div>
            ) : (
              templates.map((template: PDFTemplate) => (
                <div
                  key={template.id}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsEditing(true);
                    setSelectedElement(null);
                  }}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-muted-foreground">{template.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {template.elements.length} elements
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTemplate ? (
            <>
              {/* Template Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                      <CardDescription>{selectedTemplate.description}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {selectedTemplate.pageWidth} × {selectedTemplate.pageHeight} mm
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Background Image Controls */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Background Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Background Image</Label>
                      {selectedTemplate?.backgroundImage && (
                        <Button
                          onClick={removeBackgroundImage}
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    {!selectedTemplate?.backgroundImage ? (
                      <div className="space-y-2">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Upload Background Image
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Upload an image to use as background. Template will auto-adjust to image orientation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <ImageIcon className="h-4 w-4" />
                          Background image uploaded
                          {backgroundImageDimensions && (
                            <Badge variant="outline" className="text-xs">
                              {backgroundImageDimensions.width > backgroundImageDimensions.height ? 'Horizontal' : 'Vertical'}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Scale Mode</Label>
                          <Select
                            value={selectedTemplate.backgroundImageScale || 'fit'}
                            onValueChange={(value: 'fill' | 'fit' | 'stretch') => 
                              setSelectedTemplate({
                                ...selectedTemplate,
                                backgroundImageScale: value,
                                updatedAt: new Date().toISOString()
                              })
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fit">Fit (maintain aspect ratio)</SelectItem>
                              <SelectItem value="fill">Fill (crop to fit)</SelectItem>
                              <SelectItem value="stretch">Stretch (may distort)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBackgroundImageUpload}
                  />
                </CardContent>
              </Card>

              {/* Toolbar */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => addElement('text')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Type className="h-4 w-4" />
                      Text
                    </Button>
                    <Button
                      onClick={() => addElement('placeholder')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Database Field
                    </Button>
                    <Button
                      onClick={() => addElement('shape')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Shape
                    </Button>
                    <Button
                      onClick={() => addElement('qr-code')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      QR Code
                    </Button>
                    <Button
                      onClick={() => addElement('line')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Minus className="h-4 w-4" />
                      Line
                    </Button>
                    <Button
                      onClick={() => addElement('image')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </Button>
                    {selectedElement && (
                      <Button
                        onClick={() => deleteElement(selectedElement.id)}
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2 ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Canvas */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Design Canvas</CardTitle>
                    <Button
                      onClick={() => setIsCanvasMaximized(!isCanvasMaximized)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isCanvasMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      {isCanvasMaximized ? 'Minimize' : 'Maximize'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div 
                    className={`border rounded-md p-4 bg-gray-50 overflow-auto transition-all duration-300 ${
                      isCanvasMaximized ? 'h-[700px]' : 'h-[500px]'
                    }`}
                  >
                    <div
                      className="relative bg-white border shadow-sm cursor-crosshair"
                      style={{
                        width: isCanvasMaximized ? selectedTemplate.pageWidth * 3.5 : selectedTemplate.pageWidth * 2.8,
                        height: isCanvasMaximized ? selectedTemplate.pageHeight * 3.5 : selectedTemplate.pageHeight * 2.8,
                        minWidth: '800px',
                        minHeight: '600px',
                        backgroundImage: selectedTemplate.backgroundImage ? `url(${selectedTemplate.backgroundImage})` : 'none',
                        backgroundSize: selectedTemplate.backgroundImageScale === 'stretch' ? '100% 100%' : 
                                       selectedTemplate.backgroundImageScale === 'fill' ? 'cover' : 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                    >
                      <canvas
                        ref={canvasRef}
                        width={selectedTemplate.pageWidth * (isCanvasMaximized ? 3.5 : 2.8)}
                        height={selectedTemplate.pageHeight * (isCanvasMaximized ? 3.5 : 2.8)}
                        className="absolute inset-0"
                      />
                      
                      {/* Render interactive elements */}
                      {selectedTemplate.elements.map((element) => (
                        <div
                          key={element.id}
                          className={`absolute border-2 transition-all ${
                            selectedElement?.id === element.id 
                              ? 'border-blue-500 border-dashed' 
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          style={{
                            left: element.x * (isCanvasMaximized ? 3.5 : 2.8),
                            top: element.y * (isCanvasMaximized ? 3.5 : 2.8),
                            width: element.width * (isCanvasMaximized ? 3.5 : 2.8),
                            height: element.height * (isCanvasMaximized ? 3.5 : 2.8),
                            cursor: isDragging ? 'grabbing' : 'grab'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElement(element);
                          }}
                        >
                          {selectedElement?.id === element.id && (
                            <>
                              {/* Resize handles */}
                              <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize" 
                                   onMouseDown={(e) => {
                                     e.stopPropagation();
                                     setIsResizing(true);
                                   }} />
                              <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize" />
                              <div className="absolute -left-1 -bottom-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize" />
                              <div className="absolute -left-1 -top-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize" />
                            </>
                          )}
                          
                          {/* Element content preview */}
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-700 bg-blue-50 bg-opacity-40 rounded border border-blue-200 border-opacity-50">
                            {element.type === 'text' && element.content}
                            {element.type === 'placeholder' && `{${element.placeholder}}`}
                            {element.type === 'qr-code' && 'QR'}
                            {element.type === 'line' && '—'}
                            {element.type === 'image' && '🖼️'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-96">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No template selected</h3>
                  <p className="text-muted-foreground mb-4">Select a template or create a new one to get started</p>
                  <Button onClick={createNewTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Properties Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Properties</CardTitle>
            {selectedElement && (
              <Badge variant="outline" className="w-fit">
                {selectedElement.type}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedElement ? (
              <Tabs defaultValue="content" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4">
                  {selectedElement.type === 'text' && (
                    <div className="space-y-2">
                      <Label>Text Content</Label>
                      <Textarea
                        value={selectedElement.content || ''}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        placeholder="Enter text content"
                      />
                    </div>
                  )}
                  
                  {selectedElement.type === 'placeholder' && (
                    <div className="space-y-2">
                      <Label>Database Field</Label>
                      <Select
                        value={selectedElement.placeholder}
                        onValueChange={(value) => updateElement(selectedElement.id, { placeholder: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {DATABASE_FIELDS.map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              <div className="flex items-center justify-between w-full">
                                <span>{field.label}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {field.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {selectedElement.type === 'shape' && (
                    <div className="space-y-2">
                      <Label>Shape Type</Label>
                      <Select
                        value={selectedElement.shapeType}
                        onValueChange={(value: 'rectangle' | 'circle') => updateElement(selectedElement.id, { shapeType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rectangle">Rectangle</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {selectedElement.type === 'line' && (
                    <div className="space-y-2">
                      <Label>Line Style</Label>
                      <Select
                        value={selectedElement.lineStyle}
                        onValueChange={(value: 'solid' | 'dashed' | 'dotted') => updateElement(selectedElement.id, { lineStyle: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {selectedElement.type === 'image' && (
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        value={selectedElement.imageUrl || ''}
                        onChange={(e) => updateElement(selectedElement.id, { imageUrl: e.target.value })}
                        placeholder="Enter image URL or upload file"
                      />
                      <Button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                updateElement(selectedElement.id, { imageUrl: e.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="style" className="space-y-4">
                  {/* Position */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>X Position</Label>
                      <Input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Y Position</Label>
                      <Input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  {/* Size */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Width</Label>
                      <Input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Height</Label>
                      <Input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  {/* Typography */}
                  {(selectedElement.type === 'text' || selectedElement.type === 'placeholder') && (
                    <>
                      <div>
                        <Label>Font Size</Label>
                        <Input
                          type="number"
                          value={selectedElement.fontSize}
                          onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.color}
                          onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Text Align</Label>
                        <Select
                          value={selectedElement.textAlign}
                          onValueChange={(value: 'left' | 'center' | 'right') => updateElement(selectedElement.id, { textAlign: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {/* Background & Colors */}
                  {selectedElement.type === 'shape' && (
                    <>
                      <div>
                        <Label>Background Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.backgroundColor}
                          onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Border Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.borderColor}
                          onChange={(e) => updateElement(selectedElement.id, { borderColor: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Border Width</Label>
                        <Input
                          type="number"
                          min="0"
                          value={selectedElement.borderWidth}
                          onChange={(e) => updateElement(selectedElement.id, { borderWidth: Number(e.target.value) })}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Line Properties */}
                  {selectedElement.type === 'line' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>End X</Label>
                          <Input
                            type="number"
                            value={selectedElement.x2}
                            onChange={(e) => updateElement(selectedElement.id, { x2: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>End Y</Label>
                          <Input
                            type="number"
                            value={selectedElement.y2}
                            onChange={(e) => updateElement(selectedElement.id, { y2: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Line Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.borderColor}
                          onChange={(e) => updateElement(selectedElement.id, { borderColor: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Line Width</Label>
                        <Input
                          type="number"
                          min="1"
                          value={selectedElement.borderWidth}
                          onChange={(e) => updateElement(selectedElement.id, { borderWidth: Number(e.target.value) })}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => deleteElement(selectedElement.id)}
                      variant="destructive"
                      size="sm"
                      className="w-full flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Element
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2" />
                Select an element to edit its properties
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Fields Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Database Fields</CardTitle>
          <CardDescription>These fields can be used as placeholders in your templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              DATABASE_FIELDS.reduce((acc, field) => {
                if (!acc[field.category]) acc[field.category] = [];
                acc[field.category].push(field);
                return acc;
              }, {} as Record<string, typeof DATABASE_FIELDS>)
            ).map(([category, fields]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium text-sm">{category}</h4>
                <div className="space-y-1">
                  {fields.map(field => (
                    <div key={field.key} className="flex items-center justify-between text-sm">
                      <span>{field.label}</span>
                      <code className="text-xs bg-muted px-1 rounded">{`{${field.key}}`}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}