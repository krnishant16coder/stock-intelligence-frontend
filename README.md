# Stock Intelligence — Frontend (V1)

React + TypeScript + Vite + Tailwind CSS + shadcn-style UI + Lucide + React Query + React Router.

Standalone repo. Pair it with the backend repo (`stock-intelligence-backend`, Spring Boot on `:8080`).

## Backend contract

The Spring Boot backend exposes REST only (no auth):

| Area | Endpoints |
|---|---|
| Stocks | `POST /api/stocks` `{symbol,companyName,exchange}` · `GET /api/stocks` · `PUT /api/stocks/{id}` · `DELETE /api/stocks/{id}` |
| Watchlists | `POST /api/watchlists` `{name}` · `GET /api/watchlists` · `POST /api/watchlists/{id}/stocks` `{stockId}` · `DELETE /api/watchlists/{id}/stocks/{stockId}` |
| Schedules | `GET /api/schedules` · `PUT /api/watchlists/{id}/schedule` `{frequency: DAILY\|WEEKLY\|MONTHLY, timezone, active}` · `POST /api/watchlists/{id}/analyze` |
| Reports | `GET /api/reports?watchlistId=` · `GET /api/reports/{id}` · `GET /api/stocks/{id}/analysis?limit=` |
| Alerts | `GET /api/alerts?status=&stockId=` · `GET /api/alerts/{id}` · `PUT /api/alerts/{id}/read` |
| System | `GET /actuator/health` · `GET /actuator/info` |

Error shape: `{timestamp, status, error}`. No CORS is configured on the backend, so dev uses the Vite proxy below.

## Run

```bash
npm install
npm run dev      # http://localhost:5173 → proxies /api + /actuator to :8080
npm run build    # tsc + vite build
npm run lint     # oxlint
```

Production: serve `dist/` from the same origin as the backend (or enable CORS server-side). Optional `VITE_API_URL` overrides the API origin — copy `.env.example` to `.env` if needed.

## Notes

- Real backend data only. The report detail view renders exactly the V1 fields (`signal, riskLevel, priceTrend, fundamentalTrend, newsImpact, summary, keyReasons, confidence, criticalAlert`) and explains `INSUFFICIENT_DATA` / low-confidence cases instead of inventing prices or news.
- Backend is untouched; all integration lives in `src/lib/api.ts`, `src/lib/types.ts`, `src/hooks/useApi.ts`.
