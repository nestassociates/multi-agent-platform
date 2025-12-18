import { useState, type FormEvent } from 'react';
import { trackViewingRequest } from '../lib/analytics';

/**
 * Viewing Request Form Component
 * Collects visitor information and viewing preferences for property viewings
 * Submits to /api/public/viewing-request endpoint
 * GA4: Tracks generate_lead event on successful submission
 */

// Options matching the validation schema
const buyerStatusOptions = [
  { value: 'ftb', label: 'First Time Buyer' },
  { value: 'chain_free', label: 'Chain Free' },
  { value: 'has_chain', label: 'Has Property to Sell' },
  { value: 'investor', label: 'Investor' },
  { value: 'cash_buyer', label: 'Cash Buyer' },
  { value: 'not_specified', label: 'Prefer not to say' },
];

const mortgageStatusOptions = [
  { value: 'approved', label: 'Mortgage Approved' },
  { value: 'in_principle', label: 'Agreement in Principle' },
  { value: 'not_started', label: 'Not Yet Applied' },
  { value: 'cash_buyer', label: 'Cash Buyer' },
  { value: 'not_specified', label: 'Prefer not to say' },
];

const preferredTimeOptions = [
  { value: 'morning', label: 'Morning (9am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
  { value: 'evening', label: 'Evening (5pm - 8pm)' },
  { value: 'flexible', label: 'Flexible / Any time' },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  flexibleDates: boolean;
  buyerStatus: string;
  mortgageStatus: string;
  additionalNotes: string;
  honeypot: string;
}

interface FormState {
  status: 'idle' | 'submitting' | 'success' | 'error' | 'rate_limited';
  message: string;
  resetAt?: number;
}

interface ViewingRequestFormProps {
  agentId: string;
  propertyId?: string;
  apex27ListingId?: string;
  propertyAddress?: string;
  apiUrl: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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

export default function ViewingRequestForm({
  agentId,
  propertyId,
  apex27ListingId,
  propertyAddress,
  apiUrl,
  onSuccess,
  onCancel,
}: ViewingRequestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: 'flexible',
    flexibleDates: true,
    buyerStatus: 'not_specified',
    mortgageStatus: 'not_specified',
    additionalNotes: '',
    honeypot: '',
  });

  const [formState, setFormState] = useState<FormState>({
    status: 'idle',
    message: '',
  });

  // Get tomorrow's date for min date picker value
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState({ status: 'submitting', message: '' });

    try {
      const response = await fetch(`${apiUrl}/api/public/viewing-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          propertyId,
          apex27ListingId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          preferredDate: formData.preferredDate || undefined,
          preferredTime: formData.preferredTime,
          flexibleDates: formData.flexibleDates,
          buyerStatus: formData.buyerStatus,
          mortgageStatus: formData.mortgageStatus,
          additionalNotes: formData.additionalNotes || undefined,
          sourcePage: window.location.pathname,
          honeypot: formData.honeypot,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        const resetAt = data.error?.resetAt || Date.now() + 60 * 60 * 1000;
        setFormState({
          status: 'rate_limited',
          message: `Too many submissions. Please try again in ${formatTimeRemaining(resetAt)}.`,
          resetAt,
        });
        return;
      }

      if (!response.ok) {
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
            message: data.error?.message || 'Failed to submit request. Please try again.',
          });
        }
        return;
      }

      setFormState({
        status: 'success',
        message:
          data.message ||
          'Thank you! Your viewing request has been sent. The agent will be in touch shortly.',
      });

      // Track successful lead generation in GA4
      if (propertyId && propertyAddress) {
        trackViewingRequest(propertyId, propertyAddress);
      }

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch {
      setFormState({
        status: 'error',
        message:
          'Sorry, there was an error submitting your request. Please try again or contact the agent directly.',
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isDisabled = formState.status === 'submitting' || formState.status === 'rate_limited';
  const showSuccess = formState.status === 'success';

  if (showSuccess) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Sent!</h3>
        <p className="text-gray-600">{formState.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Property Info (if provided) */}
      {propertyAddress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700 font-medium">Requesting viewing for:</p>
          <p className="text-blue-900 font-semibold">{propertyAddress}</p>
        </div>
      )}

      {/* Honeypot field - hidden from users, catches bots */}
      <input
        type="text"
        name="honeypot"
        value={formData.honeypot}
        onChange={handleChange}
        className="absolute -left-[9999px]"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Contact Details Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isDisabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-gray-900 bg-white"
              placeholder="John Smith"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isDisabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-gray-900 bg-white"
              placeholder="john@example.com"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-gray-500 font-normal">(recommended)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={isDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-gray-900 bg-white"
            placeholder="07123 456789"
          />
        </div>
      </div>

      {/* Viewing Preferences Section */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Viewing Preferences
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preferred Date */}
          <div>
            <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date
            </label>
            <input
              type="date"
              id="preferredDate"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              min={minDate}
              disabled={isDisabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-gray-900 bg-white"
            />
          </div>

          {/* Preferred Time */}
          <div>
            <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Time
            </label>
            <select
              id="preferredTime"
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              disabled={isDisabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-gray-900 bg-white"
            >
              {preferredTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Flexible Dates */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            name="flexibleDates"
            checked={formData.flexibleDates}
            onChange={handleChange}
            disabled={isDisabled}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-gray-700">I&apos;m flexible on dates</span>
        </label>
      </div>

      {/* Buyer Information Section */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Your Situation <span className="text-gray-500 font-normal">(optional)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buyer Status */}
          <div>
            <label htmlFor="buyerStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Your Position
            </label>
            <select
              id="buyerStatus"
              name="buyerStatus"
              value={formData.buyerStatus}
              onChange={handleChange}
              disabled={isDisabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-gray-900 bg-white"
            >
              {buyerStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mortgage Status */}
          <div>
            <label htmlFor="mortgageStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Mortgage Status
            </label>
            <select
              id="mortgageStatus"
              name="mortgageStatus"
              value={formData.mortgageStatus}
              onChange={handleChange}
              disabled={isDisabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-gray-900 bg-white"
            >
              {mortgageStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="pt-4 border-t">
        <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="additionalNotes"
          name="additionalNotes"
          value={formData.additionalNotes}
          onChange={handleChange}
          rows={3}
          disabled={isDisabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm text-gray-900 bg-white"
          placeholder="Any questions or specific requirements..."
        />
      </div>

      {/* Error/Rate Limit Messages */}
      {(formState.status === 'error' || formState.status === 'rate_limited') && (
        <div
          className={`p-3 rounded-lg text-sm ${
            formState.status === 'rate_limited'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-start">
            {formState.status === 'rate_limited' ? (
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5"
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
              <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <p>{formState.message}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={formState.status === 'submitting'}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isDisabled}
          className={`${onCancel ? 'flex-1' : 'w-full'} bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          {formState.status === 'submitting' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
              Submitting...
            </>
          ) : formState.status === 'rate_limited' ? (
            'Please wait...'
          ) : (
            'Request Viewing'
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">* Required fields</p>
    </form>
  );
}
