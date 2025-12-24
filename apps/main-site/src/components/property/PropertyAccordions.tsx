'use client'

import Image from 'next/image'
import { FileImage, Zap, BarChart3 } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { EpcDisplay } from '@/components/property/EpcChart'
import type { EPCData, EPCImage, UtilitiesData } from '@/lib/api/types'

interface PropertyAccordionsProps {
  floorPlanUrl?: string | null
  utilities?: UtilitiesData | null
  epc?: EPCData | null
  epcImages?: EPCImage[]
  propertyTitle: string
}

export function PropertyAccordions({
  floorPlanUrl,
  utilities,
  epc,
  epcImages,
  propertyTitle,
}: PropertyAccordionsProps) {
  // Check if we have any accordion content to show
  const hasFloorPlan = Boolean(floorPlanUrl)
  const hasUtilities = utilities && Object.values(utilities).some(Boolean)
  const hasEpcImages = epcImages && epcImages.length > 0
  const hasEpcData = epc && (epc.current_rating || epc.current_efficiency)
  const hasEpc = hasEpcImages || hasEpcData

  if (!hasFloorPlan && !hasUtilities && !hasEpc) {
    return null
  }

  return (
    <div className="mt-8">
      <Accordion type="single" collapsible className="w-full">
        {/* Floor Plan */}
        {hasFloorPlan && (
          <AccordionItem value="floor-plan">
            <AccordionTrigger>
              <span className="flex items-center gap-3">
                <FileImage className="h-5 w-5" strokeWidth={1.5} />
                Floor Plan
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={floorPlanUrl!}
                  alt={`${propertyTitle} floor plan`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Utilities, Rights & Restrictions */}
        {hasUtilities && (
          <AccordionItem value="utilities">
            <AccordionTrigger>
              <span className="flex items-center gap-3">
                <Zap className="h-5 w-5" strokeWidth={1.5} />
                Utilities, Rights & Restrictions
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 md:grid-cols-2">
                {utilities!.electricity && (
                  <UtilityItem label="Electricity" value={utilities!.electricity} />
                )}
                {utilities!.water && (
                  <UtilityItem label="Water" value={utilities!.water} />
                )}
                {utilities!.sewerage && (
                  <UtilityItem label="Sewerage" value={utilities!.sewerage} />
                )}
                {utilities!.heating && (
                  <UtilityItem label="Heating" value={utilities!.heating} />
                )}
                {utilities!.broadband && (
                  <UtilityItem label="Broadband" value={utilities!.broadband} />
                )}
                {utilities!.mobile_coverage && (
                  <UtilityItem label="Mobile Coverage" value={utilities!.mobile_coverage} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Energy Performance Certificate */}
        {hasEpc && (
          <AccordionItem value="epc">
            <AccordionTrigger>
              <span className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5" strokeWidth={1.5} />
                Energy Performance Certificate
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {/* Display EPC images from Apex27 if available */}
              {hasEpcImages ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {epcImages!.map((epcImage, index) => (
                    <div key={index} className="relative w-full">
                      <Image
                        src={epcImage.url}
                        alt={epcImage.caption || `${propertyTitle} EPC ${index + 1}`}
                        width={400}
                        height={600}
                        className="w-full h-auto object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Generate EPC charts from rating data */
                <EpcDisplay
                  currentEfficiency={epc!.current_efficiency}
                  potentialEfficiency={epc!.potential_efficiency}
                  currentEnvironmental={epc!.current_environmental}
                  potentialEnvironmental={epc!.potential_environmental}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

function UtilityItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-nest-gray pb-2">
      <span className="text-sm text-nest-brown">{label}</span>
      <span className="text-sm font-medium text-black">{value}</span>
    </div>
  )
}
