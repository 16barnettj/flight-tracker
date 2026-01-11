'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PriceHistory {
  id: string;
  price: number;
  currency: string;
  baseFare?: number;
  taxes?: number;
  fees?: number;
  bookingLink?: string;
  checkedAt: string;
}

interface Notification {
  id: string;
  message: string;
  oldPrice: number;
  newPrice: number;
  createdAt: string;
  isRead: boolean;
}

interface Flight {
  id: string;
  origin: string;
  destination: string;
  airline: string;
  travelDate: string;
  returnDate?: string | null;
  tripType: string;
  cabinClass: string;
  numPassengers: number;
  createdAt: string;
  priceHistory: PriceHistory[];
  notifications: Notification[];
}

export default function Dashboard() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    airline: '',
    travelDate: '',
    returnDate: '',
    tripType: 'one-way' as 'one-way' | 'round-trip',
    cabinClass: 'economy',
    numPassengers: 1,
  });

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await fetch('/api/flights');
      if (response.ok) {
        const data = await response.json();
        setFlights(data);
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleAddFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add flight');
        setSubmitting(false);
        return;
      }

      // Success
      setShowAddModal(false);
      setFormData({
        origin: '',
        destination: '',
        airline: '',
        travelDate: '',
        returnDate: '',
        tripType: 'one-way',
        cabinClass: 'economy',
        numPassengers: 1,
      });
      await fetchFlights();
    } catch (error) {
      console.error('Error adding flight:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFlight = async (id: string) => {
    if (!confirm('Are you sure you want to remove this flight?')) return;

    try {
      const response = await fetch(`/api/flights/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchFlights();
      }
    } catch (error) {
      console.error('Error deleting flight:', error);
    }
  };

  const unreadNotifications = flights.reduce(
    (count, flight) => count + flight.notifications.filter((n) => !n.isRead).length,
    0
  );

  const allNotifications = flights
    .flatMap((flight) =>
      flight.notifications.map((notification) => ({
        ...notification,
        flight,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getDaysUntilDeparture = (travelDate: string) => {
    const days = Math.ceil(
      (new Date(travelDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const formatCabinClass = (cabinClass: string) => {
    return cabinClass
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">✈️ Flight Tracker</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <span className="text-2xl">🔔</span>
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Notifications</h2>
            {allNotifications.length === 0 ? (
              <p className="text-gray-500">No notifications</p>
            ) : (
              <div className="space-y-2">
                {allNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${
                      notification.isRead ? 'bg-gray-50' : 'bg-blue-50'
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {notification.flight.origin} → {notification.flight.destination}
                    </div>
                    <div className="text-sm text-gray-700">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Flight Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowAddModal(true);
              setError('');
            }}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Add Flight
          </button>
        </div>

        {/* Flights Grid */}
        {loading && flights.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading flights...</div>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No flights tracked yet</div>
            <div className="text-gray-400">Add your first flight to start tracking prices</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flights.map((flight) => {
              const currentPrice = flight.priceHistory[0];
              const daysUntil = getDaysUntilDeparture(flight.travelDate);

              return (
                <div
                  key={flight.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {flight.origin} → {flight.destination}
                      </div>
                      {flight.tripType === 'round-trip' && (
                        <div className="text-sm text-blue-600 font-medium mt-1">Round-trip</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteFlight(flight.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Airline:</span> {flight.airline}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Class:</span>{' '}
                      {formatCabinClass(flight.cabinClass)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Departure:</span>{' '}
                      {new Date(flight.travelDate).toLocaleDateString()}
                    </div>
                    {flight.returnDate && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Return:</span>{' '}
                        {new Date(flight.returnDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Passengers:</span> {flight.numPassengers}
                    </div>
                  </div>

                  {currentPrice && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-600 mb-2">Current Price</div>
                      <div className="text-3xl font-bold text-blue-600 mb-3">
                        ${currentPrice.price.toFixed(2)}
                      </div>

                      {/* Price Breakdown */}
                      {(currentPrice.baseFare || currentPrice.taxes || currentPrice.fees) && (
                        <div className="border-t border-blue-200 pt-3 space-y-1 text-sm">
                          {currentPrice.baseFare && (
                            <div className="flex justify-between text-gray-700">
                              <span>Base Fare:</span>
                              <span>${currentPrice.baseFare.toFixed(2)}</span>
                            </div>
                          )}
                          {currentPrice.taxes && currentPrice.taxes > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Taxes:</span>
                              <span>${currentPrice.taxes.toFixed(2)}</span>
                            </div>
                          )}
                          {currentPrice.fees && currentPrice.fees > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Fees:</span>
                              <span>${currentPrice.fees.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Booking Link */}
                      {currentPrice.bookingLink && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <a
                            href={currentPrice.bookingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                          >
                            Book Flight →
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm">
                    <div className={daysUntil < 7 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                      {daysUntil} days until departure
                    </div>
                    {flight.priceHistory.length > 1 && (
                      <div className="text-gray-500">{flight.priceHistory.length} price checks</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Flight Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add Flight</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAddFlight} className="space-y-4">
              {/* Trip Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tripType: 'one-way', returnDate: '' })}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      formData.tripType === 'one-way'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    One-way
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tripType: 'round-trip' })}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      formData.tripType === 'round-trip'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Round-trip
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin Airport Code
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) =>
                    setFormData({ ...formData, origin: e.target.value.toUpperCase() })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="SFO"
                  maxLength={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Airport Code
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value.toUpperCase() })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="JFK"
                  maxLength={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Airline</label>
                <input
                  type="text"
                  value={formData.airline}
                  onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="United Airlines"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={formData.travelDate}
                  onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {formData.tripType === 'round-trip' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={formData.travelDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={formData.cabinClass}
                  onChange={(e) => setFormData({ ...formData, cabinClass: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                <input
                  type="number"
                  value={formData.numPassengers}
                  onChange={(e) =>
                    setFormData({ ...formData, numPassengers: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="9"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Flight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
