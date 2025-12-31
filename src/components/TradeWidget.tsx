import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useAccount } from '../context/AccountContext';
import './TradeWidget.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

interface TradeWidgetProps {
  selectedStock: string | null;
  onSelectStock: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string) => void;
}

interface StockQuote {
  name: string;
  price: number;
  change: number;
}

// Fallback stock data if API fails
const fallbackData: Record<string, StockQuote> = {
  AAPL: { name: 'Apple Inc.', price: 178.23, change: 1.2 },
  AMZN: { name: 'Amazon.com Inc.', price: 178.12, change: -0.5 },
  AMD: { name: 'Advanced Micro Devices', price: 156.78, change: 2.3 },
  GOOGL: { name: 'Alphabet Inc.', price: 141.80, change: -0.8 },
  MSFT: { name: 'Microsoft Corp.', price: 378.91, change: 0.5 },
  TSLA: { name: 'Tesla Inc.', price: 248.50, change: 3.2 },
  NVDA: { name: 'NVIDIA Corp.', price: 495.22, change: 5.67 },
};

const TradeWidget = ({ selectedStock, onAddToWatchlist }: TradeWidgetProps) => {
  const { getToken } = useAuth();
  const { mode } = useAccount();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('1');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stock, setStock] = useState<StockQuote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch stock quote when selected stock changes
  useEffect(() => {
    if (!selectedStock) {
      setStock(null);
      return;
    }

    const fetchQuote = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/market/quote/${selectedStock}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setStock({
            name: data.name || selectedStock,
            price: data.c || 0,
            change: data.dp || 0,
          });
        } else {
          // Use fallback data
          setStock(fallbackData[selectedStock] || { name: selectedStock, price: 0, change: 0 });
        }
      } catch {
        setStock(fallbackData[selectedStock] || { name: selectedStock, price: 0, change: 0 });
      }
    };

    fetchQuote();
  }, [selectedStock, getToken]);

  const totalValue = stock ? stock.price * (parseInt(quantity) || 0) : 0;

  const handlePlaceOrder = async () => {
    if (!selectedStock || !stock || mode !== 'individual') return;

    setIsSubmitting(true);
    setOrderResult(null);

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/individual/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedStock,
          qty: parseInt(quantity),
          side: orderType,
          type: 'market',
          time_in_force: 'day',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOrderResult({
          success: true,
          message: `Order placed: ${orderType.toUpperCase()} ${quantity} ${selectedStock}`,
        });
        // Reset form
        setQuantity('1');
        setStopLoss('');
        setTakeProfit('');
      } else {
        setOrderResult({
          success: false,
          message: data.error || 'Failed to place order',
        });
      }
    } catch (err) {
      setOrderResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear order result after 5 seconds
  useEffect(() => {
    if (orderResult) {
      const timer = setTimeout(() => setOrderResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [orderResult]);

  const canTrade = mode === 'individual';

  if (!selectedStock || !stock) {
    return (
      <div className="trade-widget trade-widget-empty">
        <div className="trade-empty-icon">⌕</div>
        <p className="trade-empty-text">Select a stock to trade</p>
        <p className="trade-empty-hint">Use the search widget to find stocks</p>
      </div>
    );
  }

  return (
    <div className="trade-widget">
      <div className="trade-layout">
        {/* Left Side - Ticker & Price */}
        <div className="trade-left">
          <div className="trade-ticker-section">
            <div className="trade-ticker">{selectedStock}</div>
            <div className="trade-company">{stock.name}</div>
          </div>
          <div className="trade-price-section">
            <span className="trade-price">${stock.price.toFixed(2)}</span>
            <span className={`trade-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
            </span>
          </div>
          <div className="trade-total-section">
            <span className="trade-label">Total</span>
            <span className="trade-total">${totalValue.toFixed(2)}</span>
          </div>
          {onAddToWatchlist && (
            <button
              className="trade-watchlist-btn"
              onClick={() => onAddToWatchlist(selectedStock)}
              title="Add to watchlist"
            >
              <span className="watchlist-icon">★</span>
              Add to Watchlist
            </button>
          )}
        </div>

        {/* Right Side - Order Controls */}
        <div className="trade-right">
          {/* Order Type Toggle */}
          <div className="trade-type-toggle">
            <button
              className={`trade-type-btn ${orderType === 'buy' ? 'active buy' : ''}`}
              onClick={() => setOrderType('buy')}
            >
              Buy
            </button>
            <button
              className={`trade-type-btn ${orderType === 'sell' ? 'active sell' : ''}`}
              onClick={() => setOrderType('sell')}
            >
              Sell
            </button>
          </div>

          {/* Quantity */}
          <div className="trade-control-group">
            <label className="trade-label">Qty</label>
            <div className="trade-compact-input">
              <button
                className="trade-qty-btn"
                onClick={() => setQuantity(String(Math.max(1, (parseInt(quantity) || 1) - 1)))}
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="trade-qty-field"
              />
              <button
                className="trade-qty-btn"
                onClick={() => setQuantity(String((parseInt(quantity) || 0) + 1))}
              >
                +
              </button>
            </div>
          </div>

          {/* SL/TP Row */}
          <div className="trade-sl-tp-row">
            <div className="trade-control-group">
              <label className="trade-label">SL</label>
              <div className="trade-price-input">
                <span className="trade-input-prefix">$</span>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder={(stock.price * 0.95).toFixed(0)}
                  className="trade-sl-tp-field"
                />
                <div className="trade-price-arrows">
                  <button
                    className="trade-arrow-btn"
                    onClick={() => setStopLoss(String(Math.round((parseFloat(stopLoss) || stock.price * 0.95) + 1)))}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    className="trade-arrow-btn"
                    onClick={() => setStopLoss(String(Math.max(0, Math.round((parseFloat(stopLoss) || stock.price * 0.95) - 1))))}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="trade-control-group">
              <label className="trade-label">TP</label>
              <div className="trade-price-input">
                <span className="trade-input-prefix">$</span>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder={(stock.price * 1.1).toFixed(0)}
                  className="trade-sl-tp-field"
                />
                <div className="trade-price-arrows">
                  <button
                    className="trade-arrow-btn"
                    onClick={() => setTakeProfit(String(Math.round((parseFloat(takeProfit) || stock.price * 1.1) + 1)))}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    className="trade-arrow-btn"
                    onClick={() => setTakeProfit(String(Math.max(0, Math.round((parseFloat(takeProfit) || stock.price * 1.1) - 1))))}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Result Message */}
          {orderResult && (
            <div className={`trade-result ${orderResult.success ? 'success' : 'error'}`}>
              {orderResult.message}
            </div>
          )}

          {/* Submit Button */}
          {canTrade ? (
            <button
              className={`trade-submit ${orderType}`}
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !stock.price}
            >
              {isSubmitting ? 'Placing...' : orderType === 'buy' ? 'Buy' : 'Sell'}
            </button>
          ) : (
            <div className="trade-disabled-notice">
              <p>Trading is only available with your Individual Account</p>
              <p className="trade-disabled-hint">Switch to Individual Account in the navigation to trade</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeWidget;
