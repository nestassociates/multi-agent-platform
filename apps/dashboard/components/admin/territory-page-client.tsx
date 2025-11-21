'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TerritoryMap from '@/components/admin/territory-map';
import TerritoryForm, { type TerritoryFormData } from '@/components/admin/territory-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MapPin, Trash2, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { getAgentColor } from '@/lib/color-generator';

interface Props {
  territories: any[];
  agents: any[];
}

export default function TerritoryPageClient({ territories: initialTerritories, agents }: Props) {
  const router = useRouter();
  const [territories, setTerritories] = useState(initialTerritories);
  const [drawnPolygon, setDrawnPolygon] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [expandedTerritoryId, setExpandedTerritoryId] = useState<string | null>(null);
  const [searchRadiusData, setSearchRadiusData] = useState<{ center: [number, number]; radiusMeters: number } | null>(null);

  // Monitor state changes with useEffect
  useEffect(() => {
    console.log('📊 [STATE] isCreating changed:', isCreating, {
      hasPolygon: !!drawnPolygon,
      territoriesCount: territories.length,
      timestamp: new Date().toISOString(),
    });
  }, [isCreating]);

  useEffect(() => {
    console.log('📊 [STATE] drawnPolygon changed:', !!drawnPolygon, {
      polygon: drawnPolygon,
      timestamp: new Date().toISOString(),
    });
  }, [drawnPolygon]);

  // Debug state changes on every render
  console.log('🔍 [RENDER] Component state:', {
    isCreating,
    hasPolygon: !!drawnPolygon,
    territoriesCount: territories.length,
    timestamp: new Date().toISOString(),
  });

  const handleDrawCreate = (feature: any) => {
    console.log('✏️ [HANDLER] handleDrawCreate called', {
      feature,
      geometry: feature.geometry,
      timestamp: new Date().toISOString(),
    });
    console.log('✏️ [HANDLER] Setting drawnPolygon and isCreating=true');
    setDrawnPolygon(feature.geometry);
    setIsCreating(true);
    console.log('✏️ [HANDLER] State setters called, React will re-render');
  };

  const handleDrawUpdate = (feature: any) => {
    console.log('📝 [HANDLER] handleDrawUpdate called', {
      feature,
      geometry: feature.geometry,
      timestamp: new Date().toISOString(),
    });
    setDrawnPolygon(feature.geometry);
  };

  const handleDrawDelete = () => {
    console.log('🗑️ [HANDLER] handleDrawDelete called', {
      timestamp: new Date().toISOString(),
    });
    setDrawnPolygon(null);
    setIsCreating(false);
  };

  const handleTerritoryClick = (territory: any) => {
    setSelectedTerritoryId(territory.id);
  };

  const handleSubmit = async (data: TerritoryFormData) => {
    console.log('💾 [SUBMIT] handleSubmit called', {
      data,
      timestamp: new Date().toISOString(),
    });

    try {
      console.log('💾 [SUBMIT] Calling API /api/admin/territories');
      const response = await fetch('/api/admin/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      console.log('💾 [SUBMIT] API response:', {
        ok: response.ok,
        status: response.status,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('💾 [SUBMIT] API error:', error);
        throw new Error(error.error?.message || 'Failed to create territory');
      }

      const result = await response.json();
      console.log('💾 [SUBMIT] Territory created successfully', {
        territory: result.territory,
        os_property_count: result.os_property_count,
        overlaps: result.overlaps,
      });

      // Add new territory to local state immediately with metadata
      const newTerritory = {
        ...result.territory,
        boundary: data.boundary,
        color: getAgentColor(data.agent_id, territories.length),
      };
      setTerritories([newTerritory, ...territories]);

      // Reset form
      console.log('💾 [SUBMIT] Resetting form state');
      setDrawnPolygon(null);
      setIsCreating(false);
      setSearchRadiusData(null);
    } catch (error: any) {
      console.error('💾 [SUBMIT] Submit error:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setDrawnPolygon(null);
    setIsCreating(false);
    setSearchRadiusData(null);
  };

  const handleMetadataChange = (metadata: any) => {
    if (metadata?.centerPoint && metadata?.radiusMeters) {
      setSearchRadiusData({
        center: metadata.centerPoint,
        radiusMeters: metadata.radiusMeters,
      });
    }
  };

  const handleDeleteTerritory = async (territoryId: string) => {
    if (!confirm('Are you sure you want to delete this territory?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/territories/${territoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete territory');
      }

      // Remove from local state immediately
      setTerritories(territories.filter(t => t.id !== territoryId));
      setSelectedTerritoryId(null);
    } catch (error) {
      console.error('Delete territory error:', error);
      alert('Failed to delete territory');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Territory Management</h1>
          <p className="text-muted-foreground">
            Draw and assign geographic territories to agents ({territories.length} territories)
          </p>
        </div>
        {isCreating && (
          <Button variant="outline" onClick={handleCancel}>
            Cancel Drawing
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <TerritoryMap
                territories={territories}
                onDrawCreate={handleDrawCreate}
                onDrawUpdate={handleDrawUpdate}
                onDrawDelete={handleDrawDelete}
                onTerritoryClick={handleTerritoryClick}
                allowDrawing={!isCreating}
                searchRadius={searchRadiusData}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {isCreating ? (
            /* Territory Creation Form */
            <TerritoryForm
              agents={agents}
              drawnPolygon={drawnPolygon}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onMetadataChange={handleMetadataChange}
            />
          ) : (
            /* Territory List */
            <Card>
              <CardHeader>
                <CardTitle>Territories ({territories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {territories.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No territories yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the polygon tool on the map to create your first territory
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {territories.map((territory) => (
                      <Collapsible
                        key={territory.id}
                        open={expandedTerritoryId === territory.id}
                        onOpenChange={(open) => setExpandedTerritoryId(open ? territory.id : null)}
                      >
                        <div
                          className={`border rounded-lg transition-colors ${
                            selectedTerritoryId === territory.id ? 'bg-muted border-primary' : ''
                          }`}
                        >
                          {/* Territory Header */}
                          <div
                            className="p-3 cursor-pointer hover:bg-muted"
                            onClick={() => handleTerritoryClick(territory)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: territory.color }}
                                  />
                                  <p className="font-medium text-sm">{territory.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {territory.agent?.profile?.first_name} {territory.agent?.profile?.last_name}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {territory.property_count?.toLocaleString() || 0} properties
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {expandedTerritoryId === territory.id ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTerritory(territory.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Statistics */}
                          <CollapsibleContent>
                            <div className="px-3 pb-3 pt-0 border-t bg-muted/50">
                              <div className="mt-3 space-y-3">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs font-medium text-muted-foreground">Territory Statistics</p>
                                </div>

                                {/* Property Counts */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Residential:</span>
                                    <span className="font-medium">{territory.property_count?.toLocaleString() || 0}</span>
                                  </div>
                                  {territory.metadata?.commercial_count > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Commercial:</span>
                                      <span className="font-medium">{territory.metadata.commercial_count.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {territory.metadata?.mixed_count > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Mixed Use:</span>
                                      <span className="font-medium">{territory.metadata.mixed_count.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Area Statistics */}
                                {territory.metadata && (
                                  <div className="pt-2 border-t space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Area Size:</span>
                                      <span className="font-medium">~{territory.metadata.area_km2?.toFixed(2)} km²</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Property Density:</span>
                                      <span className="font-medium">
                                        ~{Math.round((territory.property_count || 0) / territory.metadata.area_km2).toLocaleString()} per km²
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Search Radius:</span>
                                      <span className="font-medium">{territory.metadata.radius_meters?.toLocaleString()} meters</span>
                                    </div>
                                  </div>
                                )}

                                {/* Postcodes */}
                                {territory.metadata?.postcodes && territory.metadata.postcodes.length > 0 && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                      Postcode Districts ({territory.metadata.postcodes.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {territory.metadata.postcodes.map((postcode: string) => (
                                        <Badge key={postcode} variant="outline" className="text-xs">
                                          {postcode}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
