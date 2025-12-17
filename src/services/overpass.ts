export interface AdminRegion {
  name: string;
  adminLevel: number;
  osmId: number;
}

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Cache to avoid repeated API calls
const regionCache = new Map<string, AdminRegion[]>();

// Country name to ISO code mapping for Overpass area queries
const COUNTRY_ISO: Record<string, string> = {
  'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'andorra': 'AD',
  'angola': 'AO', 'argentina': 'AR', 'armenia': 'AM', 'australia': 'AU',
  'austria': 'AT', 'azerbaijan': 'AZ', 'bahamas': 'BS', 'bahrain': 'BH',
  'bangladesh': 'BD', 'barbados': 'BB', 'belarus': 'BY', 'belgium': 'BE',
  'belize': 'BZ', 'benin': 'BJ', 'bhutan': 'BT', 'bolivia': 'BO',
  'bosnia and herzegovina': 'BA', 'botswana': 'BW', 'brazil': 'BR',
  'brunei': 'BN', 'bulgaria': 'BG', 'burkina faso': 'BF', 'burundi': 'BI',
  'cambodia': 'KH', 'cameroon': 'CM', 'canada': 'CA', 'chile': 'CL',
  'china': 'CN', 'colombia': 'CO', 'costa rica': 'CR', 'croatia': 'HR',
  'cuba': 'CU', 'cyprus': 'CY', 'czech republic': 'CZ', 'denmark': 'DK',
  'dominican republic': 'DO', 'ecuador': 'EC', 'egypt': 'EG',
  'el salvador': 'SV', 'estonia': 'EE', 'ethiopia': 'ET', 'fiji': 'FJ',
  'finland': 'FI', 'france': 'FR', 'germany': 'DE', 'ghana': 'GH',
  'greece': 'GR', 'guatemala': 'GT', 'haiti': 'HT', 'honduras': 'HN',
  'hungary': 'HU', 'iceland': 'IS', 'india': 'IN', 'indonesia': 'ID',
  'iran': 'IR', 'iraq': 'IQ', 'ireland': 'IE', 'israel': 'IL', 'italy': 'IT',
  'jamaica': 'JM', 'japan': 'JP', 'jordan': 'JO', 'kazakhstan': 'KZ',
  'kenya': 'KE', 'kuwait': 'KW', 'latvia': 'LV', 'lebanon': 'LB',
  'libya': 'LY', 'lithuania': 'LT', 'luxembourg': 'LU', 'malaysia': 'MY',
  'maldives': 'MV', 'mali': 'ML', 'malta': 'MT', 'mexico': 'MX',
  'moldova': 'MD', 'monaco': 'MC', 'mongolia': 'MN', 'montenegro': 'ME',
  'morocco': 'MA', 'mozambique': 'MZ', 'myanmar': 'MM', 'namibia': 'NA',
  'nepal': 'NP', 'netherlands': 'NL', 'new zealand': 'NZ', 'nicaragua': 'NI',
  'niger': 'NE', 'nigeria': 'NG', 'north korea': 'KP', 'north macedonia': 'MK',
  'norway': 'NO', 'oman': 'OM', 'pakistan': 'PK', 'panama': 'PA',
  'papua new guinea': 'PG', 'paraguay': 'PY', 'peru': 'PE', 'philippines': 'PH',
  'poland': 'PL', 'portugal': 'PT', 'qatar': 'QA', 'romania': 'RO',
  'russia': 'RU', 'saudi arabia': 'SA', 'senegal': 'SN', 'serbia': 'RS',
  'singapore': 'SG', 'slovakia': 'SK', 'slovenia': 'SI', 'somalia': 'SO',
  'south africa': 'ZA', 'south korea': 'KR', 'spain': 'ES', 'sri lanka': 'LK',
  'sudan': 'SD', 'sweden': 'SE', 'switzerland': 'CH', 'syria': 'SY',
  'taiwan': 'TW', 'tanzania': 'TZ', 'thailand': 'TH', 'tunisia': 'TN',
  'turkey': 'TR', 'uganda': 'UG', 'ukraine': 'UA', 'united arab emirates': 'AE',
  'united kingdom': 'GB', 'united states': 'US', 'uruguay': 'UY',
  'uzbekistan': 'UZ', 'venezuela': 'VE', 'vietnam': 'VN', 'yemen': 'YE',
  'zambia': 'ZM', 'zimbabwe': 'ZW',
};

// Admin level for states/provinces varies by country
const COUNTRY_ADMIN_LEVEL: Record<string, number> = {
  'US': 4, 'AU': 4, 'CA': 4, 'BR': 4, 'MX': 4, 'IN': 4, 'CN': 4,
  'DE': 4, 'FR': 4, 'IT': 5, 'ES': 4, 'GB': 4, 'JP': 4, 'RU': 4,
};

export async function getRegionsFromOSM(countryName: string): Promise<AdminRegion[]> {
  const countryLower = countryName.toLowerCase();

  // Check cache first
  if (regionCache.has(countryLower)) {
    return regionCache.get(countryLower)!;
  }

  const isoCode = COUNTRY_ISO[countryLower];
  if (!isoCode) {
    return [];
  }

  const adminLevel = COUNTRY_ADMIN_LEVEL[isoCode] || 4;

  const query = `
    [out:json][timeout:25];
    area["ISO3166-1"="${isoCode}"]->.country;
    (
      relation["boundary"="administrative"]["admin_level"="${adminLevel}"](area.country);
    );
    out tags;
  `;

  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status);
      return [];
    }

    const data = await response.json();

    const regions: AdminRegion[] = data.elements
      .map((el: { id: number; tags?: { name?: string; 'name:en'?: string; admin_level?: string } }) => ({
        name: el.tags?.['name:en'] || el.tags?.name || '',
        adminLevel: parseInt(el.tags?.admin_level || '4'),
        osmId: el.id,
      }))
      .filter((r: AdminRegion) => r.name)
      .sort((a: AdminRegion, b: AdminRegion) => a.name.localeCompare(b.name));

    regionCache.set(countryLower, regions);

    return regions;
  } catch (error) {
    console.error('Failed to fetch regions from OSM:', error);
    return [];
  }
}
