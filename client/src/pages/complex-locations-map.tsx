import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComplexLocationMap } from '@/components/ComplexLocationMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Filter, Building, Clock } from 'lucide-react';
import { formatAddress } from '@/lib/format-address';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
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
      return Array.isArray(data) ? data : data.complexes || [];
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

  const complexesWithCoords = filteredComplexes.filter((complex: Complex) => {
    const lat = complex.latitude;
    const lng = complex.longitude;
    if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
    const latNum = typeof lat === 'number' ? lat : parseFloat(String(lat));
    const lngNum = typeof lng === 'number' ? lng : parseFloat(String(lng));
    return !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;
  });

  const complexesWithoutCoords = filteredComplexes.filter((complex: Complex) => {
    const lat = complex.latitude;
    const lng = complex.longitude;
    if (lat === null || lat === undefined || lng === null || lng === undefined) return true;
    const latNum = typeof lat === 'number' ? lat : parseFloat(String(lat));
    const lngNum = typeof lng === 'number' ? lng : parseFloat(String(lng));
    return isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0;
  });

  if (isLoading) {
    return (
      <AdminPageWrapper title="Complex Locations" backUrl="/admin" backLabel="Back to Dashboard">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </AdminPageWrapper>
    );
  }

  if (error) {
    return (
      <AdminPageWrapper title="Complex Locations" backUrl="/admin" backLabel="Back to Dashboard">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-400">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Failed to load complexes</p>
              <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="Complex Locations"
      subtitle="Interactive map of all complex locations"
      backUrl="/admin"
      backLabel="Back to Dashboard"
    >
      <div className="space-y-6">
        <div className="flex justify-end items-center gap-2">
          <Badge variant="outline">
            {complexes.length} total complexes
          </Badge>
          <Badge variant="secondary">
            {complexesWithCoords.length} on map
          </Badge>
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
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedComplexId === complex.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
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
                          <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{formatAddress(complex)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {complex.openTime} - {complex.closeTime}
                          </span>
                        </div>

                        {complex.fields && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
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
                  <p className="text-xs text-muted-foreground mb-3">
                    These complexes don't have coordinates and won't appear on the map:
                  </p>
                  <div className="space-y-2">
                    {complexesWithoutCoords.map((complex: Complex) => (
                      <div key={complex.id} className="text-xs p-2 bg-muted/50 rounded">
                        <div className="font-medium">{complex.name}</div>
                        <div className="text-muted-foreground">{formatAddress(complex)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
