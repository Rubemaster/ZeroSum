import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, UserButton } from '@clerk/clerk-react';
import rockiesImage from '../assets/rockies-snow.jpg';
import AddressStep from './onboarding/AddressStep';
import PersonalInfoStep from './onboarding/PersonalInfoStep';
import type {
  Address,
  OnboardingStep,
  PersonalInfo,
  IncomeInfo,
  TradingProfile,
  EmploymentInfo,
  Disclosures,
  TrustedContact,
  Agreements,
  OnboardingData,
} from '../types/onboarding';
import '../App.css';
import './Navigation.css';
import './KYCGate.css';

type KYCStatus = 'checking' | 'verified' | 'pending' | 'required' | 'failed';

interface ApplicantData {
  reviewStatus?: string;
  reviewResult?: {
    reviewAnswer?: string;
    rejectLabels?: string[];
  };
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// Declare Sumsub types
declare global {
  interface Window {
    snsWebSdk: {
      init: (
        accessToken: string,
        getNewToken: () => Promise<string>
      ) => {
        withConf: (conf: { lang?: string; theme?: string }) => {
          withOptions: (options: { addViewportTag?: boolean; adaptIframeHeight?: boolean }) => {
            on: (event: string, callback: (...args: unknown[]) => void) => ReturnType<Window['snsWebSdk']['init']>['withConf'];
            build: () => {
              launch: (containerId: string) => void;
            };
          };
        };
      };
    };
  }
}

interface KYCGateProps {
  children: React.ReactNode;
}

const initialPersonalInfo: PersonalInfo = {
  dateOfBirth: '',
  countryOfBirth: '',
  countryOfCitizenship: 'United States',
  maritalStatus: 'single',
  dependents: 0,
  isUSResident: true,
};

const initialIncomeInfo: IncomeInfo = {
  minAnnualIncome: 50000,
  maxAnnualIncome: 100000,
  totalNetWorth: 100000,
  liquidNetWorth: 50000,
};

const initialTradingProfile: TradingProfile = {
  liquidityRequirement: 'important',
  riskTolerance: 'moderate',
  investmentObjective: 'growth',
  investmentTimeHorizon: '3_to_5',
};

const initialEmploymentInfo: EmploymentInfo = {};

const initialDisclosures: Disclosures = {};

const initialAgreements: Agreements = {
  acceptsAlpacaMarginAgreement: false,
  acceptsTermsOfService: false,
};

export default function KYCGate({ children }: KYCGateProps) {
  const { getToken } = useAuth();
  const [kycStatus, setKycStatus] = useState<KYCStatus>('checking');
  const [applicantData, setApplicantData] = useState<ApplicantData | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const sdkLaunched = useRef(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Onboarding step state
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('address');
  const [homeAddress, setHomeAddress] = useState<Address>({ displayName: '' });
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(initialPersonalInfo);
  const [incomeInfo, setIncomeInfo] = useState<IncomeInfo>(initialIncomeInfo);
  const [tradingProfile, setTradingProfile] = useState<TradingProfile>(initialTradingProfile);
  const [employmentInfo, setEmploymentInfo] = useState<EmploymentInfo>(initialEmploymentInfo);
  const [disclosures, setDisclosures] = useState<Disclosures>(initialDisclosures);
  const [trustedContact, setTrustedContact] = useState<TrustedContact | undefined>();
  const [agreements, setAgreements] = useState<Agreements>(initialAgreements);

  // Load saved onboarding data from Clerk metadata
  const loadOnboardingData = useCallback(async () => {
    try {
      const authToken = await getToken();
      const response = await fetch(`${API_BASE}/api/onboarding`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.onboardingStep) setOnboardingStep(data.onboardingStep);
        if (data.homeAddress) setHomeAddress(data.homeAddress);
        if (data.personalInfo) setPersonalInfo({ ...initialPersonalInfo, ...data.personalInfo });
        if (data.incomeInfo) setIncomeInfo({ ...initialIncomeInfo, ...data.incomeInfo });
        if (data.tradingProfile) setTradingProfile({ ...initialTradingProfile, ...data.tradingProfile });
        if (data.employmentInfo) setEmploymentInfo({ ...initialEmploymentInfo, ...data.employmentInfo });
        if (data.disclosures) setDisclosures({ ...initialDisclosures, ...data.disclosures });
        if (data.trustedContact) setTrustedContact(data.trustedContact);
        if (data.agreements) setAgreements({ ...initialAgreements, ...data.agreements });
      }
    } catch (err) {
      console.error('Failed to load onboarding data:', err);
    } finally {
      setDataLoaded(true);
    }
  }, [getToken]);

  // Load onboarding data on mount
  useEffect(() => {
    loadOnboardingData();
  }, [loadOnboardingData]);

  // Save onboarding data to Clerk metadata (debounced)
  const saveOnboardingData = useCallback(async (data: {
    onboardingStep: OnboardingStep;
    homeAddress: Address;
    personalInfo: PersonalInfo;
    incomeInfo: IncomeInfo;
    tradingProfile: TradingProfile;
    employmentInfo: EmploymentInfo;
    disclosures: Disclosures;
    trustedContact?: TrustedContact;
    agreements: Agreements;
  }) => {
    try {
      const authToken = await getToken();
      const response = await fetch(`${API_BASE}/api/onboarding`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setSaveError(null);
        setLastSaveTime(new Date().toLocaleTimeString());
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSaveError(`Save failed: ${response.status} - ${errorData.details || response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
      setSaveError(`Save failed: ${err instanceof Error ? err.message : 'Network error'}`);
    }
  }, [getToken]);

  // Auto-save whenever data changes (debounced)
  useEffect(() => {
    if (!dataLoaded) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveOnboardingData({
        onboardingStep,
        homeAddress,
        personalInfo,
        incomeInfo,
        tradingProfile,
        employmentInfo,
        disclosures,
        trustedContact,
        agreements,
      });
    }, 1000); // Debounce for 1 second

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [dataLoaded, onboardingStep, homeAddress, personalInfo, incomeInfo, tradingProfile, employmentInfo, disclosures, trustedContact, agreements, saveOnboardingData]);


  // Check KYC status with backend
  const checkKYCStatus = useCallback(async () => {
    try {
      const authToken = await getToken();
      const response = await fetch(`${API_BASE}/api/kyc/status`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplicantData(data);

        if (data.reviewStatus === 'completed') {
          if (data.reviewResult?.reviewAnswer === 'GREEN') {
            setKycStatus('verified');
            return 'verified';
          } else if (data.reviewResult?.reviewAnswer === 'RED') {
            setKycStatus('failed');
            return 'failed';
          }
        } else if (data.reviewStatus === 'pending') {
          setKycStatus('pending');
          return 'pending';
        }
      }

      setKycStatus('required');
      return 'required';
    } catch (err) {
      console.error('Failed to check KYC status:', err);
      setKycStatus('required');
      return 'required';
    }
  }, [getToken]);

  // Get access token for Sumsub SDK
  const getAccessToken = useCallback(async (): Promise<string> => {
    const authToken = await getToken();
    const response = await fetch(`${API_BASE}/api/kyc/token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get verification token');
    }

    const data = await response.json();
    return data.token;
  }, [getToken]);

  // Submit onboarding data to backend
  const submitOnboardingData = useCallback(async () => {
    const onboardingData: OnboardingData = {
      personalInfo,
      homeAddress,
      incomeInfo,
      tradingProfile,
      employmentInfo,
      disclosures,
      trustedContact,
      agreements,
    };

    try {
      const authToken = await getToken();
      await fetch(`${API_BASE}/api/onboarding`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });
    } catch (err) {
      console.error('Failed to submit onboarding data:', err);
    }
  }, [getToken, personalInfo, homeAddress, incomeInfo, tradingProfile, employmentInfo, disclosures, trustedContact, agreements]);

  // Check status on mount
  useEffect(() => {
    const init = async () => {
      const status = await checkKYCStatus();

      if (status === 'required' || status === 'failed') {
        // Load SDK script for later use
        if (!document.getElementById('sumsub-websdk')) {
          const script = document.createElement('script');
          script.id = 'sumsub-websdk';
          script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js';
          script.async = true;
          script.onload = () => setSdkLoaded(true);
          document.head.appendChild(script);
        } else {
          setSdkLoaded(true);
        }
      }
    };

    init();
  }, [checkKYCStatus]);

  // Launch SDK when on kyc step and loaded
  useEffect(() => {
    if (!sdkLoaded || !window.snsWebSdk || sdkLaunched.current) return;
    if (onboardingStep !== 'kyc') return;
    if (kycStatus !== 'required' && kycStatus !== 'failed') return;

    const launchSdk = async () => {
      try {
        const accessToken = await getAccessToken();

        const snsWebSdkInstance = window.snsWebSdk
          .init(accessToken, () => getAccessToken())
          .withConf({
            lang: 'en',
            theme: 'light',
          })
          .withOptions({
            addViewportTag: false,
            adaptIframeHeight: true,
          })
          .on('idCheck.onStepCompleted', (payload: unknown) => {
            console.log('Step completed:', payload);
          })
          .on('idCheck.onError', (error: unknown) => {
            console.error('Verification error:', error);
          })
          .on('idCheck.applicantStatus', (payload: unknown) => {
            const statusPayload = payload as { reviewStatus?: string; reviewResult?: { reviewAnswer?: string } };

            if (statusPayload.reviewStatus === 'completed') {
              if (statusPayload.reviewResult?.reviewAnswer === 'GREEN') {
                setKycStatus('verified');
              } else if (statusPayload.reviewResult?.reviewAnswer === 'RED') {
                setKycStatus('failed');
              }
            } else if (statusPayload.reviewStatus === 'pending') {
              setKycStatus('pending');
            }
          })
          .on('idCheck.onApplicantLoaded', (payload: unknown) => {
            // Check if already verified when SDK loads
            const loadedPayload = payload as { reviewStatus?: string; reviewResult?: { reviewAnswer?: string } };
            if (loadedPayload.reviewStatus === 'completed' && loadedPayload.reviewResult?.reviewAnswer === 'GREEN') {
              setKycStatus('verified');
            }
          })
          .build();

        snsWebSdkInstance.launch('#kyc-gate-container');
        sdkLaunched.current = true;
        setSdkReady(true);
      } catch (err) {
        console.error('Failed to launch Sumsub SDK:', err);
      }
    };

    launchSdk();
  }, [sdkLoaded, onboardingStep, kycStatus, getAccessToken]);

  // If verified, show the app
  if (kycStatus === 'verified') {
    return <>{children}</>;
  }

  const handleAddressNext = () => {
    // Save immediately before changing step (bypass debounce)
    saveOnboardingData({
      onboardingStep: 'personal',
      homeAddress,
      personalInfo,
      incomeInfo,
      tradingProfile,
      employmentInfo,
      disclosures,
      trustedContact,
      agreements,
    });
    setOnboardingStep('personal');
  };

  const handlePersonalBack = () => {
    // Save immediately before changing step
    saveOnboardingData({
      onboardingStep: 'address',
      homeAddress,
      personalInfo,
      incomeInfo,
      tradingProfile,
      employmentInfo,
      disclosures,
      trustedContact,
      agreements,
    });
    setOnboardingStep('address');
  };

  const handlePersonalNext = async () => {
    await submitOnboardingData();
    setOnboardingStep('kyc');
  };

  // Show KYC onboarding page with app wrapper
  return (
    <div className="app theme-light">
      {/* Global SVG Filter for liquid glass distortion */}
      <svg className="svg-filters-global" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glass-distortion-global" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.004"
              numOctaves={2}
              seed={92}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation={2} result="blurredNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurredNoise"
              scale={77}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Background */}
      <div className="app-background bg-rockies">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${rockiesImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.15,
            pointerEvents: 'none',
          }}
        />
      </div>

      <nav className="island-nav island-nav-glass">
        <div className="nav-brand">
          <span className="brand-name">ZEROSUM</span>
        </div>
        <div className="nav-actions">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: { width: 36, height: 36 }
              }
            }}
          />
        </div>
      </nav>

      <main className="main-content">
        <div className="page">
          {kycStatus === 'checking' ? (
            <div className="kyc-gate-content">
              <div className="card">
                <div className="kyc-gate-loading">
                  <div className="spinner" />
                  <p>Checking verification status...</p>
                </div>
              </div>
            </div>
          ) : kycStatus === 'pending' ? (
            <div className="kyc-gate-content">
              <div className="page-header">
                <h1>Verification In Progress</h1>
                <p className="page-subtitle">Your documents are being reviewed</p>
              </div>
              <div className="card">
                <div className="kyc-gate-status-card">
                  <div className="status-icon pending">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <h2>Under Review</h2>
                  <p>This usually takes a few minutes. We'll notify you once complete.</p>
                  <button className="btn-primary" onClick={() => checkKYCStatus()}>
                    Check Status
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Save status indicator */}
              {(saveError || lastSaveTime) && (
                <div style={{
                  position: 'fixed',
                  bottom: 20,
                  right: 20,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: saveError ? '#fee2e2' : '#dcfce7',
                  color: saveError ? '#dc2626' : '#16a34a',
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  maxWidth: 300,
                }}>
                  {saveError ? (
                    <>
                      <strong>Error:</strong> {saveError}
                    </>
                  ) : (
                    <>Saved at {lastSaveTime}</>
                  )}
                </div>
              )}

              {onboardingStep === 'address' && (
                <AddressStep
                  address={homeAddress}
                  onAddressChange={setHomeAddress}
                  onNext={handleAddressNext}
                />
              )}

              {onboardingStep === 'personal' && (
                <PersonalInfoStep
                  personalInfo={personalInfo}
                  incomeInfo={incomeInfo}
                  tradingProfile={tradingProfile}
                  employmentInfo={employmentInfo}
                  disclosures={disclosures}
                  trustedContact={trustedContact}
                  agreements={agreements}
                  homeAddress={homeAddress}
                  onPersonalInfoChange={setPersonalInfo}
                  onIncomeInfoChange={setIncomeInfo}
                  onTradingProfileChange={setTradingProfile}
                  onEmploymentInfoChange={setEmploymentInfo}
                  onDisclosuresChange={setDisclosures}
                  onTrustedContactChange={setTrustedContact}
                  onAgreementsChange={setAgreements}
                  onNext={handlePersonalNext}
                  onBack={handlePersonalBack}
                />
              )}

              {onboardingStep === 'kyc' && (
                <div className="onboarding-step">
                  <div className="step-header">
                    <h2>Identity Verification</h2>
                    <p>Verify your identity to complete account setup</p>
                  </div>

                  {kycStatus === 'failed' && (
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <div className="kyc-gate-status-card">
                        <div className="status-icon failed">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </div>
                        <h2>Verification Failed</h2>
                        <p>
                          {applicantData?.reviewResult?.rejectLabels?.join(', ') ||
                           'We could not verify your identity. Please try again with valid documents.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px' }}>
                    {!sdkReady && (
                      <div className="kyc-gate-loading">
                        <div className="spinner" />
                        <p>Loading verification...</p>
                      </div>
                    )}
                    <div
                      id="kyc-gate-container"
                      style={{ display: sdkReady ? 'block' : 'none', minHeight: '500px' }}
                    />
                  </div>

                  <div className="card kyc-gate-info-card" style={{ marginTop: '24px' }}>
                    <h3>What you'll need</h3>
                    <div className="kyc-gate-requirements">
                      <div className="requirement">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <circle cx="9" cy="10" r="2" />
                          <path d="M15 8h2M15 12h2M7 16h10" />
                        </svg>
                        <span>Valid government-issued ID</span>
                      </div>
                      <div className="requirement">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="2" width="14" height="20" rx="2" />
                          <circle cx="12" cy="9" r="3" />
                          <path d="M12 15v2" />
                        </svg>
                        <span>Device with camera for selfie</span>
                      </div>
                      <div className="requirement">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Takes about 2 minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="step-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                    <button className="btn-secondary" onClick={() => setOnboardingStep('personal')}>
                      Back
                    </button>
                    <button className="btn-primary" onClick={() => checkKYCStatus()}>
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
