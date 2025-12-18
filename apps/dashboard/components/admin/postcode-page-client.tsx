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

  // Sector drill-down state (Feature 008)
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);
  const [sectorCounts, setSectorCounts] = useState<Record<string, number>>({});
  // Assigned sector boundaries for display at district level
  const [assignedSectorBoundaries, setAssignedSectorBoundaries] = useState<any[]>([]);

  // Load postcodes when area is selected (accumulate, don't replace)
  const handleLoadArea = async (area: string, forceReload = false) => {
    // Don't reload if already loaded (unless forced)
    const alreadyHasAreaPostcodes = postcodes.some(p => p.code.startsWith(area));
    if (alreadyHasAreaPostcodes && !forceReload) {
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
        if (forceReload) {
          // Replace existing postcodes for this area with fresh data
          setPostcodes(prev => [
            ...prev.filter(p => !p.code.startsWith(area)),
            ...data.postcodes,
          ]);
        } else {
          // Add to existing postcodes
          setPostcodes(prev => [...prev, ...data.postcodes]);
        }
      }
    } catch (error) {
      console.error('Error loading postcodes:', error);
    } finally {
      setIsLoadingPostcodes(false);
    }
  };

  // Refresh postcodes data to get updated assignment statuses
  const refreshPostcodes = async () => {
    try {
      // Get unique areas from current postcodes
      const areas = new Set<string>();
      postcodes.forEach(p => {
        const areaMatch = p.code.match(/^([A-Z]+)/);
        if (areaMatch) {
          areas.add(areaMatch[1]);
        }
      });

      // Reload each area to get fresh assignment_status
      for (const area of areas) {
        await handleLoadArea(area, true);
      }
    } catch (error) {
      console.error('Error refreshing postcodes:', error);
      // Don't throw - this is a non-critical refresh
    }
  };

  // Get agent assignments for FULL DISTRICTS only (not sectors)
  const getPostcodeAssignments = () => {
    const assignments: Record<string, { agentId: string, agentName: string, color: string }> = {};
    const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];

    mappedTerritories.forEach((territory: any, index) => {
      const color = colors[index % colors.length];

      // Only use the postcodes array (full district assignments)
      // Don't include districts that only have sector-level assignments
      if (territory.postcodes && territory.postcodes.length > 0) {
        territory.postcodes.forEach((postcode: string) => {
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

  // Get agent assignments for SECTORS (individual sector assignments)
  const getSectorAssignments = () => {
    const assignments: Record<string, { agentId: string, agentName: string, color: string }> = {};
    const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];

    mappedTerritories.forEach((territory: any, index) => {
      const color = colors[index % colors.length];

      // Use the sectors array (individual sector assignments)
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

  // Get districts that have ONLY sector-level assignments (for visual indicator on map)
  const getDistrictsWithSectorAssignments = () => {
    const districtsWithSectors = new Set<string>();
    const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
    const districtColors: Record<string, string> = {};

    mappedTerritories.forEach((territory: any, index) => {
      const color = colors[index % colors.length];
      const fullDistricts = new Set(territory.postcodes || []);

      // For each sector, extract its parent district
      if (territory.sectors && territory.sectors.length > 0) {
        territory.sectors.forEach((sector: string) => {
          const districtMatch = sector.match(/^([A-Z]+\d+)/);
          if (districtMatch) {
            const district = districtMatch[1];
            // Only include if this district is NOT a full assignment
            if (!fullDistricts.has(district)) {
              districtsWithSectors.add(district);
              districtColors[district] = color;
            }
          }
        });
      }
    });

    return { districts: districtsWithSectors, colors: districtColors };
  };

  // Load sector boundaries for assigned sectors (to show on map at district level)
  const loadAssignedSectorBoundaries = async (territories: any[]) => {
    try {
      const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
      const allAssignedSectors: any[] = [];

      // Collect all assigned sectors from territories
      for (let i = 0; i < territories.length; i++) {
        const territory = territories[i];
        const color = colors[i % colors.length];

        if (territory.sectors && territory.sectors.length > 0) {
          // Group sectors by district to minimize API calls
          const sectorsByDistrict: Record<string, string[]> = {};
          for (const sector of territory.sectors) {
            const districtMatch = sector.match(/^([A-Z]+\d+)/);
            if (districtMatch) {
              const district = districtMatch[1];
              if (!sectorsByDistrict[district]) {
                sectorsByDistrict[district] = [];
              }
              sectorsByDistrict[district].push(sector);
            }
          }

          // Fetch sector boundaries for each district
          for (const [district, sectorCodes] of Object.entries(sectorsByDistrict)) {
            try {
              const response = await fetch(`/api/admin/sectors/list?district=${district}`);
              const data = await response.json();

              if (data.sectors) {
                // Filter to only assigned sectors and add color
                const assignedSectors = data.sectors
                  .filter((s: any) => sectorCodes.includes(s.code))
                  .map((s: any) => ({
                    ...s,
                    agentColor: color,
                    agentName: territory.agentName,
                    agentId: territory.id,
                  }));
                allAssignedSectors.push(...assignedSectors);
              }
            } catch (error) {
              console.error(`Error loading sectors for ${district}:`, error);
            }
          }
        }
      }

      setAssignedSectorBoundaries(allAssignedSectors);
    } catch (error) {
      console.error('Error loading assigned sector boundaries:', error);
    }
  };

  // Refresh territories list from API
  const refreshTerritories = async () => {
    try {
      const response = await fetch('/api/admin/territories');
      const data = await response.json();

      if (data.data) {
        // Map territories to display format, preserving postcodes and sectors arrays
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
            // Preserve postcodes and sectors arrays for map coloring
            postcodes: t.postcodes || [],
            sectors: t.sectors || [],
          };
        });

        setMappedTerritories(territories);

        // Load sector boundaries for assigned sectors
        await loadAssignedSectorBoundaries(territories);

        return territories;
      }
      return [];
    } catch (error) {
      console.error('Error loading territories:', error);
      return [];
    }
  };

  // Load territories on mount and auto-load postcodes for assigned areas
  useEffect(() => {
    async function loadTerritories() {
      try {
        const territories = await refreshTerritories();

        // Auto-load postcodes for ALL unique areas that have territories assigned
        if (territories.length > 0) {
          const uniqueAreas = new Set<string>();

          territories.forEach((territory: any) => {
            // Extract ALL postcode prefixes from territory name (e.g., "BA16, TA11" -> ["BA", "TA"])
            const postcodeMatches = territory.name.match(/([A-Z]+)\d+/g);
            if (postcodeMatches) {
              postcodeMatches.forEach((postcode: string) => {
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
    setSelectedSectors([]);
    setExpandedDistrict(null);
    setSectors([]);
  };

  // Drill down into a district to see its sectors (Feature 008)
  const handleDistrictDrillDown = async (districtCode: string) => {
    // If already expanded, collapse
    if (expandedDistrict === districtCode) {
      setExpandedDistrict(null);
      setSectors([]);
      // Don't clear selectedSectors - keep them for mixed assignment
      return;
    }

    setIsLoadingSectors(true);
    setExpandedDistrict(districtCode);
    // Don't clear selectedSectors - allow accumulating sectors from multiple districts

    try {
      const response = await fetch(`/api/admin/sectors/list?district=${districtCode}`);
      const data = await response.json();

      if (data.sectors) {
        setSectors(data.sectors);
      } else {
        setSectors([]);
        if (data.message) {
          console.log(data.message);
        }
      }
    } catch (error) {
      console.error('Error loading sectors:', error);
      setSectors([]);
    } finally {
      setIsLoadingSectors(false);
    }
  };

  // Toggle sector selection (Feature 008)
  const handleSectorClick = async (sectorCode: string) => {
    setSelectedSectors(prev => {
      if (prev.includes(sectorCode)) {
        return prev.filter(code => code !== sectorCode);
      } else {
        return [...prev, sectorCode];
      }
    });

    // Fetch property count for sector if not already loaded
    if (!sectorCounts[sectorCode] && !loadingCounts.has(sectorCode)) {
      setLoadingCounts(prev => new Set(prev).add(sectorCode));

      try {
        const encodedCode = encodeURIComponent(sectorCode);
        const response = await fetch(`/api/admin/sectors/${encodedCode}/count`);
        const data = await response.json();

        setSectorCounts(prev => ({
          ...prev,
          [sectorCode]: data.count || 0,
        }));
      } catch (error) {
        console.error('Error fetching sector count:', error);
      } finally {
        setLoadingCounts(prev => {
          const next = new Set(prev);
          next.delete(sectorCode);
          return next;
        });
      }
    }
  };

  // Collapse sectors and go back to district view
  // Keep selectedSectors - allows accumulating sectors from multiple districts
  const handleCollapseSectors = () => {
    setExpandedDistrict(null);
    setSectors([]);
    // Don't clear selectedSectors - preserve for mixed assignment
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
    // Support mixed assignment: districts AND sectors together
    const hasDistricts = selectedPostcodes.length > 0;
    const hasSectors = selectedSectors.length > 0;

    if (!selectedAgentId || (!hasDistricts && !hasSectors)) return;

    setIsAssigning(true);

    try {
      const agent = agents.find(a => a.id === selectedAgentId);
      const agentName = agent?.profile
        ? `${agent.profile.first_name} ${agent.profile.last_name}`
        : agent?.subdomain || 'Agent';

      const assignedItems: string[] = [];
      let totalProperties = 0;

      // 1. Assign full districts first (multiple agents can share territories)
      if (hasDistricts) {
        for (const postcodeCode of selectedPostcodes) {
          const response = await fetch('/api/admin/territories/postcode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent_id: selectedAgentId,
              postcode_code: postcodeCode,
              sector_codes: null, // Full district assignment
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error?.message || `Failed to assign ${postcodeCode}`);
          }

          assignedItems.push(`${postcodeCode} (full district)`);
          totalProperties += postcodeCounts[postcodeCode] || 0;
        }
      }

      // 2. Assign individual sectors (grouped by district)
      if (hasSectors) {
        // Group sectors by their parent district (e.g., "TA3 1" -> "TA3")
        const sectorsByDistrict: Record<string, string[]> = {};
        for (const sectorCode of selectedSectors) {
          // Extract district from sector code (e.g., "TA3 1" -> "TA3")
          const districtMatch = sectorCode.match(/^([A-Z]+\d+)/);
          if (districtMatch) {
            const district = districtMatch[1];
            if (!sectorsByDistrict[district]) {
              sectorsByDistrict[district] = [];
            }
            sectorsByDistrict[district].push(sectorCode);
          }
        }

        // Assign sectors for each district (multiple agents can share territories)
        for (const [districtCode, sectorCodesToAssign] of Object.entries(sectorsByDistrict)) {
          const response = await fetch('/api/admin/territories/postcode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent_id: selectedAgentId,
              postcode_code: districtCode,
              sector_codes: sectorCodesToAssign,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error?.message || `Failed to assign sectors in ${districtCode}`);
          }

          assignedItems.push(`${districtCode}: ${sectorCodesToAssign.join(', ')}`);
          const sectorProps = sectorCodesToAssign.reduce(
            (sum, code) => sum + (sectorCounts[code] || 0),
            0
          );
          totalProperties += sectorProps;
        }
      }

      // Show success message
      if (assignedItems.length > 0) {
        alert(
          `✓ Territories Assigned Successfully!\n\n` +
          `Assigned to: ${agentName}\n` +
          `${assignedItems.join('\n')}\n\n` +
          `Total Properties: ${totalProperties.toLocaleString()}`
        );

        // Refresh both territories and postcodes to update assignment statuses
        await refreshTerritories();
        await refreshPostcodes();
      }

      // Reset all selections
      setSelectedPostcodes([]);
      setSelectedSectors([]);
      setExpandedDistrict(null);
      setSectors([]);
      setSelectedAgentId('');

    } catch (error: any) {
      console.error('Error assigning territories:', error);
      alert(`Failed to assign territories: ${error.message}`);
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
            {expandedDistrict ? (
              <>Viewing sectors in {expandedDistrict} ({sectors.length} sectors, {selectedSectors.length} selected)</>
            ) : (
              <>Select an area to load districts ({postcodes.length} loaded, {selectedPostcodes.length} selected)</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {expandedDistrict && (
            <Button variant="outline" onClick={handleCollapseSectors}>
              ← Back to Districts
            </Button>
          )}
          {(selectedPostcodes.length > 0 || selectedSectors.length > 0) && (
            <Button variant="outline" onClick={handleClearSelection}>
              Clear Selection
            </Button>
          )}
        </div>
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
                sectorAssignments={getSectorAssignments()}
                districtsWithSectors={getDistrictsWithSectorAssignments()}
                assignedSectorBoundaries={assignedSectorBoundaries}
                onMapClick={handleLoadArea}
                isLoadingPostcodes={isLoadingPostcodes}
                selectedArea={selectedArea}
                // Sector drill-down props (Feature 008)
                expandedDistrict={expandedDistrict}
                sectors={sectors}
                selectedSectors={selectedSectors}
                onSectorClick={handleSectorClick}
                onDistrictDrillDown={handleDistrictDrillDown}
                isLoadingSectors={isLoadingSectors}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sector Picker Card - shows when drilling down into a district */}
          {expandedDistrict && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Sectors in {expandedDistrict}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSectors ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sectors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No sector boundary data available for {expandedDistrict}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      You can still assign the full district by selecting it
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Click sectors on the map to add them to your selection
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selected Districts Card - always visible */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Selected Districts
                <Badge variant="secondary">{selectedPostcodes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPostcodes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {expandedDistrict
                    ? 'Click "← Back to Districts" to select full districts'
                    : 'Click districts on the map to select them, or double-click to view sectors'
                  }
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedPostcodes.map(code => {
                    const postcode = postcodes.find(p => p.code === code);
                    const propertyCount = postcodeCounts[code];
                    const isLoading = loadingCounts.has(code);
                    const isPartial = postcode?.assignment_status === 'partial';
                    const isFull = postcode?.assignment_status === 'full';

                    return (
                      <div
                        key={code}
                        className={`p-3 border rounded-lg ${
                          isPartial ? 'border-amber-400 bg-amber-50' :
                          isFull ? 'border-green-400 bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{code}</p>
                              <Badge variant="outline" className="text-xs">Full</Badge>
                              {isPartial && postcode?.sector_count > 0 && (
                                <Badge variant="outline" className="text-xs bg-amber-100 border-amber-400 text-amber-700">
                                  {postcode.assigned_sector_count}/{postcode.sector_count} sectors
                                </Badge>
                              )}
                            </div>
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

          {/* Selected Sectors Card - always visible */}
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
                  {expandedDistrict
                    ? 'Click sectors on the map to select individual areas'
                    : 'Double-click a district to view and select individual sectors'
                  }
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedSectors.map(code => {
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
                              <Badge variant="outline" className="text-xs bg-green-100 border-green-400 text-green-700">
                                {parentDistrict}
                              </Badge>
                            </div>
                            {isLoading ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Counting properties...</span>
                              </div>
                            ) : propertyCount !== undefined ? (
                              <p className="text-sm font-semibold text-green-600">
                                {propertyCount.toLocaleString()} properties
                              </p>
                            ) : null}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSectorClick(code)}
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

          {/* Assign Full District Card - shows when expanded but no sectors selected */}
          {expandedDistrict && selectedSectors.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Full District</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Assign all {sectors.length} sectors in {expandedDistrict} at once
                  </p>
                  <p className="text-lg font-semibold">
                    Total: {postcodeCounts[expandedDistrict]?.toLocaleString() || '...'} properties
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
                  onClick={async () => {
                    if (!selectedAgentId || !expandedDistrict) return;
                    setIsAssigning(true);
                    try {
                      const agent = agents.find(a => a.id === selectedAgentId);
                      const agentName = agent?.profile
                        ? `${agent.profile.first_name} ${agent.profile.last_name}`
                        : agent?.subdomain || 'Agent';

                      const response = await fetch('/api/admin/territories/postcode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          agent_id: selectedAgentId,
                          postcode_code: expandedDistrict,
                          sector_codes: null, // Full district assignment
                        }),
                      });

                      const result = await response.json();
                      if (!response.ok) {
                        throw new Error(result.error?.message || 'Failed to assign district');
                      }

                      alert(
                        `✓ Full District Assigned Successfully!\n\n` +
                        `District: ${expandedDistrict}\n` +
                        `Agent: ${agentName}\n` +
                        `Sectors: All ${sectors.length} sectors\n\n` +
                        `The entire district has been assigned to the agent.`
                      );

                      // Refresh both territories and postcodes to update assignment statuses
                      await refreshTerritories();
                      await refreshPostcodes();

                      setExpandedDistrict(null);
                      setSectors([]);
                      setSelectedAgentId('');
                    } catch (error: any) {
                      console.error('Error assigning full district:', error);
                      alert(`Failed to assign district: ${error.message}`);
                    } finally {
                      setIsAssigning(false);
                    }
                  }}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Full District'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Or select individual sectors above to assign only specific areas
                </p>
              </CardContent>
            </Card>
          )}

          {/* Assign to Agent Card - shows when ANY selection exists (districts, sectors, or both) */}
          {(selectedPostcodes.length > 0 || selectedSectors.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Assign to Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {/* Show districts summary */}
                  {selectedPostcodes.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {selectedPostcodes.length} full district{selectedPostcodes.length > 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold text-blue-600">
                        {Object.entries(postcodeCounts)
                          .filter(([code]) => selectedPostcodes.includes(code))
                          .reduce((sum, [, count]) => sum + count, 0)
                          .toLocaleString()} props
                      </span>
                    </div>
                  )}
                  {/* Show sectors summary */}
                  {selectedSectors.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {selectedSectors.length} sector{selectedSectors.length > 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold text-green-600">
                        {Object.entries(sectorCounts)
                          .filter(([code]) => selectedSectors.includes(code))
                          .reduce((sum, [, count]) => sum + count, 0)
                          .toLocaleString()} props
                      </span>
                    </div>
                  )}
                  {/* Show combined total */}
                  {(selectedPostcodes.length > 0 || selectedSectors.length > 0) && (
                    <div className="pt-2 border-t">
                      <p className="text-lg font-semibold">
                        Total: {(
                          Object.entries(postcodeCounts)
                            .filter(([code]) => selectedPostcodes.includes(code))
                            .reduce((sum, [, count]) => sum + count, 0) +
                          Object.entries(sectorCounts)
                            .filter(([code]) => selectedSectors.includes(code))
                            .reduce((sum, [, count]) => sum + count, 0)
                        ).toLocaleString()} properties
                      </p>
                    </div>
                  )}
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
                  ) : selectedPostcodes.length > 0 && selectedSectors.length > 0 ? (
                    'Assign All Territories'
                  ) : selectedSectors.length > 0 ? (
                    'Assign Sectors'
                  ) : (
                    'Assign Districts'
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
