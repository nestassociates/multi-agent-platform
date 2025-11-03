/**
 * Type definitions for Apex27 Main API responses
 * Based on actual API response from GET /listings
 */

export interface Apex27Branch {
  id: number;
  name: string;
  code: string;
  address1: string;
  address2: string | null;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  phone: string;
  fax: string | null;
  email: string;
  hasSales: boolean;
  hasLettings: boolean;
  hasNewHomes: boolean;
  hasLand: boolean;
  hasAuctions: boolean;
  hasParkHomes: boolean;
  hasCommercialSales: boolean;
  hasCommercialLettings: boolean;
  dtsUpdated: string;
  updateMd5Hash: string;
}

export interface Apex27User {
  id: number;
  email: string;
  title: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isCallRecordingsEnabled: boolean;
  isCallTranscriptionsEnabled: boolean;
  dtsUpdated: string;
  updateMd5Hash: string;
}

export interface Apex27Geolocation {
  latitude: number | null;
  longitude: number | null;
}

export interface Apex27POV {
  latitude: number;
  longitude: number;
  pitch: number;
  heading: number;
  zoom: number;
}

export interface Apex27Flags {
  hasElectricity: boolean | null;
  hasFibreOptic: boolean | null;
  hasGas: boolean | null;
  hasSatelliteCableTv: boolean | null;
  hasTelephone: boolean | null;
  hasWater: boolean | null;
  isAuction: boolean | null;
  isArticle4Area: boolean | null;
  isListed: boolean | null;
  hasRestrictions: boolean | null;
  hasRequiredAccess: boolean | null;
  hasRightsOfWay: boolean | null;
  hasFloodedInLastFiveYears: boolean | null;
  hasFloodDefenses: boolean | null;
}

export interface Apex27ResidentialFlags {
  hasAccessibilityFeatures: boolean | null;
  hasBasement: boolean | null;
  hasConservatory: boolean | null;
  hasDoubleGlazing: boolean | null;
  hasFireplace: boolean | null;
  hasGym: boolean | null;
  hasLoft: boolean | null;
  hasOutbuildings: boolean | null;
  hasPorterSecurity: boolean | null;
  hasSwimmingPool: boolean | null;
  hasTennisCourt: boolean | null;
  hasUtilityRoom: boolean | null;
  hasWaterfront: boolean | null;
  hasWoodFloors: boolean | null;
  isSharedAccommodation: boolean | null;
}

export interface Apex27SaleFlags {
  isChainFree: boolean | null;
  isNewHome: boolean | null;
  isRepossession: boolean | null;
  isRetirement: boolean | null;
  hasEquityLoanIncentive: boolean | null;
  hasHelpToBuyIncentive: boolean | null;
  hasMiNewHomeIncentive: boolean | null;
  hasNewBuyIncentive: boolean | null;
  hasPartBuyPartRentIncentive: boolean | null;
  hasSharedEquityIncentive: boolean | null;
  hasSharedOwnershipIncentive: boolean | null;
  developmentOpportunity: boolean | null;
  investmentOpportunity: boolean | null;
}

export interface Apex27RentalFlags {
  petsAllowed: boolean | null;
  smokersConsidered: boolean | null;
  sharersConsidered: boolean | null;
  hasBurglarAlarm: boolean | null;
  hasWashingMachine: boolean | null;
  hasDishwasher: boolean | null;
  allBillsIncluded: boolean | null;
  waterBillIncluded: boolean | null;
  gasBillIncluded: boolean | null;
  electricityBillIncluded: boolean | null;
  oilBillIncluded: boolean | null;
  councilTaxIncluded: boolean | null;
  councilTaxExempt: boolean | null;
  tvLicenceIncluded: boolean | null;
  satelliteCableTvBillIncluded: boolean | null;
  internetBillIncluded: boolean | null;
  telephoneBillIncluded: boolean | null;
  isTenanted: boolean | null;
  isServiced: boolean | null;
  isStudentProperty: boolean | null;
}

export interface Apex27CommercialFlags {
  businessForSale: boolean | null;
}

export interface Apex27Listing {
  id: number;
  externalId: string | null;
  branch: Apex27Branch;
  user: Apex27User;
  archived: boolean;
  reference: string;
  fullReference: string;
  address1: string;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  city: string;
  county: string | null;
  postalCode: string;
  country: string;
  displayAddress: string;
  locationType: string | null;
  summary: string | null;
  printSummary: string | null;
  incomeDescription: string | null;
  description: string | null;
  customDescription1: string | null;
  customDescription2: string | null;
  customDescription3: string | null;
  customDescription4: string | null;
  customDescription5: string | null;
  customDescription6: string | null;
  bullets: string[];
  priceCurrency: string;
  price: string;
  pricePrefix: string | null;
  tenure: string | null;
  rentFrequency: string | null;
  minimumTermMonths: number | null;
  transactionType: 'sale' | 'rental';
  status: string;
  websiteStatus: string | null;
  mainSearchRegionId: number | null;
  saleProgression: string | null;
  propertyType: string;
  displayPropertyType: string | null;
  propertySubType: string | null;
  tenancyType: string | null;
  bedrooms: number;
  bathrooms: number;
  receptions: number | null;
  ensuites: number | null;
  toilets: number | null;
  kitchens: number | null;
  diningRooms: number | null;
  garages: number | null;
  parkingSpaces: number | null;
  yearBuilt: number | null;
  condition: string | null;
  ageCategory: string | null;
  furnished: string | null;
  commercialUseClasses: string[];
  accessibilityFeatures: string[];
  heatingFeatures: string[];
  parkingFeatures: string[];
  outsideSpaceFeatures: string[];
  waterSupplyFeatures: string[];
  electricitySupplyFeatures: string[];
  sewerageSupplyFeatures: string[];
  broadbandSupplyFeatures: string[];
  floodSources: string[];
  customFeatures: string[];
  internalArea: number | null;
  internalAreaUnit: string;
  externalArea: number | null;
  externalAreaUnit: string;
  floors: number | null;
  entranceFloor: number | null;
  floorNumber: number | null;
  levelsOccupied: number | null;
  latitude: number | null;
  longitude: number | null;
  uprn: string | null;
  grossYield: string | null;
  totalIncomeText: string | null;
  featured: boolean;
  unlisted: boolean;
  rentService: number | null;
  saleFee: number;
  saleFeeType: number;
  saleFeePayableBy: number;
  saleFeeNotes: string | null;
  councilTaxAmount: number | null;
  councilTaxBand: string | null;
  domesticRatesAmount: number | null;
  serviceChargeAmount: number | null;
  serviceChargeDescription: string | null;
  groundRentAmount: number | null;
  groundRentDescription: string | null;
  groundRentReviewPeriod: string | null;
  groundRentPercentageIncrease: number | null;
  insuranceDescription: string | null;
  termsOfBusiness: string | null;
  dateLeaseStart: string | null;
  leaseYearsRemaining: number | null;
  leaseDuration: number | null;
  dateOfInstruction: string | null;
  dateAvailableFrom: string | null;
  feeType: string | null;
  lettingFees: string | null;
  epcExempt: boolean;
  epcEeCurrent: number | null;
  epcEePotential: number | null;
  epcEiCurrent: number | null;
  epcEiPotential: number | null;
  epcArCurrent: number | null;
  dtsEpcExpiry: string | null;
  epcReference: string | null;
  epcNotes: string | null;
  showPrice: boolean;
  exportable: boolean;
  matchable: boolean;
  dtsCreated: string;
  dtsUpdated: string;
  dtsWithdrawn: string | null;
  dtsArchived: string | null;
  dtsGoLive: string | null;
  dtsMarketed: string | null;
  dtsRemarketed: string | null;
  updateMd5Hash: string;
  flags: Apex27Flags;
  residentialFlags: Apex27ResidentialFlags;
  saleFlags: Apex27SaleFlags;
  rentalFlags: Apex27RentalFlags;
  commercialFlags: Apex27CommercialFlags;
  sale: any | null;
  upsellNames: string[];
  matchingSearchRegions: string[];
  metadata: any[];
  pov?: Apex27POV;
}

export interface Apex27WebhookPayload {
  action: 'create' | 'update' | 'delete';
  listing: Apex27Listing;
}

export interface Apex27ListingsResponse {
  data: Apex27Listing[];
  totalCount: number;
  page: number;
  pageSize: number;
}
