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

    load Shapefiles per department from https://geoservices.ign.fr/bdforet#telechargementv2

1. Download the `.7z` archive for the department(s) you want
2. Extract the Shapefiles into `backend/data/bdforet/`
3. Run the import:

```bash
cd backend
npm run import:bdforet
```

The script finds all `.shp` files in `data/bdforet/`, reprojects from Lambert 93 to WGS84, and imports into PostGIS. You can import multiple departments at once.

## Features

- JWT authentication (register, login, protected routes)
- Interactive map with satellite imagery and OSM labels
- BD Forêt layer with species-based color coding
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

- **BD Forêt® V2 (IGN)** — forest inventory Shapefiles, https://geoservices.ign.fr/bdforet
- **French Cadastre** — Géoplateforme WMS tiles (CADASTRALPARCELS.PARCELLAIRE_EXPRESS)
- **Communes** — geo.api.gouv.fr
