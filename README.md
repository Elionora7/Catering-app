# Catering App

Full-stack Next.js 14+ TypeScript application for catering services.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Authentication**: NextAuth.js (Credentials provider)
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration values.

4. Start PostgreSQL with Docker:
```bash
docker-compose up -d postgres
```

5. Generate Prisma Client:
```bash
npm run db:generate
```

6. Run database migrations (when ready):
```bash
npm run db:migrate
```

7. (Optional) Seed the database:
```bash
npm run db:seed
```

8. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
catering-app/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Protected admin pages
│   ├── auth/              # Authentication pages
│   └── ...
├── lib/                   # Utility libraries
│   ├── prisma.ts          # Prisma client instance
│   └── auth.ts            # NextAuth configuration
├── prisma/                # Prisma schema and migrations
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seed script
├── utils/                 # Utility functions
│   └── validators.ts      # Zod validation schemas
└── types/                 # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## Features

- User authentication (login/register)
- Menu browsing
- Event prebooking
- Shopping cart
- Order management
- Admin panel (protected routes)

## Notes

- Database migrations have not been run. Run `npm run db:migrate` when ready.
- Seed script is provided but not executed. Run `npm run db:seed` to populate sample data.
- NextAuth is configured but requires proper environment variables to work.

