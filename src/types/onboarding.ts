export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  displayName: string;
  house_number?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface SearchResult {
  placeId: string;
  displayName: string;
  coordinates: Coordinates;
  address: Address;
}

export interface NominatimResponse {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type EmploymentStatus = 'employed' | 'unemployed' | 'retired' | 'student';
export type LiquidityRequirement = 'very_important' | 'important' | 'somewhat_important' | 'does_not_matter';
export type RiskTolerance = 'conservative' | 'moderate' | 'significant';
export type InvestmentObjective = 'income' | 'preserve_wealth' | 'speculation' | 'growth' | 'balanced';
export type InvestmentTimeHorizon = 'less_than_1' | '1_to_2' | '3_to_5' | '6_to_10' | 'more_than_10';
export type EmploymentSector =
  | 'agriculture' | 'business_management' | 'computers_it' | 'construction'
  | 'education' | 'finance' | 'government' | 'healthcare' | 'hospitality'
  | 'manufacturing' | 'marketing' | 'media' | 'science' | 'self_employed'
  | 'transportation' | 'other';

export type TaxIdType =
  | 'USA_SSN' | 'USA_ITIN'
  | 'ARG_AR_CUIT' | 'AUS_TFN' | 'AUS_ABN'
  | 'BOL_NIT' | 'BRA_CPF'
  | 'CHL_RUT' | 'COL_NIT' | 'CRI_NITE'
  | 'DEU_TAX_ID' | 'DOM_RNC'
  | 'ECU_RUC'
  | 'FRA_SPI'
  | 'GBR_UTR' | 'GBR_NINO' | 'GTM_NIT'
  | 'HND_RTN' | 'HUN_TIN'
  | 'IDN_KTP' | 'IND_PAN' | 'ISR_TAX_ID' | 'ITA_TAX_ID'
  | 'JPN_TAX_ID'
  | 'MEX_RFC'
  | 'NIC_RUC' | 'NLD_TIN'
  | 'PAN_RUC' | 'PER_RUC' | 'PRY_RUC'
  | 'SGP_NRIC' | 'SGP_FIN' | 'SGP_ASGD' | 'SGP_ITR' | 'SLV_NIT' | 'SWE_TAX_ID'
  | 'URY_RUT'
  | 'VEN_RIF'
  | 'not_applicable';

export interface PersonalInfo {
  // Name comes from ID verification, email/phone from Clerk, tax residence from address
  dateOfBirth: string;
  countryOfBirth: string;
  countryOfCitizenship: string;
  maritalStatus: MaritalStatus;
  dependents: number;
  isUSResident: boolean;
  visaType?: string;
  visaExpirationDate?: string;
  departureDate?: string; // For B1/B2 visas
  taxIdType?: TaxIdType;
  taxId?: string;
}

export interface IncomeInfo {
  minAnnualIncome: number;
  maxAnnualIncome: number;
  totalNetWorth: number;
  liquidNetWorth: number;
}

export interface TradingProfile {
  liquidityRequirement: LiquidityRequirement;
  riskTolerance: RiskTolerance;
  investmentObjective: InvestmentObjective;
  investmentTimeHorizon: InvestmentTimeHorizon;
}

export interface EmploymentInfo {
  status?: EmploymentStatus;
  position?: string;
  employerName?: string;
  employerAddress?: Address;
  sector?: EmploymentSector;
}

export interface Disclosures {
  isOfficerOrDirector?: boolean;
  isAffiliatedWithExchange?: boolean;
  isPoliticallyExposed?: boolean;
  hasFamilyPoliticallyExposed?: boolean;
}

export interface TrustedContact {
  givenNames: string;
  lastName: string;
  email: string;
  phone: string;
  address?: Address;
}

export interface Agreements {
  acceptsAlpacaMarginAgreement: boolean;
  acceptsTermsOfService: boolean;
}

export interface OnboardingData {
  personalInfo: PersonalInfo;
  homeAddress: Address;
  incomeInfo: IncomeInfo;
  tradingProfile: TradingProfile;
  employmentInfo: EmploymentInfo;
  disclosures: Disclosures;
  trustedContact?: TrustedContact;
  agreements: Agreements;
}

export type OnboardingStep = 'address' | 'personal' | 'kyc';
