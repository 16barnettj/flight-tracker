'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PriceHistory {
  id: string;
  price: number;
  currency: string;
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
  cabinClass: string;
  numPassengers: number;
  createdAt: string;
  priceHistory: PriceHistory[];
  notifications: Notification[];
}

export default function Dashboard() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    airline: '',
    travelDate: '',
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
    setLoading(true);

    try {
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          origin: '',
          destination: '',
          airline: '',
          travelDate: '',
          cabinClass: 'economy',
          numPassengers: 1,
        });
        await fetchFlights();
      }
    } catch (error) {
      console.error('Error adding flight:', error);
    } finally {
      setLoading(false);
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

  const allNotifications = flights.flatMap((flight) =>
    flight.notifications.map((notification) => ({
      ...notification,
      flight,
    }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
            onClick={() => setShowAddModal(true)}
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
                    <div className="text-2xl font-bold text-gray-900">
                      {flight.origin} → {flight.destination}
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
                      <span className="font-medium">Class:</span> {formatCabinClass(flight.cabinClass)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Date:</span>{' '}
                      {new Date(flight.travelDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Passengers:</span> {flight.numPassengers}
                    </div>
                  </div>

                  {currentPrice && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-600 mb-1">Current Price</div>
                      <div className="text-3xl font-bold text-blue-600">
                        ${currentPrice.price.toFixed(2)}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm">
                    <div className={daysUntil < 7 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                      {daysUntil} days until departure
                    </div>
                    {flight.priceHistory.length > 1 && (
                      <div className="text-gray-500">
                        {flight.priceHistory.length} price checks
                      </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add Flight</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFlight} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin Airport Code
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value.toUpperCase() })}
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
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value.toUpperCase() })}
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
                  placeholder="United"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date</label>
                <input
                  type="date"
                  value={formData.travelDate}
                  onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

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
                  onChange={(e) => setFormData({ ...formData, numPassengers: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="9"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Flight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
