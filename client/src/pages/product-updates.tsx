import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { ProductUpdates } from "@/components/ProductUpdates";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// List of possible categories for filtering
const categories = [
  "All",
  "Major Update",
  "Feature",
  "Bug Fix",
  "Improvement",
  "Security"
];

export default function ProductUpdatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  return (
    <div className="min-h-screen pb-16">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Page title */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold">Product Updates</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with the latest features and improvements to KickDeck
          </p>
        </div>

        {/* Category filter */}
        <div className="flex justify-end mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {selectedCategory || "All Categories"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setSelectedCategory(undefined)}
                className={selectedCategory === undefined ? "bg-muted" : ""}
              >
                All Categories
              </DropdownMenuItem>
              {categories.slice(1).map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-muted" : ""}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Product updates list */}
        <ProductUpdates category={selectedCategory} />
      </div>
    </div>
  );
}