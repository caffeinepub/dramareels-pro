# DramaReels Pro

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full DramaReels Pro admin panel as a React web app
- Motoko backend with complete data models mirroring the specified Firestore schema
- Dashboard with analytics cards and charts
- Dramas management (CRUD with thumbnail upload)
- Episodes manager (per-drama episode list, reorder, video upload)
- Categories management (CRUD, toggle active)
- Users management (table, search/filter, block/unblock, coin adjustment)
- Subscriptions management (table, pricing config)
- Coins & Rewards management (config, transaction log)
- Ads Config page (AdMob unit IDs)
- Push Notifications page (compose + history)
- App Settings page (maintenance mode, VIP pricing)
- Dark theme throughout matching the specified color palette

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan

### Backend (Motoko)
1. Data types for User, Creator, Category, Drama, Episode, Comment, CoinTransaction, Subscription, AppConfig, Notification, AnalyticsDay
2. Stable storage maps for each collection
3. CRUD APIs for dramas, episodes, categories, creators
4. User management: list, block/unblock, adjust coins
5. Subscription management: list, update pricing
6. Coin transactions: log, query
7. AppConfig: get/set
8. Notification: create record, list history
9. Analytics: get daily stats, summary
10. Seed realistic mock data on init

### Frontend (React + TypeScript)
1. App shell: dark sidebar nav, top bar, main content area
2. Dashboard: stat cards (Total Users, Active Today, Views, Revenue) + Recharts line/bar/area charts + recent tables
3. Dramas page: table with thumbnail/title/category/status + Add/Edit/Delete modal with form
4. Episodes page: drama selector + episode table + Add/Edit modal + drag-and-drop reorder
5. Categories page: grid/list with Add/Edit/Delete + active toggle
6. Users page: table with avatar/phone/coins/VIP + search/filter + detail drawer + block + coin adjust
7. Subscriptions page: table + pricing config form
8. Coins & Rewards page: config sliders/inputs + transaction log table + top earners
9. Ads Config page: form with Banner/Interstitial/Rewarded IDs + test mode toggle
10. Push Notifications page: compose form + audience select + send + history table
11. App Settings page: maintenance toggle + version info + VIP price form
12. All pages wired to backend actor with mock data fallback
