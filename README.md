# ✈️ Flight Price Tracker

A web application that automatically tracks flight prices over time using the Amadeus API and sends notifications when prices drop.

## Features

- 🔐 **Password-protected access** - Secure login with session management
- ✈️ **Flight tracking** - Add and manage flights with origin, destination, airline, class, and date
- 💰 **Automatic price checking** - Daily price checks at 12:00 PM via Vercel Cron
- 📊 **Price history** - Track how prices change over time
- 🔔 **Price drop notifications** - Get notified when flight prices decrease
- 📱 **Mobile-first design** - Fully responsive interface optimized for mobile devices
- 🚀 **Easy deployment** - Deploy to Vercel with one click

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **External API**: Amadeus Flight Offers Search API
- **Deployment**: Vercel (with Cron Jobs)

## Prerequisites

- Node.js 18+ installed
- Amadeus API credentials (get them from [Amadeus for Developers](https://developers.amadeus.com/))
- Vercel account (for deployment with cron jobs)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/flight-tracker.git
cd flight-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Amadeus API credentials:

```env
# Database
DATABASE_URL="file:./dev.db"

# Amadeus API Credentials
AMADEUS_API_KEY=your_amadeus_api_key_here
AMADEUS_API_SECRET=your_amadeus_api_secret_here

# App Authentication
APP_PASSWORD=TravelAppByJake

# NextAuth
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Getting Amadeus API Credentials:**
1. Go to https://developers.amadeus.com/
2. Create a free account
3. Create a new app
4. Copy the API Key and API Secret

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Set Up the Database

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Login

Use the default password: `TravelAppByJake`

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/flight-tracker.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure environment variables in Vercel dashboard:
   - `AMADEUS_API_KEY`
   - `AMADEUS_API_SECRET`
   - `APP_PASSWORD`
   - `DATABASE_URL` (use `file:./dev.db` for SQLite)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your Vercel deployment URL, e.g., `https://your-app.vercel.app`)
5. Click "Deploy"

### 3. Vercel Cron Job Setup

The cron job is already configured in `vercel.json` to run daily at 12:00 PM UTC:

```json
{
  "crons": [
    {
      "path": "/api/check-prices",
      "schedule": "0 12 * * *"
    }
  ]
}
```

**Note:** Cron jobs only work on Vercel's Pro plan or higher. For the free tier, you can:
- Manually trigger price checks by visiting `/api/check-prices`
- Use a free external service like [cron-job.org](https://cron-job.org) to ping your endpoint

## Usage Guide

### Adding a Flight

1. Click the "+ Add Flight" button
2. Fill in the flight details:
   - **Origin**: Airport code (e.g., SFO)
   - **Destination**: Airport code (e.g., JFK)
   - **Airline**: Airline name (e.g., United)
   - **Travel Date**: Date of travel
   - **Class**: Economy, Premium Economy, Business, or First
   - **Passengers**: Number of passengers
3. Click "Add Flight"

The app will immediately fetch the current price from Amadeus and start tracking it.

### Viewing Flights

All tracked flights are displayed as cards on the dashboard showing:
- Route (origin → destination)
- Airline and class
- Travel date
- Number of passengers
- Current price
- Days until departure
- Number of price checks

### Notifications

- Price drop notifications appear in the bell icon (🔔) in the header
- Unread notification count is shown as a badge
- Click the bell icon to view all notifications
- Notifications show the route, old price, new price, and savings

### Deleting a Flight

Click the "✕" button on any flight card and confirm to remove it from tracking.

## Database Schema

### Flights Table
- `id`: Unique identifier
- `origin`: Airport code
- `destination`: Airport code
- `airline`: Airline name
- `travelDate`: Date of travel
- `cabinClass`: economy | premium_economy | business | first
- `numPassengers`: Number of passengers
- `createdAt`: When the flight was added
- `isActive`: Soft delete flag

### Price History Table
- `id`: Unique identifier
- `flightId`: Reference to flight
- `price`: Flight price
- `currency`: Currency code (USD)
- `checkedAt`: When the price was checked
- `amadeusOfferId`: Amadeus offer ID (optional)

### Notifications Table
- `id`: Unique identifier
- `flightId`: Reference to flight
- `message`: Notification message
- `oldPrice`: Previous price
- `newPrice`: New price
- `createdAt`: When notification was created
- `isRead`: Read status

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with password
- `POST /api/auth/logout` - Logout

### Flights
- `GET /api/flights` - Get all flights
- `POST /api/flights` - Add new flight
- `GET /api/flights/[id]` - Get flight with price history
- `DELETE /api/flights/[id]` - Delete flight

### Price Checking
- `GET /api/check-prices` - Check prices for all flights (triggered by cron)

## Amadeus API Integration

The app uses the Amadeus Flight Offers Search API:
- **Endpoint**: `https://test.api.amadeus.com/v2/shopping/flight-offers`
- **Authentication**: OAuth2 client credentials flow
- **Rate Limits**: Check your Amadeus plan for limits
- **Test vs Production**: Uses test API by default (free tier)

### Switching to Production API

In `lib/amadeus.ts`, change:
```typescript
// From
'https://test.api.amadeus.com'
// To
'https://api.amadeus.com'
```

## Troubleshooting

### Prices not updating
- Check that your Amadeus API credentials are correct
- Verify the cron job is running (Vercel Pro plan required)
- Manually trigger: visit `/api/check-prices` in your browser

### "Invalid password" error
- Make sure `APP_PASSWORD` in `.env` matches what you're entering
- Default password is `TravelAppByJake`

### Database errors
- Run `npx prisma generate` to regenerate the Prisma client
- Run `npx prisma migrate dev` to apply migrations

### Amadeus API errors
- Check your API key and secret
- Verify you haven't exceeded rate limits
- Ensure airport codes are valid IATA codes
- Check that flight dates are in the future

## Project Structure

```
flight-tracker/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── flights/
│   │   │   ├── [id]/route.ts
│   │   │   └── route.ts
│   │   └── check-prices/route.ts
│   ├── login/
│   │   └── page.tsx
│   └── page.tsx (dashboard)
├── lib/
│   ├── amadeus.ts
│   ├── auth.ts
│   └── prisma.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
├── .env.example
├── middleware.ts
├── vercel.json
└── package.json
```

## Security Considerations

- Never commit `.env` file (already in `.gitignore`)
- Use strong `NEXTAUTH_SECRET` in production
- Amadeus API calls are server-side only (keys never exposed to browser)
- Sessions use HTTP-only cookies
- HTTPS enforced in production

## Future Enhancements

- [ ] Price trend charts with Recharts
- [ ] Email notifications
- [ ] Round-trip flight support
- [ ] Multi-currency support
- [ ] Export price history to CSV
- [ ] Dark mode
- [ ] PWA support

## License

MIT License - feel free to use this project however you'd like!

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and the Amadeus API**
