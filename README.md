# French Forest Geospatial App

Full-stack app for visualizing and analyzing French forest data (BD Forêt) on an interactive map.

## Tech Stack

**Frontend:** Next.js 14, TypeScript, OpenLayers, Tailwind CSS, Axios

**Backend:** NestJS, TypeORM, PostgreSQL + PostGIS, JWT auth (Passport), GraphQL

## Setup

### Environment Variables

**backend/.env**

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=forest_db
DATABASE_SSL=false
JWT_SECRET=your-secret-key
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Docker

```bash
docker-compose up -d
```

Frontend runs on http://localhost:3000, backend on http://localhost:3001, Swagger docs at http://localhost:3001/api.

### Manual

```bash
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```

Requires PostgreSQL with PostGIS running locally.

### Importing Forest Data

Forest data for Île-de-France is sourced from OpenStreetMap:

```bash
cd backend
npm run import:idf-forest     # downloads from Overpass API
npm run import:forest-to-db   # imports into PostGIS
```

## Features

- JWT authentication (register, login, protected routes)
- Interactive map with satellite imagery and OSM labels
- BD Forêt layer with species-based color coding (data for Île-de-France)
- French cadastre parcels via Géoplateforme WMS (visible at zoom 14+)
- Progressive navigation: click regions → departments → zoom into forest data
- Polygon drawing tool for forest coverage analysis (species distribution, area in hectares)
- Map state saved per user (position, zoom, active layers)

## API Endpoints

### Auth

- `POST /auth/register` — register
- `POST /auth/login` — login, returns JWT
- `GET /auth/profile` — current user

### Geo

- `GET /geo/regions` — list French regions
- `GET /geo/departments/:regionId` — departments by region
- `GET /geo/forest/bbox?bounds=...&zoom=...` — forest features in bounding box (PostGIS)
- `POST /geo/analyze-polygon` — forest stats for a drawn polygon

### Users

- `GET /users/:id/map-state` — saved map state
- `PUT /users/:id/map-state` — update map state

## Data Sources

- **BD Forêt V2 (IGN)** — forest polygons from OpenStreetMap (Île-de-France subset)
- **French Cadastre** — Géoplateforme WMS tiles (CADASTRALPARCELS.PARCELLAIRE_EXPRESS)
