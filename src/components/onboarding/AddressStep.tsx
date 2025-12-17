import AddressWidget from './AddressWidget';
import type { Address } from '../../types/onboarding';
import './OnboardingForms.css';

interface AddressStepProps {
  address: Address;
  onAddressChange: (address: Address) => void;
  onNext: () => void;
}

export default function AddressStep({ address, onAddressChange, onNext }: AddressStepProps) {
  const isValid = address.house_number && address.road && address.city && address.postcode && address.country;

  return (
    <div className="onboarding-step personal-info-step single-page">
      <div className="single-page-form">
        <div className="form-header-row">
          <h2>Home Address</h2>
        </div>
        <hr className="form-header-separator" />

        <div className="form-section" style={{ borderBottom: 'none' }}>
          <AddressWidget
            address={address}
            onAddressChange={onAddressChange}
            height={300}
          />
          <p style={{ fontSize: '0.7rem', color: '#000', margin: '8px 0 0 0' }}>
            Enter your permanent residential address. This will also be used as your country of tax residence.
          </p>
        </div>

        <div className="step-actions">
          <button className="btn-primary" onClick={onNext} disabled={!isValid}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
