import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useAccount } from '../context/AccountContext';
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
  side: 'buy' | 'sell';
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

interface CashHistoryResponse {
  timestamps: number[];
  values: number[];
  events: Array<{
    timestamp: number;
    value: number;
    change: number;
    type: string;
    label: string;
    symbol: string | null;
  }>;
  current: number;
  min: number;
  max: number;
  start: number;
  change: number;
  changePercent: number;
  count: number;
  startDate: string | null;
  endDate: string;
}

type Period = '1W' | '1M' | '3M' | '1Y' | 'ALL';

const PERIOD_CONFIG: Record<Period, { range: string; interval: string }> = {
  '1W': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  'ALL': { range: '5y', interval: '1wk' },
};

// Colors for long (green) and short (red) positions
const LONG_COLOR = '#22c55e';  // Green
const SHORT_COLOR = '#ef4444'; // Red

// Legacy colors kept for fallback/other uses
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
  const { mode, activeKeyId } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [stockData, setStockData] = useState<Record<string, number[]>>({});
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1M');
  const [showPercent, setShowPercent] = useState(false);
  const [showCashHistory, setShowCashHistory] = useState(false);
  const [cashHistory, setCashHistory] = useState<CashHistoryResponse | null>(null);
  const [cashHistoryLoading, setCashHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  const symbols = useMemo(() => positions.map(p => p.symbol), [positions]);

  const symbolColors = useMemo(() => {
    const colors: Record<string, string> = {};
    positions.forEach((position) => {
      // Use green for long positions, red for short positions
      colors[position.symbol] = position.side === 'sell' ? SHORT_COLOR : LONG_COLOR;
    });
    return colors;
  }, [positions]);

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

      // Determine endpoints based on account mode
      const positionsEndpoint = mode === 'individual' ? '/api/individual/positions' : '/api/positions';
      const accountEndpoint = mode === 'individual' ? '/api/individual/account' : '/api/account';
      const ordersEndpoint = mode === 'individual' ? '/api/individual/orders' : '/api/orders';
      const cashHistoryEndpoint = mode === 'individual' ? '/api/individual/activities' : '/api/account/cash-history';

      try {
        const token = await getToken();

        // Fetch positions, account, and orders in parallel
        const [positionsRes, accountRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE}${positionsEndpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}${accountEndpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}${ordersEndpoint}?status=all&limit=500`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!positionsRes.ok) {
          throw new Error('Failed to fetch positions');
        }

        const positionsData: Position[] = await positionsRes.json();

        // Get fill dates from orders and add to positions
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          // Find any filled order for each symbol to get the fill date and side
          for (const position of positionsData) {
            const filledOrder = ordersData.find(
              (order: { symbol: string; side: string; status: string; filledAt?: string; filled_at?: string }) =>
                order.symbol === position.symbol &&
                order.status === 'filled' &&
                (order.filledAt || order.filled_at)
            );
            if (filledOrder) {
              position.filledAt = filledOrder.filledAt || filledOrder.filled_at;
              position.side = filledOrder.side;
            }
          }
        }

        setPositions(positionsData);

        let currentAccountCash = 0;
        if (accountRes.ok) {
          const accountData = await accountRes.json();
          // Handle both broker (cashBalance) and individual (cash) field names
          currentAccountCash = parseFloat(accountData.cashBalance || accountData.cash || '0');
          setCashBalance(currentAccountCash);
        }

        // Fetch cash history for the stacked chart
        if (mode !== 'individual') {
          // Broker mode: use pre-computed cash history endpoint
          const cashHistoryRes = await fetch(`${API_BASE}${cashHistoryEndpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cashHistoryRes.ok) {
            const cashHistoryData: CashHistoryResponse = await cashHistoryRes.json();
            setCashHistory(cashHistoryData);
          }
        } else {
          // Individual mode: fetch activities and reconstruct cash history
          const activitiesRes = await fetch(`${API_BASE}/api/individual/activities`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (activitiesRes.ok) {
            const activities = await activitiesRes.json();
            const currentCash = currentAccountCash;

            // Sort activities chronologically (oldest first)
            const sortedActivities = [...activities].sort((a: { transaction_time?: string; date?: string }, b: { transaction_time?: string; date?: string }) =>
              new Date(a.transaction_time || a.date || 0).getTime() - new Date(b.transaction_time || b.date || 0).getTime()
            );

            const timestamps: number[] = [];
            const values: number[] = [];
            const events: CashHistoryResponse['events'] = [];
            let runningCash = 0;

            for (const activity of sortedActivities) {
              const timestamp = new Date(activity.transaction_time || activity.date).getTime();
              let change = 0;
              let label = '';

              if (activity.activity_type === 'FILL') {
                const qty = parseFloat(activity.qty || '0');
                const price = parseFloat(activity.price || '0');
                const side = activity.side;

                if (side === 'buy') {
                  change = -(qty * price);
                  label = `Buy ${activity.symbol}`;
                } else if (side === 'sell' || side === 'sell_short') {
                  change = qty * price;
                  label = side === 'sell_short' ? `Short ${activity.symbol}` : `Sell ${activity.symbol}`;
                } else if (side === 'buy_to_cover') {
                  change = -(qty * price);
                  label = `Cover ${activity.symbol}`;
                }
              } else if (activity.net_amount !== undefined) {
                change = parseFloat(activity.net_amount);
                switch (activity.activity_type) {
                  case 'JNLC':
                    label = change > 0 ? 'Cash Transfer In' : 'Cash Transfer Out';
                    break;
                  case 'CSD':
                  case 'TRANS':
                    label = change > 0 ? 'Deposit' : 'Withdrawal';
                    break;
                  case 'DIV':
                    label = 'Dividend';
                    break;
                  case 'INT':
                    label = 'Interest';
                    break;
                  case 'FEE':
                    label = 'Fee';
                    break;
                  default:
                    label = activity.activity_type || 'Other';
                }
              }

              runningCash += change;
              timestamps.push(timestamp);
              values.push(Math.round(runningCash * 100) / 100);
              events.push({
                timestamp,
                value: Math.round(runningCash * 100) / 100,
                change: Math.round(change * 100) / 100,
                type: activity.activity_type,
                label,
                symbol: activity.symbol || null
              });
            }

            // Add current point
            const now = Date.now();
            timestamps.push(now);
            values.push(currentCash);

            const startCash = values[0] || 0;
            const totalChange = currentCash - startCash;

            setCashHistory({
              timestamps,
              values,
              events,
              current: currentCash,
              min: Math.min(...values),
              max: Math.max(...values),
              start: startCash,
              change: Math.round(totalChange * 100) / 100,
              changePercent: startCash > 0 ? Math.round((totalChange / startCash) * 10000) / 100 : 0,
              count: activities.length,
              startDate: timestamps[0] ? new Date(timestamps[0]).toISOString() : null,
              endDate: new Date(now).toISOString()
            });
          } else {
            setCashHistory(null);
          }
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
  }, [getToken, selectedPeriod, mode, activeKeyId]);

  // Fetch cash history when toggled (broker mode only)
  useEffect(() => {
    if (!showCashHistory) return;
    // Skip for individual mode - cash history not available in same format
    if (mode === 'individual') {
      setCashHistoryLoading(false);
      return;
    }

    const fetchCashHistory = async () => {
      setCashHistoryLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/account/cash-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: CashHistoryResponse = await res.json();
          setCashHistory(data);
        }
      } catch (err) {
        console.error('Failed to fetch cash history:', err);
      } finally {
        setCashHistoryLoading(false);
      }
    };

    fetchCashHistory();
  }, [showCashHistory, getToken, mode, activeKeyId]);

  const renderChart = useCallback(() => {
    if (!chartRef.current) return;

    // For cash history mode, check cashHistory data
    if (showCashHistory) {
      if (!cashHistory || cashHistory.timestamps.length === 0) return;
    } else {
      // For portfolio mode, check stock data
      if (timestamps.length === 0 || Object.keys(stockData).length === 0) return;
    }

    if (uplotRef.current) {
      uplotRef.current.destroy();
      uplotRef.current = null;
    }

    const width = chartRef.current.clientWidth;
    if (width === 0) return;

    let data: uPlot.AlignedData;
    let series: uPlot.Series[];

    // Cash History mode
    if (showCashHistory && cashHistory) {
      // Convert timestamps from ms to seconds for uPlot
      const tsSeconds = cashHistory.timestamps.map(t => Math.floor(t / 1000));

      data = [tsSeconds, cashHistory.values];
      series = [
        {},
        {
          label: 'Cash',
          stroke: '#888888',
          fill: 'rgba(136, 136, 136, 0.2)',
          width: 2,
        },
      ];

      const opts: uPlot.Options = {
        width,
        height: 280,
        series,
        scales: {
          x: { time: true },
          y: {
            range: (_u, dataMin, dataMax) => {
              const pad = (dataMax - dataMin) * 0.1 || 100;
              return [Math.max(0, dataMin - pad), dataMax + pad];
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
            size: 60,
            values: (_u, vals) => vals.map(v => '$' + v.toLocaleString()),
          },
        ],
        cursor: { show: true },
        legend: { show: false },
      };

      uplotRef.current = new uPlot(opts, data, chartRef.current);
      return;
    }

    // Portfolio mode (existing logic)
    const activeSymbols = symbols.filter(s => stockData[s]);

    if (showPercent) {
      // Percent mode: individual lines starting from fill date
      // Add a flat 0% line for cash
      const cashPercentData = timestamps.map(() => 0);

      const seriesData: (number | null)[][] = activeSymbols.map(symbol => {
        const position = positions.find(p => p.symbol === symbol);
        const filledTimestamp = position?.filledAt
          ? Math.floor(new Date(position.filledAt).getTime() / 1000)
          : null;
        const isShort = position?.side === 'sell';

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
              // Short positions profit when price decreases
              if (isShort) {
                return ((basePrice - price) / basePrice) * 100;
              }
              return ((price - basePrice) / basePrice) * 100;
            }
            return price;
          }
          return null;
        });
      });

      data = [timestamps, cashPercentData, ...seriesData];
      series = [
        {},
        {
          label: 'Cash',
          stroke: '#888888',
          width: 2,
          dash: [5, 5],
        },
        ...activeSymbols.map((symbol) => ({
          label: symbol,
          stroke: symbolColors[symbol],
          width: 2,
        })),
      ];
    } else {
      // Stacked mode: cash at bottom, then each stock's market value
      // Use historical cash values if available, interpolated to match stock timestamps
      const cashData = timestamps.map(ts => {
        if (!cashHistory || cashHistory.timestamps.length === 0) {
          return cashBalance;
        }

        // Convert stock timestamp (seconds) to ms for comparison with cash history (ms)
        const tsMs = ts * 1000;

        // If timestamp is before the first cash history entry, return 0
        if (tsMs < cashHistory.timestamps[0]) {
          return 0;
        }

        // Find the cash value at or before this timestamp
        let cashValue = 0;

        for (let i = 0; i < cashHistory.timestamps.length; i++) {
          if (cashHistory.timestamps[i] <= tsMs) {
            cashValue = cashHistory.values[i];
          } else {
            break;
          }
        }

        return cashValue;
      });

      // Use sortedSymbols (sorted by market value, largest first)
      const activeSortedSymbols = sortedSymbols.filter(s => stockData[s]);

      // Calculate market values for each stock (price * qty)
      // Only show value after the position was opened (filledAt)
      // Use absolute value to show market exposure for both long and short positions
      const stockMarketValues: { symbol: string; values: number[] }[] = activeSortedSymbols.map(symbol => {
        const position = positions.find(p => p.symbol === symbol);
        const qty = parseFloat(position?.qty || '0');
        const filledAtMs = position?.filledAt ? new Date(position.filledAt).getTime() : null;

        return {
          symbol,
          values: stockData[symbol].map((price, i) => {
            // If we have a filledAt date and this timestamp is before it, return 0
            if (filledAtMs) {
              const tsMs = timestamps[i] * 1000;
              if (tsMs < filledAtMs) {
                return 0;
              }
            }
            // Use absolute value to handle short positions (negative qty)
            return Math.abs(price * qty);
          }),
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
          stroke: '#888888',
          fill: 'rgba(136, 136, 136, 0.3)',
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
          positions.forEach((position) => {
            if (!position.filledAt || !stockData[position.symbol]) return;

            const filledTimestamp = Math.floor(new Date(position.filledAt).getTime() / 1000);
            const color = symbolColors[position.symbol];

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

    // Plugin to show symbol labels at cursor intersection points
    const hoverLabelPlugin = {
      hooks: {
        setCursor: (u: uPlot) => {
          // Trigger redraw when cursor moves
          u.redraw();
        },
        drawCursor: (u: uPlot) => {
          if (u.cursor.left === undefined || u.cursor.left < 0) return;

          const ctx = u.ctx;
          const { left, top } = u.bbox;
          const cursorLeft = u.cursor.left;

          // For each series, find the Y value at cursor position and draw label
          u.series.forEach((series, seriesIdx) => {
            if (seriesIdx === 0 || !series.show) return; // Skip x-axis series

            const dataIdx = u.posToIdx(cursorLeft);
            if (dataIdx < 0 || dataIdx >= u.data[0].length) return;

            const yVal = u.data[seriesIdx]?.[dataIdx];
            if (yVal == null) return;

            const yPos = u.valToPos(yVal, 'y', true);

            // Draw symbol label at intersection
            ctx.save();
            ctx.fillStyle = (series.stroke as string) || '#fff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            // Add a background for better visibility
            const label = series.label || '';
            const textMetrics = ctx.measureText(label);
            const padding = 3;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
              left + cursorLeft + 5,
              top + yPos - 14,
              textMetrics.width + padding * 2,
              14
            );
            ctx.fillStyle = (series.stroke as string) || '#fff';
            ctx.fillText(label, left + cursorLeft + 5 + padding, top + yPos - 2);
            ctx.restore();
          });
        }
      }
    };

    const opts: uPlot.Options = {
      width,
      height: 280,
      series,
      plugins: [verticalLinePlugin, hoverLabelPlugin],
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
  }, [timestamps, stockData, symbols, positions, showPercent, cashBalance, sortedSymbols, symbolColors, showCashHistory, cashHistory]);

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
      const isShort = position?.side === 'sell';
      const prices = stockData[symbol];

      let percentChange = 0;
      if (prices && prices.length >= 2) {
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        // Short positions profit when price decreases
        if (isShort) {
          percentChange = ((firstPrice - lastPrice) / firstPrice) * 100;
        } else {
          percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
        }
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

  // Handle empty state for portfolio mode (not cash history)
  if (!showCashHistory && timestamps.length === 0) {
    return (
      <div className="performance-chart performance-empty">
        <div className="chart-controls" style={{ justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            className={`percent-toggle ${showCashHistory ? 'active' : ''}`}
            onClick={() => setShowCashHistory(!showCashHistory)}
            title="Show Cash History"
          >
            $
          </button>
        </div>
        <p>No positions to display</p>
        <p className="empty-hint">Buy stocks to see their price history</p>
      </div>
    );
  }

  // Cash history loading state
  if (showCashHistory && cashHistoryLoading) {
    return (
      <div className="performance-chart performance-loading">
        <p>Loading cash history...</p>
      </div>
    );
  }

  return (
    <div className="performance-chart">
      <div className="performance-header">
        <div className="performance-title">
          <span className="chart-label">
            {showCashHistory ? 'Cash Balance History' : (showPercent ? 'Performance %' : 'Portfolio Value')}
          </span>
          <div className="stock-legend">
            {showCashHistory && cashHistory ? (
              <>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#888888' }}></span>
                  <span className="legend-symbol">Current:</span>
                  <span className="legend-value">
                    ${cashHistory.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="legend-item">
                  <span className={`legend-percent ${cashHistory.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    {cashHistory.changePercent >= 0 ? '+' : ''}{cashHistory.changePercent.toFixed(1)}%
                  </span>
                  <span className="legend-filled">
                    from ${cashHistory.start.toLocaleString()}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#888888' }}></span>
                  <span className="legend-symbol">Cash:</span>
                  {showPercent ? (
                    <span className="legend-percent neutral">0.0%</span>
                  ) : (
                    <span className="legend-value">
                      ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
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
              </>
            )}
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
