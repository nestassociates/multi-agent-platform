'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  agent: {
    bio: string | null;
    qualifications: string[];
    social_media_links: any;
    subdomain: string;
  };
}

const SOCIAL_ICONS: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
};

export default function ProfilePreview({ isOpen, onClose, profile, agent }: Props) {
  const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
  const fullName = `${profile.first_name} ${profile.last_name}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Preview</DialogTitle>
          <DialogDescription>
            This is how your profile will appear on your agent microsite
          </DialogDescription>
        </DialogHeader>

        {/* Preview Card - Mimics agent website design */}
        <Card className="border-2">
          <CardContent className="p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Avatar className="h-32 w-32 border-4 border-primary/10">
                <AvatarImage src={profile.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">{fullName}</h2>
                <p className="text-muted-foreground mb-4">Real Estate Agent</p>

                {/* Contact Info */}
                <div className="flex flex-col gap-2 mb-4">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-2 text-sm hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </a>
                  )}
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </a>
                </div>

                {/* Qualifications */}
                {agent.qualifications && agent.qualifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {agent.qualifications.map((qual, index) => (
                      <Badge key={index} variant="secondary">
                        {qual}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bio Section */}
            {agent.bio && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">About Me</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {agent.bio}
                </p>
              </div>
            )}

            {/* Social Media Links */}
            {agent.social_media_links && Object.keys(agent.social_media_links).length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Connect With Me</h3>
                <div className="flex gap-4">
                  {Object.entries(agent.social_media_links).map(([platform, url]) => {
                    const Icon = SOCIAL_ICONS[platform.toLowerCase()];
                    const urlString = String(url);
                    return (
                      <a
                        key={platform}
                        href={urlString}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="capitalize">{platform}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Website URL */}
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Your microsite: {' '}
                <a
                  href={`https://${agent.subdomain}.nestassociates.co.uk`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {agent.subdomain}.nestassociates.co.uk
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground text-center">
          💡 This preview shows how your profile section will look on your agent website
        </div>
      </DialogContent>
    </Dialog>
  );
}
