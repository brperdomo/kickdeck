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
  Underline
} from 'lucide-react';
import jsPDF from 'jspdf';

interface PDFElement {
  id: string;
  type: 'text' | 'placeholder' | 'image' | 'shape' | 'qr-code';
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
}

interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  pageWidth: number;
  pageHeight: number;
  elements: PDFElement[];
  backgroundColor: string;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      width: type === 'text' || type === 'placeholder' ? 100 : 50,
      height: type === 'text' || type === 'placeholder' ? 20 : 50,
      fontSize: 12,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#000000',
      backgroundColor: type === 'shape' ? '#f0f0f0' : 'transparent',
      borderColor: '#000000',
      borderWidth: 0,
      content: type === 'text' ? 'Sample Text' : '',
      shapeType: type === 'shape' ? 'rectangle' : undefined,
      rotation: 0
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
                  </div>
                </CardContent>
              </Card>

              {/* Canvas */}
              <Card>
                <CardContent className="pt-4">
                  <div className="border rounded-md p-4 bg-gray-50 overflow-auto">
                    <canvas
                      ref={canvasRef}
                      className="border bg-white cursor-crosshair"
                      onClick={(e) => {
                        const rect = canvasRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        // Find clicked element
                        const clickedElement = selectedTemplate.elements.find(el => 
                          x >= el.x && x <= el.x + el.width &&
                          y >= el.y && y <= el.y + el.height
                        );
                        
                        setSelectedElement(clickedElement || null);
                      }}
                    />
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
                  
                  {/* Background */}
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
                  
                  {/* Delete Button */}
                  <Separator />
                  <Button
                    onClick={() => deleteElement(selectedElement.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Element
                  </Button>
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