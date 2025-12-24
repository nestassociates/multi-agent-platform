'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  propertyToSell: z.enum(['yes', 'no', '']).optional(),
  propertyToLet: z.enum(['yes', 'no', '']).optional(),
  honeypot: z.string().max(0), // Bot detection - must be empty
})

type FormData = z.infer<typeof formSchema>

interface ViewingRequestFormProps {
  agentId: string
  propertyId: string
  apex27ListingId?: string | null
  sourcePage: string
}

const DASHBOARD_API_URL = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || ''

export function ViewingRequestForm({
  agentId,
  propertyId,
  apex27ListingId,
  sourcePage,
}: ViewingRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      surname: '',
      email: '',
      phone: '',
      propertyToSell: '',
      propertyToLet: '',
      honeypot: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    // Bot detection
    if (data.honeypot) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Transform form data to API format
      const apiBody = {
        name: `${data.firstName} ${data.surname}`.trim(),
        email: data.email,
        phone: data.phone,
        agentId,
        propertyId,
        apex27ListingId: apex27ListingId || null,
        preferredTime: 'flexible',
        flexibleDates: true,
        buyerStatus: data.propertyToSell === 'yes' ? 'sold_stc' : 'looking',
        mortgageStatus: 'not_specified',
        additionalNotes: data.propertyToLet === 'yes' ? 'Also has property to let' : null,
        sourcePage,
        honeypot: '',
      }

      const response = await fetch(`${DASHBOARD_API_URL}/api/public/viewing-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to submit request')
      }

      setIsSuccess(true)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-nest-olive" />
        <h3 className="mt-4 text-lg font-medium uppercase tracking-nest text-black">
          Thank You
        </h3>
        <p className="mt-2 text-sm text-nest-brown">
          Your viewing request has been submitted. The agent will be in touch shortly.
        </p>
        <Button
          variant="outline"
          onClick={() => setIsSuccess(false)}
          className="mt-6"
        >
          Submit Another Request
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      {/* Honeypot field - hidden from users */}
      <input
        type="text"
        {...register('honeypot')}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-nest text-black">
            First Name *
          </Label>
          <Input
            id="firstName"
            {...register('firstName')}
            className="mt-2 h-12 border-0 bg-white text-base focus:ring-1 focus:ring-nest-olive"
            disabled={isSubmitting}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="surname" className="text-xs font-semibold uppercase tracking-nest text-black">
            Surname *
          </Label>
          <Input
            id="surname"
            {...register('surname')}
            className="mt-2 h-12 border-0 bg-white text-base focus:ring-1 focus:ring-nest-olive"
            disabled={isSubmitting}
          />
          {errors.surname && (
            <p className="mt-1 text-xs text-red-600">{errors.surname.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-nest text-black">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className="mt-2 h-12 border-0 bg-white text-base focus:ring-1 focus:ring-nest-olive"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-nest text-black">
            Contact Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            className="mt-2 h-12 border-0 bg-white text-base focus:ring-1 focus:ring-nest-olive"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="propertyToSell" className="text-xs font-semibold uppercase tracking-nest text-black">
            I Have a Property to Sell
          </Label>
          <select
            id="propertyToSell"
            {...register('propertyToSell')}
            className="mt-2 h-12 w-full border-0 bg-white px-4 text-base focus:outline-none focus:ring-1 focus:ring-nest-olive disabled:opacity-50"
            disabled={isSubmitting}
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <Label htmlFor="propertyToLet" className="text-xs font-semibold uppercase tracking-nest text-black">
            I Have a Property to Let
          </Label>
          <select
            id="propertyToLet"
            {...register('propertyToLet')}
            className="mt-2 h-12 w-full border-0 bg-white px-4 text-base focus:outline-none focus:ring-1 focus:ring-nest-olive disabled:opacity-50"
            disabled={isSubmitting}
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          type="submit"
          disabled={isSubmitting}
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Request Viewing'
          )}
        </Button>
      </div>
    </form>
  )
}
