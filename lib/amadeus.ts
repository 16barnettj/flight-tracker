// Amadeus API Integration
interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
}

interface AmadeusFlightOffer {
  id: string;
  price: {
    total: string;
    base: string;
    currency: string;
    fees?: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal: string;
  };
  pricingOptions?: {
    fareType?: string[];
  };
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAmadeusToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY || '',
      client_secret: process.env.AMADEUS_API_SECRET || '',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get Amadeus access token');
  }

  const data: AmadeusTokenResponse = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

  return cachedToken;
}

export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
  travelClass: string;
}): Promise<{
  price: number;
  currency: string;
  offerId: string;
  baseFare?: number;
  taxes?: number;
  fees?: number;
  bookingLink?: string;
} | null> {
  try {
    const token = await getAmadeusToken();

    // Map cabin class to Amadeus format
    const classMap: { [key: string]: string } = {
      economy: 'ECONOMY',
      premium_economy: 'PREMIUM_ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST',
    };

    const queryParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults.toString(),
      travelClass: classMap[params.travelClass] || 'ECONOMY',
      currencyCode: 'USD',
      max: '1',
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Amadeus API error:', await response.text());
      return null;
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const offer: AmadeusFlightOffer = data.data[0];

    // Calculate taxes (total - base)
    const total = parseFloat(offer.price.grandTotal || offer.price.total);
    const base = parseFloat(offer.price.base);
    const taxesAndFees = total - base;

    // Calculate fees if available
    let fees = 0;
    if (offer.price.fees) {
      fees = offer.price.fees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
    }

    const taxes = taxesAndFees - fees;

    // Generate booking link (Amadeus test environment doesn't provide deep links,
    // so we'll create a search URL that users can use)
    const bookingLink = `https://www.google.com/travel/flights?q=flights+from+${params.origin}+to+${params.destination}+on+${params.departureDate}`;

    return {
      price: total,
      currency: offer.price.currency,
      offerId: offer.id,
      baseFare: base,
      taxes: taxes > 0 ? taxes : undefined,
      fees: fees > 0 ? fees : undefined,
      bookingLink,
    };
  } catch (error) {
    console.error('Error searching flights:', error);
    return null;
  }
}
