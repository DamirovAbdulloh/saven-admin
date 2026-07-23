# Savin Admin — Frontend (Vue 3 + Vite + Tailwind)

`design-inspiration-guide` maketining Vue.js'ga aynan (dizayn va animatsiyalar
saqlangan holda) ko'chirilgan versiyasi. Backend: Django + DRF (`savin-backend`).

## O'rnatish

```bash
npm install
npm run dev
```

Standart holatda Vite dev server `http://localhost:5173` da ishlaydi va
`/api/*` so'rovlarini `http://localhost:8000` dagi Django serverga
proksi qiladi (`vite.config.ts`).

Production build:

```bash
npm run build
```

## Tuzilma

- `src/views/` — 7 ta sahifa: AuthView, DashboardView, UsersView,
  BusinessesView, PaymentsView, NotificationsView, AnalyticsView, SettingsView
- `src/components/` — AppSidebar, AppLayout, PageHeader, StatCard, StatusBadge,
  TableCard, ToggleSwitch, ToastHost
- `src/stores/auth.ts` — Pinia orqali autentifikatsiya holati (token localStorage'da saqlanadi)
- `src/api/client.ts` — Axios instance, tokenni avtomatik qo'shadi, 401'da login sahifasiga qaytaradi
- `src/lib/chartTheme.ts` — Chart.js uchun umumiy ranglar/sozlamalar
- `src/assets/main.css` — dizayn tokenlari (asl maketdagi CSS o'zgaruvchilar bilan bir xil)

## Backend bilan ishlash

1. `savin-backend` papkasida serverni ishga tushiring (`python manage.py runserver 8000`)
2. `npm run dev` — login sahifasida **admin / admin12345** bilan kiring
   (`seed_demo_data` bilan yaratilgan)
"# saven-admin" 
