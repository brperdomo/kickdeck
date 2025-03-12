
import React from "react";

type ColorPickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ id, value, onChange }: ColorPickerProps) {
  return (
    <input
      id={id}
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-10 h-10 rounded cursor-pointer"
    />
  );
}

