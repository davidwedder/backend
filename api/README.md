# FeAutos API

Backend API for the FeAutos car dealership application.

## Features

- RESTful API for car management
- Image upload and management (Vercel Blob or local storage)
- Store settings management
- Authentication with session-based admin access
- Prisma ORM with PostgreSQL

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure your database URL in `.env`

4. Run database migrations:
   ```bash
   npm run prisma:migrate:dev
   ```

5. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

6. Seed the database (optional):
   ```bash
   npm run prisma:seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Cars
- `GET /api/cars` - Get all cars
- `GET /api/cars/:id` - Get car by ID
- `POST /api/cars` - Create new car (admin only)
- `PUT /api/cars/:id` - Update car (admin only)
- `DELETE /api/cars/:id` - Delete car (admin only)

### Store Settings
- `GET /api/settings` - Get store settings
- `PUT /api/settings` - Update store settings (admin only)

### Authentication
- `POST /api/auth/login` - Admin login

## Deployment

This API is designed to be deployed separately from the frontend. You can deploy it to:

- Vercel
- Railway
- Render
- Heroku
- Any Node.js hosting platform

Make sure to set the environment variables in your deployment platform.