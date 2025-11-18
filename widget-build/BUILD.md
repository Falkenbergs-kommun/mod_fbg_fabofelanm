# Building the React Widget

This guide explains how to build the standalone React widget for the Joomla module.

## Prerequisites

- Node.js 18+ and npm
- Access to the `felanmalan-mock` Next.js project

## Step 1: Copy Components from felanmalan-mock

The widget requires the following components from the Next.js project:

### Components to Copy

From `felanmalan-mock/components/`:
- `ReportForm.tsx` → `src/components/ReportForm.jsx`
- `ReportStatus.tsx` → `src/components/ReportStatus.jsx`
- `Combobox.tsx` → `src/components/Combobox.jsx`
- `Header.tsx` → `src/components/Header.jsx` (optional)
- `ApiLog.tsx` → `src/components/ApiLog.jsx` (optional, for debugging)

From `felanmalan-mock/lib/`:
- `fastaStrukturenStore.ts` → `src/lib/fastaStrukturenStore.js` (only type definitions and helpers)

### Conversion Steps

For each component:

1. **Create the new file:**
   ```bash
   mkdir -p src/components src/lib
   ```

2. **Copy and rename:**
   ```bash
   cp ../../felanmalan/felanmalan-mock/components/ReportForm.tsx src/components/ReportForm.jsx
   ```

3. **Convert TypeScript to JavaScript:**

   Remove all TypeScript-specific syntax:

   **Before (TypeScript):**
   ```typescript
   interface ReportFormProps {
     initialProperty?: string;
     onWorkOrdersLoaded?: (workOrders: any[]) => void;
   }

   export default function ReportForm({
     initialProperty = '',
     onWorkOrdersLoaded
   }: ReportFormProps) {
     const [objektList, setObjektList] = useState<Objekt[]>([]);
   }
   ```

   **After (JavaScript):**
   ```javascript
   export default function ReportForm({
     initialProperty = '',
     onWorkOrdersLoaded
   }) {
     const [objektList, setObjektList] = useState([]);
   }
   ```

4. **Update imports:**

   **Before (Next.js):**
   ```javascript
   import { useSearchParams } from 'next/navigation';
   import { apiClient } from '@/lib/apiClient';
   ```

   **After (Standalone):**
   ```javascript
   import { useApiClient } from '../apiClient';

   // Instead of useSearchParams, use:
   const searchParams = new URLSearchParams(window.location.search);
   ```

5. **Replace Next.js-specific hooks:**

   - `useSearchParams()` → `new URLSearchParams(window.location.search)`
   - `process.env.NEXT_PUBLIC_*` → Props passed from Joomla
   - `@/` imports → Relative imports (`../`, `./`)

## Step 2: Update FelanmalanWidget.jsx

Once components are copied, update `src/FelanmalanWidget.jsx`:

```javascript
import React, { useState } from 'react';
import { ApiClientProvider } from './apiClient';
import ReportForm from './components/ReportForm';
import ReportStatus from './components/ReportStatus';

export default function FelanmalanWidget({ apiEndpoint, userData, kundNr, googleMapsApiKey }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedObjekt, setSelectedObjekt] = useState(null);

  return (
    <ApiClientProvider apiEndpoint={apiEndpoint} kundNr={kundNr}>
      <div className="felanmalan-widget">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ReportForm
            userData={userData}
            onWorkOrdersLoaded={setWorkOrders}
            onObjektSelected={setSelectedObjekt}
          />
          <ReportStatus
            workOrders={workOrders}
            selectedObjekt={selectedObjekt}
          />
        </div>
      </div>
    </ApiClientProvider>
  );
}
```

## Step 3: Handle Styles

### Option A: Copy Tailwind Styles (Recommended)

1. Copy `felanmalan-mock/app/globals.css` → `src/styles.css`
2. Install Tailwind:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init
   ```
3. Configure `tailwind.config.js`:
   ```javascript
   export default {
     content: ['./src/**/*.{js,jsx}'],
     theme: { extend: {} },
     plugins: [],
   }
   ```

### Option B: Custom CSS

Write custom CSS to match the Tailwind classes used in components.

## Step 4: Build the Widget

```bash
npm install
npm run build
```

Output:
- `../assets/js/felanmalan-widget.js` (bundled UMD module)
- `../assets/css/felanmalan-widget.css` (extracted CSS)

## Step 5: Test Standalone

Create `public/index.html` for testing:

```html
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <title>Felanmälan Widget Test</title>
  <link rel="stylesheet" href="../assets/css/felanmalan-widget.css">
</head>
<body>
  <div id="test-container"></div>

  <script src="../assets/js/felanmalan-widget.js"></script>
  <script>
    FelanmalanWidget.init({
      containerId: 'test-container',
      apiEndpoint: 'http://localhost:3000/api/bff',
      userData: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '0346-88 60 00'
      },
      kundNr: 'SERVA10311',
      googleMapsApiKey: ''
    });
  </script>
</body>
</html>
```

Open in browser to test.

## Troubleshooting

### Build Errors

- **Module not found:** Check that all imports use relative paths
- **Unexpected token:** Check for remaining TypeScript syntax
- **React hooks error:** Ensure React is properly bundled

### Runtime Errors

- **useApiClient error:** Check that components are wrapped in `<ApiClientProvider>`
- **API errors:** Check that apiEndpoint is correct
- **CORS errors:** Ensure API endpoint allows requests from your domain

## Development Workflow

For live development:

```bash
npm run dev
```

This starts Vite dev server at `http://localhost:5173`.

Edit files in `src/` and see changes live.

## Production Build

```bash
npm run build
```

Minifies and optimizes for production.

File size should be ~200-300KB (including React).
