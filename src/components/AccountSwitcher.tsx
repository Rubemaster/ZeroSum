import { useState, useRef, useEffect } from 'react';
import { useAccount } from '../context/AccountContext';
import type { AccountMode, IndividualAccount } from '../context/AccountContext';
import './AccountSwitcher.css';

const AccountSwitcher = () => {
  const { mode, setMode, hasIndividualAccount, isLoading, individualAccounts, activeKeyId, setActiveKey } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show if user doesn't have individual account access
  if (isLoading || !hasIndividualAccount) {
    return null;
  }

  const handleSelectBroker = () => {
    setMode('broker');
    setIsOpen(false);
  };

  const handleSelectIndividual = async (account: IndividualAccount) => {
    await setActiveKey(account.keyId);
    setMode('individual');
    setIsOpen(false);
  };

  // Get the active individual account
  const activeAccount = individualAccounts.find(a => a.keyId === activeKeyId) || individualAccounts[0];

  // Get display label for current selection
  const getCurrentLabel = () => {
    if (mode === 'broker') {
      return 'ZeroSum Account';
    }
    if (activeAccount?.accountNumber) {
      return `#${activeAccount.accountNumber}`;
    }
    return 'Individual Account';
  };

  return (
    <div className="account-switcher" ref={dropdownRef}>
      <button
        className="account-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="account-mode-indicator">
          <span className={`mode-dot ${mode}`} />
          {getCurrentLabel()}
        </span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="account-switcher-dropdown" role="listbox">
          <button
            className={`account-option ${mode === 'broker' ? 'active' : ''}`}
            onClick={handleSelectBroker}
            role="option"
            aria-selected={mode === 'broker'}
          >
            <span className="mode-dot broker" />
            <span className="option-label">ZeroSum Account</span>
            <span className="option-description">Managed brokerage account</span>
          </button>
          {individualAccounts.filter(a => !a.error).map((account) => (
            <button
              key={account.keyId}
              className={`account-option ${mode === 'individual' && activeKeyId === account.keyId ? 'active' : ''}`}
              onClick={() => handleSelectIndividual(account)}
              role="option"
              aria-selected={mode === 'individual' && activeKeyId === account.keyId}
            >
              <span className="mode-dot individual" />
              <span className="option-label">
                {account.accountNumber ? `#${account.accountNumber}` : account.name}
              </span>
              <span className="option-description">
                {account.portfolioValue
                  ? `$${parseFloat(account.portfolioValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Personal Alpaca account'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;
