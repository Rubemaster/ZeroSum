import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Widget from '../components/Widget';
import AddWidget from '../components/AddWidget';
import SearchBar from '../components/SearchBar';
import TradeWidget from '../components/TradeWidget';
import ChartWidget from '../components/ChartWidget';
import PerformanceChart from '../components/PerformanceChart';
import CashHistoryWidget from '../components/CashHistoryWidget';
import type { WidgetConfig } from '../components/AddWidget';
import './Pages.css';
import './Dashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

interface AlpacaAccount {
  id: string;
  accountNumber: string;
  status: string;
  currency: string;
  cashBalance: string;
  portfolioValue: string;
  buyingPower: string;
  equity: string;
  lastEquity: string;
  createdAt: string;
}

interface Position {
  symbol: string;
  qty: string;
  side: string;
  marketValue: string;
  costBasis: string;
  unrealizedPL: string;
  unrealizedPLPercent: string;
  currentPrice: string;
  avgEntryPrice: string;
  assetId: string;
  assetClass: string;
  filledAt: string | null;
}

interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}

interface Order {
  id: string;
  clientOrderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  qty: string;
  filledQty: string;
  filledAvgPrice: string;
  status: string;
  createdAt: string;
  filledAt: string | null;
}

interface WatchlistQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Define all available widgets
const WIDGET_REGISTRY: WidgetConfig[] = [
  { id: 'search', name: 'Search', description: 'Search stocks, ETFs, crypto', icon: '⌕' },
  { id: 'chart', name: 'Chart', description: 'Stock price chart', icon: '📈' },
  { id: 'trade', name: 'Product', description: 'View stock details and trade', icon: '⇄' },
  { id: 'stats', name: 'Account Stats', description: 'Balance, P&L, and buying power', icon: '$' },
  { id: 'performance', name: 'Portfolio Performance', description: 'Chart of your portfolio over time', icon: '↗' },
  { id: 'watchlist', name: 'Watchlist', description: 'Track your favorite stocks', icon: '★' },
  { id: 'positions', name: 'Open Positions', description: 'Your current holdings', icon: '◧' },
  { id: 'orders', name: 'Order History', description: 'Recent buy and sell orders', icon: '☰' },
  { id: 'news', name: 'Market News', description: 'Latest financial headlines', icon: '◉' },
  { id: 'movers', name: 'Top Movers', description: 'Biggest gainers and losers', icon: '⇅' },
  { id: 'cash-history', name: 'Cash History', description: 'Historical cash balance from activities', icon: '⟳' },
];

// Default active widgets
const DEFAULT_WIDGETS = ['search', 'trade', 'chart', 'stats', 'performance', 'watchlist'];

// Helper function to format time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const Dashboard = () => {
  const { getToken } = useAuth();
  const [activeWidgets, setActiveWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [watchlistQuotes, setWatchlistQuotes] = useState<WatchlistQuote[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check server health on mount
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch {
        setServerStatus('offline');
      }
    };
    checkServerHealth();
  }, []);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        console.log('[Dashboard] Fetching account from:', `${API_BASE}/api/account`);
        const token = await getToken();
        console.log('[Dashboard] Got auth token:', token ? 'Yes' : 'No');
        const response = await fetch(`${API_BASE}/api/account`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[Dashboard] Response status:', response.status);
        const data = await response.json();
        console.log('[Dashboard] Response data:', data);
        if (response.ok) {
          setAccount(data);
        } else {
          console.error('[Dashboard] Account fetch failed:', data);
        }
      } catch (err) {
        console.error('[Dashboard] Failed to fetch account:', err);
      } finally {
        setAccountLoading(false);
      }
    };
    fetchAccount();
  }, [getToken]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/positions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPositions(data);
        }
      } catch (err) {
        console.error('Failed to fetch positions:', err);
      } finally {
        setPositionsLoading(false);
      }
    };
    fetchPositions();
  }, [getToken]);

  // Fetch watchlist and quotes
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/watchlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setWatchlist(data);

          // Fetch quotes for each symbol
          if (data.symbols && data.symbols.length > 0) {
            const quotes = await Promise.all(
              data.symbols.map(async (symbol: string) => {
                try {
                  const quoteRes = await fetch(`${API_BASE}/api/market/quote/${symbol}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (quoteRes.ok) {
                    const quote = await quoteRes.json();
                    return {
                      symbol,
                      price: quote.c || 0,
                      change: quote.d || 0,
                      changePercent: quote.dp || 0,
                    };
                  }
                } catch {
                  // Ignore individual quote errors
                }
                return { symbol, price: 0, change: 0, changePercent: 0 };
              })
            );
            setWatchlistQuotes(quotes);
          }
        }
      } catch (err) {
        console.error('Failed to fetch watchlist:', err);
      } finally {
        setWatchlistLoading(false);
      }
    };
    fetchWatchlist();
  }, [getToken]);

  // Fetch order history
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [getToken]);

  const handleRemoveFromWatchlist = async (symbol: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/watchlist/${symbol}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
        setWatchlistQuotes(prev => prev.filter(q => q.symbol !== symbol));
      }
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  const handleAddToWatchlist = async (symbol: string) => {
    // Check if symbol is already in watchlist
    if (watchlist?.symbols?.includes(symbol.toUpperCase())) {
      console.log(`${symbol} is already in watchlist`);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/watchlist/${symbol}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
        // Fetch quote for the new symbol if not already present
        if (!watchlistQuotes.some(q => q.symbol === symbol.toUpperCase())) {
          const quoteRes = await fetch(`${API_BASE}/api/market/quote/${symbol}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (quoteRes.ok) {
            const quote = await quoteRes.json();
            setWatchlistQuotes(prev => [
              ...prev,
              {
                symbol: symbol.toUpperCase(),
                price: quote.c || 0,
                change: quote.d || 0,
                changePercent: quote.dp || 0,
              },
            ]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    }
  };

  const handleCloseWidget = (widgetId: string) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
  };

  const handleAddWidget = (widgetId: string) => {
    if (!activeWidgets.includes(widgetId)) {
      setActiveWidgets(prev => [...prev, widgetId]);
    }
  };

  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'search':
        return <SearchBar isWidget onSelectStock={setSelectedStock} />;

      case 'chart':
        return <ChartWidget selectedStock={selectedStock} />;

      case 'trade':
        return <TradeWidget selectedStock={selectedStock} onSelectStock={setSelectedStock} onAddToWatchlist={handleAddToWatchlist} />;

      case 'stats': {
        if (accountLoading) {
          return <div className="stats-grid-inner"><p>Loading account...</p></div>;
        }
        if (!account) {
          return <div className="stats-grid-inner"><p>No account data</p></div>;
        }
        const equity = parseFloat(account.equity || '0');
        const lastEquity = parseFloat(account.lastEquity || '0');
        const dayPL = equity - lastEquity;
        const dayPLPercent = lastEquity > 0 ? (dayPL / lastEquity) * 100 : 0;
        return (
          <div className="stats-grid-inner">
            <div className="stat-item">
              <span className="stat-label">Portfolio Value</span>
              <span className="stat-value">${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`stat-change ${dayPLPercent >= 0 ? 'positive' : 'negative'}`}>
                {dayPLPercent >= 0 ? '+' : ''}{dayPLPercent.toFixed(2)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Today's P&L</span>
              <span className="stat-value">{dayPL >= 0 ? '+' : ''}${dayPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`stat-change ${dayPL >= 0 ? 'positive' : 'negative'}`}>
                {dayPL >= 0 ? '+' : ''}{dayPLPercent.toFixed(2)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Buying Power</span>
              <span className="stat-value">${parseFloat(account.buyingPower || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="stat-change neutral">Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Cash Balance</span>
              <span className="stat-value">${parseFloat(account.cashBalance || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="stat-change neutral">{account.currency}</span>
            </div>
          </div>
        );
      }

      case 'performance':
        return <PerformanceChart />;

      case 'watchlist': {
        if (watchlistLoading) {
          return <div className="watchlist"><p>Loading watchlist...</p></div>;
        }
        if (!watchlist || watchlist.symbols.length === 0) {
          return (
            <div className="watchlist">
              <p className="no-watchlist">No stocks in watchlist</p>
              <p className="watchlist-hint">Search for stocks and add them to your watchlist</p>
            </div>
          );
        }
        return (
          <div className="watchlist">
            {watchlistQuotes.map(quote => (
              <div key={quote.symbol} className="watchlist-item" onClick={() => setSelectedStock(quote.symbol)}>
                <span className="ticker">{quote.symbol}</span>
                <span className="price">
                  {quote.price > 0 ? `$${quote.price.toFixed(2)}` : '—'}
                </span>
                <span className={`change ${quote.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                </span>
                <button
                  className="watchlist-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromWatchlist(quote.symbol);
                  }}
                  title="Remove from watchlist"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        );
      }

      case 'positions': {
        if (positionsLoading) {
          return <div className="positions-list"><p>Loading positions...</p></div>;
        }
        if (positions.length === 0) {
          return <div className="positions-list"><p className="no-positions">No open positions</p></div>;
        }
        return (
          <div className="positions-list">
            {positions.map(pos => {
              const marketValue = parseFloat(pos.marketValue || '0');
              const plPercent = parseFloat(pos.unrealizedPLPercent || '0') * 100;
              const qty = parseFloat(pos.qty || '0');
              const filledDate = pos.filledAt ? new Date(pos.filledAt) : null;
              return (
                <div key={pos.symbol} className="position-item">
                  <div className="position-info">
                    <span className="ticker">{pos.symbol}</span>
                    <span className="shares">{qty} {qty === 1 ? 'share' : 'shares'}</span>
                    {filledDate && (
                      <span className="position-filled">Filled {getTimeAgo(filledDate)}</span>
                    )}
                  </div>
                  <div className="position-value">
                    <span className="value">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className={`change ${plPercent >= 0 ? 'positive' : 'negative'}`}>
                      {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'orders': {
        if (ordersLoading) {
          return <div className="orders-list"><p>Loading orders...</p></div>;
        }
        if (orders.length === 0) {
          return <div className="orders-list"><p className="no-orders">No order history</p></div>;
        }
        return (
          <div className="orders-list">
            {orders.slice(0, 10).map(order => {
              const qty = parseFloat(order.qty || '0');
              const filledQty = parseFloat(order.filledQty || '0');
              const filledPrice = parseFloat(order.filledAvgPrice || '0');
              const orderDate = new Date(order.createdAt);
              const timeAgo = getTimeAgo(orderDate);
              return (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <div className="order-header">
                      <span className={`order-side ${order.side}`}>{order.side.toUpperCase()}</span>
                      <span className="order-symbol">{order.symbol}</span>
                    </div>
                    <span className="order-details">
                      {filledQty > 0 ? filledQty : qty} shares @ {filledPrice > 0 ? `$${filledPrice.toFixed(2)}` : 'Market'}
                    </span>
                  </div>
                  <div className="order-status-info">
                    <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                    <span className="order-time">{timeAgo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'news':
        return (
          <div className="news-list">
            <div className="news-item">
              <span className="news-time">2h ago</span>
              <p className="news-headline">Fed signals potential rate cut in upcoming meeting</p>
            </div>
            <div className="news-item">
              <span className="news-time">4h ago</span>
              <p className="news-headline">Tech stocks rally amid strong earnings reports</p>
            </div>
            <div className="news-item">
              <span className="news-time">6h ago</span>
              <p className="news-headline">Oil prices stabilize after volatile week</p>
            </div>
          </div>
        );

      case 'movers':
        return (
          <div className="movers-grid">
            <div className="movers-section">
              <span className="movers-label">Gainers</span>
              <div className="mover-item">
                <span className="ticker">NVDA</span>
                <span className="change positive">+5.67%</span>
              </div>
              <div className="mover-item">
                <span className="ticker">AMD</span>
                <span className="change positive">+4.23%</span>
              </div>
            </div>
            <div className="movers-section">
              <span className="movers-label">Losers</span>
              <div className="mover-item">
                <span className="ticker">INTC</span>
                <span className="change negative">-4.12%</span>
              </div>
              <div className="mover-item">
                <span className="ticker">BA</span>
                <span className="change negative">-3.45%</span>
              </div>
            </div>
          </div>
        );

      case 'cash-history':
        return <CashHistoryWidget />;

      default:
        return null;
    }
  };

  const getWidgetTitle = (widgetId: string) => {
    const widget = WIDGET_REGISTRY.find(w => w.id === widgetId);
    return widget?.name || 'Widget';
  };

  const getWidgetClass = (widgetId: string) => {
    if (widgetId === 'search') return 'widget-full widget-compact';
    if (widgetId === 'chart') return 'widget-three-fifth';
    if (widgetId === 'trade') return 'widget-two-fifth';
    if (widgetId === 'stats') return 'widget-full';
    if (widgetId === 'performance') return 'widget-large';
    if (widgetId === 'orders') return 'widget-two-fifth';
    if (widgetId === 'cash-history') return 'widget-large';
    return 'widget-small';
  };

  return (
    <div className="page">
      {serverStatus === 'offline' && (
        <div className="server-offline-banner">
          <span className="offline-icon">⚠</span>
          <span>Unable to connect to server. Please make sure the backend is running.</span>
        </div>
      )}

      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">
          {account ? (
            <>Account #{account.accountNumber} · {account.status}</>
          ) : (
            'Welcome back. Here\'s your portfolio overview.'
          )}
        </p>
      </div>

      <div className="dashboard-grid">
        {activeWidgets.map(widgetId => (
          <Widget
            key={widgetId}
            id={widgetId}
            title={getWidgetTitle(widgetId)}
            onClose={handleCloseWidget}
            className={getWidgetClass(widgetId)}
          >
            {renderWidgetContent(widgetId)}
          </Widget>
        ))}

        <AddWidget
          availableWidgets={WIDGET_REGISTRY}
          activeWidgetIds={activeWidgets}
          onAdd={handleAddWidget}
        />
      </div>
    </div>
  );
};

export default Dashboard;
