# Felanmälan Joomla Module (mod_fbg_fabofelanm)

Joomla module for fault reporting (felanmälan) integrated with FAST2 API. Embeds a React-based widget with BFF (Backend for Frontend) architecture for secure API access.

## Features

- **React Widget:** Standalone React component embedded in Joomla
- **BFF Architecture:** PHP-based API proxy with two-tier authentication
- **FAST2 Integration:** OAuth2 + API token authentication
- **User Context:** Automatically uses logged-in Joomla user data (name, email, phone)
- **Property Hierarchy:** Support for objekt → utrymme → enhet selection
- **File Uploads:** Multi-file upload support (images and PDF)
- **Confidential Filtering:** Automatic filtering of confidential work orders
- **QR Code Generation:** Generate QR codes for specific locations

## Architecture

```
Joomla User (Browser)
    ↓
tmpl/default.php (loads React widget)
    ↓
React Widget (felanmalan-widget.js)
    ↓
Joomla AJAX: index.php?option=com_ajax&module=fbg_fabofelanm&method=proxy
    ↓
helper.php (BFF logic)
    ↓
lib/ProxyToRealApi.php (OAuth2 + API auth)
    ↓
FAST2 API
```

## Installation

### Step 1: Build React Widget

The React widget must be built before installing the module:

```bash
cd widget-build
npm install
npm run build
```

This creates `assets/js/felanmalan-widget.js` and `assets/css/felanmalan-widget.css`.

**Important:** Before building, you must copy the React components from `felanmalan-mock`:

1. Copy components from `felanmalan-mock/components/`:
   - `ReportForm.tsx` → `widget-build/src/components/ReportForm.jsx`
   - `ReportStatus.tsx` → `widget-build/src/components/ReportStatus.jsx`
   - `Combobox.tsx` → `widget-build/src/components/Combobox.jsx`
   - `Header.tsx` → `widget-build/src/components/Header.jsx` (optional)

2. Convert TypeScript to JavaScript:
   - Remove all type annotations (`: Type`, `interface`, etc.)
   - Change file extension from `.tsx` to `.jsx`
   - Replace Next.js imports with vanilla JS equivalents

3. Update imports in `widget-build/src/FelanmalanWidget.jsx`

See `widget-build/BUILD.md` for detailed instructions.

### Step 2: Install Module in Joomla

1. Create a ZIP file of the module:
   ```bash
   zip -r mod_fbg_fabofelanm.zip . -x "*.git*" -x "widget-build/node_modules/*" -x "widget-build/dist/*"
   ```

2. In Joomla admin:
   - Go to **Extensions → Manage → Install**
   - Upload `mod_fbg_fabofelanm.zip`
   - Click **Install**

3. Publish the module:
   - Go to **Extensions → Modules**
   - Find "Felanmälan" module
   - Click to edit
   - Set **Status** to **Published**
   - Assign to desired **Position**
   - Save

### Step 3: Configure Module

In the module settings, configure:

**Basic Settings:**
- **FAST2 Base URL:** `https://klient-test.fabo.se:8243`
- **OAuth2 Token Endpoint:** (leave empty to auto-detect)
- **Consumer Key:** Your OAuth2 consumer key
- **Consumer Secret:** Your OAuth2 consumer secret
- **FAST2 Username:** API username
- **FAST2 Password:** API password
- **Customer Number:** `SERVA10311` (or your kundNr)
- **Google Maps API Key:** (optional)

**User Field Mapping:**
- **Name Field:** `name` (default Joomla user name field)
- **Email Field:** `email` (default Joomla user email field)
- **Phone Field:** `profile.phone` (custom field path)

## Server Structure

The module is installed on the server in the following structure:

```
/var/www/html/joomlaextensions/fabofelanm/mod_fbg_fabofelanm/
├── tmpl/
│   └── default.php
├── helper.php
├── mod_fbg_fabofelanm.php
├── mod_fbg_fabofelanm.xml
├── assets/
│   ├── js/
│   │   └── felanmalan-widget.js
│   └── css/
│       └── felanmalan-widget.css
└── lib/
    ├── OAuth2Client.php
    ├── ApiAuthClient.php
    └── ProxyToRealApi.php
```

## Development

### Widget Development

To develop the React widget:

```bash
cd widget-build
npm install
npm run dev
```

This starts a Vite dev server at `http://localhost:5173` for live development.

### Building for Production

```bash
cd widget-build
npm run build
```

Outputs to `../assets/js/` and `../assets/css/`.

### Testing the Widget Standalone

Open `widget-build/public/index.html` in a browser to test the widget without Joomla.

## BFF (Backend for Frontend) Pattern

The module implements a BFF pattern where:

1. **Client (React)** makes requests to Joomla AJAX endpoint
2. **PHP Helper** proxies requests to FAST2 API
3. **PHP Libraries** handle OAuth2 and API authentication
4. **Token Caching** uses Joomla session storage

This ensures:
- ✅ OAuth2 credentials never exposed to browser
- ✅ Automatic token refresh and retry on auth failures
- ✅ Confidential work orders filtered server-side
- ✅ User context from Joomla session

## Security

- All API credentials stored in Joomla module parameters (encrypted in database)
- Session-based token caching (per-user isolation)
- CSRF token validation on AJAX requests
- Only authenticated Joomla users can access the widget

## Troubleshooting

### Widget Not Loading

1. Check that `assets/js/felanmalan-widget.js` exists
2. Check browser console for JavaScript errors
3. Verify module is published and assigned to a position

### API Errors

1. Check module configuration (FAST2 credentials)
2. Check PHP error logs: `/var/log/apache2/error.log`
3. Enable Joomla debug mode to see detailed errors

### Authentication Errors

1. Verify OAuth2 credentials are correct
2. Verify FAST2 username/password are correct
3. Check that tokens are being cached in session
4. Try clearing Joomla session cache

## License

Copyright (C) 2025 Falkenbergs kommun. All rights reserved.

This module is licensed under the GNU General Public License version 2 or later.

## Support

For issues and questions, contact: it@falkenberg.se
