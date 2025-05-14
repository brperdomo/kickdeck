import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFoundPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404 - Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Go to Login
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground pt-4">
          <p>
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}