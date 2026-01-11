import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchFlights } from '@/lib/amadeus';

export async function GET() {
  try {
    console.log('🔄 Starting price check for all active flights...');

    // Get all active flights
    const flights = await prisma.flight.findMany({
      where: { isActive: true },
      include: {
        priceHistory: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    console.log(`📊 Found ${flights.length} active flights to check`);

    let updatedCount = 0;
    let notificationCount = 0;

    for (const flight of flights) {
      console.log(`\n✈️  Checking ${flight.origin} → ${flight.destination}`);

      try {
        // Get current price from Amadeus
        const priceData = await searchFlights({
          origin: flight.origin,
          destination: flight.destination,
          departureDate: flight.travelDate.toISOString().split('T')[0],
          returnDate: flight.returnDate ? flight.returnDate.toISOString().split('T')[0] : undefined,
          adults: flight.numPassengers,
          travelClass: flight.cabinClass,
        });

        if (!priceData) {
          console.log('  ⚠️  No price data available');
          continue;
        }

        console.log(`  💰 Current price: $${priceData.price}`);

        // Save new price to history
        await prisma.priceHistory.create({
          data: {
            flightId: flight.id,
            price: priceData.price,
            currency: priceData.currency,
            baseFare: priceData.baseFare,
            taxes: priceData.taxes,
            fees: priceData.fees,
            bookingLink: priceData.bookingLink,
            amadeusOfferId: priceData.offerId,
          },
        });

        updatedCount++;

        // Check if price changed significantly (more than $5)
        const lastPrice = flight.priceHistory[0];
        if (lastPrice) {
          const priceDiff = priceData.price - lastPrice.price;
          const percentChange = (priceDiff / lastPrice.price) * 100;

          console.log(`  📈 Price change: $${priceDiff.toFixed(2)} (${percentChange.toFixed(1)}%)`);

          if (Math.abs(priceDiff) >= 5) {
            // Create notification
            const message =
              priceDiff < 0
                ? `Price dropped by $${Math.abs(priceDiff).toFixed(2)}!`
                : `Price increased by $${priceDiff.toFixed(2)}`;

            await prisma.notification.create({
              data: {
                flightId: flight.id,
                message,
                oldPrice: lastPrice.price,
                newPrice: priceData.price,
              },
            });

            notificationCount++;
            console.log(`  🔔 Notification created: ${message}`);
          }
        }
      } catch (error) {
        console.error(`  ❌ Error checking flight ${flight.id}:`, error);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Price check complete:`);
    console.log(`   - Updated: ${updatedCount} flights`);
    console.log(`   - Notifications: ${notificationCount}`);

    return NextResponse.json({
      success: true,
      checked: flights.length,
      updated: updatedCount,
      notifications: notificationCount,
    });
  } catch (error) {
    console.error('❌ Error in price check cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
