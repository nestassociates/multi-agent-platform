'use client';

import { useState } from 'react';
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
import { AlertTriangle, MapPin, Package } from 'lucide-react';

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
}

export interface TerritoryFormData {
  name: string;
  agent_id: string;
  boundary: any;
  description?: string;
}

export default function TerritoryForm({
  agents,
  drawnPolygon,
  onSubmit,
  onCancel,
}: TerritoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlaps, setOverlaps] = useState<any[]>([]);
  const [propertyCount, setPropertyCount] = useState<number | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TerritoryFormData>();

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

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="e.g., Covers city centre including Northern Quarter and Spinningfields"
              rows={3}
              disabled={!drawnPolygon}
            />
          </div>

          {/* Property Count Preview */}
          {propertyCount !== null && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Estimated Property Count</p>
              </div>
              <p className="text-2xl font-bold mt-2">{propertyCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                From OS Data Hub (residential properties in boundary)
              </p>
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
