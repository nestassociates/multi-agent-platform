'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TerritoryMap from '@/components/admin/territory-map';
import TerritoryForm, { type TerritoryFormData } from '@/components/admin/territory-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Trash2 } from 'lucide-react';

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

  const handleDrawCreate = (feature: any) => {
    setDrawnPolygon(feature.geometry);
    setIsCreating(true);
  };

  const handleDrawUpdate = (feature: any) => {
    setDrawnPolygon(feature.geometry);
  };

  const handleDrawDelete = () => {
    setDrawnPolygon(null);
    setIsCreating(false);
  };

  const handleTerritoryClick = (territory: any) => {
    setSelectedTerritoryId(territory.id);
  };

  const handleSubmit = async (data: TerritoryFormData) => {
    try {
      const response = await fetch('/api/admin/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create territory');
      }

      const result = await response.json();

      // Reset form and refresh
      setDrawnPolygon(null);
      setIsCreating(false);
      router.refresh();
    } catch (error: any) {
      throw error;
    }
  };

  const handleCancel = () => {
    setDrawnPolygon(null);
    setIsCreating(false);
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

      router.refresh();
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
                      <div
                        key={territory.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                          selectedTerritoryId === territory.id ? 'bg-muted border-primary' : ''
                        }`}
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
                                {territory.property_count} properties
                              </Badge>
                            </div>
                          </div>
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
