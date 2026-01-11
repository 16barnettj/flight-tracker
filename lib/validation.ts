// Validation utilities

// List of valid IATA airport codes (subset - add more as needed)
const VALID_AIRPORTS = [
  'SFO', 'LAX', 'JFK', 'ORD', 'ATL', 'DFW', 'DEN', 'SEA', 'LAS', 'PHX',
  'IAH', 'MIA', 'BOS', 'MSP', 'DTW', 'PHL', 'LGA', 'EWR', 'MCO', 'CLT',
  'SAN', 'PDX', 'TPA', 'STL', 'BWI', 'AUS', 'BNA', 'OAK', 'SJC', 'SAT',
  // International
  'LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'MXP', 'DUB', 'ZRH',
  'VIE', 'CPH', 'ARN', 'HEL', 'IST', 'ATH', 'LIS', 'BRU', 'PRG', 'BUD',
  'YYZ', 'YVR', 'YUL', 'MEX', 'GDL', 'CUN', 'GRU', 'EZE', 'SCL', 'BOG',
  'LIM', 'NRT', 'HND', 'ICN', 'PVG', 'PEK', 'HKG', 'SIN', 'BKK', 'KUL',
  'DEL', 'BOM', 'SYD', 'MEL', 'AKL', 'DXB', 'DOH', 'AUH', 'JNB', 'CPT',
];

export function validateAirportCode(code: string): { valid: boolean; message?: string } {
  const upperCode = code.toUpperCase().trim();

  if (!upperCode) {
    return { valid: false, message: 'Airport code is required' };
  }

  if (upperCode.length !== 3) {
    return { valid: false, message: 'Airport code must be 3 letters' };
  }

  if (!/^[A-Z]{3}$/.test(upperCode)) {
    return { valid: false, message: 'Airport code must contain only letters' };
  }

  if (!VALID_AIRPORTS.includes(upperCode)) {
    return {
      valid: false,
      message: `Airport code "${upperCode}" not recognized. Please verify it's a valid IATA code.`
    };
  }

  return { valid: true };
}

// List of major airlines
const KNOWN_AIRLINES = [
  'United', 'United Airlines', 'Delta', 'Delta Air Lines', 'American', 'American Airlines',
  'Southwest', 'Southwest Airlines', 'JetBlue', 'Alaska', 'Alaska Airlines', 'Spirit',
  'Frontier', 'Hawaiian', 'Allegiant', 'Sun Country',
  'British Airways', 'Air France', 'Lufthansa', 'KLM', 'Emirates', 'Qatar Airways',
  'Singapore Airlines', 'Cathay Pacific', 'Qantas', 'Air Canada', 'Aeromexico',
  'LATAM', 'Avianca', 'Copa Airlines', 'ANA', 'JAL', 'Korean Air', 'China Eastern',
  'Air China', 'Turkish Airlines', 'Etihad', 'Virgin Atlantic', 'Norwegian',
];

export function validateAirline(airline: string): { valid: boolean; message?: string } {
  const trimmed = airline.trim();

  if (!trimmed) {
    return { valid: false, message: 'Airline name is required' };
  }

  if (trimmed.length < 2) {
    return { valid: false, message: 'Airline name is too short' };
  }

  // Check if it's a known airline (case insensitive)
  const isKnown = KNOWN_AIRLINES.some(
    known => known.toLowerCase() === trimmed.toLowerCase()
  );

  if (!isKnown) {
    // Just a warning, not a hard failure
    return {
      valid: true,
      message: `Airline "${trimmed}" will be tracked, but it's not in our common airlines list.`
    };
  }

  return { valid: true };
}

export function validateTravelDate(dateStr: string): { valid: boolean; message?: string } {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }

  if (date < today) {
    return { valid: false, message: 'Travel date must be in the future' };
  }

  return { valid: true };
}

export function validateReturnDate(
  departureStr: string,
  returnStr: string | null
): { valid: boolean; message?: string } {
  if (!returnStr) {
    return { valid: true }; // One-way is valid
  }

  const departure = new Date(departureStr);
  const returnDate = new Date(returnStr);

  if (isNaN(returnDate.getTime())) {
    return { valid: false, message: 'Invalid return date format' };
  }

  if (returnDate <= departure) {
    return { valid: false, message: 'Return date must be after departure date' };
  }

  return { valid: true };
}
