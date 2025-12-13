import { useState, useEffect, useRef } from 'react';
import './Pages.css';
import './KYC.css';

type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface VerificationResult {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentNumber: string;
  country: string;
}

const KYC = () => {
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In production, you would initialize the third-party SDK here.
    //
    // Example with Veriff (https://veriff.com):
    // const veriff = Veriff({ apiKey: 'YOUR_API_KEY', parentId: 'veriff-container' });
    // veriff.mount();
    //
    // Example with Onfido (https://onfido.com):
    // Onfido.init({ token: 'YOUR_SDK_TOKEN', containerId: 'onfido-container', onComplete: handleComplete });
    //
    // Example with IDAnalyzer CoreAPI Web SDK:
    // new IDAnalyzer.CoreAPI({ apiKey: 'YOUR_KEY', container: '#idanalyzer-container' });
    //
    // Example with Persona (https://withpersona.com):
    // const client = new Persona.Client({ templateId: 'tmpl_xxx', environmentId: 'env_xxx' });
    // client.open();
    //
    // Example with Jumio (https://jumio.com):
    // JumioWebSDK.init({ authorizationToken: 'YOUR_TOKEN', container: 'jumio-container' });

    // For demo purposes, we simulate the SDK loading
    const timer = setTimeout(() => {
      setStatus('in_progress');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // This would be called by the third-party SDK's callback
  const handleVerificationComplete = (data: VerificationResult) => {
    setResult(data);
    setStatus('completed');
  };

  // Simulate completing verification (for demo only)
  const simulateComplete = () => {
    handleVerificationComplete({
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1990-05-15',
      documentNumber: 'D12345678',
      country: 'United States'
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Identity Verification</h1>
        <p className="page-subtitle">Verify your identity to unlock all trading features</p>
      </div>

      <div className="kyc-container">
        {status === 'completed' && result ? (
          <div className="kyc-success">
            <div className="kyc-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Verification Successful</h2>
            <p>Your identity has been verified</p>

            <div className="kyc-extracted-data">
              <h3>Verified Information</h3>
              <div className="kyc-data-grid">
                <div className="kyc-data-item">
                  <span className="kyc-data-label">Full Name</span>
                  <span className="kyc-data-value">{result.firstName} {result.lastName}</span>
                </div>
                <div className="kyc-data-item">
                  <span className="kyc-data-label">Date of Birth</span>
                  <span className="kyc-data-value">{result.dateOfBirth}</span>
                </div>
                <div className="kyc-data-item">
                  <span className="kyc-data-label">Document Number</span>
                  <span className="kyc-data-value">{result.documentNumber}</span>
                </div>
                <div className="kyc-data-item">
                  <span className="kyc-data-label">Country</span>
                  <span className="kyc-data-value">{result.country}</span>
                </div>
              </div>
            </div>

            <button className="kyc-btn kyc-btn-primary" onClick={() => window.location.href = '/'}>
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Third-party SDK container */}
            <div
              ref={containerRef}
              id="verification-container"
              className="kyc-sdk-container"
            >
              {status === 'pending' && (
                <div className="kyc-loading">
                  <span className="kyc-spinner" />
                  <p>Loading verification...</p>
                </div>
              )}

              {status === 'in_progress' && (
                <div className="kyc-sdk-placeholder">
                  {/* This is where the third-party SDK iframe/widget renders */}
                  <div className="kyc-sdk-demo">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="9" cy="10" r="2" />
                      <path d="M15 8h2" />
                      <path d="M15 12h2" />
                      <path d="M7 16h10" />
                    </svg>
                    <h3>Third-Party Verification Widget</h3>
                    <p>In production, the ID verification SDK (Veriff, Onfido, Persona, etc.) renders here and handles:</p>
                    <ul>
                      <li>Document capture (front/back)</li>
                      <li>Selfie/liveness check</li>
                      <li>Data extraction (OCR)</li>
                      <li>Fraud detection</li>
                    </ul>
                    <button className="kyc-btn kyc-btn-primary" onClick={simulateComplete}>
                      Simulate Verification Complete
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="kyc-providers">
              <h4>Recommended Verification Providers</h4>
              <div className="kyc-provider-list">
                <div className="kyc-provider">
                  <strong>Veriff</strong>
                  <span>From $1/verification</span>
                </div>
                <div className="kyc-provider">
                  <strong>Onfido</strong>
                  <span>From $2/verification</span>
                </div>
                <div className="kyc-provider">
                  <strong>Persona</strong>
                  <span>From $1/verification</span>
                </div>
                <div className="kyc-provider">
                  <strong>IDAnalyzer</strong>
                  <span>From $0.10/scan</span>
                </div>
              </div>
            </div>

            <div className="kyc-info">
              <h4>Why third-party verification?</h4>
              <p>We use industry-leading verification providers to ensure security and compliance. Your data is processed securely by the verification provider and only the verified results are shared with us.</p>
              <div className="kyc-features">
                <div className="kyc-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>PCI-DSS compliant</span>
                </div>
                <div className="kyc-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>SOC 2 certified</span>
                </div>
                <div className="kyc-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Under 60 seconds</span>
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
