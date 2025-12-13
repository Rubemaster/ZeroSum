import { useState } from 'react';
import './TradeWidget.css';

interface TradeWidgetProps {
  selectedStock: string | null;
  onSelectStock: (symbol: string) => void;
}

// Mock stock data
const stockData: Record<string, { name: string; price: number; change: number }> = {
  AAPL: { name: 'Apple Inc.', price: 178.23, change: 1.2 },
  AMZN: { name: 'Amazon.com Inc.', price: 178.12, change: -0.5 },
  AMD: { name: 'Advanced Micro Devices', price: 156.78, change: 2.3 },
  ABNB: { name: 'Airbnb Inc.', price: 142.50, change: 0.8 },
  GOOGL: { name: 'Alphabet Inc.', price: 141.80, change: -0.8 },
  MSFT: { name: 'Microsoft Corp.', price: 378.91, change: 0.5 },
  TSLA: { name: 'Tesla Inc.', price: 248.50, change: 3.2 },
  NVDA: { name: 'NVIDIA Corp.', price: 495.22, change: 5.67 },
};

const TradeWidget = ({ selectedStock, onSelectStock }: TradeWidgetProps) => {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('1');

  const stock = selectedStock ? stockData[selectedStock] : null;
  const totalValue = stock ? stock.price * (parseInt(quantity) || 0) : 0;

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
      {/* Large Ticker Display */}
      <div className="trade-ticker-section">
        <div className="trade-ticker">{selectedStock}</div>
        <div className="trade-company">{stock.name}</div>
        <button
          className="trade-clear"
          onClick={() => onSelectStock('')}
          aria-label="Clear selection"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Price Info */}
      <div className="trade-price-section">
        <span className="trade-price">${stock.price.toFixed(2)}</span>
        <span className={`trade-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
        </span>
      </div>

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

      {/* Quantity Input */}
      <div className="trade-quantity-section">
        <label className="trade-label">Quantity</label>
        <div className="trade-quantity-input">
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

      {/* Total */}
      <div className="trade-total-section">
        <span className="trade-label">Estimated Total</span>
        <span className="trade-total">${totalValue.toFixed(2)}</span>
      </div>

      {/* Submit Button */}
      <button className={`trade-submit ${orderType}`}>
        {orderType === 'buy' ? 'Buy' : 'Sell'} {selectedStock}
      </button>
    </div>
  );
};

export default TradeWidget;
