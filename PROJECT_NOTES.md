# Flight Tracker - Project Notes

**Last Updated:** January 10, 2026
**Status:** ✅ Deployed to Production on Vercel

---

## 📋 Project Overview

A flight price tracking application that monitors nonstop flight prices using the Amadeus API and sends notifications when prices change.

**Live URL:** https://flight-tracker-omega-plum.vercel.app
**GitHub:** https://github.com/16barnettj/flight-tracker
**Password:** `TravelAppByJake`

---

## 🛠 Tech Stack

- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Vercel Postgres - `flight_tracker_db`)
- **ORM:** Prisma 5.22.0
- **API:** Amadeus Flight Offers Search API (test environment)
- **Authentication:** Simple session-based with HTTP-only cookies
- **Deployment:** Vercel (production)
- **Cron Jobs:** Vercel Cron (daily at 12pm UTC)

---

## ✅ Features Implemented

### Core Functionality
- ✅ Add flights (one-way and round-trip)
- ✅ Track prices for multiple passengers
- ✅ **Nonstop flights only** (configurable via `nonStop: 'true'` parameter)
- ✅ Support for all cabin classes (economy, premium economy, business, first)
- ✅ Price history tracking with timestamps
- ✅ Notifications for price changes > $5
- ✅ Manual price check button ("Check All Prices")
- ✅ Daily automated price checks at 12pm UTC

### UI/UX
- ✅ Searchable airport autocomplete (150+ airports)
- ✅ Searchable airline autocomplete (50+ airlines)
- ✅ Price breakdown display (base fare, taxes, fees)
- ✅ Per-passenger pricing display for multi-passenger bookings
- ✅ Round-trip indicator badges
- ✅ Notification system with read/unread status
- ✅ Days until departure countdown

### Integration
- ✅ Google Flights booking links with:
  - Route (origin/destination)
  - Dates (departure/return)
  - Cabin class
  - Number of passengers
  - "one way" designation for one-way flights

---

## 🏗 Architecture

### Database Schema

**Flights Table:**
- id, origin, destination, airline
- travelDate, returnDate (nullable)
- tripType (one-way/round-trip)
- cabinClass, numPassengers
- isActive, createdAt

**PriceHistory Table:**
- id, flightId (FK)
- price, currency, baseFare, taxes, fees
- bookingLink, amadeusOfferId
- checkedAt

**Notifications Table:**
- id, flightId (FK)
- message, oldPrice, newPrice
- isRead, createdAt

### API Routes

- `POST /api/auth/login` - Authentication
- `POST /api/auth/logout` - Logout
- `GET /api/flights` - Get all active flights
- `POST /api/flights` - Add new flight
- `DELETE /api/flights/[id]` - Remove flight
- `GET /api/cron/check-prices` - Price check cron job (manual trigger available)

### Key Files

- `/lib/amadeus.ts` - Amadeus API integration
- `/lib/validation.ts` - Airport/airline validation
- `/lib/airports.ts` - Airport data (150+ airports)
- `/lib/airlines.ts` - Airline data (50+ airlines)
- `/lib/auth.ts` - Authentication logic
- `/lib/prisma.ts` - Prisma client singleton
- `/app/page.tsx` - Main dashboard UI
- `/app/api/cron/check-prices/route.ts` - Price check job
- `/prisma/schema.prisma` - Database schema
- `/vercel.json` - Cron job configuration

---

## 🔧 Configuration

### Environment Variables (Production)

Set in Vercel dashboard:
```
DATABASE_URL=postgres://... (auto-set by Vercel Postgres)
AMADEUS_API_KEY=your_amadeus_api_key_here
AMADEUS_API_SECRET=your_amadeus_api_secret_here
SESSION_SECRET=your_session_secret_here
```

**⚠️ NEVER commit actual credentials to git!**

### Vercel Cron Job

Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 12 * * *"
    }
  ]
}
```

Runs daily at 12:00 PM UTC.

---

## ⚠️ Important Notes & Limitations

### Nonstop Flights Only
- App is configured to ONLY show nonstop flights
- If no nonstop flights exist for a route, no pricing will be returned
- **Recommended routes with guaranteed nonstop service:**
  - SFO ↔ LAX, JFK ↔ LAX, IAD ↔ SFO
  - ORD ↔ LAX, ATL ↔ LAX, DFW ↔ JFK
  - IAD ↔ LHR, IAD ↔ CDG, IAD ↔ FRA
- Small regional routes (e.g., DCA → CHS) typically DON'T have nonstop service

### Google Flights Links
- Uses Google search format: `"google flights SFO to LAX 2026-03-15 one way economy"`
- Google automatically redirects to Google Flights
- Includes: route, dates, cabin class, passengers, trip type
- Most reliable method tested

### Amadeus API
- Currently using **test environment** (`test.api.amadeus.com`)
- Test API may have limited flight data
- Credentials stored in environment variables
- Token caching implemented (expires after ~30 min)

### Database
- PostgreSQL via Vercel Postgres
- Old SQLite migrations removed
- Single PostgreSQL migration: `20260111_init`

---

## 🐛 Known Issues / Future Improvements

### Potential Enhancements
1. **Add connecting flights option** - Remove `nonStop: 'true'` filter for more routes
2. **Price alert thresholds** - Allow users to set custom notification thresholds
3. **Email notifications** - Integrate email service (SendGrid, Resend, etc.)
4. **Price charts** - Visualize price history over time with graphs
5. **Multiple users** - Add user accounts with individual flight tracking
6. **Airline filters** - Filter by specific airlines
7. **Flexible dates** - Search +/- 3 days for better prices
8. **Production Amadeus API** - Switch from test to production API for real data

### Technical Debt
- Remove detailed logging in production (`console.log` statements)
- Add error boundaries for better error handling
- Implement rate limiting on API endpoints
- Add unit tests for validation functions
- Consider caching frequently accessed flights/prices

---

## 📝 Development Workflow

### Local Development
```bash
npm install
npx prisma generate
npm run dev
# Server runs at http://localhost:3000
```

### Database Migrations
```bash
npx prisma migrate dev --name migration_name
npx prisma generate
```

### Deployment
```bash
git add -A
git commit -m "Description"
git push origin main
npx vercel --prod --yes
```

### Check Production Logs
```bash
npx vercel logs flight-tracker-omega-plum.vercel.app
```

---

## 🎯 Session Summary

### What We Built
1. Complete Next.js flight tracking app from scratch
2. Amadeus Flight API integration
3. PostgreSQL database with Prisma ORM
4. Authentication system
5. Price monitoring with notifications
6. Automated daily price checks (Vercel Cron)
7. Full deployment to Vercel with production database

### Iterations & Fixes
- Fixed Prisma 7 → downgraded to Prisma 5
- Fixed add flight form (error handling, state management)
- Added round-trip support
- Created validation system for airports/airlines
- Added searchable autocomplete dropdowns
- Fixed Google Flights booking links (multiple iterations)
- Switched from SQLite to PostgreSQL for production
- Fixed multi-passenger price display
- Added fare class and "one way" to booking links

### Final State
✅ **Fully functional and deployed**
✅ **All core features working**
✅ **Production-ready with Postgres**
✅ **Daily automated price checks**
✅ **Google Flights integration working**

---

## 🔗 Quick Links

- **Production:** https://flight-tracker-omega-plum.vercel.app
- **Vercel Dashboard:** https://vercel.com/16barnettjs-projects/flight-tracker
- **GitHub Repo:** https://github.com/16barnettj/flight-tracker
- **Vercel Postgres:** https://vercel.com/16barnettjs-projects/flight-tracker/stores

---

## 💡 Next Session Tips

1. Test with major hub routes (SFO-LAX, JFK-LAX) for guaranteed nonstop availability
2. Check Vercel cron logs to verify daily price checks are running
3. Monitor Vercel Postgres usage/limits on hobby plan
4. Consider adding email notifications for a complete user experience
5. Could add price drop alerts with custom thresholds per flight

---

**End of Notes**
