'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Calendar, Globe, Building2 } from 'lucide-react';

interface AgentOverviewProps {
  agent: {
    id: string;
    subdomain: string;
    apex27_branch_id: string | null;
    bio: string | null;
    status: string;
    created_at: string;
    qualifications?: string[];
    social_media_links?: Record<string, string>;
    profile?: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
      avatar_url: string | null;
    };
  };
  stats?: {
    contentCount: number;
    propertiesCount: number;
    lastBuildDate: string | null;
  };
}

export function AgentOverview({ agent, stats }: AgentOverviewProps) {
  const fullName = `${agent.profile?.first_name} ${agent.profile?.last_name}`;
  const initials = `${agent.profile?.first_name?.[0]}${agent.profile?.last_name?.[0]}`.toUpperCase();
  const micrositeUrl = `https://${agent.subdomain}.agents.nestassociates.com`;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Basic information about this agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={agent.profile?.avatar_url || undefined} alt={fullName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{fullName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      agent.status === 'active'
                        ? 'default'
                        : agent.status === 'inactive'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {agent.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${agent.profile?.email}`} className="text-primary hover:underline">
                    {agent.profile?.email}
                  </a>
                </div>
                {agent.profile?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${agent.profile.phone}`} className="text-primary hover:underline">
                      {agent.profile.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={micrositeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {agent.subdomain}.agents.nestassociates.com
                  </a>
                </div>
                {agent.apex27_branch_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Branch ID: {agent.apex27_branch_id}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined {new Date(agent.created_at).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Published content pieces</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.propertiesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Active property listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last Build</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastBuildDate
                  ? new Date(stats.lastBuildDate).toLocaleDateString('en-GB')
                  : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Site deployment date</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bio */}
      {agent.bio && (
        <Card>
          <CardHeader>
            <CardTitle>Biography</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed">{agent.bio}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Qualifications */}
      {agent.qualifications && agent.qualifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {agent.qualifications.map((qual, index) => (
                <li key={index} className="text-sm">
                  {qual}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Social Media Links */}
      {agent.social_media_links && Object.keys(agent.social_media_links).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(agent.social_media_links).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  <span className="capitalize">{platform}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AgentOverview;
