import { useState, type FormEvent } from 'react';
import { trackContactFormSubmit } from '../lib/analytics';

/**
 * Contact Form Component
 * T032: Enhanced error handling for rate limit messages with retry time
 * GA4: Tracks generate_lead event on successful submission
 */

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

interface FormState {
  status: 'idle' | 'submitting' | 'success' | 'error' | 'rate_limited';
  message: string;
  rateLimitInfo?: RateLimitInfo;
}

/**
 * Format time remaining until rate limit reset (T033)
 */
function formatTimeRemaining(resetAt: number): string {
  const now = Date.now();
  const diffMs = resetAt - now;

  if (diffMs <= 0) return 'now';

  const diffMinutes = Math.ceil(diffMs / (60 * 1000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  }

  const diffHours = Math.ceil(diffMinutes / 60);
  return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
}

interface ContactFormProps {
  agentId?: string;
  agentName?: string;
}

export default function ContactForm({ agentId, agentName }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [formState, setFormState] = useState<FormState>({
    status: 'idle',
    message: '',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState({ status: 'submitting', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Handle rate limiting (429)
      if (response.status === 429) {
        const resetAt = data.error?.resetAt || (Date.now() + 60 * 60 * 1000);
        const remaining = data.error?.remaining ?? 0;

        setFormState({
          status: 'rate_limited',
          message: `Too many submissions. Please try again in ${formatTimeRemaining(resetAt)}.`,
          rateLimitInfo: { remaining, resetAt },
        });
        return;
      }

      if (!response.ok) {
        // Handle validation errors
        if (data.error?.code === 'VALIDATION_ERROR') {
          const fieldError = data.error.details?.field
            ? `${data.error.details.field}: ${data.error.details.reason}`
            : data.error.message;
          setFormState({
            status: 'error',
            message: fieldError || 'Please check your form inputs and try again.',
          });
        } else {
          setFormState({
            status: 'error',
            message: data.error?.message || 'Failed to send message. Please try again.',
          });
        }
        return;
      }

      setFormState({
        status: 'success',
        message: data.message || 'Thank you! Your message has been sent successfully. I will get back to you soon.',
      });

      // Track successful lead generation in GA4
      trackContactFormSubmit();

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch {
      setFormState({
        status: 'error',
        message: 'Sorry, there was an error sending your message. Please try again or contact me directly.',
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isDisabled = formState.status === 'submitting' || formState.status === 'rate_limited';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="John Smith"
          disabled={isDisabled}
        />
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="john@example.com"
          disabled={isDisabled}
        />
      </div>

      {/* Phone Field */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="020 7123 4567"
          disabled={isDisabled}
        />
      </div>

      {/* Message Field */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Tell me about your property requirements..."
          disabled={isDisabled}
        />
      </div>

      {/* Status Messages */}
      {formState.message && (
        <div
          className={`p-4 rounded-lg ${
            formState.status === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : formState.status === 'rate_limited'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-start">
            {formState.status === 'success' ? (
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : formState.status === 'rate_limited' ? (
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <div>
              <p className="text-sm">{formState.message}</p>
              {formState.rateLimitInfo && formState.rateLimitInfo.remaining > 0 && (
                <p className="mt-1 text-xs opacity-75">
                  {formState.rateLimitInfo.remaining} submission{formState.rateLimitInfo.remaining === 1 ? '' : 's'} remaining
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isDisabled}
        className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {formState.status === 'submitting' ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sending...
          </>
        ) : formState.status === 'rate_limited' ? (
          'Please wait...'
        ) : (
          'Send Message'
        )}
      </button>

      <p className="text-sm text-gray-600 text-center">
        * Required fields
      </p>
    </form>
  );
}
