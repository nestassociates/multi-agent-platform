'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// Schema for editing agent (email and subdomain are read-only)
const editAgentSchema = z.object({
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  apex27_branch_id: z.string().optional(),
});

type EditAgentInput = z.infer<typeof editAgentSchema>;

interface EditAgentModalProps {
  agent: {
    id: string;
    subdomain: string;
    apex27_branch_id: string | null;
    bio: string | null;
    profile?: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAgentModal({ agent, open, onOpenChange }: EditAgentModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditAgentInput>({
    resolver: zodResolver(editAgentSchema),
    defaultValues: {
      phone: agent.profile?.phone || '',
      bio: agent.bio || '',
      apex27_branch_id: agent.apex27_branch_id || '',
    },
  });

  const onSubmit = async (data: EditAgentInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/agents/${agent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update agent');
      }

      // Success - close modal and refresh
      onOpenChange(false);
      router.refresh();
      reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setError(null);
      reset();
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>
            Update agent information. Note: Email and subdomain cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name (Read-only)</Label>
              <Input
                value={agent.profile?.first_name}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Last Name (Read-only)</Label>
              <Input
                value={agent.profile?.last_name}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label>Email (Read-only)</Label>
            <Input
              value={agent.profile?.email}
              disabled
              className="bg-muted"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Email cannot be changed after account creation
            </p>
          </div>

          <div>
            <Label>Subdomain (Read-only)</Label>
            <div className="flex items-center">
              <Input
                value={agent.subdomain}
                disabled
                className="bg-muted rounded-r-none"
              />
              <span className="rounded-r-md border border-l-0 bg-muted px-3 py-2 text-sm text-muted-foreground">
                .agents.nestassociates.com
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Subdomain cannot be changed after account creation
            </p>
          </div>

          {/* Editable fields */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              {...register('phone')}
              id="phone"
              type="tel"
              placeholder="07700 900000"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="apex27_branch_id">Apex27 Branch ID</Label>
            <Input
              {...register('apex27_branch_id')}
              id="apex27_branch_id"
              placeholder="1962"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Link this agent to an Apex27 branch for property sync
            </p>
            {errors.apex27_branch_id && (
              <p className="mt-1 text-sm text-destructive">{errors.apex27_branch_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              {...register('bio')}
              id="bio"
              rows={4}
              placeholder="Professional background and experience..."
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum 500 characters
            </p>
            {errors.bio && (
              <p className="mt-1 text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditAgentModal;
