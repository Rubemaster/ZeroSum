import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://zerosumserver.onrender.com';

type AccountMode = 'broker' | 'individual';

interface IndividualAccount {
  keyId: string;
  name: string;
  apiKeyId: string;
  accountNumber?: string;
  status?: string;
  portfolioValue?: string;
  cash?: string;
  buyingPower?: string;
  error?: string;
}

interface AccountContextType {
  mode: AccountMode;
  setMode: (mode: AccountMode) => void;
  hasIndividualAccount: boolean;
  isLoading: boolean;
  apiKeyCount: number;
  individualAccounts: IndividualAccount[];
  activeKeyId: string | null;
  setActiveKey: (keyId: string) => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [mode, setMode] = useState<AccountMode>('broker');
  const [hasIndividualAccount, setHasIndividualAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyCount, setApiKeyCount] = useState(0);
  const [individualAccounts, setIndividualAccounts] = useState<IndividualAccount[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setHasIndividualAccount(false);
      setApiKeyCount(0);
      setIndividualAccounts([]);
      setActiveKeyId(null);
      setIsLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/user/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const hasAccess = data.hasRetailApiAccess === true;
          setHasIndividualAccount(hasAccess);

          // If user has access, fetch individual accounts with Alpaca info
          if (hasAccess) {
            const accountsResponse = await fetch(`${API_BASE}/api/user/individual-accounts`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (accountsResponse.ok) {
              const accountsData = await accountsResponse.json();
              const accounts = accountsData.accounts || [];
              setIndividualAccounts(accounts);
              setApiKeyCount(accounts.length);
              setActiveKeyId(accountsData.activeKeyId || null);
              // Only enable individual mode if they have at least one working account
              if (accounts.length === 0 || accounts.every((a: IndividualAccount) => a.error)) {
                setHasIndividualAccount(false);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to check account access:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [getToken, isSignedIn]);

  // Persist mode preference in localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('accountMode') as AccountMode | null;
    if (savedMode && (savedMode === 'broker' || savedMode === 'individual')) {
      // Only set individual mode if user has access
      if (savedMode === 'individual' && hasIndividualAccount) {
        setMode(savedMode);
      } else {
        setMode('broker');
      }
    }
  }, [hasIndividualAccount]);

  const handleSetMode = (newMode: AccountMode) => {
    // Only allow individual mode if user has access
    if (newMode === 'individual' && !hasIndividualAccount) {
      return;
    }
    setMode(newMode);
    localStorage.setItem('accountMode', newMode);
  };

  const handleSetActiveKey = async (keyId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/user/set-active-key`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyId }),
      });
      if (response.ok) {
        setActiveKeyId(keyId);
      }
    } catch (err) {
      console.error('Failed to set active key:', err);
    }
  };

  return (
    <AccountContext.Provider
      value={{
        mode,
        setMode: handleSetMode,
        hasIndividualAccount,
        isLoading,
        apiKeyCount,
        individualAccounts,
        activeKeyId,
        setActiveKey: handleSetActiveKey,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}

export type { AccountMode, IndividualAccount };
