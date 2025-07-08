import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";

interface FormFieldOption {
  label: string;
  value: string;
  order?: number;
}

interface FormFieldOptionsEditorProps {
  options: FormFieldOption[];
  onOptionsChange: (options: FormFieldOption[]) => void;
}

export function FormFieldOptionsEditor({ options, onOptionsChange }: FormFieldOptionsEditorProps) {
  const addOption = () => {
    const newOptions = [...options, { label: "", value: "", order: options.length }];
    onOptionsChange(newOptions);
  };

  const updateOption = (index: number, updates: Partial<FormFieldOption>) => {
    const newOptions = options.map((option, i) => 
      i === index ? { ...option, ...updates } : option
    );
    onOptionsChange(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onOptionsChange(newOptions);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Options</Label>
        <Button
          onClick={addOption}
          variant="outline"
          size="sm"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>
      <div className="space-y-2">
        {options.length === 0 && (
          <div className="text-center py-4 bg-muted/30 rounded-md">
            <p className="text-muted-foreground text-sm">No options added.</p>
          </div>
        )}
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={option.label}
              onChange={(e) => updateOption(index, { 
                label: e.target.value, 
                value: e.target.value.toLowerCase().replace(/\s+/g, '_') 
              })}
              placeholder="Option label"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeOption(index)}
              className="text-destructive hover:text-destructive/90"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}