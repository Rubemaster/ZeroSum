import type { SearchResult, NominatimResponse, Coordinates, Address } from '../types/onboarding';

const BASE_URL = 'https://nominatim.openstreetmap.org';

function parseAddress(response: NominatimResponse): Address {
  const addr = response.address;
  return {
    displayName: response.display_name,
    house_number: addr.house_number,
    road: addr.road,
    suburb: addr.suburb,
    city: addr.city || addr.town || addr.village,
    state: addr.state,
    postcode: addr.postcode,
    country: addr.country,
  };
}

function parseSearchResult(response: NominatimResponse): SearchResult {
  return {
    placeId: response.place_id.toString(),
    displayName: response.display_name,
    coordinates: {
      lat: parseFloat(response.lat),
      lng: parseFloat(response.lon),
    },
    address: parseAddress(response),
  };
}

export async function searchAddress(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '5',
  });

  const response = await fetch(`${BASE_URL}/search?${params}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to search address');
  }

  const data: NominatimResponse[] = await response.json();
  return data.map(parseSearchResult);
}

export interface CityResult {
  name: string;
  state?: string;
  country: string;
  displayName: string;
}

export async function searchCities(query: string): Promise<CityResult[]> {
  if (!query.trim() || query.length < 2) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    featuretype: 'city',
  });

  try {
    const response = await fetch(`${BASE_URL}/search?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return [];

    const data: NominatimResponse[] = await response.json();
    return data
      .filter(r => r.address?.city || r.address?.town || r.address?.village)
      .map(r => ({
        name: r.address.city || r.address.town || r.address.village || '',
        state: r.address.state,
        country: r.address.country || '',
        displayName: [
          r.address.city || r.address.town || r.address.village,
          r.address.state,
          r.address.country
        ].filter(Boolean).join(', '),
      }));
  } catch {
    return [];
  }
}

export async function reverseGeocode(coordinates: Coordinates): Promise<SearchResult | null> {
  const params = new URLSearchParams({
    lat: coordinates.lat.toString(),
    lon: coordinates.lng.toString(),
    format: 'json',
    addressdetails: '1',
  });

  const response = await fetch(`${BASE_URL}/reverse?${params}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to reverse geocode');
  }

  const data = await response.json();

  // Nominatim returns {error: "..."} for invalid coordinates
  if (data.error || !data.place_id) {
    return null;
  }

  return parseSearchResult(data as NominatimResponse);
}

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'DR Congo',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
  'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany',
  'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
  'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
  'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Republic of the Congo', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
  'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];
