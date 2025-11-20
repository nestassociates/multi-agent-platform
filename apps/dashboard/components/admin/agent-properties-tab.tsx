'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Home, ExternalLink, Loader2 } from 'lucide-react';

interface Property {
  id: string;
  apex27_id: string;
  title: string;
  address: any; // JSONB
  postcode: string;
  transaction_type: string;
  property_type: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentPropertiesTabProps {
  agentId: string;
}

export function AgentPropertiesTab({ agentId }: AgentPropertiesTabProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/agents/${agentId}/properties`);

        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const data = await response.json();
        setProperties(data.properties || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProperties();
  }, [agentId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-destructive">Error loading properties: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No properties</h3>
            <p className="text-sm text-muted-foreground">
              This agent doesn't have any properties assigned yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Beds/Baths</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="font-medium">{property.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {property.postcode || 'ID: ' + property.apex27_id}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <Badge variant="outline" className="capitalize">
                      {property.transaction_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">
                    {property.property_type}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(property.price)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {property.bedrooms || '—'} / {property.bathrooms || '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={property.status === 'active' ? 'default' : 'secondary'}
                  >
                    {property.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`https://www.apex27.co.uk/property/${property.apex27_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default AgentPropertiesTab;
