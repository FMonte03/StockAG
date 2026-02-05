import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  TrendingUp,
  DollarSign,
  PieChart,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VITE_API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const API_BASE_URL = VITE_API_BASE.endsWith('/api') ? VITE_API_BASE : `${VITE_API_BASE.replace(/\/$/, '')}/api`;

const formatNumber = (num) => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1.0e+12) return (num / 1.0e+12).toFixed(2) + 'T';
  if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(2) + 'B';
  if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(2) + 'M';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatPercent = (num) => {
  if (num === null || num === undefined) return 'N/A';
  return (num * 100).toFixed(2) + '%';
};

const formatCurrency = (num) => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const MetricRow = ({ label, value, highlight }) => (
  <div className="metric-row">
    <span className="metric-label">{label}</span>
    <span className={`metric-value ${highlight ? 'good-metric' : ''}`}>
      {value || 'N/A'}
    </span>
  </div>
);

const PriceChart = ({ ticker }) => {
  const [priceData, setPriceData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [loading, setLoading] = useState(true);

  const periods = ['5D', '1M', '6M', '1Y', '5Y'];

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/stock/${ticker}/price-history?period=${selectedPeriod}`);
        if (!res.ok) throw new Error("Failed to fetch price history");
        const json = await res.json();
        setPriceData(json);
      } catch (err) {
        console.error("Error fetching price history:", err);
        setPriceData([]);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) fetchPriceHistory();
  }, [ticker, selectedPeriod]);

  if (loading) return <div className="chart-loading">Loading price data...</div>;
  if (!priceData || priceData.length === 0) return <div className="chart-error">No price data available</div>;

  const prices = priceData.map(d => d.close).filter(p => p !== null && p !== undefined);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const padding = (maxPrice - minPrice) * 0.05;
  const yDomain = [minPrice - padding, maxPrice + padding];

  return (
    <div className="price-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Price History</h3>
        <div className="period-selector">
          {periods.map(period => (
            <button
              key={period}
              className={`period-button ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
          />
          <YAxis
            domain={yDomain}
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(26, 26, 46, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Close Price']}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#00d4ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const StockDetail = () => {
  const navigate = useNavigate();
  const { ticker } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/stock/${ticker}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching stock detail:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    if (ticker) fetchDetail();
  }, [ticker]);

  const handleBack = () => {
    navigate('/');
  };

  if (loading) return <div className="loading-message">Loading Analysis...</div>;
  if (!data) return <div className="loading-message error">Error loading stock data for {ticker}.</div>;

  return (
    <div className="detail-view">
      <button onClick={handleBack} className="back-button">
        <ChevronLeft size={16} /> Back to Screener
      </button>
      <div className="detail-header-card">
        <div className="header-content-left">
          <div className="ticker-price-group">
            <h2 className="detail-ticker">{data.ticker}</h2>
            <span className="detail-price">{data.current_price ? formatCurrency(data.current_price) : 'N/A'}</span>
          </div>

          <p className="detail-date">Data Snapshot: {data.snapshot_date}</p>
        </div>

        <div className="header-content-right">
          <div className={`analyst-badge ${data.analyst_rating?.includes('Buy') ? 'buy' : ''}`}>
            {data.analyst_rating || 'Neutral'}
          </div>
        </div>
      </div>
      <PriceChart ticker={ticker} />

      {/* Metrics Grid */}
      <div className="metric-grid">
        <div className="metric-card valuation">
          <div className="metric-header">
            <DollarSign size={20} />
            <h3 className="metric-title">Valuation</h3>
          </div>
          <div className="metric-list">
            <MetricRow label="Market Cap" value={formatNumber(data.market_cap)} />
            <MetricRow label="P/E (TTM)" value={data.pe_ttm?.toFixed(2)} />
            <MetricRow label="Trailing P/E" value={data.pe_trailing?.toFixed(2)} />
            <MetricRow label="PEG (5y)" value={data.peg_5y} />
          </div>
        </div>
        <div className="metric-card profitability">
          <div className="metric-header">
            <TrendingUp size={20} />
            <h3 className="metric-title">Profitability</h3>
          </div>
          <div className="metric-list">
            <MetricRow
              label="Revenue Growth (YoY)"
              value={formatPercent(data.revenue_growth_yoy)}
              highlight={data.revenue_growth_yoy > 0.15}
            />
            <MetricRow label="Profit Margin" value={formatPercent(data.profit_margin)} />
            <MetricRow label="ROE" value={formatPercent(data.roe)} />
            <MetricRow label="EPS (TTM)" value={data.eps_ttm?.toFixed(2)} />
          </div>
        </div>
        <div className="metric-card health">
          <div className="metric-header">
            <Activity size={20} />
            <h3 className="metric-title">Health</h3>
          </div>
          <div className="metric-list">
            <MetricRow
              label="Debt to Equity"
              value={data.debt_to_equity?.toFixed(2)}
              highlight={data.debt_to_equity < 1.0}
            />
            <MetricRow label="Current Ratio" value={data.current_ratio?.toFixed(2)} />
            <MetricRow label="Interest Coverage" value={data.interest_coverage?.toFixed(2)} />
            <MetricRow label="Free Cash Flow +" value={data.free_cash_flow_positive ? "Yes" : "No"} />
          </div>
        </div>

      </div>
      <div className="trading-info-card">
        <h3 className="trading-info-title">Trading Information</h3>
        <div className="trading-info-grid">
          <div className="info-box">
            <span className="info-label">52 Week Range</span>
            <span className="info-value">{data.week_range_52 || 'N/A'}</span>
          </div>
          <div className="info-box">
            <span className="info-label">Beta</span>
            <span className="info-value">{data.beta || 'N/A'}</span>
          </div>
          <div className="info-box">
            <span className="info-label">1Y Performance</span>
            <span className={`info-value ${data.perf_1y > 0 ? 'positive' : 'negative'}`}>
              {formatPercent(data.perf_1y)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;