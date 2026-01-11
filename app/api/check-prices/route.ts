import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchFlights } from '@/lib/amadeus';

// This endpoint will be called by Vercel Cron daily at 12pm
export async function GET() {
  try {
    // Get all active flights that haven't departed yet
    const flights = await prisma.flight.findMany({
      where: {
        isActive: true,
        travelDate: {
          gte: new Date(),
        },
      },
      include: {
        priceHistory: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    const results = [];

    for (const flight of flights) {
      try {
        // Search for current price
        const priceData = await searchFlights({
          origin: flight.origin,
          destination: flight.destination,
          departureDate: flight.travelDate.toISOString().split('T')[0],
          adults: flight.numPassengers,
          travelClass: flight.cabinClass,
        });

        if (!priceData) {
          results.push({ flightId: flight.id, status: 'no_price_found' });
          continue;
        }

        // Save new price
        await prisma.priceHistory.create({
          data: {
            flightId: flight.id,
            price: priceData.price,
            currency: priceData.currency,
            amadeusOfferId: priceData.offerId,
          },
        });

        // Check if price dropped
        const lastPrice = flight.priceHistory[0];
        if (lastPrice && priceData.price < lastPrice.price) {
          const priceDrop = lastPrice.price - priceData.price;
          const percentDrop = ((priceDrop / lastPrice.price) * 100).toFixed(1);

          // Create notification
          await prisma.notification.create({
            data: {
              flightId: flight.id,
              message: `Price dropped by $${priceDrop.toFixed(2)} (${percentDrop}%)`,
              oldPrice: lastPrice.price,
              newPrice: priceData.price,
            },
          });

          results.push({
            flightId: flight.id,
            status: 'price_dropped',
            oldPrice: lastPrice.price,
            newPrice: priceData.price,
          });
        } else {
          results.push({
            flightId: flight.id,
            status: 'price_checked',
            price: priceData.price,
          });
        }
      } catch (error) {
        console.error(`Error checking price for flight ${flight.id}:`, error);
        results.push({ flightId: flight.id, status: 'error' });
      }
    }

    return NextResponse.json({
      success: true,
      checked: flights.length,
      results,
    });
  } catch (error) {
    console.error('Error in price check cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
