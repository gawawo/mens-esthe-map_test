# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

メンズエステ店検索Webアプリ - Google Maps Platform + LLM (Gemini) を活用したリスク回避型店舗検索システム。レビューをAI解析し、5軸スコアリング・サクラ検出・リスク分類を提供。

## Commands

### Development (Docker)
```bash
docker compose up -d          # Start all services
docker compose logs -f        # View logs
docker compose down           # Stop services
docker compose build backend  # Rebuild backend (after requirements.txt changes)
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Linting & Formatting
black app/
ruff check app/

# Tests
pytest
pytest tests/test_specific.py -v
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type check only
```

## Architecture

### Backend (`backend/`)
- **FastAPI** with SQLAlchemy ORM
- **PostgreSQL** with PostGIS (geography) + pgvector (embeddings)
- API versioned at `/api/v1/`

Key modules:
- `app/api/v1/` - API routers: shops, reviews, analytics, ingestion, search
- `app/models/` - SQLAlchemy models: Shop (PostGIS GEOGRAPHY), Review (pgvector embedding), ShopAIAnalytics
- `app/services/` - Business logic: places_api (Google Places New API), ingestion pipeline
- `app/ai/` - LLM integration: llm_client (Gemini with JSON mode), analyzer (review analysis), embeddings (text-embedding-004), rag_search (vector search + LLM answer)
- `app/tasks/` - Background scheduler for periodic analysis (analyze_unanalyzed every 60min, analyze_outdated every 6h)

### Frontend (`frontend/`)
- **Next.js 14** App Router with TypeScript
- **@vis.gl/react-google-maps** for Advanced Markers
- **Zustand** for state management
- **Framer Motion** for animations
- **Recharts** for radar charts

Key structure:
- `src/app/page.tsx` - Server component that fetches initial shop data (SSR)
- `src/components/ClientPage.tsx` - Client wrapper receiving SSR data
- `src/components/Map/` - MapContainer, ShopMarker, MapFilterChips, ShopCarousel, MapSearchBar
- `src/components/Shop/` - ShopCard, RadarChart (5-axis), RiskBadge, ShopDetailPanel
- `src/components/Filter/` - DetailedFilterPanel (sliders for rating/sakura risk)
- `src/components/Ranking/` - AreaRanking (area-based shop rankings)
- `src/components/Search/` - AIChat (RAG search UI), SearchBar
- `src/components/AICharacter/` - AI assistant character UI
- `src/components/Animation/` - Reusable animation components
- `src/stores/` - shopStore, filterStore, mapStore, characterStore
- `src/hooks/` - useBreakpoint (responsive), useShops, useMap, useFilter, useAISearch
- `src/lib/api.ts` - API client functions

### Responsive Design
Uses `useBreakpoint` hook with Tailwind breakpoints:
- mobile: < 768px (md)
- tablet: 768px - 1024px
- desktop: >= 1024px (lg)

### Data Flow
1. **Ingestion**: Google Places API → shops/reviews tables
2. **Analysis**: Reviews → Gemini LLM (JSON mode) → shop_ai_analytics (5-axis scores, risk_level)
3. **Embeddings**: Review text → text-embedding-004 → pgvector
4. **Search**: User query → vector similarity → LLM answer generation

## Risk Classification
- `safe` (green): Low risk, verified quality
- `gamble` (yellow): High variance, mixed reviews
- `mine` (red): Known issues, accuracy problems
- `fake` (ghost): High sakura_risk (fake review suspicion)

## 5-Axis Scoring (0-10, higher = safer)
- `score_operation`: Operational legitimacy
- `score_accuracy`: Information accuracy (Google reviews match reality)
- `score_hygiene`: Cleanliness and environment
- `score_sincerity`: Service authenticity
- `score_safety`: Psychological safety and trustworthiness

## Environment Variables
Required in `.env`:
- `GOOGLE_PLACES_API_KEY` - Google Places API (New)
- `GOOGLE_MAPS_API_KEY` - Google Maps JavaScript API
- `GOOGLE_MAP_ID` - Google Maps Map ID (for Advanced Markers)
- `GEMINI_API_KEY` - Google Gemini API
- `APIFY_API_TOKEN` - Apify API (for Google Reviews scraping)
- `POSTGRES_USER/PASSWORD/DB` - Database credentials

## Development Ports
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- Database: localhost:5432
- Adminer (DB UI): http://localhost:8080

## API Endpoints
- `POST /api/v1/ingestion/run` - Trigger data ingestion
- `POST /api/v1/analytics/analyze/batch` - Run AI analysis (with force=true to re-analyze)
- `POST /api/v1/analytics/analyze/shop/{shop_id}` - Analyze single shop
- `POST /api/v1/search/chat` - RAG-based natural language search
- `POST /api/v1/search/embeddings/generate` - Generate review embeddings
- `GET /api/v1/shops/nearby` - Geospatial shop search
- `GET /api/v1/ranking` - Area-based shop rankings

## Predefined Search Areas
Ingestion supports these Tokyo areas (in `app/services/ingestion.py`):
- Shinjuku (新宿): radius 1500m
- Shibuya (渋谷): radius 1000m
- Ikebukuro (池袋): radius 1000m
- Ueno (上野): radius 1000m
- Akihabara (秋葉原): radius 800m

## Development Workflow (PR-based)

**重要**: mainブランチへの直接pushは禁止。必ずPR経由で変更する。

```bash
# 1. 機能ブランチ作成
git checkout main && git pull origin main
git checkout -b feature/機能名

# 2. 実装・コミット
git add -A && git commit -m "feat: 機能の説明"

# 3. プッシュ・PR作成
git push -u origin HEAD
gh pr create --title "タイトル" --body "説明"

# 4. CIが通ったらマージ
gh pr merge --squash --delete-branch
```

ブランチ命名: `feature/`, `fix/`, `refactor/`, `docs/`, `chore/`

CI (GitHub Actions): PRで自動実行
- Frontend: lint, type check, build
- Backend: ruff, black

## Production Deployment (Railway)
- Frontend: `keen-abundance-production.up.railway.app`
- Backend: `mens-esthe-map-production.up.railway.app`
- Database: Supabase (PostgreSQL with PostGIS + pgvector)

Railway environment variables for Frontend:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `NEXT_PUBLIC_GOOGLE_MAP_ID` - Google Maps Map ID
- `BACKEND_API_URL` - Backend API URL (e.g., `https://mens-esthe-map-production.up.railway.app`)
