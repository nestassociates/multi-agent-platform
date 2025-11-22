'use client';

import { useState } from 'react';
import PostcodeMap from '@/components/admin/postcode-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  postcodes: any[];
  agents: any[];
}

export default function PostcodePageClient({ postcodes, agents }: Props) {
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);

  const handlePostcodeClick = (postcodeCode: string) => {
    setSelectedPostcodes(prev => {
      if (prev.includes(postcodeCode)) {
        // Deselect
        return prev.filter(code => code !== postcodeCode);
      } else {
        // Select
        return [...prev, postcodeCode];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedPostcodes([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Postcode-Based Territories</h1>
          <p className="text-muted-foreground">
            Click postcodes on the map to select ({selectedPostcodes.length} selected)
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
                    return (
                      <div key={code} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{code}</p>
                            <p className="text-xs text-muted-foreground">
                              {postcode?.area_km2 ? `${parseFloat(postcode.area_km2).toFixed(2)} km²` : ''}
                            </p>
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
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Select an agent to assign these {selectedPostcodes.length} postcodes
                </p>
                {agents.map(agent => (
                  <Button key={agent.id} variant="outline" className="w-full mb-2">
                    {agent.profile?.first_name} {agent.profile?.last_name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
