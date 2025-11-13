'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, TrendingUp } from 'lucide-react';

interface AgentAnalyticsTabProps {
  agentId: string;
}

export function AgentAnalyticsTab({ agentId }: AgentAnalyticsTabProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <BarChart className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Analytics Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Agent analytics including traffic statistics, property views, and lead sources will be
            available in a future update.
          </p>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-left text-sm">
                <p className="font-medium mb-1">Planned Features:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Page views and unique visitors</li>
                  <li>• Property view tracking</li>
                  <li>• Lead source analysis</li>
                  <li>• Conversion tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentAnalyticsTab;
