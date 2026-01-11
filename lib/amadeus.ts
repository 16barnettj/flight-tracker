// Amadeus API Integration
interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
}

interface AmadeusFlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
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
}): Promise<{ price: number; currency: string; offerId: string } | null> {
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
    return {
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      offerId: offer.id,
    };
  } catch (error) {
    console.error('Error searching flights:', error);
    return null;
  }
}
