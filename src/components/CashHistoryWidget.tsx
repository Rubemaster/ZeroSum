import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './CashHistoryWidget.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

interface CashHistoryResponse {
  // Chart data arrays
  timestamps: number[];
  values: number[];

  // Event markers
  events: Array<{
    timestamp: number;
    value: number;
    change: number;
    type: string;
    label: string;
    symbol: string | null;
  }>;

  // Summary stats
  current: number;
  min: number;
  max: number;
  start: number;
  change: number;
  changePercent: number;

  // Metadata
  count: number;
  startDate: string | null;
  endDate: string;
}

const CashHistoryWidget = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState<CashHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCashHistory = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/account/cash-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          const err = await response.json();
          setError(err.error || 'Failed to fetch cash history');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchCashHistory();
  }, [getToken]);

  if (loading) {
    return <div className="cash-history-widget"><p>Loading cash history...</p></div>;
  }

  if (error) {
    return <div className="cash-history-widget"><p className="error">Error: {error}</p></div>;
  }

  return (
    <div className="cash-history-widget">
      <textarea
        className="json-output"
        defaultValue={JSON.stringify(data, null, 2)}
        spellCheck={false}
      />
    </div>
  );
};

export default CashHistoryWidget;
