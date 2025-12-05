'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateAgentProfileSchema, type UpdateAgentProfileInput } from '@nest/validation';
import { Button } from '@nest/ui';
import type { Agent, Profile } from '@nest/shared-types';
import ProfilePreview from '@/components/agent/profile-preview';
import { Eye, CheckCircle2, Clock, Check, Plus, Trash2, Save } from 'lucide-react';

interface ProfileEditorProps {
  agent: Agent & { profile: Profile };
  isOnboarding?: boolean;
}

// Calculate profile completion matching the backend logic
// Note: Profile photo is managed by admin, not included in agent's required fields
function calculateCompletion(profile: Profile, agent: Agent, formBio: string, formQualifications: string[], formPhone: string) {
  const items = [
    {
      label: 'Full name',
      complete: !!(profile.first_name && profile.last_name),
      hint: 'Set by admin',
    },
    {
      label: 'Phone number',
      complete: !!(formPhone && formPhone.trim().length > 0),
      hint: 'Add your contact number',
    },
    {
      label: 'Bio (min 100 characters)',
      complete: formBio.length >= 100,
      hint: `${formBio.length}/100 characters`,
    },
    {
      label: 'At least 1 qualification',
      complete: formQualifications.filter(q => q.trim()).length > 0,
      hint: 'e.g., ARLA, NAEA, RICS',
    },
    {
      label: 'Subdomain',
      complete: !!agent.subdomain,
      hint: 'Set by admin',
    },
  ];

  const completed = items.filter(i => i.complete).length;
  const percentage = Math.round((completed / items.length) * 100);

  return { items, completed, total: items.length, percentage };
}

export default function ProfileEditor({ agent, isOnboarding = false }: ProfileEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [qualifications, setQualifications] = useState<string[]>(
    agent.qualifications?.length ? agent.qualifications : ['']
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
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

  const watchBio = watch('bio') || '';
  const watchPhone = watch('phone') || '';

  // Update form value when qualifications change
  useEffect(() => {
    setValue('qualifications', qualifications.filter(q => q.trim()));
  }, [qualifications, setValue]);

  // Calculate completion
  const completion = calculateCompletion(
    agent.profile,
    agent,
    watchBio,
    qualifications,
    watchPhone
  );

  const addQualification = () => {
    setQualifications([...qualifications, '']);
  };

  const removeQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const updateQualification = (index: number, value: string) => {
    const newQuals = [...qualifications];
    newQuals[index] = value;
    setQualifications(newQuals);
  };

  // Helper to clean social media links (remove empty values)
  const cleanSocialMediaLinks = (links?: Record<string, string>) => {
    if (!links) return {};
    return Object.fromEntries(
      Object.entries(links).filter(([_, url]) => url && url.trim())
    );
  };

  // Save draft - saves current form data without validation requirements
  const saveDraft = async () => {
    setIsSavingDraft(true);
    setError('');
    setSuccess(false);

    try {
      const data = getValues();
      // Clean up empty social media links before saving
      const cleanedData = {
        ...data,
        social_media_links: cleanSocialMediaLinks(data.social_media_links),
      };
      const response = await fetch('/api/agent/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to save draft');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data: UpdateAgentProfileInput) => {
    console.log('Form submitting with data:', data);
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // Clean up empty social media links before saving
      const cleanedData = {
        ...data,
        social_media_links: cleanSocialMediaLinks(data.social_media_links),
      };
      const response = await fetch('/api/agent/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update profile');
      }

      // Check if status changed to pending_admin (profile complete)
      if (isOnboarding && result.profileCompletion?.statusChanged) {
        setOnboardingComplete(true);
      } else if (isOnboarding) {
        // Profile saved but not complete yet
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show onboarding complete message instead of form
  if (onboardingComplete) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Submitted!</h2>
        <p className="text-gray-600 mb-6">
          Your profile has been submitted for review. An admin will review your details
          and activate your microsite shortly.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">What happens next?</p>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• An admin will review your profile</li>
                <li>• You&apos;ll receive an email when approved</li>
                <li>• Your microsite will go live automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log('Form validation failed:', errors);
      })} className="space-y-6 flex-1 max-w-2xl">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800" role="alert">
            Profile saved successfully!
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
            Phone Number {isOnboarding && <span className="text-red-500">*</span>}
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
            Bio {isOnboarding && <span className="text-red-500">*</span>}
          </label>
          <textarea
            {...register('bio')}
            rows={6}
            placeholder="Tell visitors about your experience, qualifications, and expertise. Include your background in real estate, areas you specialize in, and what makes you the right choice for buyers and sellers..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
          <div className="mt-1 flex justify-between">
            <p className={`text-xs ${watchBio.length >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {watchBio.length}/100 characters minimum {watchBio.length >= 100 && <Check className="inline h-3 w-3" />}
            </p>
            <p className="text-xs text-gray-500">Max 5,000 characters</p>
          </div>
          {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
        </div>

        {/* Qualifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qualifications {isOnboarding && <span className="text-red-500">*</span>}
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Add your professional qualifications (e.g., ARLA, NAEA, RICS, Registered Valuer)
          </p>
          <div className="space-y-2">
            {qualifications.map((qual, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={qual}
                  onChange={(e) => updateQualification(index, e.target.value)}
                  placeholder="e.g., ARLA Propertymark"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
                {qualifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQualification(index)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addQualification}
            className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add another qualification
          </button>
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Social Media Links (Optional)</label>

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
              Twitter / X
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

        {/* Submit Buttons */}
        <div className="pt-4 border-t flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          {/* Save Draft button - always available during onboarding */}
          {isOnboarding && (
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={isSavingDraft || isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || isSavingDraft || (isOnboarding && completion.percentage < 100)}
          >
            {isSubmitting
              ? 'Submitting...'
              : isOnboarding
                ? completion.percentage === 100
                  ? 'Submit Profile for Review'
                  : 'Complete Required Fields First'
                : 'Save Profile'
            }
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

      {/* Completion Checklist Sidebar - Only show during onboarding */}
      {isOnboarding && (
        <div className="w-72 flex-shrink-0">
          <div className="sticky top-4 bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Profile Completion</h3>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{completion.completed}/{completion.total} complete</span>
                <span className={completion.percentage === 100 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  {completion.percentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    completion.percentage === 100 ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <ul className="space-y-3">
              {completion.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className={`mt-0.5 flex-shrink-0 ${item.complete ? 'text-green-500' : 'text-gray-300'}`}>
                    {item.complete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-current" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm ${item.complete ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {item.label}
                    </p>
                    {!item.complete && (
                      <p className="text-xs text-gray-500">{item.hint}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {completion.percentage === 100 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium">
                  Ready to submit!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Click the button below to submit your profile for admin review.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
