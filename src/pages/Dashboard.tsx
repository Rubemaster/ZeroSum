import { useState } from 'react';
import Widget from '../components/Widget';
import AddWidget from '../components/AddWidget';
import SearchBar from '../components/SearchBar';
import type { WidgetConfig } from '../components/AddWidget';
import './Pages.css';
import './Dashboard.css';

// Define all available widgets
const WIDGET_REGISTRY: WidgetConfig[] = [
  { id: 'search', name: 'Search', description: 'Search stocks, ETFs, crypto', icon: '⌕' },
  { id: 'stats', name: 'Account Stats', description: 'Balance, P&L, and buying power', icon: '$' },
  { id: 'performance', name: 'Portfolio Performance', description: 'Chart of your portfolio over time', icon: '↗' },
  { id: 'watchlist', name: 'Watchlist', description: 'Track your favorite stocks', icon: '★' },
  { id: 'positions', name: 'Open Positions', description: 'Your current holdings', icon: '◧' },
  { id: 'news', name: 'Market News', description: 'Latest financial headlines', icon: '◉' },
  { id: 'movers', name: 'Top Movers', description: 'Biggest gainers and losers', icon: '⇅' },
];

// Default active widgets
const DEFAULT_WIDGETS = ['search', 'stats', 'performance', 'watchlist'];

const Dashboard = () => {
  const [activeWidgets, setActiveWidgets] = useState<string[]>(DEFAULT_WIDGETS);

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
        return <SearchBar isWidget />;

      case 'stats':
        return (
          <div className="stats-grid-inner">
            <div className="stat-item">
              <span className="stat-label">Total Balance</span>
              <span className="stat-value">$124,523.00</span>
              <span className="stat-change positive">+2.4%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Today's P&L</span>
              <span className="stat-value">+$1,234.56</span>
              <span className="stat-change positive">+0.99%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Buying Power</span>
              <span className="stat-value">$45,000.00</span>
              <span className="stat-change neutral">Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Open Positions</span>
              <span className="stat-value">12</span>
              <span className="stat-change neutral">Active</span>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="chart-placeholder">
            <span>Chart visualization goes here</span>
          </div>
        );

      case 'watchlist':
        return (
          <div className="watchlist">
            <div className="watchlist-item">
              <span className="ticker">AAPL</span>
              <span className="price">$178.23</span>
              <span className="change positive">+1.2%</span>
            </div>
            <div className="watchlist-item">
              <span className="ticker">GOOGL</span>
              <span className="price">$141.80</span>
              <span className="change negative">-0.8%</span>
            </div>
            <div className="watchlist-item">
              <span className="ticker">TSLA</span>
              <span className="price">$248.50</span>
              <span className="change positive">+3.2%</span>
            </div>
            <div className="watchlist-item">
              <span className="ticker">MSFT</span>
              <span className="price">$378.91</span>
              <span className="change positive">+0.5%</span>
            </div>
          </div>
        );

      case 'positions':
        return (
          <div className="positions-list">
            <div className="position-item">
              <div className="position-info">
                <span className="ticker">AAPL</span>
                <span className="shares">100 shares</span>
              </div>
              <div className="position-value">
                <span className="value">$17,823.00</span>
                <span className="change positive">+8.02%</span>
              </div>
            </div>
            <div className="position-item">
              <div className="position-info">
                <span className="ticker">NVDA</span>
                <span className="shares">40 shares</span>
              </div>
              <div className="position-value">
                <span className="value">$19,808.80</span>
                <span className="change positive">+3.17%</span>
              </div>
            </div>
            <div className="position-item">
              <div className="position-info">
                <span className="ticker">TSLA</span>
                <span className="shares">25 shares</span>
              </div>
              <div className="position-value">
                <span className="value">$6,212.50</span>
                <span className="change negative">-4.42%</span>
              </div>
            </div>
          </div>
        );

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
    if (widgetId === 'stats') return 'widget-full';
    if (widgetId === 'performance') return 'widget-large';
    return 'widget-small';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome back. Here's your portfolio overview.</p>
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
