import './Pages.css';

const Portfolio = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Portfolio</h1>
        <p className="page-subtitle">Your holdings and positions.</p>
      </div>

      <div className="card">
        <h2>Holdings</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Shares</th>
              <th>Avg Cost</th>
              <th>Current Price</th>
              <th>Market Value</th>
              <th>P&L</th>
              <th>% Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ticker">AAPL</td>
              <td>100</td>
              <td>$165.00</td>
              <td>$178.23</td>
              <td>$17,823.00</td>
              <td className="positive">+$1,323.00</td>
              <td className="positive">+8.02%</td>
            </tr>
            <tr>
              <td className="ticker">GOOGL</td>
              <td>50</td>
              <td>$135.50</td>
              <td>$141.80</td>
              <td>$7,090.00</td>
              <td className="positive">+$315.00</td>
              <td className="positive">+4.65%</td>
            </tr>
            <tr>
              <td className="ticker">TSLA</td>
              <td>25</td>
              <td>$260.00</td>
              <td>$248.50</td>
              <td>$6,212.50</td>
              <td className="negative">-$287.50</td>
              <td className="negative">-4.42%</td>
            </tr>
            <tr>
              <td className="ticker">MSFT</td>
              <td>75</td>
              <td>$350.00</td>
              <td>$378.91</td>
              <td>$28,418.25</td>
              <td className="positive">+$2,168.25</td>
              <td className="positive">+8.26%</td>
            </tr>
            <tr>
              <td className="ticker">NVDA</td>
              <td>40</td>
              <td>$480.00</td>
              <td>$495.22</td>
              <td>$19,808.80</td>
              <td className="positive">+$608.80</td>
              <td className="positive">+3.17%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="content-grid">
        <div className="card">
          <h2>Allocation</h2>
          <div className="allocation-list">
            <div className="allocation-item">
              <span className="allocation-label">Technology</span>
              <div className="allocation-bar">
                <div className="allocation-fill" style={{ width: '65%' }}></div>
              </div>
              <span className="allocation-percent">65%</span>
            </div>
            <div className="allocation-item">
              <span className="allocation-label">Healthcare</span>
              <div className="allocation-bar">
                <div className="allocation-fill" style={{ width: '15%' }}></div>
              </div>
              <span className="allocation-percent">15%</span>
            </div>
            <div className="allocation-item">
              <span className="allocation-label">Finance</span>
              <div className="allocation-bar">
                <div className="allocation-fill" style={{ width: '12%' }}></div>
              </div>
              <span className="allocation-percent">12%</span>
            </div>
            <div className="allocation-item">
              <span className="allocation-label">Other</span>
              <div className="allocation-bar">
                <div className="allocation-fill" style={{ width: '8%' }}></div>
              </div>
              <span className="allocation-percent">8%</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h2>Summary</h2>
          <div className="summary-list">
            <div className="summary-item">
              <span className="summary-label">Total Investment</span>
              <span className="summary-value">$120,395.45</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Current Value</span>
              <span className="summary-value">$124,523.00</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Return</span>
              <span className="summary-value positive">+$4,127.55</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Return %</span>
              <span className="summary-value positive">+3.43%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
