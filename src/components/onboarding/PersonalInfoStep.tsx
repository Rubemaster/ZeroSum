import { useState, useRef, useCallback, useEffect } from 'react';
import { COUNTRIES } from '../../services/nominatim';
import AddressWidget from './AddressWidget';
import type {
  PersonalInfo,
  IncomeInfo,
  TradingProfile,
  EmploymentInfo,
  Disclosures,
  TrustedContact,
  Agreements,
  MaritalStatus,
  EmploymentStatus,
  LiquidityRequirement,
  RiskTolerance,
  InvestmentObjective,
  InvestmentTimeHorizon,
  EmploymentSector,
  TaxIdType,
  Address,
} from '../../types/onboarding';
import './OnboardingForms.css';

interface PersonalInfoStepProps {
  personalInfo: PersonalInfo;
  incomeInfo: IncomeInfo;
  tradingProfile: TradingProfile;
  employmentInfo: EmploymentInfo;
  disclosures: Disclosures;
  trustedContact?: TrustedContact;
  agreements: Agreements;
  homeAddress?: Address;
  onPersonalInfoChange: (info: PersonalInfo) => void;
  onIncomeInfoChange: (info: IncomeInfo) => void;
  onTradingProfileChange: (profile: TradingProfile) => void;
  onEmploymentInfoChange: (info: EmploymentInfo) => void;
  onDisclosuresChange: (disclosures: Disclosures) => void;
  onTrustedContactChange: (contact: TrustedContact | undefined) => void;
  onAgreementsChange: (agreements: Agreements) => void;
  onNext: () => void;
  onBack: () => void;
}

const INCOME_BRACKETS = [
  { min: 0, max: 25000, label: '$0 - $25,000' },
  { min: 25000, max: 50000, label: '$25,000 - $50,000' },
  { min: 50000, max: 75000, label: '$50,000 - $75,000' },
  { min: 75000, max: 100000, label: '$75,000 - $100,000' },
  { min: 100000, max: 150000, label: '$100,000 - $150,000' },
  { min: 150000, max: 200000, label: '$150,000 - $200,000' },
  { min: 200000, max: 300000, label: '$200,000 - $300,000' },
  { min: 300000, max: 500000, label: '$300,000 - $500,000' },
  { min: 500000, max: 1000000, label: '$500,000 - $1,000,000' },
  { min: 1000000, max: 1000000, label: '$1,000,000+' },
];

const NET_WORTH_RANGES = [
  { value: 0, label: '$0' },
  { value: 50000, label: '$50,000' },
  { value: 100000, label: '$100,000' },
  { value: 250000, label: '$250,000' },
  { value: 500000, label: '$500,000' },
  { value: 1000000, label: '$1,000,000' },
  { value: 5000000, label: '$5,000,000+' },
];

const EMPLOYMENT_SECTORS: { value: EmploymentSector; label: string }[] = [
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'business_management', label: 'Business Management' },
  { value: 'computers_it', label: 'Computers & IT' },
  { value: 'construction', label: 'Construction' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'government', label: 'Government' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'media', label: 'Media' },
  { value: 'science', label: 'Science' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'other', label: 'Other' },
];

const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  single: 'Single',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
};

const RISK_TOLERANCE_LABELS: Record<RiskTolerance, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  significant: 'Significant Risk',
};

const OBJECTIVE_LABELS: Record<InvestmentObjective, string> = {
  income: 'Income',
  preserve_wealth: 'Preserve Wealth',
  speculation: 'Speculation',
  growth: 'Growth',
  balanced: 'Balanced',
};

const LIQUIDITY_LABELS: Record<LiquidityRequirement, string> = {
  very_important: 'Very Important',
  important: 'Important',
  somewhat_important: 'Somewhat',
  does_not_matter: 'Does Not Matter',
};

const TIME_HORIZON_LABELS: Record<InvestmentTimeHorizon, string> = {
  less_than_1: '<1 year',
  '1_to_2': '1-2 years',
  '3_to_5': '3-5 years',
  '6_to_10': '6-10 years',
  more_than_10: '10+ years',
};

const TAX_ID_TYPE_LABELS: Record<TaxIdType, string> = {
  USA_SSN: 'USA Social Security Number',
  USA_ITIN: 'USA Individual Taxpayer Identification Number',
  ARG_AR_CUIT: 'Argentina CUIT',
  AUS_TFN: 'Australian Tax File Number',
  AUS_ABN: 'Australian Business Number',
  BOL_NIT: 'Bolivia NIT',
  BRA_CPF: 'Brazil CPF',
  CHL_RUT: 'Chile RUT',
  COL_NIT: 'Colombia NIT',
  CRI_NITE: 'Costa Rica NITE',
  DEU_TAX_ID: 'Germany Tax ID (Identifikationsnummer)',
  DOM_RNC: 'Dominican Republic RNC',
  ECU_RUC: 'Ecuador RUC',
  FRA_SPI: 'France SPI (Reference Tax Number)',
  GBR_UTR: 'UK UTR (Unique Taxpayer Reference)',
  GBR_NINO: 'UK NINO (National Insurance Number)',
  GTM_NIT: 'Guatemala NIT',
  HND_RTN: 'Honduras RTN',
  HUN_TIN: 'Hungary TIN Number',
  IDN_KTP: 'Indonesia KTP',
  IND_PAN: 'India PAN Number',
  ISR_TAX_ID: 'Israel Tax ID (Teudat Zehut)',
  ITA_TAX_ID: 'Italy Tax ID (Codice Fiscale)',
  JPN_TAX_ID: 'Japan Tax ID (Koijin Bango)',
  MEX_RFC: 'Mexico RFC',
  NIC_RUC: 'Nicaragua RUC',
  NLD_TIN: 'Netherlands TIN Number',
  PAN_RUC: 'Panama RUC',
  PER_RUC: 'Peru RUC',
  PRY_RUC: 'Paraguay RUC',
  SGP_NRIC: 'Singapore NRIC',
  SGP_FIN: 'Singapore FIN',
  SGP_ASGD: 'Singapore ASGD',
  SGP_ITR: 'Singapore ITR',
  SLV_NIT: 'El Salvador NIT',
  SWE_TAX_ID: 'Sweden Tax ID (Personnummer)',
  URY_RUT: 'Uruguay RUT',
  VEN_RIF: 'Venezuela RIF',
  not_applicable: 'Not Applicable',
};

export default function PersonalInfoStep({
  personalInfo,
  incomeInfo,
  tradingProfile,
  employmentInfo,
  disclosures,
  trustedContact,
  agreements,
  homeAddress,
  onPersonalInfoChange,
  onIncomeInfoChange,
  onTradingProfileChange,
  onEmploymentInfoChange,
  onDisclosuresChange,
  onTrustedContactChange,
  onAgreementsChange,
  onNext,
  onBack,
}: PersonalInfoStepProps) {
  const [showTrustedContact, setShowTrustedContact] = useState(!!trustedContact);
  const [contactMethods, setContactMethods] = useState<{ phone: boolean; email: boolean; address: boolean }>({
    phone: trustedContact ? !!(trustedContact?.phone) : true,
    email: !!(trustedContact?.email),
    address: !!(trustedContact?.address?.city),
  });
  const [showCustomIncome, setShowCustomIncome] = useState(false);
  const [showDependentsInput, setShowDependentsInput] = useState(personalInfo.dependents > 0);

  // Tax ID input refs and focus state
  const taxIdInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const taxIdSelectRef = useRef<HTMLSelectElement>(null);
  const taxIdMeasureRef = useRef<HTMLSpanElement>(null);
  const [taxIdFocused, setTaxIdFocused] = useState(false);
  const taxId = personalInfo.taxId || '';
  const taxIdType = personalInfo.taxIdType;

  // Auto-size tax ID select
  useEffect(() => {
    if (!taxIdSelectRef.current || !taxIdMeasureRef.current) return;
    const selectedLabel = taxIdType ? TAX_ID_TYPE_LABELS[taxIdType] : 'Select...';
    taxIdMeasureRef.current.textContent = selectedLabel;
    const measuredWidth = taxIdMeasureRef.current.offsetWidth + 8;
    // Make "Select..." wider for better visibility
    const width = taxIdType ? measuredWidth : 200;
    taxIdSelectRef.current.style.width = `${width}px`;
  }, [taxIdType]);

  // Calculate number of boxes - start with 6, add extra only when focused
  const getBoxCount = useCallback(() => {
    const filledCount = taxId.length;
    if (filledCount < 6) return 6;
    return taxIdFocused ? filledCount + 1 : filledCount;
  }, [taxId, taxIdFocused]);

  const handleTaxIdChange = (index: number, value: string) => {
    // Only allow alphanumeric and dash
    const char = value.slice(-1).toUpperCase();
    if (!/^[A-Z0-9-]$/.test(char) && value !== '') return;

    const chars = taxId.split('');
    if (value === '') {
      // Backspace - remove character and focus previous
      chars.splice(index, 1);
      const newTaxId = chars.join('');
      updatePersonal('taxId', newTaxId);
      if (index > 0) {
        setTimeout(() => taxIdInputRefs.current[index - 1]?.focus(), 0);
      }
    } else {
      // Add character and focus next
      chars[index] = char;
      const newTaxId = chars.join('');
      updatePersonal('taxId', newTaxId);
      setTimeout(() => taxIdInputRefs.current[index + 1]?.focus(), 0);
    }
  };

  const handleTaxIdKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !taxId[index] && index > 0) {
      // If current box is empty and backspace pressed, focus previous
      taxIdInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      taxIdInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < taxId.length) {
      taxIdInputRefs.current[index + 1]?.focus();
    }
  };


  const getIncomeBracketValue = () => {
    const bracket = INCOME_BRACKETS.find(
      b => b.min === incomeInfo.minAnnualIncome && b.max === incomeInfo.maxAnnualIncome
    );
    return bracket ? `${bracket.min}-${bracket.max}` : '';
  };

  const handleIncomeBracketChange = (value: string) => {
    const [min, max] = value.split('-').map(Number);
    onIncomeInfoChange({ ...incomeInfo, minAnnualIncome: min, maxAnnualIncome: max });
  };

  const updatePersonal = <K extends keyof PersonalInfo>(field: K, value: PersonalInfo[K]) => {
    onPersonalInfoChange({ ...personalInfo, [field]: value });
  };

  const updateIncome = <K extends keyof IncomeInfo>(field: K, value: IncomeInfo[K]) => {
    onIncomeInfoChange({ ...incomeInfo, [field]: value });
  };

  const updateTrading = <K extends keyof TradingProfile>(field: K, value: TradingProfile[K]) => {
    onTradingProfileChange({ ...tradingProfile, [field]: value });
  };

  const updateEmployment = <K extends keyof EmploymentInfo>(field: K, value: EmploymentInfo[K]) => {
    onEmploymentInfoChange({ ...employmentInfo, [field]: value });
  };

  const updateDisclosures = <K extends keyof Disclosures>(field: K, value: Disclosures[K]) => {
    onDisclosuresChange({ ...disclosures, [field]: value });
  };

  const updateTrustedContact = <K extends keyof TrustedContact>(field: K, value: TrustedContact[K]) => {
    if (!trustedContact) {
      onTrustedContactChange({ givenNames: '', lastName: '', email: '', phone: '', [field]: value });
    } else {
      onTrustedContactChange({ ...trustedContact, [field]: value });
    }
  };

  const toggleContactMethod = (method: 'phone' | 'email' | 'address') => {
    const newMethods = { ...contactMethods, [method]: !contactMethods[method] };
    // Ensure at least one method is selected
    if (!newMethods.phone && !newMethods.email && !newMethods.address) {
      return; // Don't allow deselecting the last one
    }
    setContactMethods(newMethods);
  };

  const updateAgreements = <K extends keyof Agreements>(field: K, value: Agreements[K]) => {
    onAgreementsChange({ ...agreements, [field]: value });
  };

  const isValid = !!personalInfo.countryOfCitizenship;

  // Display value helpers
  const getIncomeLabel = () => {
    const bracket = INCOME_BRACKETS.find(
      b => b.min === incomeInfo.minAnnualIncome && b.max === incomeInfo.maxAnnualIncome
    );
    return bracket?.label || `$${incomeInfo.minAnnualIncome.toLocaleString()} - $${incomeInfo.maxAnnualIncome.toLocaleString()}`;
  };

  const getNetWorthLabel = (value: number) => {
    return NET_WORTH_RANGES.find(r => r.value === value)?.label || `$${value.toLocaleString()}`;
  };

  const getSectorLabel = (value: EmploymentSector | undefined) => {
    return EMPLOYMENT_SECTORS.find(s => s.value === value)?.label || 'Select...';
  };

  const boxCount = getBoxCount();

  return (
    <div className="onboarding-step personal-info-step single-page">
      <div className="single-page-form">
        {/* Header row with title and Tax ID */}
        <div className="form-header-row">
          <h2>Account Information</h2>
          <div className="tax-id-section-topright">
          <div className="tax-id-type-select">
            <label>Tax ID:</label>
            <select
              ref={taxIdSelectRef}
              value={taxIdType || ''}
              onChange={(e) => updatePersonal('taxIdType', e.target.value as TaxIdType)}
            >
              <option value="">Select...</option>
              {Object.entries(TAX_ID_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span ref={taxIdMeasureRef} className="tax-id-measure" aria-hidden="true" />
          </div>
          {taxIdType && taxIdType !== 'not_applicable' && (
            <div className="tax-id-boxes-compact">
              {Array.from({ length: boxCount }).map((_, index) => (
                <input
                  key={index}
                  ref={(el) => { taxIdInputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  className={`tax-id-box-small ${index < taxId.length ? 'filled' : ''} ${index >= taxId.length && index > 0 ? 'faded' : ''} ${taxId[index] === '-' ? 'dash' : ''}`}
                  value={taxId[index] || ''}
                  onChange={(e) => handleTaxIdChange(index, e.target.value)}
                  onKeyDown={(e) => handleTaxIdKeyDown(index, e)}
                  onFocus={() => setTaxIdFocused(true)}
                  onBlur={() => setTaxIdFocused(false)}
                  placeholder=""
                />
              ))}
            </div>
          )}
          </div>
        </div>
        <hr className="form-header-separator" />

        {/* Personal Information */}
        <div className="form-section">
          <div className="form-row-thirds">
            <div className="form-group third hover-edit-field">
              <label>Country of Citizenship *</label>
              <div className="hover-edit-wrapper">
                <span className="hover-edit-value">{personalInfo.countryOfCitizenship || 'Select...'}</span>
                <select
                  className="hover-edit-control"
                  value={personalInfo.countryOfCitizenship}
                  onChange={(e) => updatePersonal('countryOfCitizenship', e.target.value)}
                >
                  <option value="">Select...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group third hover-edit-field">
              <label>Marital Status</label>
              <div className="hover-edit-wrapper">
                <span className="hover-edit-value">{MARITAL_STATUS_LABELS[personalInfo.maritalStatus]}</span>
                <select
                  className="hover-edit-control"
                  value={personalInfo.maritalStatus}
                  onChange={(e) => updatePersonal('maritalStatus', e.target.value as MaritalStatus)}
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>
            <div className="form-group dependents-field">
              <label>Dependents</label>
              {showDependentsInput || personalInfo.dependents > 0 ? (
                <input
                  type="number"
                  min="0"
                  value={personalInfo.dependents}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    updatePersonal('dependents', val);
                    if (val === 0) setShowDependentsInput(false);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="add-dependents-btn"
                  onClick={() => {
                    setShowDependentsInput(true);
                    updatePersonal('dependents', 1);
                  }}
                  aria-label="Add dependents"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Annual Income */}
        <div className="form-section">
          <div className="form-grid">
            {showCustomIncome ? (
              <>
                <div className="form-group half">
                  <label>Min Income</label>
                  <input
                    type="number"
                    value={incomeInfo.minAnnualIncome || ''}
                    onChange={(e) => updateIncome('minAnnualIncome', parseInt(e.target.value) || 0)}
                    placeholder="$0"
                  />
                </div>
                <div className="form-group half income-field-with-edit">
                  <label>Max Income</label>
                  <div className="input-with-edit">
                    <input
                      type="number"
                      value={incomeInfo.maxAnnualIncome || ''}
                      onChange={(e) => updateIncome('maxAnnualIncome', parseInt(e.target.value) || 0)}
                      placeholder="$100,000"
                    />
                    <button
                      type="button"
                      className="field-edit-btn"
                      onClick={() => setShowCustomIncome(false)}
                      aria-label="Use brackets"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group full hover-edit-field income-field-with-edit">
                <label>Annual Income</label>
                <div className="hover-edit-wrapper has-edit-btn">
                  <span className="hover-edit-value">{getIncomeLabel()}</span>
                  <select
                    className="hover-edit-control"
                    value={getIncomeBracketValue()}
                    onChange={(e) => handleIncomeBracketChange(e.target.value)}
                  >
                    <option value="">Select...</option>
                    {INCOME_BRACKETS.map((b) => (
                      <option key={`${b.min}-${b.max}`} value={`${b.min}-${b.max}`}>{b.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="field-edit-btn"
                    onClick={() => setShowCustomIncome(true)}
                    aria-label="Custom amount"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Net Worth */}
        <div className="form-section">
          <div className="form-grid">
            <div className="form-group half hover-edit-field">
              <label>Total Net Worth</label>
              <div className="hover-edit-wrapper">
                <span className="hover-edit-value">{getNetWorthLabel(incomeInfo.totalNetWorth)}</span>
                <select
                  className="hover-edit-control"
                  value={incomeInfo.totalNetWorth}
                  onChange={(e) => updateIncome('totalNetWorth', parseInt(e.target.value))}
                >
                  {NET_WORTH_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group half hover-edit-field">
              <label>Liquid Net Worth</label>
              <div className="hover-edit-wrapper">
                <span className="hover-edit-value">{getNetWorthLabel(incomeInfo.liquidNetWorth)}</span>
                <select
                  className="hover-edit-control"
                  value={incomeInfo.liquidNetWorth}
                  onChange={(e) => updateIncome('liquidNetWorth', parseInt(e.target.value))}
                >
                  {NET_WORTH_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Profile */}
        <div className="form-section">
          <div className="form-grid">
            <div className="form-group half hover-edit-field">
              <label>Risk Tolerance</label>
              <div className="hover-edit-wrapper">
                <span className="hover-edit-value">{RISK_TOLERANCE_LABELS[tradingProfile.riskTolerance]}</span>
                <select
                  className="hover-edit-control"
                  value={tradingProfile.riskTolerance}
                  onChange={(e) => updateTrading('riskTolerance', e.target.value as RiskTolerance)}
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="significant">Significant Risk</option>
                </select>
              </div>
            </div>
            <div className="form-group half hover-edit-field">
              <label>Objective</label>
              <div className="hover-edit-wrapper">
                <span className="hover-edit-value">{OBJECTIVE_LABELS[tradingProfile.investmentObjective]}</span>
                <select
                  className="hover-edit-control"
                  value={tradingProfile.investmentObjective}
                  onChange={(e) => updateTrading('investmentObjective', e.target.value as InvestmentObjective)}
                >
                  <option value="income">Income</option>
                  <option value="preserve_wealth">Preserve Wealth</option>
                  <option value="speculation">Speculation</option>
                  <option value="growth">Growth</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>
            </div>
            <div className="form-group half hover-edit-field">
              <label>Liquidity Needs</label>
              <div className="hover-edit-wrapper">
                <span className="hover-edit-value">{LIQUIDITY_LABELS[tradingProfile.liquidityRequirement]}</span>
                <select
                  className="hover-edit-control"
                  value={tradingProfile.liquidityRequirement}
                  onChange={(e) => updateTrading('liquidityRequirement', e.target.value as LiquidityRequirement)}
                >
                  <option value="very_important">Very Important</option>
                  <option value="important">Important</option>
                  <option value="somewhat_important">Somewhat</option>
                  <option value="does_not_matter">Does Not Matter</option>
                </select>
              </div>
            </div>
            <div className="form-group half hover-edit-field">
              <label>Time Horizon</label>
              <div className="hover-edit-wrapper">
                <span className="hover-edit-value">{TIME_HORIZON_LABELS[tradingProfile.investmentTimeHorizon]}</span>
                <select
                  className="hover-edit-control"
                  value={tradingProfile.investmentTimeHorizon}
                  onChange={(e) => updateTrading('investmentTimeHorizon', e.target.value as InvestmentTimeHorizon)}
                >
                  <option value="less_than_1">&lt;1 year</option>
                  <option value="1_to_2">1-2 years</option>
                  <option value="3_to_5">3-5 years</option>
                  <option value="6_to_10">6-10 years</option>
                  <option value="more_than_10">10+ years</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Employment */}
        <div className="form-section employment-split-section">
          <div className="employment-split-left">
            <h3>Employment</h3>
          </div>
          <div className="employment-split-right">
            <div className="employment-status-row">
              <span className="employment-status-label">Employment status:</span>
              {[
                { value: 'student', label: 'Student' },
                { value: 'employed', label: 'Employed' },
                { value: 'unemployed', label: 'Unemployed' },
                { value: 'retired', label: 'Retired' },
              ].map((opt) => (
                <label key={opt.value} className="radio-label square-radio">
                  <input
                    type="radio"
                    name="employment"
                    value={opt.value}
                    checked={employmentInfo.status === opt.value}
                    onChange={() => updateEmployment('status', opt.value as EmploymentStatus)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {employmentInfo.status === 'employed' && (
              <>
                <hr className="employment-divider" />
                <div className="form-row-thirds">
                  <div className="form-group third hover-edit-field">
                    <label>Position</label>
                    <div className="hover-edit-wrapper">
                      <span className="hover-edit-value">{employmentInfo.position || 'Enter position...'}</span>
                      <input
                        className="hover-edit-control"
                        type="text"
                        placeholder=" "
                        value={employmentInfo.position || ''}
                        onChange={(e) => updateEmployment('position', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group third hover-edit-field">
                    <label>Employer</label>
                    <div className="hover-edit-wrapper">
                      <span className="hover-edit-value">{employmentInfo.employerName || 'Enter employer...'}</span>
                      <input
                        className="hover-edit-control"
                        type="text"
                        placeholder=" "
                        value={employmentInfo.employerName || ''}
                        onChange={(e) => updateEmployment('employerName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group third hover-edit-field">
                    <label>Sector</label>
                    <div className="hover-edit-wrapper">
                      <span className="hover-edit-value">{getSectorLabel(employmentInfo.sector)}</span>
                      <select
                        className="hover-edit-control"
                        value={employmentInfo.sector || ''}
                        onChange={(e) => updateEmployment('sector', e.target.value as EmploymentSector)}
                      >
                        <option value="">Select...</option>
                        {EMPLOYMENT_SECTORS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <hr className="employment-divider" />
                {/* Employer Address Widget */}
                <div className="form-group full">
                  <label>Employer Address</label>
                  <AddressWidget
                    address={employmentInfo.employerAddress}
                    onAddressChange={(addr) => updateEmployment('employerAddress', addr)}
                    height={260}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Disclosures */}
        <div className="form-section">
          <div className="disclosure-list-yesno">
            <div className="disclosure-question">
              <span className="disclosure-text">Are you an officer, director, or 10% (or greater) stockholder of any publicly traded company?</span>
              <div className="yesno-buttons">
                <label className={`yesno-btn ${disclosures.isOfficerOrDirector === true ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="isOfficerOrDirector"
                    checked={disclosures.isOfficerOrDirector === true}
                    onChange={() => updateDisclosures('isOfficerOrDirector', true)}
                  />
                  Yes
                </label>
                <span className="yesno-separator">/</span>
                <label className={`yesno-btn ${disclosures.isOfficerOrDirector === false ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="isOfficerOrDirector"
                    checked={disclosures.isOfficerOrDirector === false}
                    onChange={() => updateDisclosures('isOfficerOrDirector', false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="disclosure-question">
              <span className="disclosure-text">Are you affiliated with any stock exchange or FINRA or IIROC?</span>
              <div className="yesno-buttons">
                <label className={`yesno-btn ${disclosures.isAffiliatedWithExchange === true ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="isAffiliatedWithExchange"
                    checked={disclosures.isAffiliatedWithExchange === true}
                    onChange={() => updateDisclosures('isAffiliatedWithExchange', true)}
                  />
                  Yes
                </label>
                <span className="yesno-separator">/</span>
                <label className={`yesno-btn ${disclosures.isAffiliatedWithExchange === false ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="isAffiliatedWithExchange"
                    checked={disclosures.isAffiliatedWithExchange === false}
                    onChange={() => updateDisclosures('isAffiliatedWithExchange', false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="disclosure-question">
              <span className="disclosure-text">Are you a Politically Exposed Person?</span>
              <div className="yesno-buttons">
                <label className={`yesno-btn ${disclosures.isPoliticallyExposed === true ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="isPoliticallyExposed"
                    checked={disclosures.isPoliticallyExposed === true}
                    onChange={() => updateDisclosures('isPoliticallyExposed', true)}
                  />
                  Yes
                </label>
                <span className="yesno-separator">/</span>
                <label className={`yesno-btn ${disclosures.isPoliticallyExposed === false ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="isPoliticallyExposed"
                    checked={disclosures.isPoliticallyExposed === false}
                    onChange={() => updateDisclosures('isPoliticallyExposed', false)}
                  />
                  No
                </label>
              </div>
            </div>
            <div className="disclosure-question">
              <span className="disclosure-text">Is anyone in your immediate family an officer, director, or 10% (or greater) stockholder of a publicly traded company, or is anyone in your immediate family a Politically Exposed Person?</span>
              <div className="yesno-buttons">
                <label className={`yesno-btn ${disclosures.hasFamilyPoliticallyExposed === true ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="hasFamilyPoliticallyExposed"
                    checked={disclosures.hasFamilyPoliticallyExposed === true}
                    onChange={() => updateDisclosures('hasFamilyPoliticallyExposed', true)}
                  />
                  Yes
                </label>
                <span className="yesno-separator">/</span>
                <label className={`yesno-btn ${disclosures.hasFamilyPoliticallyExposed === false ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="hasFamilyPoliticallyExposed"
                    checked={disclosures.hasFamilyPoliticallyExposed === false}
                    onChange={() => updateDisclosures('hasFamilyPoliticallyExposed', false)}
                  />
                  No
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Trusted Contact */}
        {!showTrustedContact ? (
          <button
            type="button"
            className="add-trusted-contact-btn"
            onClick={() => setShowTrustedContact(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add trusted contact</span>
          </button>
        ) : (
          <div className="form-section trusted-contact-split-section">
            <div className="trusted-contact-split-left">
              <h3>Trusted Contact</h3>
            </div>
            <div className="trusted-contact-split-right">
              <button
                type="button"
                className="trusted-contact-remove-btn"
                onClick={() => {
                  setShowTrustedContact(false);
                  onTrustedContactChange(undefined);
                }}
                aria-label="Remove trusted contact"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="form-group hover-edit-field">
                <label>Full Name</label>
                <div className="hover-edit-wrapper">
                  <span className="hover-edit-value">{[trustedContact?.givenNames, trustedContact?.lastName].filter(Boolean).join(' ')}</span>
                  <input
                    className="hover-edit-control"
                    type="text"
                    placeholder=" "
                    value={[trustedContact?.givenNames, trustedContact?.lastName].filter(Boolean).join(' ')}
                    onChange={(e) => {
                      const parts = e.target.value.split(' ');
                      const lastName = parts.pop() || '';
                      const givenNames = parts.join(' ');
                      onTrustedContactChange({
                        ...trustedContact,
                        givenNames: givenNames || lastName,
                        lastName: givenNames ? lastName : '',
                        email: trustedContact?.email || '',
                        phone: trustedContact?.phone || '',
                      });
                    }}
                  />
                </div>
              </div>
              <hr className="trusted-contact-divider" />
              <div className="contact-method-row">
                <span className="contact-method-label">Contact via:</span>
                <label className="radio-label square-radio">
                  <input
                    type="checkbox"
                    checked={contactMethods.phone}
                    onChange={() => toggleContactMethod('phone')}
                  />
                  <span>Phone</span>
                </label>
                <label className="radio-label square-radio">
                  <input
                    type="checkbox"
                    checked={contactMethods.email}
                    onChange={() => toggleContactMethod('email')}
                  />
                  <span>Email</span>
                </label>
                <label className="radio-label square-radio">
                  <input
                    type="checkbox"
                    checked={contactMethods.address}
                    onChange={() => toggleContactMethod('address')}
                  />
                  <span>Address</span>
                </label>
              </div>
              <hr className="trusted-contact-divider" />
              <div className="contact-method-fields">
                {(contactMethods.phone || contactMethods.email) && (
                  <div className={`contact-fields-row ${contactMethods.phone && contactMethods.email ? 'two-fields' : 'one-field'}`}>
                    {contactMethods.phone && (
                      <div className="form-group hover-edit-field">
                        <label>Phone</label>
                        <div className="hover-edit-wrapper">
                          <span className="hover-edit-value">{trustedContact?.phone}</span>
                          <input
                            className="hover-edit-control"
                            type="tel"
                            placeholder=" "
                            value={trustedContact?.phone || ''}
                            onChange={(e) => updateTrustedContact('phone', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    {contactMethods.email && (
                      <div className="form-group hover-edit-field">
                        <label>Email</label>
                        <div className="hover-edit-wrapper">
                          <span className="hover-edit-value">{trustedContact?.email}</span>
                          <input
                            className="hover-edit-control"
                            type="email"
                            placeholder=" "
                            value={trustedContact?.email || ''}
                            onChange={(e) => updateTrustedContact('email', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {contactMethods.address && (contactMethods.phone || contactMethods.email) && (
                  <hr className="trusted-contact-divider" />
                )}
                {contactMethods.address && (
                  <div className="form-group full">
                    <label>Address</label>
                    <AddressWidget
                      address={trustedContact?.address}
                      onAddressChange={(addr) => updateTrustedContact('address', addr)}
                      height={200}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-actions with-certification">
          <label className="certification-checkbox">
            <input
              type="checkbox"
              checked={agreements.acceptsTermsOfService}
              onChange={(e) => onAgreementsChange({ ...agreements, acceptsTermsOfService: e.target.checked })}
            />
            <span>I certify that to the best of my understanding the above information is true and complete.</span>
          </label>
          <div className="step-buttons">
            <button className="btn-secondary" onClick={onBack}>Back</button>
            <button className="btn-primary" onClick={onNext} disabled={!isValid || !agreements.acceptsTermsOfService}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
