# SmartReserve Platform

SmartReserve is a full-stack smart booking and demand management platform designed for businesses such as restaurants, gyms, salons, clinics, and service providers.

The platform enables businesses to manage bookings, offers, customer activity, and demand analytics through a modern responsive interface with real-time inspired interactions.

---

# Features

## User Features
- Browse smart offers
- Explore discounted booking slots
- Filter offers by category and city
- Responsive modern UI
- Real-time styled booking activity
- Dynamic demand-based offer discovery

## Admin Features
- Admin dashboard
- Business and offer management
- Slot management
- Booking analytics
- Demand monitoring interface

## Platform Features
- Full-stack architecture
- Frontend and backend separation
- Modular monorepo structure
- API client integration
- Shared schemas and database models

---

# Tech Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## Backend
- Node.js
- TypeScript
- WebSocket support

## Database & APIs
- Drizzle ORM
- OpenAPI
- Zod Validation

## Tooling
- pnpm workspace

---

# Project Structure

```bash
artifacts/
├── smartreserve/        # Frontend application
├── api-server/          # Backend server

lib/
├── api-client-react/    # API client library
├── api-spec/            # OpenAPI specification
├── api-zod/             # Shared schemas and validation
├── db/                  # Database schemas
```

---

# Setup Instructions

## Clone Repository

```bash
git clone https://github.com/aryaaruja804/smartreserve-platform.git
```

## Install Dependencies

```bash
pnpm install
```

## Run Frontend

```bash
cd artifacts/smartreserve
pnpm dev
```

## Recommended Environment

- Replit
- GitHub Codespaces
- Linux/macOS environments

---

# Demo Credentials

## Admin Login

Email:
```text
admin@smartreserve.com
```

Password:
```text
password123
```

---

# Screenshots

## Home Page
- Smart demand-based offer discovery
- Real-time styled activity dashboard
- Dynamic booking interface

## Offers Page
- Category filtering
- City filtering
- Offer exploration interface
