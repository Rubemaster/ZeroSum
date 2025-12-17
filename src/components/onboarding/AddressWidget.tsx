import { useState, useEffect, useRef, useCallback } from 'react';
import { searchAddress, reverseGeocode, COUNTRIES } from '../../services/nominatim';
import { getRegionsFromOSM } from '../../services/overpass';
import type { AdminRegion } from '../../services/overpass';
import MapView from './MapView';
import type { Address, SearchResult, Coordinates } from '../../types/onboarding';

interface AddressWidgetProps {
  address?: Address;
  onAddressChange: (address: Address) => void;
  height?: number;
  className?: string;
}

// Auto-sizing input that adjusts width based on content
interface AutoSizeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
}

function AutoSizeInput({ value, onChange, placeholder, className = '', minWidth = 40, maxWidth = 200 }: AutoSizeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const updateWidth = useCallback(() => {
    if (!inputRef.current || !measureRef.current) return;
    const text = value || placeholder;
    measureRef.current.textContent = text;
    const width = Math.min(Math.max(measureRef.current.offsetWidth + 8, minWidth), maxWidth);
    inputRef.current.style.width = `${width}px`;
  }, [value, placeholder, minWidth, maxWidth]);

  useEffect(() => {
    updateWidth();
  }, [updateWidth]);

  return (
    <span className="auto-size-input-wrapper">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`inline-input auto-size ${className}`}
      />
      <span ref={measureRef} className="auto-size-measure" aria-hidden="true" />
    </span>
  );
}

// Auto-sizing select that adjusts width based on selected option
interface AutoSizeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  disabled?: boolean;
}

function AutoSizeSelect({ value, onChange, options, placeholder = '', className = '', minWidth = 40, maxWidth = 200, disabled = false }: AutoSizeSelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const updateWidth = useCallback(() => {
    if (!selectRef.current || !measureRef.current) return;
    const selectedOption = options.find(o => o.value === value);
    const text = selectedOption?.label || placeholder || options[0]?.label || '';
    measureRef.current.textContent = text;
    const width = Math.min(Math.max(measureRef.current.offsetWidth + 20, minWidth), maxWidth); // +20 for chevron
    selectRef.current.style.width = `${width}px`;
  }, [value, options, placeholder, minWidth, maxWidth]);

  useEffect(() => {
    updateWidth();
  }, [updateWidth]);

  return (
    <span className="auto-size-input-wrapper">
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`inline-input auto-size ${className}`}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span ref={measureRef} className="auto-size-measure" aria-hidden="true" />
    </span>
  );
}

export default function AddressWidget({
  address,
  onAddressChange,
  height = 260,
  className = '',
}: AddressWidgetProps) {
  const [isEditing, setIsEditing] = useState(!address?.city);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 40.7128, lng: -74.006 });
  const [markerPosition, setMarkerPosition] = useState<Coordinates | null>(null);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const [regions, setRegions] = useState<AdminRegion[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);

  // Load regions when country changes
  useEffect(() => {
    if (address?.country && isInlineEditing) {
      setIsLoadingRegions(true);
      getRegionsFromOSM(address.country)
        .then(setRegions)
        .finally(() => setIsLoadingRegions(false));
    }
  }, [address?.country, isInlineEditing]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const searchResults = await searchAddress(query);
        setResults(searchResults);
        if (searchResults.length > 0) {
          setMapCenter(searchResults[0].coordinates);
          setMarkerPosition(searchResults[0].coordinates);
          setMapZoom(16);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleMapClick = async (coords: Coordinates) => {
    setMapCenter(coords);
    setMarkerPosition(coords);
    try {
      const result = await reverseGeocode(coords);
      if (result) {
        onAddressChange(result.address);
      }
    } catch (error) {
      console.error('Reverse geocode failed:', error);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    onAddressChange(result.address);
    setMapCenter(result.coordinates);
    setMarkerPosition(result.coordinates);
    setQuery('');
    setResults([]);
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    setQuery('');
    setResults([]);
  };

  const openEditMode = () => {
    setIsEditing(true);
    setIsInlineEditing(false);
  };

  const openInlineEdit = () => {
    setIsInlineEditing(true);
    setIsEditing(false);
    // Load regions for state dropdown
    if (address?.country) {
      setIsLoadingRegions(true);
      getRegionsFromOSM(address.country)
        .then(setRegions)
        .finally(() => setIsLoadingRegions(false));
    }
  };

  const updateAddressField = (field: keyof Address, value: string) => {
    onAddressChange({
      ...address,
      displayName: address?.displayName || '',
      [field]: value,
    });
  };

  const regionOptions = regions.map(r => ({ value: r.name, label: r.name }));
  const countryOptions = COUNTRIES.map(c => ({ value: c, label: c }));

  // Editing mode: search box, result cards, and map
  if (isEditing) {
    return (
      <div className={`employer-address-edit ${className}`} style={{ height }}>
        <button
          type="button"
          className="widget-close-btn"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="employer-address-search-box">
          <div className="search-wrapper">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search address..."
              className="search-input-with-icon"
            />
            {isSearching && <span className="search-spinner" />}
          </div>
          {results.length > 0 && (
            <div className="address-result-cards">
              {results.map((result) => (
                <div
                  key={result.placeId}
                  className="address-result-card"
                  onClick={() => handleResultSelect(result)}
                >
                  {result.address.house_number || result.address.road ? (
                    <div className="card-line">{[result.address.house_number, result.address.road].filter(Boolean).join(' ')}</div>
                  ) : null}
                  <div className="card-line">{[result.address.city, result.address.state, result.address.postcode].filter(Boolean).join(', ')}</div>
                  {result.address.country && <div className="card-line country">{result.address.country}</div>}
                </div>
              ))}
            </div>
          )}
          {address?.city && !results.length && (
            <div className="address-widget-label">
              <div className="label-address">
                {address.house_number || address.road ? (
                  <div className="label-line">
                    {[address.house_number, address.road].filter(Boolean).join(' ')}
                    {address.suburb && `, ${address.suburb}`}
                  </div>
                ) : null}
                <div className="label-line">{[address.city, address.state, address.postcode].filter(Boolean).join(', ')}</div>
                {address.country && <div className="label-line country">{address.country}</div>}
              </div>
            </div>
          )}
        </div>
        <div className="employer-address-map">
          <MapView
            center={mapCenter}
            markerPosition={markerPosition}
            onMapClick={handleMapClick}
            zoom={mapZoom}
          />
        </div>
      </div>
    );
  }

  // Label mode: compact display with hover icons
  return (
    <div className={`employer-address-label ${isInlineEditing ? 'editing' : ''} ${className}`}>
      {!isInlineEditing && (
        <div className="label-icons">
          <button
            type="button"
            className="label-icon-btn"
            onClick={openEditMode}
            aria-label="Search address"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button
            type="button"
            className="label-icon-btn"
            onClick={openInlineEdit}
            aria-label="Edit address"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
        </div>
      )}

      {isInlineEditing ? (
        <>
          <div className="label-icons editing-icons">
            <button
              type="button"
              className="label-icon-btn close"
              onClick={() => setIsInlineEditing(false)}
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              className="label-icon-btn save"
              onClick={() => setIsInlineEditing(false)}
              aria-label="Save"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
          </div>
          <div className="label-inline-form">
            <div className="inline-form-row">
              <AutoSizeInput
                value={address?.house_number || ''}
                onChange={(v) => updateAddressField('house_number', v)}
                placeholder="#"
                minWidth={30}
                maxWidth={60}
              />
              <AutoSizeInput
                value={address?.road || ''}
                onChange={(v) => updateAddressField('road', v)}
                placeholder="Street"
                minWidth={60}
                maxWidth={180}
              />
              <AutoSizeInput
                value={address?.suburb || ''}
                onChange={(v) => updateAddressField('suburb', v)}
                placeholder="Apt/Suite"
                minWidth={60}
                maxWidth={200}
              />
            </div>
            <div className="inline-form-row">
              <AutoSizeInput
                value={address?.city || ''}
                onChange={(v) => updateAddressField('city', v)}
                placeholder="City"
                minWidth={60}
                maxWidth={150}
              />
              <AutoSizeSelect
                value={address?.state || ''}
                onChange={(v) => updateAddressField('state', v)}
                options={regionOptions}
                placeholder={isLoadingRegions ? 'Loading...' : 'State'}
                disabled={isLoadingRegions || regionOptions.length === 0}
                minWidth={60}
                maxWidth={150}
              />
              <AutoSizeInput
                value={address?.postcode || ''}
                onChange={(v) => updateAddressField('postcode', v)}
                placeholder="ZIP"
                minWidth={50}
                maxWidth={80}
              />
            </div>
            <div className="inline-form-row">
              <AutoSizeSelect
                value={address?.country || ''}
                onChange={(v) => updateAddressField('country', v)}
                options={countryOptions}
                placeholder="Country"
                minWidth={80}
                maxWidth={180}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="label-address" onClick={openEditMode} style={{ cursor: 'pointer' }}>
          {address?.city ? (
            <>
              {address.house_number || address.road ? (
                <div className="label-line">
                  {[address.house_number, address.road].filter(Boolean).join(' ')}
                  {address.suburb && `, ${address.suburb}`}
                </div>
              ) : null}
              <div className="label-line">{[address.city, address.state, address.postcode].filter(Boolean).join(', ')}</div>
              {address.country && <div className="label-line country">{address.country}</div>}
            </>
          ) : (<></>
          )}
        </div>
      )}
    </div>
  );
}
