import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchFlights } from '@/lib/amadeus';

// GET all flights
export async function GET() {
  try {
    const isAuthenticated = await getSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flights = await prisma.flight.findMany({
      where: { isActive: true },
      include: {
        priceHistory: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { travelDate: 'asc' },
    });

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new flight
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await getSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { origin, destination, airline, travelDate, cabinClass, numPassengers } = body;

    // Validate required fields
    if (!origin || !destination || !airline || !travelDate || !cabinClass || !numPassengers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create flight
    const flight = await prisma.flight.create({
      data: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        airline,
        travelDate: new Date(travelDate),
        cabinClass,
        numPassengers: parseInt(numPassengers),
      },
    });

    // Get initial price from Amadeus
    try {
      const priceData = await searchFlights({
        origin: flight.origin,
        destination: flight.destination,
        departureDate: flight.travelDate.toISOString().split('T')[0],
        adults: flight.numPassengers,
        travelClass: flight.cabinClass,
      });

      if (priceData) {
        await prisma.priceHistory.create({
          data: {
            flightId: flight.id,
            price: priceData.price,
            currency: priceData.currency,
            amadeusOfferId: priceData.offerId,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching initial price:', error);
      // Continue even if price fetch fails
    }

    return NextResponse.json(flight, { status: 201 });
  } catch (error) {
    console.error('Error creating flight:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
