import { useState, useRef, useEffect } from 'react';
import filtersConfig from '../config/searchFilters.json';
import './SearchBar.css';

interface FilterConfig {
  id: string;
  label: string;
  type: 'range' | 'multiselect' | 'select';
  graphic?: 'histogram';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  histogramData?: number[];
  options?: string[] | { value: string; label: string }[];
}

interface ActiveFilter {
  id: string;
  label: string;
  value: string | string[] | [number, number];
  displayValue: string;
}

interface SearchBarProps {
  isWidget?: boolean;
}

const SearchBar = ({ isWidget = false }: SearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterConfig | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetInputRef = useRef<HTMLInputElement>(null);

  const filters = filtersConfig.filters as FilterConfig[];

  // Mock search results for widget
  const mockResults = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.23, change: 1.2 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.12, change: -0.5 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 156.78, change: 2.3 },
    { symbol: 'ABNB', name: 'Airbnb Inc.', price: 142.50, change: 0.8 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -0.8 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 0.5 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: 3.2 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 495.22, change: 5.67 },
  ];

  const filteredResults = searchQuery.length > 0
    ? mockResults.filter(r =>
        r.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockResults; // Show all results when no search query

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowFilterDropdown(false);
        setSelectedFilter(null);
      }
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsWidgetExpanded(false);
        setShowFilterDropdown(false);
        setSelectedFilter(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setShowFilterDropdown(false);
      setSelectedFilter(null);
    }
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== filterId));
  };

  const addFilter = (filter: FilterConfig) => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  const applyRangeFilter = (filter: FilterConfig, min: number, max: number) => {
    const displayValue = filter.unit
      ? `${filter.unit}${min} - ${filter.unit}${max}`
      : `${min} - ${max}`;

    setActiveFilters(prev => {
      const existing = prev.filter(f => f.id !== filter.id);
      return [...existing, {
        id: filter.id,
        label: filter.label,
        value: [min, max],
        displayValue
      }];
    });
    setSelectedFilter(null);
  };

  const applyMultiSelectFilter = (filter: FilterConfig, selected: string[]) => {
    if (selected.length === 0) {
      removeFilter(filter.id);
      setSelectedFilter(null);
      return;
    }

    const displayValue = selected.length > 2
      ? `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`
      : selected.join(', ');

    setActiveFilters(prev => {
      const existing = prev.filter(f => f.id !== filter.id);
      return [...existing, {
        id: filter.id,
        label: filter.label,
        value: selected,
        displayValue
      }];
    });
    setSelectedFilter(null);
  };

  const applySelectFilter = (filter: FilterConfig, value: string, label: string) => {
    setActiveFilters(prev => {
      const existing = prev.filter(f => f.id !== filter.id);
      return [...existing, {
        id: filter.id,
        label: filter.label,
        value,
        displayValue: label
      }];
    });
    setSelectedFilter(null);
  };

  const availableFilters = filters.filter(
    f => !activeFilters.some(af => af.id === f.id)
  );

  // Widget mode - expands in place, pushing other widgets down
  if (isWidget) {
    return (
      <div className={`search-widget ${isWidgetExpanded ? 'expanded' : ''}`} ref={widgetRef}>
        {/* Search Input */}
        <div className="search-widget-input-wrapper">
          <svg className="search-widget-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-widget-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsWidgetExpanded(true)}
            ref={widgetInputRef}
          />
          {isWidgetExpanded && (
            <button
              className="search-widget-close"
              onClick={() => {
                setIsWidgetExpanded(false);
                setShowFilterDropdown(false);
                setSelectedFilter(null);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Expanded Content */}
        {isWidgetExpanded && (
          <div className="search-widget-body">
            {/* Filters Row - includes active filters and add button */}
            <div className="search-widget-filters-row">
              {activeFilters.map(filter => (
                <div key={filter.id} className="search-widget-filter-tag">
                  <span className="filter-tag-label">{filter.label}:</span>
                  <span className="filter-tag-value">{filter.displayValue}</span>
                  <button
                    className="filter-tag-remove"
                    onClick={() => removeFilter(filter.id)}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add Filter Button - inline with filters */}
              <div className="search-widget-add-filter-wrapper">
                <button
                  className="search-widget-add-filter"
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    setSelectedFilter(null);
                  }}
                  disabled={availableFilters.length === 0}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>

                {(showFilterDropdown || selectedFilter) && (
                  <div className="search-widget-filter-dropdown">
                    {selectedFilter ? (
                      /* Filter Editor inside dropdown */
                      <div className="search-widget-dropdown-editor">
                        <WidgetFilterEditor
                          filter={selectedFilter}
                          onApplyRange={applyRangeFilter}
                          onApplyMultiSelect={applyMultiSelectFilter}
                          onApplySelect={applySelectFilter}
                          onBack={() => {
                            setSelectedFilter(null);
                            setShowFilterDropdown(true);
                          }}
                        />
                      </div>
                    ) : (
                      /* Filter selection list */
                      availableFilters.map(filter => (
                        <button
                          key={filter.id}
                          className="search-widget-filter-option"
                          onClick={() => addFilter(filter)}
                        >
                          {filter.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Results Table */}
            <div className="search-widget-results">
              {filteredResults.length > 0 ? (
                <table className="search-results-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map(result => (
                      <tr key={result.symbol}>
                        <td className="result-symbol">{result.symbol}</td>
                        <td className="result-name">{result.name}</td>
                        <td className="result-price">${result.price.toFixed(2)}</td>
                        <td className={`result-change ${result.change >= 0 ? 'positive' : 'negative'}`}>
                          {result.change >= 0 ? '+' : ''}{result.change.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="search-widget-no-results">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="search-bar-container" ref={searchRef}>
      {!isExpanded ? (
        <button className="search-toggle" onClick={handleToggle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      ) : (
        <div className="search-expanded">
          <div className="search-header">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search stocks, ETFs, crypto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="search-close" onClick={handleToggle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="active-filters">
              {activeFilters.map(filter => (
                <div key={filter.id} className="filter-tag">
                  <span className="filter-tag-label">{filter.label}:</span>
                  <span className="filter-tag-value">{filter.displayValue}</span>
                  <button
                    className="filter-tag-remove"
                    onClick={() => removeFilter(filter.id)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Filter Section */}
          <div className="filter-section">
            <button
              className="add-filter-btn"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              disabled={availableFilters.length === 0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Filter
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="filter-dropdown">
                {availableFilters.map(filter => (
                  <button
                    key={filter.id}
                    className="filter-option"
                    onClick={() => addFilter(filter)}
                  >
                    <span className="filter-option-label">{filter.label}</span>
                    <span className="filter-option-type">{filter.type}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Filter Editor */}
            {selectedFilter && (
              <FilterEditor
                filter={selectedFilter}
                onApplyRange={applyRangeFilter}
                onApplyMultiSelect={applyMultiSelectFilter}
                onApplySelect={applySelectFilter}
                onCancel={() => setSelectedFilter(null)}
              />
            )}
          </div>

          {/* Search Button */}
          <button className="search-submit">
            Search
          </button>
        </div>
      )}
    </div>
  );
};

// Widget Filter Editor Component - styled for dropdown
interface WidgetFilterEditorProps {
  filter: FilterConfig;
  onApplyRange: (filter: FilterConfig, min: number, max: number) => void;
  onApplyMultiSelect: (filter: FilterConfig, selected: string[]) => void;
  onApplySelect: (filter: FilterConfig, value: string, label: string) => void;
  onBack: () => void;
}

const WidgetFilterEditor = ({ filter, onApplyRange, onApplyMultiSelect, onApplySelect, onBack }: WidgetFilterEditorProps) => {
  const [rangeMin, setRangeMin] = useState(filter.min ?? 0);
  const [rangeMax, setRangeMax] = useState(filter.max ?? 100);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  if (filter.type === 'range') {
    const minVal = filter.min ?? 0;
    const maxVal = filter.max ?? 100;
    const step = filter.step ?? 1;

    return (
      <>
        <div className="widget-dropdown-header">
          <button className="widget-dropdown-back" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span>{filter.label}</span>
        </div>
        <div className="widget-dropdown-content">
          {/* Range display */}
          <div className="widget-range-display">
            <span>{filter.unit}{rangeMin}</span>
            <span>{filter.unit}{rangeMax}</span>
          </div>

          {/* Dual range slider */}
          <div className="widget-dual-slider">
            <div
              className="widget-slider-track-fill"
              style={{
                left: `${((rangeMin - minVal) / (maxVal - minVal)) * 100}%`,
                right: `${100 - ((rangeMax - minVal) / (maxVal - minVal)) * 100}%`
              }}
            />
            <input
              type="range"
              className="widget-slider widget-slider-min"
              min={minVal}
              max={maxVal}
              step={step}
              value={rangeMin}
              onChange={(e) => setRangeMin(Math.min(Number(e.target.value), rangeMax - step))}
            />
            <input
              type="range"
              className="widget-slider widget-slider-max"
              min={minVal}
              max={maxVal}
              step={step}
              value={rangeMax}
              onChange={(e) => setRangeMax(Math.max(Number(e.target.value), rangeMin + step))}
            />
          </div>

          <button
            className="widget-dropdown-apply"
            onClick={() => onApplyRange(filter, rangeMin, rangeMax)}
          >
            Apply
          </button>
        </div>
      </>
    );
  }

  if (filter.type === 'multiselect') {
    const options = filter.options as string[];
    return (
      <>
        <div className="widget-dropdown-header">
          <button className="widget-dropdown-back" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span>{filter.label}</span>
        </div>
        <div className="widget-dropdown-content">
          <div className="widget-multiselect-options">
            {options.map(option => (
              <label key={option} className="widget-multiselect-option">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span className="widget-checkbox"></span>
                <span>{option}</span>
              </label>
            ))}
          </div>
          <button
            className="widget-dropdown-apply"
            onClick={() => onApplyMultiSelect(filter, selectedOptions)}
          >
            Apply {selectedOptions.length > 0 && `(${selectedOptions.length})`}
          </button>
        </div>
      </>
    );
  }

  if (filter.type === 'select') {
    const options = filter.options as { value: string; label: string }[];
    return (
      <>
        <div className="widget-dropdown-header">
          <button className="widget-dropdown-back" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span>{filter.label}</span>
        </div>
        <div className="widget-dropdown-content">
          {options.map(option => (
            <button
              key={option.value}
              className="widget-select-option"
              onClick={() => onApplySelect(filter, option.value, option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </>
    );
  }

  return null;
};

// Filter Editor Component
interface FilterEditorProps {
  filter: FilterConfig;
  onApplyRange: (filter: FilterConfig, min: number, max: number) => void;
  onApplyMultiSelect: (filter: FilterConfig, selected: string[]) => void;
  onApplySelect: (filter: FilterConfig, value: string, label: string) => void;
  onCancel: () => void;
}

const FilterEditor = ({ filter, onApplyRange, onApplyMultiSelect, onApplySelect, onCancel }: FilterEditorProps) => {
  const [rangeMin, setRangeMin] = useState(filter.min ?? 0);
  const [rangeMax, setRangeMax] = useState(filter.max ?? 100);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  if (filter.type === 'range') {
    const maxVal = filter.max ?? 100;
    const histogramData = filter.histogramData ?? [];
    const maxHistogramValue = Math.max(...histogramData);

    return (
      <div className="filter-editor">
        <div className="filter-editor-header">
          <span>{filter.label}</span>
          <button className="filter-editor-close" onClick={onCancel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Histogram */}
        {filter.graphic === 'histogram' && histogramData.length > 0 && (
          <div className="histogram">
            {histogramData.map((value, index) => (
              <div
                key={index}
                className="histogram-bar"
                style={{ height: `${(value / maxHistogramValue) * 100}%` }}
              />
            ))}
          </div>
        )}

        {/* Range Inputs */}
        <div className="range-inputs">
          <div className="range-input-group">
            <label>Min</label>
            <input
              type="number"
              value={rangeMin}
              onChange={(e) => setRangeMin(Number(e.target.value))}
              min={filter.min}
              max={rangeMax}
              step={filter.step}
            />
          </div>
          <span className="range-separator">to</span>
          <div className="range-input-group">
            <label>Max</label>
            <input
              type="number"
              value={rangeMax}
              onChange={(e) => setRangeMax(Number(e.target.value))}
              min={rangeMin}
              max={maxVal}
              step={filter.step}
            />
          </div>
        </div>

        {/* Dual Range Slider */}
        <div className="dual-range-slider">
          <input
            type="range"
            min={filter.min}
            max={filter.max}
            value={rangeMin}
            onChange={(e) => setRangeMin(Math.min(Number(e.target.value), rangeMax - (filter.step ?? 1)))}
            className="range-slider range-slider-min"
          />
          <input
            type="range"
            min={filter.min}
            max={filter.max}
            value={rangeMax}
            onChange={(e) => setRangeMax(Math.max(Number(e.target.value), rangeMin + (filter.step ?? 1)))}
            className="range-slider range-slider-max"
          />
        </div>

        <button
          className="filter-apply-btn"
          onClick={() => onApplyRange(filter, rangeMin, rangeMax)}
        >
          Apply
        </button>
      </div>
    );
  }

  if (filter.type === 'multiselect') {
    const options = filter.options as string[];

    return (
      <div className="filter-editor">
        <div className="filter-editor-header">
          <span>{filter.label}</span>
          <button className="filter-editor-close" onClick={onCancel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="multiselect-options">
          {options.map(option => (
            <label key={option} className="multiselect-option">
              <input
                type="checkbox"
                checked={selectedOptions.includes(option)}
                onChange={() => toggleOption(option)}
              />
              <span className="checkbox-custom"></span>
              <span>{option}</span>
            </label>
          ))}
        </div>

        <button
          className="filter-apply-btn"
          onClick={() => onApplyMultiSelect(filter, selectedOptions)}
        >
          Apply {selectedOptions.length > 0 && `(${selectedOptions.length})`}
        </button>
      </div>
    );
  }

  if (filter.type === 'select') {
    const options = filter.options as { value: string; label: string }[];

    return (
      <div className="filter-editor">
        <div className="filter-editor-header">
          <span>{filter.label}</span>
          <button className="filter-editor-close" onClick={onCancel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="select-options">
          {options.map(option => (
            <button
              key={option.value}
              className="select-option"
              onClick={() => onApplySelect(filter, option.value, option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SearchBar;
