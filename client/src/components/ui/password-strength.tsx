import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

function calculateStrength(password: string): number {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  
  // Character variety checks
  if (/[0-9]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  
  return Math.min(strength, 4);
}

function getStrengthText(strength: number): string {
  switch (strength) {
    case 0:
      return "Very Weak";
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "";
  }
}

function getStrengthColor(strength: number): string {
  switch (strength) {
    case 0:
      return "bg-red-500";
    case 1:
      return "bg-orange-500";
    case 2:
      return "bg-yellow-500";
    case 3:
      return "bg-blue-500";
    case 4:
      return "bg-green-500";
    default:
      return "bg-gray-200";
  }
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = calculateStrength(password);
  const strengthText = getStrengthText(strength);
  const strengthColor = getStrengthColor(strength);
  
  return (
    <div className="w-full space-y-2">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", strengthColor)}
          style={{ width: `${(strength / 4) * 100}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Password strength: <span className="font-medium">{strengthText}</span>
      </p>
    </div>
  );
}
