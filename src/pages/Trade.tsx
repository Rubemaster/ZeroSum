import './Pages.css';

const Trade = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Trade</h1>
        <p className="page-subtitle">Execute trades across markets.</p>
      </div>

      <div className="trade-layout">
        <div className="card trade-form-card">
          <h2>Place Order</h2>
          <div className="trade-form">
            <div className="form-group">
              <label>Symbol</label>
              <input type="text" placeholder="e.g., AAPL" className="input" />
            </div>
            <div className="form-group">
              <label>Order Type</label>
              <select className="input">
                <option>Market</option>
                <option>Limit</option>
                <option>Stop</option>
                <option>Stop Limit</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" placeholder="0" className="input" />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="number" placeholder="0.00" className="input" />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-buy">Buy</button>
              <button className="btn-sell">Sell</button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Order Book</h2>
          <div className="order-book">
            <div className="order-book-header">
              <span>Price</span>
              <span>Size</span>
              <span>Total</span>
            </div>
            <div className="asks">
              <div className="order-row ask">
                <span>$179.50</span>
                <span>150</span>
                <span>$26,925</span>
              </div>
              <div className="order-row ask">
                <span>$179.45</span>
                <span>200</span>
                <span>$35,890</span>
              </div>
              <div className="order-row ask">
                <span>$179.40</span>
                <span>350</span>
                <span>$62,790</span>
              </div>
            </div>
            <div className="spread">
              <span>Spread: $0.05 (0.03%)</span>
            </div>
            <div className="bids">
              <div className="order-row bid">
                <span>$179.35</span>
                <span>400</span>
                <span>$71,740</span>
              </div>
              <div className="order-row bid">
                <span>$179.30</span>
                <span>250</span>
                <span>$44,825</span>
              </div>
              <div className="order-row bid">
                <span>$179.25</span>
                <span>180</span>
                <span>$32,265</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;
