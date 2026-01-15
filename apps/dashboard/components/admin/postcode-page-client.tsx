'use client';

import { useState, useEffect } from 'react';
import PostcodeMap from '@/components/admin/postcode-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';

interface Props {
  agents: any[];
}

export default function PostcodePageClient({ agents }: Props) {
  // Sectors are now the primary data source (simplified from districts → sectors)
  const [sectors, setSectors] = useState<any[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [sectorCounts, setSectorCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState<Set<string>>(new Set());

  const [isLoadingSectors, setIsLoadingSectors] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [mappedTerritories, setMappedTerritories] = useState<any[]>([]);
  const [isLoadingTerritories, setIsLoadingTerritories] = useState(true);

  // Load sectors when area is selected
  const handleLoadArea = async (area: string) => {
    // Check if we already have sectors for this area
    const alreadyLoaded = sectors.some((s) => s.code.startsWith(area));
    if (alreadyLoaded) {
      console.log(`${area} sectors already loaded`);
      return;
    }

    setSelectedArea(area);
    setIsLoadingSectors(true);

    try {
      const response = await fetch(`/api/admin/postcodes/list?area=${area}`);
      const data = await response.json();

      if (data.sectors) {
        // Add to existing sectors
        setSectors((prev) => [...prev, ...data.sectors]);
      }
    } catch (error) {
      console.error('Error loading sectors:', error);
    } finally {
      setIsLoadingSectors(false);
    }
  };

  // Refresh sectors data for an area
  const refreshSectors = async (area: string) => {
    try {
      const response = await fetch(`/api/admin/postcodes/list?area=${area}`);
      const data = await response.json();

      if (data.sectors) {
        // Replace existing sectors for this area
        setSectors((prev) => [
          ...prev.filter((s) => !s.code.startsWith(area)),
          ...data.sectors,
        ]);
      }
    } catch (error) {
      console.error('Error refreshing sectors:', error);
    }
  };

  // Get agent assignments for sectors
  const getSectorAssignments = () => {
    const assignments: Record<string, { agentId: string; agentName: string; color: string }> = {};

    mappedTerritories.forEach((territory: any) => {
      const color = territory.color || '#ef4444';

      if (territory.sectors && territory.sectors.length > 0) {
        territory.sectors.forEach((sector: string) => {
          assignments[sector] = {
            agentId: territory.id,
            agentName: territory.agentName,
            color,
          };
        });
      }
    });

    return assignments;
  };

  // Refresh territories list from API
  const refreshTerritories = async () => {
    try {
      const response = await fetch('/api/admin/territories');
      const data = await response.json();

      if (data.data) {
        const territories = data.data.map((t: any) => {
          const agentName = t.agent?.profile
            ? `${t.agent.profile.first_name} ${t.agent.profile.last_name}`
            : t.agent?.subdomain || 'Unknown';

          return {
            id: t.id,
            name: t.name,
            agentName,
            propertyCount: t.property_count || 0,
            createdAt: t.created_at,
            sectors: t.sectors || [],
            color: t.color || '#ef4444',
          };
        });

        setMappedTerritories(territories);
        return territories;
      }
      return [];
    } catch (error) {
      console.error('Error loading territories:', error);
      return [];
    }
  };

  // Load territories on mount and auto-load sectors for assigned areas
  useEffect(() => {
    async function loadTerritories() {
      try {
        const territories = await refreshTerritories();

        // Auto-load sectors for all unique areas that have territories assigned
        if (territories.length > 0) {
          const uniqueAreas = new Set<string>();

          territories.forEach((territory: any) => {
            // Extract area prefixes from territory name (e.g., "TA1 (3 sectors)" -> "TA")
            const areaMatches = territory.name.match(/([A-Z]+)\d+/g);
            if (areaMatches) {
              areaMatches.forEach((postcode: string) => {
                const areaMatch = postcode.match(/^([A-Z]+)/);
                if (areaMatch) {
                  uniqueAreas.add(areaMatch[1]);
                }
              });
            }
          });

          // Load all unique areas
          for (const area of uniqueAreas) {
            await handleLoadArea(area);
          }
        }
      } catch (error) {
        console.error('Error loading territories:', error);
      } finally {
        setIsLoadingTerritories(false);
      }
    }

    loadTerritories();
  }, []);

  // Toggle sector selection
  const handleSectorClick = async (sectorCode: string) => {
    setSelectedSectors((prev) => {
      if (prev.includes(sectorCode)) {
        return prev.filter((code) => code !== sectorCode);
      } else {
        return [...prev, sectorCode];
      }
    });

    // Fetch property count for sector if not already loaded
    // Use undefined check (not falsy) since 0 is a valid count
    if (sectorCounts[sectorCode] === undefined && !loadingCounts.has(sectorCode)) {
      setLoadingCounts((prev) => new Set(prev).add(sectorCode));

      try {
        const encodedCode = encodeURIComponent(sectorCode);
        const response = await fetch(`/api/admin/sectors/${encodedCode}/count`);
        const data = await response.json();

        setSectorCounts((prev) => ({
          ...prev,
          [sectorCode]: data.count || 0,
        }));
      } catch (error) {
        console.error('Error fetching sector count:', error);
      } finally {
        setLoadingCounts((prev) => {
          const next = new Set(prev);
          next.delete(sectorCode);
          return next;
        });
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedSectors([]);
  };

  const handleDeleteTerritory = async (territoryId: string) => {
    if (!confirm('Are you sure you want to delete all territory assignments for this agent?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/territories/${territoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete territory';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            errorMessage = result.error?.message || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
        throw new Error(errorMessage);
      }

      // Remove from list
      setMappedTerritories((prev) => prev.filter((t) => t.id !== territoryId));

      // Refresh sectors to update assignment status
      const uniqueAreas = new Set<string>();
      sectors.forEach((s) => {
        const areaMatch = s.code.match(/^([A-Z]+)/);
        if (areaMatch) {
          uniqueAreas.add(areaMatch[1]);
        }
      });
      for (const area of uniqueAreas) {
        await refreshSectors(area);
      }

      alert('Territory deleted successfully');
    } catch (error: any) {
      console.error('Error deleting territory:', error);
      alert(`Failed to delete territory: ${error.message}`);
    }
  };

  const handleAssignSectors = async () => {
    if (!selectedAgentId || selectedSectors.length === 0) return;

    setIsAssigning(true);

    try {
      const agent = agents.find((a) => a.id === selectedAgentId);
      const agentName = agent?.profile
        ? `${agent.profile.first_name} ${agent.profile.last_name}`
        : agent?.subdomain || 'Agent';

      // Call the API to assign sectors
      const response = await fetch('/api/admin/territories/postcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgentId,
          sector_codes: selectedSectors,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to assign sectors');
      }

      // Calculate total properties
      const totalProperties = selectedSectors.reduce(
        (sum, code) => sum + (sectorCounts[code] || 0),
        0
      );

      alert(
        `Territories Assigned Successfully!\n\n` +
          `Assigned to: ${agentName}\n` +
          `Sectors: ${selectedSectors.length}\n` +
          `Total Properties: ${totalProperties.toLocaleString()}`
      );

      // Refresh territories
      await refreshTerritories();

      // Refresh sectors to update assignment status
      const uniqueAreas = new Set<string>();
      selectedSectors.forEach((code) => {
        const areaMatch = code.match(/^([A-Z]+)/);
        if (areaMatch) {
          uniqueAreas.add(areaMatch[1]);
        }
      });
      for (const area of uniqueAreas) {
        await refreshSectors(area);
      }

      // Reset selections
      setSelectedSectors([]);
      setSelectedAgentId('');
    } catch (error: any) {
      console.error('Error assigning sectors:', error);
      alert(`Failed to assign sectors: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sector-Based Territories</h1>
          <p className="text-muted-foreground">
            Click on the map to load sectors, then select areas to assign ({sectors.length} sectors
            loaded, {selectedSectors.length} selected)
          </p>
        </div>
        <div className="flex gap-2">
          {selectedSectors.length > 0 && (
            <Button variant="outline" onClick={handleClearSelection}>
              Clear Selection
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Map */}
        <div className="lg:col-span-2 h-full">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <PostcodeMap
                sectors={sectors}
                selectedSectors={selectedSectors}
                onSectorClick={handleSectorClick}
                sectorAssignments={getSectorAssignments()}
                onMapClick={handleLoadArea}
                isLoadingSectors={isLoadingSectors}
                selectedArea={selectedArea}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 h-full overflow-y-auto">
          {/* Selected Sectors Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Selected Sectors
                <Badge variant="secondary">{selectedSectors.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSectors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click on sectors on the map to select them
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedSectors.map((code) => {
                    const propertyCount = sectorCounts[code];
                    const isLoading = loadingCounts.has(code);
                    // Extract district from sector code for display
                    const districtMatch = code.match(/^([A-Z]+\d+)/);
                    const parentDistrict = districtMatch ? districtMatch[1] : '';

                    return (
                      <div key={code} className="p-3 border rounded-lg border-green-200 bg-green-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{code}</p>
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-100 border-green-400 text-green-700"
                              >
                                {parentDistrict}
                              </Badge>
                            </div>
                            {isLoading ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Counting...</span>
                              </div>
                            ) : propertyCount !== undefined ? (
                              <p className="text-sm font-semibold text-green-600">
                                {propertyCount.toLocaleString()} properties
                              </p>
                            ) : null}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleSectorClick(code)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assign to Agent Card */}
          {selectedSectors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assign to Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selectedSectors.length} sector{selectedSectors.length > 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold text-green-600">
                      {Object.entries(sectorCounts)
                        .filter(([code]) => selectedSectors.includes(code))
                        .reduce((sum, [, count]) => sum + count, 0)
                        .toLocaleString()}{' '}
                      props
                    </span>
                  </div>
                </div>

                <div>
                  <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.profile?.first_name} {agent.profile?.last_name} ({agent.subdomain})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  disabled={!selectedAgentId || isAssigning}
                  onClick={handleAssignSectors}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Sectors'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mapped Territories */}
          <Card>
            <CardHeader>
              <CardTitle>Mapped Territories ({mappedTerritories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTerritories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : mappedTerritories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No territories assigned yet
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {mappedTerritories.map((territory) => (
                    <div key={territory.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          {/* Color indicator */}
                          <div
                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: territory.color }}
                            title="Territory color on map"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{territory.agentName}</p>
                            <p className="text-xs text-muted-foreground mt-1">{territory.name}</p>
                            <p className="text-sm font-semibold text-blue-600 mt-1">
                              {territory.propertyCount.toLocaleString()} properties
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTerritory(territory.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </div>
      </div>
    </div>
  );
}
