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
  const [postcodes, setPostcodes] = useState<any[]>([]);
  const [isLoadingPostcodes, setIsLoadingPostcodes] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);
  const [postcodeCounts, setPostcodeCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState<Set<string>>(new Set());
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [mappedTerritories, setMappedTerritories] = useState<any[]>([]);
  const [isLoadingTerritories, setIsLoadingTerritories] = useState(true);

  // Load postcodes when area is selected (accumulate, don't replace)
  const handleLoadArea = async (area: string) => {
    // Don't reload if already loaded
    const alreadyHasAreaPostcodes = postcodes.some(p => p.code.startsWith(area));
    if (alreadyHasAreaPostcodes) {
      console.log(`${area} postcodes already loaded`);
      return;
    }

    setSelectedArea(area);
    setIsLoadingPostcodes(true);

    try {
      const url = area ? `/api/admin/postcodes/list?area=${area}` : '/api/admin/postcodes/list';
      const response = await fetch(url);
      const data = await response.json();

      if (data.postcodes) {
        // Add to existing postcodes instead of replacing
        setPostcodes(prev => [...prev, ...data.postcodes]);
      }
    } catch (error) {
      console.error('Error loading postcodes:', error);
    } finally {
      setIsLoadingPostcodes(false);
    }
  };

  // Get agent assignments for postcodes
  const getPostcodeAssignments = () => {
    const assignments: Record<string, { agentId: string, agentName: string, color: string }> = {};

    mappedTerritories.forEach((territory, index) => {
      // Extract ALL postcodes from territory name (e.g., "BA16, TA11 Territory - Agent" -> ["BA16", "TA11"])
      const postcodeMatches = territory.name.match(/([A-Z]+\d+)/g);
      if (postcodeMatches) {
        // Generate color based on agent (consistent color per territory)
        const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
        const color = colors[index % colors.length];

        // Assign the same color to all postcodes in this territory
        postcodeMatches.forEach(postcode => {
          assignments[postcode] = {
            agentId: territory.id,
            agentName: territory.agentName,
            color,
          };
        });
      }
    });

    return assignments;
  };

  // Load territories on mount and auto-load postcodes for assigned areas
  useEffect(() => {
    async function loadTerritories() {
      try {
        const response = await fetch('/api/admin/territories');
        const data = await response.json();

        if (data.data) {
          // Map territories to display format
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
            };
          });

          setMappedTerritories(territories);

          // Auto-load postcodes for ALL unique areas that have territories assigned
          if (territories.length > 0) {
            const uniqueAreas = new Set<string>();

            territories.forEach(territory => {
              // Extract ALL postcode prefixes from territory name (e.g., "BA16, TA11" -> ["BA", "TA"])
              const postcodeMatches = territory.name.match(/([A-Z]+)\d+/g);
              if (postcodeMatches) {
                postcodeMatches.forEach(postcode => {
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
        }
      } catch (error) {
        console.error('Error loading territories:', error);
      } finally {
        setIsLoadingTerritories(false);
      }
    }

    loadTerritories();
  }, []);

  const handlePostcodeClick = async (postcodeCode: string) => {
    // Toggle selection
    setSelectedPostcodes(prev => {
      if (prev.includes(postcodeCode)) {
        return prev.filter(code => code !== postcodeCode);
      } else {
        return [...prev, postcodeCode];
      }
    });

    // Fetch property count if not already loaded
    if (!postcodeCounts[postcodeCode] && !loadingCounts.has(postcodeCode)) {
      setLoadingCounts(prev => new Set(prev).add(postcodeCode));

      try {
        const response = await fetch(`/api/admin/postcodes/${postcodeCode}/count`);
        const data = await response.json();

        setPostcodeCounts(prev => ({
          ...prev,
          [postcodeCode]: data.count || 0,
        }));
      } catch (error) {
        console.error('Error fetching property count:', error);
      } finally {
        setLoadingCounts(prev => {
          const next = new Set(prev);
          next.delete(postcodeCode);
          return next;
        });
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedPostcodes([]);
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
        let errorMessage = 'Failed to delete territory';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            errorMessage = result.error?.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
            errorMessage = `Server error (${response.status})`;
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
        throw new Error(errorMessage);
      }

      // Remove from list
      setMappedTerritories(prev => prev.filter(t => t.id !== territoryId));
      alert('Territory deleted successfully');
    } catch (error: any) {
      console.error('Error deleting territory:', error);
      alert(`Failed to delete territory: ${error.message}`);
    }
  };

  const handleAssignPostcodes = async () => {
    if (!selectedAgentId || selectedPostcodes.length === 0) return;

    setIsAssigning(true);

    try {
      // Get the selected agent's name
      const agent = agents.find(a => a.id === selectedAgentId);
      const agentName = agent?.profile
        ? `${agent.profile.first_name} ${agent.profile.last_name}`
        : agent?.subdomain || 'Agent';

      // Create a territory name from the postcodes
      const territoryName = selectedPostcodes.length === 1
        ? `${selectedPostcodes[0]} Territory - ${agentName}`
        : `${selectedPostcodes.join(', ')} Territory - ${agentName}`;

      // Get boundaries for selected postcodes and merge them
      const selectedBoundaries = selectedPostcodes
        .map(code => postcodes.find(p => p.code === code)?.boundary)
        .filter(Boolean);

      if (selectedBoundaries.length === 0) {
        alert('No valid boundaries found for selected postcodes');
        return;
      }

      // For now, we'll use the first boundary (single postcode support)
      // TODO: Implement proper boundary merging for multiple postcodes
      const boundary = selectedBoundaries[0];

      // Create the territory
      const response = await fetch('/api/admin/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: territoryName,
          agent_id: selectedAgentId,
          boundary,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create territory');
      }

      // Success!
      const totalProperties = Object.entries(postcodeCounts)
        .filter(([code]) => selectedPostcodes.includes(code))
        .reduce((sum, [, count]) => sum + count, 0);

      // Use the property count from our calculated total
      const finalPropertyCount = totalProperties;

      // Add to mapped territories list
      setMappedTerritories(prev => [{
        id: result.territory.id,
        name: territoryName,
        agentName,
        propertyCount: finalPropertyCount,
        createdAt: new Date().toISOString(),
      }, ...prev]);

      alert(
        `✓ Territory Created Successfully!\n\n` +
        `Territory: ${territoryName}\n` +
        `Agent: ${agentName}\n` +
        `Postcodes: ${selectedPostcodes.join(', ')}\n` +
        `Total Properties: ${totalProperties.toLocaleString()}\n\n` +
        `The territory has been saved and the agent can now access these properties.`
      );

      // Reset selection
      setSelectedPostcodes([]);
      setSelectedAgentId('');

    } catch (error: any) {
      console.error('Error assigning postcodes:', error);
      alert(`Failed to assign postcodes: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Postcode-Based Territories</h1>
          <p className="text-muted-foreground">
            Select an area to load postcodes ({postcodes.length} loaded, {selectedPostcodes.length} selected)
          </p>
        </div>
        {selectedPostcodes.length > 0 && (
          <Button variant="outline" onClick={handleClearSelection}>
            Clear Selection
          </Button>
        )}
      </div>


      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <PostcodeMap
                postcodes={postcodes}
                selectedPostcodes={selectedPostcodes}
                onPostcodeClick={handlePostcodeClick}
                postcodeAssignments={getPostcodeAssignments()}
                onMapClick={handleLoadArea}
                isLoadingPostcodes={isLoadingPostcodes}
                selectedArea={selectedArea}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selected Postcodes ({selectedPostcodes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPostcodes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Click postcodes on the map to select them
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedPostcodes.map(code => {
                    const postcode = postcodes.find(p => p.code === code);
                    const propertyCount = postcodeCounts[code];
                    const isLoading = loadingCounts.has(code);

                    return (
                      <div key={code} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{code}</p>
                            {isLoading ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Counting properties...</span>
                              </div>
                            ) : propertyCount !== undefined ? (
                              <p className="text-sm font-semibold text-blue-600">
                                {propertyCount.toLocaleString()} properties
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                {postcode?.area_km2 ? `${parseFloat(postcode.area_km2).toFixed(2)} km²` : ''}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePostcodeClick(code)}
                          >
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

          {selectedPostcodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assign to Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Assigning {selectedPostcodes.length} postcode{selectedPostcodes.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-lg font-semibold">
                    Total: {Object.entries(postcodeCounts)
                      .filter(([code]) => selectedPostcodes.includes(code))
                      .reduce((sum, [, count]) => sum + count, 0)
                      .toLocaleString()} properties
                  </p>
                </div>

                <div>
                  <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
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
                  onClick={handleAssignPostcodes}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Postcodes'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mapped Territories */}
          {mappedTerritories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mapped Territories ({mappedTerritories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTerritories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mappedTerritories.map((territory, index) => {
                      const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
                      const agentColor = colors[index % colors.length];

                      return (
                        <div key={territory.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              {/* Color indicator */}
                              <div
                                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                                style={{ backgroundColor: agentColor }}
                                title="Territory color on map"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{territory.agentName}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {territory.name}
                                </p>
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
                      );
                    })}
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
