'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Package, RefreshCw, Loader2 } from 'lucide-react';

interface Agent {
  id: string;
  subdomain: string;
  profile: {
    first_name: string;
    last_name: string;
  };
}

interface TerritoryFormProps {
  agents: Agent[];
  drawnPolygon: any | null;
  onSubmit: (data: TerritoryFormData) => Promise<void>;
  onCancel: () => void;
  onMetadataChange?: (metadata: any) => void;
}

export interface TerritoryFormData {
  name: string;
  agent_id: string;
  boundary: any;
}

export default function TerritoryForm({
  agents,
  drawnPolygon,
  onSubmit,
  onCancel,
  onMetadataChange,
}: TerritoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlaps, setOverlaps] = useState<any[]>([]);
  const [propertyCount, setPropertyCount] = useState<number | null>(null);
  const [propertyBreakdown, setPropertyBreakdown] = useState<any>(null);
  const [territoryMetadata, setTerritoryMetadata] = useState<any>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TerritoryFormData>();

  // Fetch property count when polygon changes
  useEffect(() => {
    if (!drawnPolygon) {
      setPropertyCount(null);
      setPropertyBreakdown(null);
      setTerritoryMetadata(null);
      setCountError(null);
      return;
    }

    console.log('🏘️ [FORM] drawnPolygon changed, fetching property count...');
    fetchPropertyCount();
  }, [drawnPolygon]);

  const fetchPropertyCount = async () => {
    if (!drawnPolygon) return;

    setIsLoadingCount(true);
    setCountError(null);

    try {
      console.log('🏘️ [FORM] Calling count properties API endpoint');
      const response = await fetch('/api/admin/territories/count-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boundary: drawnPolygon }),
      });

      console.log('🏘️ [FORM] API response:', {
        ok: response.ok,
        status: response.status,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to count properties');
      }

      const data = await response.json();
      console.log('🏘️ [FORM] Property count result:', data);

      setPropertyCount(data.count || 0);
      setPropertyBreakdown(data.details || null);
      setTerritoryMetadata(data.metadata || null);

      // Notify parent component of metadata changes (for map visualization)
      if (onMetadataChange && data.metadata) {
        onMetadataChange(data.metadata);
      }
    } catch (err: any) {
      console.error('🏘️ [FORM] Error fetching property count:', err);
      setCountError(err.message);
      setPropertyCount(0);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const handleFormSubmit = async (data: TerritoryFormData) => {
    if (!drawnPolygon) {
      setError('Please draw a territory on the map first');
      return;
    }

    if (!selectedAgentId) {
      setError('Please select an agent');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = {
        ...data,
        agent_id: selectedAgentId,
        boundary: drawnPolygon,
      };

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to create territory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Territory Details</CardTitle>
          <CardDescription>
            {drawnPolygon
              ? 'Configure the territory you drew on the map'
              : 'Draw a polygon on the map to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <p className="ml-2">{error}</p>
            </Alert>
          )}

          {!drawnPolygon && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <p className="ml-2">
                Click the polygon tool on the map to start drawing a territory boundary
              </p>
            </Alert>
          )}

          {/* Territory Name */}
          <div>
            <Label htmlFor="name">Territory Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Territory name is required' })}
              placeholder="e.g., Manchester City Centre"
              disabled={!drawnPolygon}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Agent Selection */}
          <div>
            <Label htmlFor="agent">Assign to Agent *</Label>
            <Select
              value={selectedAgentId}
              onValueChange={setSelectedAgentId}
              disabled={!drawnPolygon}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.profile.first_name} {agent.profile.last_name} ({agent.subdomain})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAgent && (
              <p className="text-xs text-muted-foreground mt-1">
                Microsite: {selectedAgent.subdomain}.agents.nestassociates.com
              </p>
            )}
          </div>


          {/* Property Count Preview */}
          {drawnPolygon && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Property Count</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchPropertyCount}
                  disabled={isLoadingCount}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingCount ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {isLoadingCount ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Counting properties...</p>
                </div>
              ) : countError ? (
                <div className="mt-2">
                  <p className="text-sm text-red-500">{countError}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click refresh to try again
                  </p>
                </div>
              ) : propertyCount !== null && propertyCount > 0 ? (
                <>
                  <div className="mt-2">
                    <p className="text-2xl font-bold">{propertyCount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Residential Properties</p>
                  </div>

                  {propertyBreakdown && (propertyBreakdown.commercial > 0 || propertyBreakdown.mixed > 0) && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Additional Properties:</p>
                      <div className="space-y-1 text-xs">
                        {propertyBreakdown.commercial > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commercial:</span>
                            <span className="font-medium">{propertyBreakdown.commercial.toLocaleString()}</span>
                          </div>
                        )}
                        {propertyBreakdown.mixed > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mixed Use:</span>
                            <span className="font-medium">{propertyBreakdown.mixed.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {territoryMetadata && (
                    <>
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Territory Statistics:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Area Size:</span>
                            <span className="font-medium">~{territoryMetadata.areaKm2.toFixed(2)} km²</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Property Density:</span>
                            <span className="font-medium">
                              ~{Math.round(propertyCount / territoryMetadata.areaKm2).toLocaleString()} per km²
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Search Radius:</span>
                            <span className="font-medium">{territoryMetadata.radiusMeters.toLocaleString()} meters</span>
                          </div>
                        </div>
                      </div>

                      {territoryMetadata.postcodes && territoryMetadata.postcodes.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Postcode Districts ({territoryMetadata.postcodes.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {territoryMetadata.postcodes.map((postcode: string) => (
                              <Badge key={postcode} variant="outline" className="text-xs">
                                {postcode}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <p className="text-xs text-muted-foreground mt-3">
                    Data from OS Data Hub Places API
                  </p>
                </>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">No properties found in this area</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try drawing in a residential area or click refresh
                  </p>
                </div>
              )}
            </div>
          )}

          {/* T165: Overlap Warning */}
          {overlaps && overlaps.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <div className="ml-2">
                <p className="font-semibold">Territory Overlap Detected</p>
                <p className="text-sm mt-1">
                  This territory overlaps with {overlaps.length} existing{' '}
                  {overlaps.length === 1 ? 'territory' : 'territories'}:
                </p>
                <div className="mt-2 space-y-1">
                  {overlaps.map((overlap: any) => (
                    <div key={overlap.id} className="text-sm">
                      • <strong>{overlap.name}</strong> (
                      {overlap.overlap_percentage?.toFixed(1)}% overlap)
                    </div>
                  ))}
                </div>
                <p className="text-sm mt-2 font-medium">
                  You can still save this territory, but be aware of the overlap.
                </p>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!drawnPolygon || isSubmitting}>
          {isSubmitting ? 'Creating Territory...' : 'Create Territory'}
        </Button>
      </div>
    </form>
  );
}
