import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import './PerformanceChart.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

interface Position {
  symbol: string;
  qty: string;
  marketValue: string;
  currentPrice: string;
  filledAt: string | null;
}

interface Bar {
  timestamp?: string | number;
  t?: string | number;
  time?: string | number;
  date?: string | number;
  close: number;
}

interface HistoryResponse {
  bars: Bar[];
}

type Period = '1W' | '1M' | '3M' | '1Y' | 'ALL';

const PERIOD_CONFIG: Record<Period, { range: string; interval: string }> = {
  '1W': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  'ALL': { range: '5y', interval: '1wk' },
};

const STOCK_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
];

const PerformanceChart = () => {
  const { getToken } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [stockData, setStockData] = useState<Record<string, number[]>>({});
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1M');
  const [showPercent, setShowPercent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  const symbols = useMemo(() => positions.map(p => p.symbol), [positions]);

  const symbolColors = useMemo(() => {
    const colors: Record<string, string> = {};
    symbols.forEach((symbol, index) => {
      colors[symbol] = STOCK_COLORS[index % STOCK_COLORS.length];
    });
    return colors;
  }, [symbols]);

  // Symbols sorted by market value (largest first) for stacked chart
  const sortedSymbols = useMemo(() => {
    return [...symbols].sort((a, b) => {
      const posA = positions.find(p => p.symbol === a);
      const posB = positions.find(p => p.symbol === b);
      const valueA = parseFloat(posA?.marketValue || '0');
      const valueB = parseFloat(posB?.marketValue || '0');
      return valueB - valueA;
    });
  }, [symbols, positions]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();

        // Fetch positions and account in parallel
        const [positionsRes, accountRes] = await Promise.all([
          fetch(`${API_BASE}/api/positions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/account`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!positionsRes.ok) {
          throw new Error('Failed to fetch positions');
        }

        const positionsData: Position[] = await positionsRes.json();
        setPositions(positionsData);

        if (accountRes.ok) {
          const accountData = await accountRes.json();
          setCashBalance(parseFloat(accountData.cashBalance || '0'));
        }

        if (positionsData.length === 0) {
          setStockData({});
          setTimestamps([]);
          setLoading(false);
          return;
        }

        const config = PERIOD_CONFIG[selectedPeriod];
        const historyPromises = positionsData.map(async (position) => {
          const res = await fetch(
            `${API_BASE}/api/history/${position.symbol}?range=${config.range}&interval=${config.interval}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) {
            return { symbol: position.symbol, bars: [] };
          }
          const data: HistoryResponse = await res.json();
          return { symbol: position.symbol, bars: data.bars || [] };
        });

        const historyResults = await Promise.all(historyPromises);

        const baseResult = historyResults.find(r => r.bars.length > 0);
        if (!baseResult) {
          setStockData({});
          setTimestamps([]);
          setLoading(false);
          return;
        }

        const ts = baseResult.bars.map(bar => {
          // Check multiple possible timestamp property names
          let rawValue: string | number | undefined;
          if (bar.timestamp !== undefined) {
            rawValue = bar.timestamp;
          } else if (bar.t !== undefined) {
            rawValue = bar.t;
          } else if (bar.time !== undefined) {
            rawValue = bar.time;
          } else if (bar.date !== undefined) {
            rawValue = bar.date;
          }

          if (rawValue === undefined || rawValue === null) return null;

          // Convert to Unix timestamp in seconds
          let unixSeconds: number;
          if (typeof rawValue === 'string') {
            // ISO date string like "2025-12-01T14:30:00.000Z"
            unixSeconds = Math.floor(new Date(rawValue).getTime() / 1000);
          } else if (rawValue > 10000000000) {
            // Milliseconds - convert to seconds
            unixSeconds = Math.floor(rawValue / 1000);
          } else {
            // Already in seconds
            unixSeconds = rawValue;
          }

          return unixSeconds;
        });
        setTimestamps(ts as number[]);

        const data: Record<string, number[]> = {};
        for (const result of historyResults) {
          if (result.bars.length > 0) {
            data[result.symbol] = result.bars.map(bar => bar.close);
          }
        }
        setStockData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken, selectedPeriod]);

  const renderChart = useCallback(() => {
    if (!chartRef.current || timestamps.length === 0 || Object.keys(stockData).length === 0) return;

    if (uplotRef.current) {
      uplotRef.current.destroy();
      uplotRef.current = null;
    }

    const width = chartRef.current.clientWidth;
    if (width === 0) return;

    const activeSymbols = symbols.filter(s => stockData[s]);

    let data: uPlot.AlignedData;
    let series: uPlot.Series[];

    if (showPercent) {
      // Percent mode: individual lines starting from fill date
      const seriesData: (number | null)[][] = activeSymbols.map(symbol => {
        const position = positions.find(p => p.symbol === symbol);
        const filledTimestamp = position?.filledAt
          ? Math.floor(new Date(position.filledAt).getTime() / 1000)
          : null;

        let basePrice: number | null = null;
        if (filledTimestamp) {
          const fillIndex = timestamps.findIndex(t => t >= filledTimestamp);
          if (fillIndex !== -1) {
            basePrice = stockData[symbol][fillIndex];
          }
        }

        return stockData[symbol].map((price, i) => {
          if (!filledTimestamp || timestamps[i] >= filledTimestamp) {
            if (basePrice) {
              return ((price - basePrice) / basePrice) * 100;
            }
            return price;
          }
          return null;
        });
      });

      if (seriesData.length === 0) return;

      data = [timestamps, ...seriesData];
      series = [
        {},
        ...activeSymbols.map((symbol, idx) => ({
          label: symbol,
          stroke: STOCK_COLORS[idx % STOCK_COLORS.length],
          width: 2,
        })),
      ];
    } else {
      // Stacked mode: cash at bottom, then each stock's market value
      const cashData = timestamps.map(() => cashBalance);

      // Use sortedSymbols (sorted by market value, largest first)
      const activeSortedSymbols = sortedSymbols.filter(s => stockData[s]);

      // Calculate market values for each stock (price * qty)
      const stockMarketValues: { symbol: string; values: number[] }[] = activeSortedSymbols.map(symbol => {
        const position = positions.find(p => p.symbol === symbol);
        const qty = parseFloat(position?.qty || '0');
        return {
          symbol,
          values: stockData[symbol].map(price => price * qty),
        };
      });

      // Build stacked data - each layer is cumulative
      const stackedData: number[][] = [];
      let runningTotal = [...cashData];

      // First layer is just cash
      stackedData.push([...runningTotal]);

      // Add each stock's value on top (largest first)
      for (const { values } of stockMarketValues) {
        runningTotal = runningTotal.map((val, i) => val + values[i]);
        stackedData.push([...runningTotal]);
      }

      data = [timestamps, ...stackedData];

      // Series for stacked areas - use fill with bands
      series = [
        {},
        {
          label: 'Cash',
          stroke: '#22c55e',
          fill: 'rgba(34, 197, 94, 0.3)',
          width: 1,
        },
        ...activeSortedSymbols.map((symbol, idx) => ({
          label: symbol,
          stroke: symbolColors[symbol],
          fill: symbolColors[symbol] + '4D', // 30% opacity
          width: 1,
          band: idx === 0 ? 1 : idx, // Band to previous series
        } as uPlot.Series)),
      ];
    }

    const verticalLinePlugin = {
      hooks: {
        draw: (u: uPlot) => {
          const ctx = u.ctx;
          const { left, top, width, height } = u.bbox;

          // Get the time range from the x scale
          const minTime = u.scales.x.min!;
          const maxTime = u.scales.x.max!;

          // Draw vertical lines for each position's filled date
          positions.forEach((position, idx) => {
            if (!position.filledAt || !stockData[position.symbol]) return;

            const filledTimestamp = Math.floor(new Date(position.filledAt).getTime() / 1000);
            const color = STOCK_COLORS[idx % STOCK_COLORS.length];

            // Only draw if timestamp is within the visible range
            if (filledTimestamp < minTime || filledTimestamp > maxTime) return;

            // Calculate x position using linear interpolation
            const x = left + ((filledTimestamp - minTime) / (maxTime - minTime)) * width;

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, top + height);
            ctx.stroke();
            ctx.restore();
          });
        }
      }
    };

    const opts: uPlot.Options = {
      width,
      height: 280,
      series,
      plugins: [verticalLinePlugin],
      scales: {
        x: { time: true },
        y: {
          range: (_u, dataMin, dataMax) => {
            // For stacked chart, start at 0; for percent chart, use data range with padding
            if (showPercent) {
              const pad = (dataMax - dataMin) * 0.1;
              return [dataMin - pad, dataMax + pad];
            }
            // Stacked chart: force min to 0, add 5% padding to max
            return [0, dataMax * 1.05];
          },
        },
      },
      axes: [
        {
          stroke: '#6b7280',
          grid: { show: false },
          ticks: { show: false },
        },
        {
          stroke: '#6b7280',
          grid: { stroke: 'rgba(255,255,255,0.1)' },
          ticks: { show: false },
          size: 50,
        },
      ],
      cursor: { show: true },
      legend: { show: false },
    };

    uplotRef.current = new uPlot(opts, data, chartRef.current);
  }, [timestamps, stockData, symbols, positions, showPercent, cashBalance, sortedSymbols, symbolColors]);

  useEffect(() => {
    renderChart();

    const handleResize = () => {
      if (uplotRef.current && chartRef.current) {
        const width = chartRef.current.clientWidth;
        if (width > 0) {
          uplotRef.current.setSize({ width, height: 280 });
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [renderChart]);

  const legendData = useMemo(() => {
    const result: Record<string, { percentChange: number; filledAt: string | null }> = {};

    for (const symbol of symbols) {
      const position = positions.find(p => p.symbol === symbol);
      const filledAt = position?.filledAt || null;
      const prices = stockData[symbol];

      let percentChange = 0;
      if (prices && prices.length >= 2) {
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      }

      result[symbol] = { percentChange, filledAt };
    }

    return result;
  }, [stockData, symbols, positions]);

  const formatFilledDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="performance-chart performance-loading">
        <p>Loading price history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-chart performance-error">
        <p>{error}</p>
      </div>
    );
  }

  if (timestamps.length === 0) {
    return (
      <div className="performance-chart performance-empty">
        <p>No positions to display</p>
        <p className="empty-hint">Buy stocks to see their price history</p>
      </div>
    );
  }

  return (
    <div className="performance-chart">
      <div className="performance-header">
        <div className="performance-title">
          <span className="chart-label">{showPercent ? 'Performance %' : 'Portfolio Value'}</span>
          <div className="stock-legend">
            {!showPercent && (
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#22c55e' }}></span>
                <span className="legend-symbol">Cash:</span>
                <span className="legend-value">
                  ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {(showPercent ? symbols : sortedSymbols).filter(s => stockData[s]).map((symbol) => {
              const data = legendData[symbol];
              const position = positions.find(p => p.symbol === symbol);
              const isPositive = data?.percentChange >= 0;
              return (
                <div key={symbol} className="legend-item">
                  <span className="legend-dot" style={{ background: symbolColors[symbol] }}></span>
                  <span className="legend-symbol">{symbol}:</span>
                  {showPercent ? (
                    <>
                      <span className={`legend-percent ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : ''}{data?.percentChange.toFixed(1)}%
                      </span>
                      <span className="legend-filled">
                        filled {formatFilledDate(data?.filledAt)}
                      </span>
                    </>
                  ) : (
                    <span className="legend-value">
                      ${parseFloat(position?.marketValue || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="chart-controls">
          <button
            className={`percent-toggle ${showPercent ? 'active' : ''}`}
            onClick={() => setShowPercent(!showPercent)}
          >
            %
          </button>
          <div className="period-selector">
            {(Object.keys(PERIOD_CONFIG) as Period[]).map((period) => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-container" ref={chartRef}></div>
    </div>
  );
};

export default PerformanceChart;
