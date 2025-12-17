import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './Pages.css';
import './KYC.css';

type VerificationStatus = 'loading' | 'ready' | 'pending' | 'completed' | 'failed';

interface ApplicantData {
  applicantId?: string;
  reviewStatus?: string;
  reviewResult?: {
    reviewAnswer?: string;
    rejectLabels?: string[];
  };
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// Declare Sumsub types
interface SumsubSdkBuilder {
  on: (event: string, callback: (...args: unknown[]) => void) => SumsubSdkBuilder;
  build: () => { launch: (containerId: string) => void };
}

declare global {
  interface Window {
    snsWebSdk: {
      init: (
        accessToken: string,
        getNewToken: () => Promise<string>
      ) => {
        withConf: (conf: { lang?: string; theme?: string }) => {
          withOptions: (options: { addViewportTag?: boolean; adaptIframeHeight?: boolean }) => SumsubSdkBuilder;
        };
      };
    };
  }
}

const KYC = () => {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [applicantData, setApplicantData] = useState<ApplicantData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkLaunched = useRef(false);

  // Check existing verification status
  const checkStatus = useCallback(async () => {
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

        // Determine status from review result
        if (data.reviewStatus === 'completed') {
          if (data.reviewResult?.reviewAnswer === 'GREEN') {
            setStatus('completed');
            return true;
          } else if (data.reviewResult?.reviewAnswer === 'RED') {
            setStatus('failed');
            return true;
          }
        } else if (data.reviewStatus === 'pending') {
          setStatus('pending');
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to check KYC status:', err);
      return false;
    }
  }, [getToken]);

  // Check verification status immediately on mount
  useEffect(() => {
    const checkInitialStatus = async () => {
      const alreadyVerified = await checkStatus();
      if (!alreadyVerified) {
        // Only load SDK if not already verified
        if (document.getElementById('sumsub-websdk')) {
          setSdkLoaded(true);
          return;
        }

        const script = document.createElement('script');
        script.id = 'sumsub-websdk';
        script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js';
        script.async = true;
        script.onload = () => setSdkLoaded(true);
        script.onerror = () => setError('Failed to load verification SDK');
        document.head.appendChild(script);
      }
    };

    checkInitialStatus();
  }, [checkStatus]);

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
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to get verification token');
    }

    const data = await response.json();
    return data.token;
  }, [getToken]);

  // Initialize Sumsub SDK
  const launchSdk = useCallback(async () => {
    if (!sdkLoaded || !window.snsWebSdk || sdkLaunched.current) return;

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
          setError('Verification encountered an error. Please try again.');
        })
        .on('idCheck.applicantStatus', (payload: unknown) => {
          console.log('Applicant status:', payload);
          const statusPayload = payload as { reviewStatus?: string; reviewResult?: { reviewAnswer?: string } };

          if (statusPayload.reviewStatus === 'completed') {
            if (statusPayload.reviewResult?.reviewAnswer === 'GREEN') {
              setStatus('completed');
            } else if (statusPayload.reviewResult?.reviewAnswer === 'RED') {
              setStatus('failed');
            }
          } else if (statusPayload.reviewStatus === 'pending') {
            setStatus('pending');
          }
        })
        .build();

      snsWebSdkInstance.launch('#sumsub-container');
      sdkLaunched.current = true;
      setStatus('ready');
    } catch (err) {
      console.error('Failed to launch Sumsub SDK:', err);
      setError(err instanceof Error ? err.message : 'Failed to start verification');
    }
  }, [sdkLoaded, getAccessToken]);

  // Launch SDK when ready
  useEffect(() => {
    if (sdkLoaded && status === 'loading') {
      launchSdk();
    }
  }, [sdkLoaded, status, launchSdk]);

  // Retry verification
  const handleRetry = () => {
    setError(null);
    setStatus('loading');
    sdkLaunched.current = false;
    launchSdk();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Identity Verification</h1>
        <p className="page-subtitle">Verify your identity to unlock all trading features</p>
      </div>

      <div className="kyc-container">
        {status === 'completed' ? (
          <div className="kyc-success">
            <div className="kyc-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Verification Successful</h2>
            <p>Your identity has been verified. You now have full access to all trading features.</p>
            <button className="kyc-btn kyc-btn-primary" onClick={() => window.location.href = '/'}>
              Continue to Dashboard
            </button>
          </div>
        ) : status === 'pending' ? (
          <div className="kyc-pending">
            <div className="kyc-pending-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2>Verification In Progress</h2>
            <p>Your documents are being reviewed. This usually takes a few minutes.</p>
            <button className="kyc-btn kyc-btn-secondary" onClick={() => checkStatus()}>
              Check Status
            </button>
          </div>
        ) : status === 'failed' ? (
          <div className="kyc-failed">
            <div className="kyc-failed-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2>Verification Failed</h2>
            <p>
              {applicantData?.reviewResult?.rejectLabels?.join(', ') ||
               'We could not verify your identity. Please try again with clear, valid documents.'}
            </p>
            <button className="kyc-btn kyc-btn-primary" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        ) : error ? (
          <div className="kyc-error">
            <div className="kyc-error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button className="kyc-btn kyc-btn-primary" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Loading overlay - shown above SDK container */}
            {status === 'loading' && (
              <div className="kyc-sdk-container">
                <div className="kyc-loading">
                  <span className="kyc-spinner" />
                  <p>Loading verification...</p>
                </div>
              </div>
            )}

            {/* Sumsub SDK container - React won't touch its children */}
            <div
              ref={containerRef}
              id="sumsub-container"
              className="kyc-sdk-container"
              style={{ display: status === 'loading' ? 'none' : 'block', minHeight: '500px' }}
            />

            <div className="kyc-info">
              <h4>What you'll need</h4>
              <div className="kyc-features">
                <div className="kyc-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="M15 8h2M15 12h2M7 16h10" />
                  </svg>
                  <span>Valid government ID</span>
                </div>
                <div className="kyc-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <circle cx="12" cy="9" r="3" />
                    <path d="M12 15v2" />
                  </svg>
                  <span>Smartphone or webcam</span>
                </div>
                <div className="kyc-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Takes about 2 minutes</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KYC;
