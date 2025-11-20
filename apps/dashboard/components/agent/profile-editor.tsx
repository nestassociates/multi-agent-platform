'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateAgentProfileSchema, type UpdateAgentProfileInput } from '@nest/validation';
import { Button } from '@nest/ui';
import type { Agent, Profile } from '@nest/shared-types';
import ProfilePreview from '@/components/agent/profile-preview';
import { Eye } from 'lucide-react';

interface ProfileEditorProps {
  agent: Agent & { profile: Profile };
}

export default function ProfileEditor({ agent }: ProfileEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateAgentProfileInput>({
    resolver: zodResolver(updateAgentProfileSchema),
    defaultValues: {
      phone: agent.profile.phone || '',
      bio: agent.bio || '',
      qualifications: agent.qualifications || [],
      social_media_links: agent.social_media_links || {},
    },
  });

  const onSubmit = async (data: UpdateAgentProfileInput) => {
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/agent/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update profile');
      }

      setSuccess(true);
      router.refresh();
      
      // Show success message for 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800" role="alert">
          Profile updated successfully! Your site will be rebuilt shortly.
        </div>
      )}

      {/* First Name (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">First Name</label>
        <input
          type="text"
          value={agent.profile.first_name}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">Contact admin to change</p>
      </div>

      {/* Last Name (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Last Name</label>
        <input
          type="text"
          value={agent.profile.last_name}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">Contact admin to change</p>
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          {...register('phone')}
          type="tel"
          placeholder="07700 900000"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          {...register('bio')}
          rows={6}
          placeholder="Tell visitors about your experience, qualifications, and expertise..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-gray-500">Max 1,000 words</p>
        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
      </div>

      {/* Qualifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
        <p className="text-xs text-gray-500 mb-2">
          Enter your professional qualifications (e.g., ARLA, NAEA, Registered Valuer)
        </p>
        {/* TODO: Implement dynamic array input for qualifications in Phase 3+ */}
        <input
          type="text"
          placeholder="Comma-separated qualifications"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">Dynamic qualification management coming soon</p>
      </div>

      {/* Social Media Links */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Social Media Links</label>

        <div>
          <label htmlFor="facebook" className="block text-xs text-gray-600 mb-1">
            Facebook
          </label>
          <input
            {...register('social_media_links.facebook')}
            type="url"
            placeholder="https://facebook.com/yourprofile"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="twitter" className="block text-xs text-gray-600 mb-1">
            Twitter
          </label>
          <input
            {...register('social_media_links.twitter')}
            type="url"
            placeholder="https://twitter.com/yourprofile"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="linkedin" className="block text-xs text-gray-600 mb-1">
            LinkedIn
          </label>
          <input
            {...register('social_media_links.linkedin')}
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="instagram" className="block text-xs text-gray-600 mb-1">
            Instagram
          </label>
          <input
            {...register('social_media_links.instagram')}
            type="url"
            placeholder="https://instagram.com/yourprofile"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsPreviewOpen(true)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      {/* Preview Modal */}
      <ProfilePreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        profile={agent.profile}
        agent={agent}
      />
    </form>
  );
}
