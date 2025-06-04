import { useState, useEffect } from "react";
import axios from "axios";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

interface ProductUpdate {
  id: number;
  version: string;
  releaseDate: string;
  title: string;
  description: string;
  category: string;
  isHighlighted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductUpdatesProps {
  limit?: number;
  onlyHighlighted?: boolean;
  category?: string;
}

export function ProductUpdates({ limit, onlyHighlighted, category }: ProductUpdatesProps) {
  const [updates, setUpdates] = useState<ProductUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (onlyHighlighted) params.append("highlighted", "true");
        if (category) params.append("category", category);
        
        const queryString = params.toString();
        const url = `/api/product-updates${queryString ? `?${queryString}` : ""}`;
        
        const response = await axios.get(url);
        setUpdates(response.data.updates);
        setError(null);
      } catch (err) {
        console.error("Error fetching product updates:", err);
        setError("Failed to load product updates. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, [limit, onlyHighlighted, category]);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "major update":
        return "bg-blue-500";
      case "feature":
        return "bg-green-500";
      case "bug fix":
        return "bg-yellow-500";
      case "security":
        return "bg-red-500";
      case "improvement":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading product updates...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 flex items-center justify-center gap-2">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  if (updates.length === 0) {
    return <div className="p-6 text-center text-muted-foreground">No product updates available.</div>;
  }

  // Group updates by date (month and year)
  const groupedUpdates: { [key: string]: ProductUpdate[] } = {};
  
  updates.forEach(update => {
    const date = new Date(update.releaseDate);
    const monthYear = format(date, "MMMM yyyy");
    
    if (!groupedUpdates[monthYear]) {
      groupedUpdates[monthYear] = [];
    }
    
    groupedUpdates[monthYear].push(update);
  });

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto">
      {Object.entries(groupedUpdates).map(([monthYear, monthUpdates]) => (
        <div key={monthYear} className="space-y-4">
          <h3 className="text-xl font-medium">{monthYear}</h3>
          <Separator />
          
          <div className="space-y-6">
            {monthUpdates.map(update => (
              <div 
                key={update.id} 
                className={`p-4 rounded-lg border ${update.isHighlighted ? "border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{update.title}</h4>
                    <Badge variant="outline" className="text-xs ml-2">v{update.version}</Badge>
                  </div>
                  <Badge className={`${getCategoryColor(update.category)} text-white`}>
                    {update.category}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {format(new Date(update.releaseDate), "MMMM d, yyyy")}
                </p>
                
                <p className="text-sm whitespace-pre-line">{update.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}