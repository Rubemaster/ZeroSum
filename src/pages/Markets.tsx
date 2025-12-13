import './Pages.css';

const Markets = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Markets</h1>
        <p className="page-subtitle">Live market data and trends.</p>
      </div>

      <div className="market-indices">
        <div className="index-card">
          <span className="index-name">S&P 500</span>
          <span className="index-value">4,567.89</span>
          <span className="index-change positive">+0.85%</span>
        </div>
        <div className="index-card">
          <span className="index-name">NASDAQ</span>
          <span className="index-value">14,234.56</span>
          <span className="index-change positive">+1.23%</span>
        </div>
        <div className="index-card">
          <span className="index-name">DOW</span>
          <span className="index-value">35,678.12</span>
          <span className="index-change negative">-0.32%</span>
        </div>
        <div className="index-card">
          <span className="index-name">VIX</span>
          <span className="index-value">18.45</span>
          <span className="index-change negative">-2.15%</span>
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <h2>Top Gainers</h2>
          <div className="market-list">
            <div className="market-item">
              <span className="ticker">NVDA</span>
              <span className="company">NVIDIA Corp</span>
              <span className="price">$495.22</span>
              <span className="change positive">+5.67%</span>
            </div>
            <div className="market-item">
              <span className="ticker">AMD</span>
              <span className="company">Advanced Micro</span>
              <span className="price">$145.80</span>
              <span className="change positive">+4.23%</span>
            </div>
            <div className="market-item">
              <span className="ticker">META</span>
              <span className="company">Meta Platforms</span>
              <span className="price">$325.44</span>
              <span className="change positive">+3.89%</span>
            </div>
            <div className="market-item">
              <span className="ticker">TSLA</span>
              <span className="company">Tesla Inc</span>
              <span className="price">$248.50</span>
              <span className="change positive">+3.21%</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h2>Top Losers</h2>
          <div className="market-list">
            <div className="market-item">
              <span className="ticker">INTC</span>
              <span className="company">Intel Corp</span>
              <span className="price">$34.56</span>
              <span className="change negative">-4.12%</span>
            </div>
            <div className="market-item">
              <span className="ticker">BA</span>
              <span className="company">Boeing Co</span>
              <span className="price">$198.23</span>
              <span className="change negative">-3.45%</span>
            </div>
            <div className="market-item">
              <span className="ticker">DIS</span>
              <span className="company">Walt Disney</span>
              <span className="price">$89.67</span>
              <span className="change negative">-2.89%</span>
            </div>
            <div className="market-item">
              <span className="ticker">PFE</span>
              <span className="company">Pfizer Inc</span>
              <span className="price">$28.90</span>
              <span className="change negative">-2.34%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Most Active</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company</th>
              <th>Price</th>
              <th>Change</th>
              <th>Volume</th>
              <th>Market Cap</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ticker">AAPL</td>
              <td>Apple Inc</td>
              <td>$178.23</td>
              <td className="positive">+1.2%</td>
              <td>89.5M</td>
              <td>$2.8T</td>
            </tr>
            <tr>
              <td className="ticker">TSLA</td>
              <td>Tesla Inc</td>
              <td>$248.50</td>
              <td className="positive">+3.2%</td>
              <td>78.2M</td>
              <td>$789B</td>
            </tr>
            <tr>
              <td className="ticker">NVDA</td>
              <td>NVIDIA Corp</td>
              <td>$495.22</td>
              <td className="positive">+5.7%</td>
              <td>65.4M</td>
              <td>$1.2T</td>
            </tr>
            <tr>
              <td className="ticker">AMD</td>
              <td>Advanced Micro</td>
              <td>$145.80</td>
              <td className="positive">+4.2%</td>
              <td>52.1M</td>
              <td>$235B</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Markets;
