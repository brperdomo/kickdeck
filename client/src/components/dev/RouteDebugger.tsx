import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ClipboardCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface RouteInfoProps {
  label: string;
  value: string;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ label, value }) => {
  const { toast } = useToast();
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
      duration: 2000,
    });
  };
  
  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium">{label}:</span>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6" 
          onClick={copyToClipboard}
        >
          <ClipboardCopy className="h-3 w-3" />
        </Button>
      </div>
      <code className="p-2 bg-muted rounded-md text-xs font-mono break-all flex-1">{value}</code>
    </div>
  );
};

const RouteDebugger: React.FC = () => {
  const [location] = useLocation();
  const [pathname, setPathname] = useState('');
  const [search, setSearch] = useState('');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState<Record<string, string>>({});

  // Update URL parts when location changes
  useEffect(() => {
    try {
      // Get current URL
      const currentUrl = window.location.href;
      setUrl(currentUrl);
      
      // Get pathname
      const pathFromLocation = window.location.pathname;
      setPathname(pathFromLocation);
      
      // Get search params
      const searchParams = window.location.search;
      setSearch(searchParams);

      // Parse search params
      const urlParams = new URLSearchParams(searchParams);
      const paramsObject: Record<string, string> = {};
      urlParams.forEach((value, key) => {
        paramsObject[key] = value;
      });
      setParams(paramsObject);
      
      // Log for debugging
      console.log('Current route location (Wouter):', location);
      console.log('Current URL:', currentUrl);
      console.log('Current pathname:', pathFromLocation);
      console.log('Current search:', searchParams);
    } catch (error) {
      console.error('Route debugger error:', error);
    }
  }, [location]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <RouteInfo label="Current Route (Wouter)" value={location} />
        <RouteInfo label="Full URL" value={url} />
      </div>
      
      <Separator />
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <RouteInfo label="Pathname" value={pathname} />
        <RouteInfo label="Search" value={search || "(none)"} />
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-sm font-medium mb-2">Search Parameters:</h3>
        {Object.keys(params).length > 0 ? (
          <div className="bg-muted p-3 rounded-md">
            {Object.entries(params).map(([key, value]) => (
              <div key={key} className="mb-2 flex items-center gap-2">
                <Badge variant="outline">{key}</Badge>
                <span>=</span>
                <code className="bg-background px-2 py-1 rounded text-xs">{value}</code>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">No search parameters</div>
        )}
      </div>
    </div>
  );
};

export default RouteDebugger;