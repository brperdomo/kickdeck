import { Input } from '@/components/ui/input';

interface EditableInputProps {
  type: 'number' | 'date';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  autoFocus?: boolean;
}

export function EditableInput({ type, value, onChange, className = '', autoFocus = false }: EditableInputProps) {
  return (
    <Input
      type={type}
      value={value}
      onChange={onChange}
      className={`bg-slate-800 border-slate-500 text-white focus:bg-slate-700 focus:border-blue-400 focus:text-white placeholder-slate-400 ${className}`}
      style={{
        backgroundColor: '#1e293b',
        color: '#ffffff',
        borderColor: '#64748b'
      }}
      autoFocus={autoFocus}
    />
  );
}