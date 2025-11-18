# Felanmälan Joomla Module (mod_fbg_fabofelanm)

**✅ FULLY FUNCTIONAL - READY TO INSTALL**

Joomla module for fault reporting (felanmälan) integrated with FAST2 API. Complete React widget with PHP BFF (Backend for Frontend) architecture for secure API access.

## Features

- **Complete React Widget:** Fully functional form with property/space/unit selection
- **BFF Architecture:** PHP-based API proxy with two-tier authentication (OAuth2 + API token)
- **FAST2 Integration:** Full integration with FAST2 API v1.8
- **User Context:** Automatically uses logged-in Joomla user data (name, email, phone)
- **Property Hierarchy:** Objekt → Utrymme → Enhet selection with dynamic loading
- **File Uploads:** Multi-file upload (max 5 files, 4MB each, images + PDF)
- **Dual Mode:** Felanmälan and Beställning (with reference code)
- **Confidential Filtering:** Automatic server-side filtering of confidential work orders
- **Form Validation:** Client-side validation with error feedback
- **Success Feedback:** Real-time status updates with auto-reset

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

### Prerequisites

- Joomla 4.0+ or 5.x
- PHP 8.0+ (Joomla 4.x) or PHP 8.1+ (Joomla 5.x)
- FAST2 API credentials (OAuth2 + username/password)

### Step 1: Install Module in Joomla

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

### Step 2: Configure Module

In the module settings, configure:

**Basic Settings:**
- **FAST2 Base URL:** `https://klient-test.fabo.se:8243`
- **OAuth2 Token Endpoint:** (leave empty to auto-detect)
- **Consumer Key:** Your OAuth2 consumer key
- **Consumer Secret:** Your OAuth2 consumer secret
- **FAST2 Username:** API username
- **FAST2 Password:** API password
- **Customer ID:** `296751` (numeric kundId for filtering objects)
- **Customer Number:** `SERVKOMMUN` (alphanumeric kundNr for work orders)

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

## What's Included

**Ready-to-use built assets:**
- `assets/js/felanmalan-widget.js` (488KB, 150KB gzipped) - Complete React widget
- `assets/css/felanmalan-widget.css` (4.87KB, 1.37KB gzipped) - Tailwind styles

**React Components (source in `widget-build/src/`):**
- `ReportForm.jsx` - Complete form with validation
- `ReportStatus.jsx` - Work order status display
- `Combobox.jsx` - Searchable dropdown
- `apiClient.jsx` - Joomla AJAX client

**No build required!** The widget is pre-built and ready to use.

## Development (Optional)

Only needed if you want to modify the React widget:

### Rebuild Widget

```bash
cd widget-build
npm install
npm run build
```

### Live Development

```bash
npm run dev  # Starts Vite dev server at http://localhost:5173
```

### Test Standalone

```bash
open widget-build/public/index.html  # Test widget without Joomla
```

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
