import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';

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

const FilterDropdown = ({
  label,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  placeholder,
  type = 'number',
  presets = [],
  formatter = (v) => v,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [operator, setOperator] = useState('>');
  const [manualValue, setManualValue] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (valueMin) {
      setOperator('>');
      setManualValue(valueMin);
    } else if (valueMax) {
      setOperator('<');
      setManualValue(valueMax);
    } else {
      setManualValue('');
    }
  }, [valueMin, valueMax, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    onChangeMin('');
    onChangeMax('');

    if (manualValue) {
      if (operator === '>') {
        onChangeMin(manualValue);
      } else {
        onChangeMax(manualValue);
      }
    }
    setIsOpen(false);
  };

  const handlePresetClick = (preset) => {
    onChangeMin(preset.valueMin || '');
    onChangeMax(preset.valueMax || '');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChangeMin('');
    onChangeMax('');
    setManualValue('');
    setIsOpen(false);
  };

  let displayValue = 'All';
  if (valueMin) displayValue = `> ${formatter(valueMin)}`;
  if (valueMax) displayValue = `< ${formatter(valueMax)}`;

  const isActive = !!valueMin || !!valueMax;

  return (
    <div className="filter-dropdown-group" ref={dropdownRef}>
      <button
        className={`filter-button ${isActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="filter-label-text">
          {label}: <strong>{displayValue}</strong>
        </span>
        <div className="filter-actions">
          {isActive && (
            <span className="clear-filter-icon" onClick={handleClear} title="Clear filter">
              <X size={14} />
            </span>
          )}
          <ChevronDown size={14} />
        </div>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <label className="dropdown-label">Manual Setup</label>
          <div className="manual-setup-row">
            <select
              className="operator-select"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            >
              <option value=">">Above {'>'}</option>
              <option value="<">Below {'<'}</option>
            </select>
            <input
              type={type}
              step={type === 'number' ? 'any' : undefined}
              placeholder={placeholder}
              className="dropdown-input manual-input"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            />
          </div>
          <button className="apply-button" onClick={handleApply}>Apply</button>

          <div className="dropdown-divider"></div>

          <label className="dropdown-label">Presets</label>
          <div className="dropdown-presets">
            {presets.map((preset, idx) => {
              const isSelected = (preset.valueMin && preset.valueMin === valueMin) || (preset.valueMax && preset.valueMax === valueMax);
              return (
                <button
                  key={idx}
                  className={`preset-button ${isSelected ? 'active' : ''}`}
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              className={`preset-button ${!isActive ? 'active' : ''}`}
              onClick={(e) => handleClear(e)}
            >
              Clear/All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const SelectFilter = ({ label, value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = !!value;
  const displayValue = value ? options.find(o => o.value === value)?.label || value : 'All';

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  }

  return (
    <div className="filter-dropdown-group" ref={dropdownRef}>
      <button className={`filter-button ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span className="filter-label-text">{label}: <strong>{displayValue}</strong></span>
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <button className={`preset-button ${!value ? 'active' : ''}`} onClick={() => handleSelect('')}>All</button>
          {options.map(opt => (
            <button key={opt.value} className={`preset-button ${value === opt.value ? 'active' : ''}`} onClick={() => handleSelect(opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const TopFilterBar = ({ filters, setFilters }) => {

  const handleFilterChange = (updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="top-filter-bar">
      <div className="ticker-search-group">
        <Search size={16} color="#9ca3af" />
        <input
          type="text"
          placeholder="Search Ticker..."
          className="ticker-search-input"
          value={filters.ticker_search}
          onChange={(e) => handleFilterChange({ ticker_search: e.target.value })}
        />
      </div>
      <FilterDropdown
        label="Market Cap"
        valueMin={filters.min_market_cap}
        valueMax={filters.max_market_cap}
        onChangeMin={(v) => handleFilterChange({ min_market_cap: v })}
        onChangeMax={(v) => handleFilterChange({ max_market_cap: v })}
        placeholder="e.g. 1000000000"
        formatter={(v) => formatNumber(parseFloat(v))}
        presets={[
          { label: '> 1B', valueMin: '1000000000' },
          { label: '> 10B', valueMin: '10000000000' },
          { label: '> 100B', valueMin: '100000000000' },
          { label: '< 1B', valueMax: '1000000000' },
        ]}
      />
      <FilterDropdown
        label="P/E"
        valueMin={filters.min_pe}
        valueMax={filters.max_pe}
        onChangeMin={(v) => handleFilterChange({ min_pe: v })}
        onChangeMax={(v) => handleFilterChange({ max_pe: v })}
        placeholder="e.g. 25"
        presets={[
          { label: '< 15', valueMax: '15' },
          { label: '< 20', valueMax: '20' },
          { label: '> 0', valueMin: '0' },
        ]}
      />
      <FilterDropdown
        label="Rev Growth"
        valueMin={filters.min_revenue_growth}
        valueMax={filters.max_revenue_growth}
        onChangeMin={(v) => handleFilterChange({ min_revenue_growth: v })}
        onChangeMax={(v) => handleFilterChange({ max_revenue_growth: v })}
        placeholder="0.10 for 10%"
        formatter={(v) => formatPercent(parseFloat(v))}
        presets={[
          { label: '> 10%', valueMin: '0.10' },
          { label: '> 20%', valueMin: '0.20' },
        ]}
      />
      <FilterDropdown
        label="Profit Margin"
        valueMin={filters.min_profit_margin}
        valueMax={filters.max_profit_margin}
        onChangeMin={(v) => handleFilterChange({ min_profit_margin: v })}
        onChangeMax={(v) => handleFilterChange({ max_profit_margin: v })}
        placeholder="0.05 for 5%"
        formatter={(v) => formatPercent(parseFloat(v))}
        presets={[
          { label: '> 10%', valueMin: '0.10' },
          { label: '> 20%', valueMin: '0.20' },
        ]}
      />
      <FilterDropdown
        label="1Y Perf"
        valueMin={filters.min_perf_1y}
        valueMax={filters.max_perf_1y}
        onChangeMin={(v) => handleFilterChange({ min_perf_1y: v })}
        onChangeMax={(v) => handleFilterChange({ max_perf_1y: v })}
        placeholder="0.20 for 20%"
        formatter={(v) => formatPercent(parseFloat(v))}
        presets={[
          { label: '> 20%', valueMin: '0.20' },
          { label: '> 50%', valueMin: '0.50' },
          { label: '< -10%', valueMax: '-0.10' },
        ]}
      />
      <SelectFilter
        label="Analyst Rating"
        value={filters.analyst_rating}
        onChange={(v) => handleFilterChange({ analyst_rating: v })}
        options={[
          { label: 'Strong Buy', value: 'Strong Buy' },
          { label: 'Buy', value: 'Buy' },
          { label: 'Hold', value: 'Hold' },
        ]}
      />
      <button
        className={`filter-button ${filters.fcf_positive === true ? 'active' : ''}`}
        onClick={() => handleFilterChange({ fcf_positive: filters.fcf_positive ? '' : true })}
      >
        <span className="filter-label-text">FCF +</span>
      </button>

    </div>
  );
}


const SortHeader = ({ label, field, currentSort, onSort }) => (
  <th className="table-header" onClick={() => onSort(field)}>
    <div className="sortable-header-content">
      {label}
      {currentSort.field === field ? (
        currentSort.order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
      ) : (
        <ArrowUpDown size={14} className="sort-icon-default" />
      )}
    </div>
  </th>
);

const ScreenerView = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    min_market_cap: '',
    max_market_cap: '',
    min_pe: '',
    max_pe: '',
    min_revenue_growth: '',
    max_revenue_growth: '',
    min_profit_margin: '',
    max_profit_margin: '',
    min_perf_1y: '',
    max_perf_1y: '',
    fcf_positive: '',
    analyst_rating: '',
    ticker_search: ''
  });
  const [sort, setSort] = useState({
    field: 'market_cap',
    order: 'desc'
  });

  useEffect(() => {
    const currentFiltersString = JSON.stringify(filters);
    const lastFiltersString = JSON.parse(sessionStorage.getItem('lastFiltersString') || '{}');

    if (currentFiltersString !== JSON.stringify(lastFiltersString)) {
      setPagination(prev => ({ ...prev, page: 1 }));
      sessionStorage.setItem('lastFiltersString', currentFiltersString);
    }
  }, [filters]);


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStocks();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, pagination.page, sort]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        sort_by: sort.field,
        sort_order: sort.order
      });

      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          params.append(key, filters[key]);
        }
      });

      const res = await fetch(`${API_BASE_URL}/fundamentals?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      setStocks(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch stocks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleRowClick = (ticker) => {
    navigate(`/stock/${ticker}`);
  };

  return (
    <div className="screener-layout">
      <TopFilterBar filters={filters} setFilters={setFilters} />
      <div className="main-table-area">
        <div className="data-table-container">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="Ticker" field="ticker" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="Price" field="current_price" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="Mkt Cap" field="market_cap" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="P/E" field="pe_ttm" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="Rev Growth" field="revenue_growth_yoy" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="Profit Margin" field="profit_margin" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="1Y Perf" field="perf_1y" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="Rating" field="analyst_rating" currentSort={sort} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="loading-message">Loading Data...</td></tr>
                ) : stocks.length === 0 ? (
                  <tr><td colSpan="6" className="loading-message">No stocks found matching filters.</td></tr>
                ) : (
                  stocks.map((stock) => (
                    <tr
                      key={stock.ticker}
                      onClick={() => handleRowClick(stock.ticker)}
                      className="table-row"
                    >
                      <td className="table-cell ticker-cell">{stock.ticker}</td>
                      <td className="table-cell">{formatCurrency(stock.current_price)}</td>
                      <td className="table-cell">{formatNumber(stock.market_cap)}</td>
                      <td className="table-cell">
                        <span className={stock.pe_ttm < 15 && stock.pe_ttm > 0 ? 'good-metric' : ''}>
                          {stock.pe_ttm ? stock.pe_ttm.toFixed(2) : 'N/A'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={stock.revenue_growth_yoy > 0.2 ? 'excellent-metric' : ''}>
                          {formatPercent(stock.revenue_growth_yoy)}
                        </span>
                      </td>
                      <td className="table-cell">{formatPercent(stock.profit_margin)}</td>
                      <td className="table-cell">
                        <span style={{ color: stock.perf_1y > 0 ? '#10b981' : stock.perf_1y < 0 ? '#ef4444' : 'inherit' }}>
                          {formatPercent(stock.perf_1y)}
                        </span>
                      </td>
                      <td className="table-cell">{stock.analyst_rating || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-footer">
            <span className="pagination-summary">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} results)
            </span>
            <div className="pagination-controls">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="pagination-button"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={pagination.page === pagination.total_pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="pagination-button"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenerView;