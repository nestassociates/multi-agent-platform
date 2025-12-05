'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Settings, Shield, Cookie, Edit, MessageSquareWarning } from 'lucide-react';

interface GlobalContentItem {
  id: string;
  contentType: string;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

interface GlobalContentListProps {
  content: GlobalContentItem[];
}

const contentTypeConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  header: {
    label: 'Header',
    icon: Settings,
    description: 'Logo, navigation, and CTA button',
  },
  footer: {
    label: 'Footer',
    icon: Settings,
    description: 'Footer columns, contact info, and social links',
  },
  privacy_policy: {
    label: 'Privacy Policy',
    icon: Shield,
    description: 'Legal page for privacy information',
  },
  terms_of_service: {
    label: 'Terms of Service',
    icon: FileText,
    description: 'Legal page for terms and conditions',
  },
  cookie_policy: {
    label: 'Cookie Policy',
    icon: Cookie,
    description: 'Legal page for cookie usage',
  },
  complaints_procedure: {
    label: 'Complaints Procedure',
    icon: MessageSquareWarning,
    description: 'Legal page for complaints handling',
  },
};

export function GlobalContentList({ content }: GlobalContentListProps) {
  // Ensure all content types are represented, even if not in database
  const allTypes = ['header', 'footer', 'privacy_policy', 'terms_of_service', 'cookie_policy', 'complaints_procedure'];
  const contentMap = content.reduce((acc, item) => {
    acc[item.contentType] = item;
    return acc;
  }, {} as Record<string, GlobalContentItem>);

  const displayItems = allTypes.map((type) => ({
    contentType: type,
    item: contentMap[type] || null,
  }));

  if (displayItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No global content found</h3>
          <p className="text-muted-foreground">Global content will appear here once configured.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Site Content</CardTitle>
        <CardDescription>
          Manage header, footer, and legal pages that appear on all agent sites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map(({ contentType, item }) => {
              const config = contentTypeConfig[contentType];
              const Icon = config.icon;
              const hasUnpublishedChanges = item && item.publishedAt
                ? new Date(item.updatedAt) > new Date(item.publishedAt)
                : item && !item.isPublished;

              return (
                <TableRow key={contentType}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{config.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {config.description}
                  </TableCell>
                  <TableCell>
                    {!item ? (
                      <Badge variant="outline">Not Created</Badge>
                    ) : item.isPublished ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">Published</Badge>
                        {hasUnpublishedChanges && (
                          <Badge variant="secondary">Has Changes</Badge>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item ? new Date(item.updatedAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/global-content/${contentType}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default GlobalContentList;
