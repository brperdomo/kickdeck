import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComplexLocationMap } from '@/components/ComplexLocationMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Filter, Building, Clock } from 'lucide-react';
import { formatAddress } from '@/lib/format-address';

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: string | null;
  longitude?: string | null;
  openTime: string;
  closeTime: string;
  rules?: string | null;
  directions?: string | null;
  isOpen: boolean;
  fields?: any[];
}

export default function ComplexLocationsMapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedComplexId, setSelectedComplexId] = useState<number | undefined>();

  const { data: complexes = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) {
        throw new Error('Failed to fetch complexes');
      }
      const data = await response.json();
      return data.complexes || [];
    }
  });

  // Filter complexes based on search and status
  const filteredComplexes = complexes.filter((complex: Complex) => {
    const matchesSearch = !searchQuery || 
      complex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complex.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complex.state.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'open' && complex.isOpen) ||
      (statusFilter === 'closed' && !complex.isOpen);
    
    return matchesSearch && matchesStatus;
  });

  const complexesWithCoords = filteredComplexes.filter((complex: Complex) => 
    complex.latitude && complex.longitude
  );

  const complexesWithoutCoords = filteredComplexes.filter((complex: Complex) => 
    !complex.latitude || !complex.longitude
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Failed to load complexes</p>
              <p className="text-sm text-gray-600 mt-1">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Complex Locations</h1>
          <p className="text-gray-600 mt-1">Interactive map of all complex locations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {complexes.length} total complexes
          </Badge>
          <Badge variant="secondary">
            {complexesWithCoords.length} on map
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search complexes by name, city, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Complexes</SelectItem>
                <SelectItem value="open">Open Only</SelectItem>
                <SelectItem value="closed">Closed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <ComplexLocationMap
            complexes={filteredComplexes}
            height="600px"
            selectedComplexId={selectedComplexId}
            onComplexSelect={(complex) => setSelectedComplexId(complex.id)}
          />
        </div>

        {/* Complex List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complex List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredComplexes.map((complex: Complex) => (
                  <div
                    key={complex.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedComplexId === complex.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedComplexId(complex.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{complex.name}</h3>
                      <Badge 
                        variant={complex.isOpen ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {complex.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{formatAddress(complex)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {complex.openTime} - {complex.closeTime}
                        </span>
                      </div>

                      {complex.fields && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {complex.fields.length} field{complex.fields.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {(!complex.latitude || !complex.longitude) && (
                        <Badge variant="outline" className="text-xs">
                          No coordinates
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Complexes without coordinates */}
          {complexesWithoutCoords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Complexes Not on Map</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-3">
                  These complexes don't have coordinates and won't appear on the map:
                </p>
                <div className="space-y-2">
                  {complexesWithoutCoords.map((complex: Complex) => (
                    <div key={complex.id} className="text-xs p-2 bg-gray-50 rounded">
                      <div className="font-medium">{complex.name}</div>
                      <div className="text-gray-600">{formatAddress(complex)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}