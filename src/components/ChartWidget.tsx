import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './ChartWidget.css';

interface ChartWidgetProps {
  selectedStock: string | null;
}

interface Bar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockData {
  name: string;
  price: number;
  change: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  bars: Bar[];
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://zerosumserver.onrender.com';

const TIME_RANGE_CONFIG: Record<TimeRange, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  'ALL': { range: '5y', interval: '1wk' },
};

const ChartWidget = ({ selectedStock }: ChartWidgetProps) => {
  const { getToken } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticker = selectedStock || 'AAPL';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const config = TIME_RANGE_CONFIG[timeRange];
        const response = await fetch(
          `${API_BASE}/api/history/${ticker}?range=${config.range}&interval=${config.interval}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }

        const data = await response.json();

        if (!data.bars || data.bars.length === 0) {
          throw new Error('No data available');
        }

        const bars: Bar[] = data.bars;
        const latestBar = bars[bars.length - 1];
        const firstBar = bars[0];

        const priceChange = ((latestBar.close - firstBar.close) / firstBar.close) * 100;

        // Calculate high/low/volume for the period
        const periodHigh = Math.max(...bars.map(b => b.high));
        const periodLow = Math.min(...bars.map(b => b.low));
        const totalVolume = bars.reduce((sum, b) => sum + b.volume, 0);

        setStockData({
          name: data.meta?.longName || data.meta?.shortName || ticker,
          price: latestBar.close,
          change: priceChange,
          open: firstBar.open,
          high: periodHigh,
          low: periodLow,
          volume: totalVolume,
          bars,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker, timeRange, getToken]);

  const generateChartPath = () => {
    if (!stockData || stockData.bars.length === 0) {
      return '';
    }

    const bars = stockData.bars;
    const width = 100;
    const height = 60;
    const padding = 5;

    const prices = bars.map(b => b.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const points = bars.map((bar, index) => {
      const x = (index / (bars.length - 1)) * width;
      const y = padding + ((maxPrice - bar.close) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const chartPath = generateChartPath();
  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  const isPositive = stockData ? stockData.change >= 0 : true;

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
    return vol.toString();
  };

  return (
    <div className="chart-widget">
      <div className="chart-header">
        <div className="chart-stock-info">
          <span className="chart-ticker">{ticker}</span>
          <span className="chart-company">
            {loading ? 'Loading...' : stockData?.name || ticker}
          </span>
        </div>
        <div className="chart-price-info">
          {stockData && (
            <>
              <span className="chart-price">${stockData.price.toFixed(2)}</span>
              <span className={`chart-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{stockData.change.toFixed(2)}%
              </span>
            </>
          )}
        </div>
      </div>

      <div className="chart-container">
        {loading && (
          <div className="chart-loading">Loading chart data...</div>
        )}
        {error && (
          <div className="chart-error">{error}</div>
        )}
        {!loading && !error && stockData && (
          <>
            <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="chart-svg">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={`${chartPath} L 100,60 L 0,60 Z`}
                fill="url(#chartGradient)"
              />
              {/* Line */}
              <path
                d={chartPath}
                fill="none"
                stroke={isPositive ? '#4ade80' : '#f87171'}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Price labels */}
            <div className="chart-y-labels">
              <span>${stockData.high.toFixed(0)}</span>
              <span>${((stockData.high + stockData.low) / 2).toFixed(0)}</span>
              <span>${stockData.low.toFixed(0)}</span>
            </div>
          </>
        )}
      </div>

      <div className="chart-time-selector">
        {timeRanges.map((range) => (
          <button
            key={range}
            className={`chart-time-btn ${timeRange === range ? 'active' : ''}`}
            onClick={() => setTimeRange(range)}
          >
            {range}
          </button>
        ))}
      </div>

      <div className="chart-stats">
        <div className="chart-stat">
          <span className="chart-stat-label">Open</span>
          <span className="chart-stat-value">
            {stockData ? `$${stockData.open.toFixed(2)}` : '--'}
          </span>
        </div>
        <div className="chart-stat">
          <span className="chart-stat-label">High</span>
          <span className="chart-stat-value">
            {stockData ? `$${stockData.high.toFixed(2)}` : '--'}
          </span>
        </div>
        <div className="chart-stat">
          <span className="chart-stat-label">Low</span>
          <span className="chart-stat-value">
            {stockData ? `$${stockData.low.toFixed(2)}` : '--'}
          </span>
        </div>
        <div className="chart-stat">
          <span className="chart-stat-label">Vol</span>
          <span className="chart-stat-value">
            {stockData ? formatVolume(stockData.volume) : '--'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChartWidget;
