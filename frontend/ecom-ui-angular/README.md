# ecom-ui

Angular 17 frontend for the e-commerce and dashboard experience.

## Tech stack

- Angular 17
- Angular Material
- Angular CDK
- Chart.js
- ng2-charts
- RxJS
- TypeScript

## Available npm scripts

```bash
npm install
npm start
npm run build
npm test
```

Script behavior from `package.json`:
- `npm start` -> `ng serve -o`
- `npm run build` -> production-style Angular build
- `npm test` -> Karma/Jasmine tests

## Local run

```bash
npm install
npm start
```

## API target

The app currently calls:
- `https://localhost:57240`

This is defined in:
- `src/app/core/api.config.ts`

If the backend runs on another host/port, update that file before running locally.

## Main routes

- `/` - home page
- `/products` - catalog page
- `/products/:id` - product details
- `/cart` - authenticated cart
- `/login` - login page
- `/orders` - authenticated user orders
- `/admin` - admin management screen
- `/dashboard` - admin analytics dashboard

## Source layout

- `src/app/core/` - config, models, auth, services, guards, interceptor
- `src/app/pages/` - route-level pages
- `src/app/shared/` - reusable components, widgets, dialogs

## Dependencies already declared

- `@angular/*` 17.3.x
- `@angular/material` 17.3.x
- `chart.js` 4.4.x
- `ng2-charts` 5.0.x

## Notes for running successfully

- Start the backend first.
- Make sure the browser trusts the local ASP.NET HTTPS development certificate if prompted.
- If authentication calls fail because of host mismatch, verify the backend is actually listening on `https://localhost:57240`.


## Authors

- **Youssef Ben Abdallah**
- **Mariem Ben Slim**
