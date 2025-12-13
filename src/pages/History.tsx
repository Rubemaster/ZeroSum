import './Pages.css';

const History = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1>History</h1>
        <p className="page-subtitle">Your transaction history and order log.</p>
      </div>

      <div className="filters">
        <select className="input filter-input">
          <option>All Types</option>
          <option>Buy</option>
          <option>Sell</option>
          <option>Dividend</option>
        </select>
        <select className="input filter-input">
          <option>All Time</option>
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
          <option>This Year</option>
        </select>
        <input type="text" placeholder="Search symbol..." className="input filter-input" />
      </div>

      <div className="card">
        <h2>Transactions</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Symbol</th>
              <th>Shares</th>
              <th>Price</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dec 12, 2024</td>
              <td><span className="badge buy">Buy</span></td>
              <td className="ticker">AAPL</td>
              <td>25</td>
              <td>$178.23</td>
              <td>$4,455.75</td>
              <td><span className="status filled">Filled</span></td>
            </tr>
            <tr>
              <td>Dec 11, 2024</td>
              <td><span className="badge sell">Sell</span></td>
              <td className="ticker">GOOGL</td>
              <td>10</td>
              <td>$142.50</td>
              <td>$1,425.00</td>
              <td><span className="status filled">Filled</span></td>
            </tr>
            <tr>
              <td>Dec 10, 2024</td>
              <td><span className="badge dividend">Dividend</span></td>
              <td className="ticker">MSFT</td>
              <td>-</td>
              <td>$0.75</td>
              <td>$56.25</td>
              <td><span className="status filled">Paid</span></td>
            </tr>
            <tr>
              <td>Dec 9, 2024</td>
              <td><span className="badge buy">Buy</span></td>
              <td className="ticker">NVDA</td>
              <td>15</td>
              <td>$485.00</td>
              <td>$7,275.00</td>
              <td><span className="status filled">Filled</span></td>
            </tr>
            <tr>
              <td>Dec 8, 2024</td>
              <td><span className="badge sell">Sell</span></td>
              <td className="ticker">TSLA</td>
              <td>20</td>
              <td>$252.30</td>
              <td>$5,046.00</td>
              <td><span className="status filled">Filled</span></td>
            </tr>
            <tr>
              <td>Dec 7, 2024</td>
              <td><span className="badge buy">Buy</span></td>
              <td className="ticker">AMD</td>
              <td>30</td>
              <td>$140.25</td>
              <td>$4,207.50</td>
              <td><span className="status filled">Filled</span></td>
            </tr>
            <tr>
              <td>Dec 6, 2024</td>
              <td><span className="badge buy">Buy</span></td>
              <td className="ticker">META</td>
              <td>12</td>
              <td>$318.90</td>
              <td>$3,826.80</td>
              <td><span className="status pending">Pending</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="btn-secondary" disabled>Previous</button>
        <span className="page-info">Page 1 of 24</span>
        <button className="btn-secondary">Next</button>
      </div>
    </div>
  );
};

export default History;
