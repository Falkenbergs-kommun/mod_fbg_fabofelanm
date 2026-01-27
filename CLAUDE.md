# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Joomla module (`mod_fbg_fabofelanm`) that provides a fault reporting (felanmälan) widget for Falkenbergs kommun. It integrates with the FAST2 API using a Backend for Frontend (BFF) architecture pattern with two-tier authentication.

## Architecture

### Three-Layer System

1. **Frontend Layer**: React widget (`widget-build/src/`)
   - Pre-built to `assets/js/felanmalan-widget.js`
   - Rendered by `tmpl/default.php`
   - Makes AJAX requests to Joomla

2. **BFF Layer**: PHP proxy (`helper.php`, `lib/ProxyToRealApi.php`)
   - Handles all FAST2 API authentication
   - Proxies React requests to FAST2 API
   - Filters confidential work orders server-side
   - Endpoint: `index.php?option=com_ajax&module=fbg_fabofelanm&method=proxy`

3. **External API**: FAST2 API
   - Requires two-tier authentication:
     1. OAuth2 token (WSO2 API Gateway) - handled by `lib/OAuth2Client.php`
     2. API token from username/password - handled by `lib/ApiAuthClient.php`
   - Both tokens cached in Joomla session with automatic refresh

### Authentication Flow

```
React Widget
    ↓ AJAX (no auth headers)
helper.php::proxyAjax()
    ↓
ProxyToRealApi::proxyRequest()
    ↓
OAuth2Client::getValidToken()  → Session cache: 'mod_fbg_fabofelanm.oauth2_token'
    ↓
ApiAuthClient::getValidApiToken() → Session cache: 'mod_fbg_fabofelanm.api_token'
    ↓
cURL to FAST2 with both:
  - Authorization: Bearer {oauth2_token}
  - X-Auth-Token: {api_token}
```

**Key Pattern**: On 401/403 errors, both token caches are cleared and request is automatically retried once.

### Module Initialization

`mod_fbg_fabofelanm.php` (entry point):
- Checks if user is logged in
- Fetches user data (name, email, phone) via `helper.php::getUserData()`
- Passes config to template: `apiEndpoint`, `userData`, `kundId`, `kundNr`

`tmpl/default.php` (template):
- Loads CSS and JS assets
- Creates container div with unique ID
- Initializes React widget via `window.FelanmalanWidget.init()`

## Common Development Tasks

### Build React Widget

Only required when modifying React components in `widget-build/src/`:

```bash
cd widget-build
npm install
npm run build
```

This outputs to `assets/js/felanmalan-widget.js` and `assets/css/felanmalan-widget.css`.

### Test Widget Standalone

```bash
cd widget-build
npm run dev  # Starts Vite dev server at http://localhost:5173
```

Use `widget-build/public/index.html` for standalone testing without Joomla.

### Package Module for Installation

```bash
zip -r mod_fbg_fabofelanm.zip . \
  -x "*.git*" \
  -x "widget-build/node_modules/*" \
  -x "widget-build/dist/*"
```

Install via Joomla admin: Extensions → Manage → Install

### Debug Authentication Issues

Clear both token caches:
```
GET index.php?option=com_ajax&module=fbg_fabofelanm&method=clearAuthCache&format=json
```

Check PHP error logs:
```bash
tail -f /var/log/apache2/error.log
```

Enable API logging in module settings (`enable_logging` parameter) to log work order creation and file uploads.

## Key Files

- `mod_fbg_fabofelanm.php` - Module entry point
- `mod_fbg_fabofelanm.xml` - Joomla manifest with module configuration fields
- `helper.php` - BFF logic, AJAX handlers, user data retrieval
- `tmpl/default.php` - Template that renders widget container
- `lib/ProxyToRealApi.php` - Main proxy with two-tier auth coordination
- `lib/OAuth2Client.php` - OAuth2 client credentials flow (WSO2 gateway)
- `lib/ApiAuthClient.php` - Username/password login for FAST2 API token
- `lib/ApiLogger.php` - Optional request logger for work orders and files
- `widget-build/src/FelanmalanWidget.jsx` - Main React widget component
- `widget-build/src/apiClient.jsx` - Joomla AJAX client wrapper
- `widget-build/src/components/ReportForm.jsx` - Form with property/space/unit selection
- `widget-build/vite.config.js` - Vite build configuration (UMD format, outputs to `../assets/js`)

## Module Parameters

Configured via Joomla admin → Extensions → Modules → Felanmälan:

**FAST2 API:**
- `fast2_base_url` - Base URL (e.g., `https://klient-test.fabo.se:8243`)
- `oauth2_token_endpoint` - Optional, defaults to `{fast2_base_url}/oauth2/token`
- `consumer_key`, `consumer_secret` - OAuth2 credentials
- `username`, `password` - FAST2 API credentials
- `kund_id` - Customer ID for filtering objects (numeric, e.g., `296751`)
- `kund_nr` - Customer number for work orders (alphanumeric, e.g., `SERVKOMMUN`)

**User Field Mapping:**
- `user_name_field` - Default: `name`
- `user_email_field` - Default: `email`
- `user_phone_field` - Default: `profile.mobil` (supports nested fields)

**Logging:**
- `enable_logging` - Enable API request logging
- `log_directory` - Where to save logs

## Important Patterns

### User Field Retrieval

`helper.php::getUserField()` supports nested field paths:
- Direct fields: `name`, `email`
- Profile fields: `profile.mobil`, `profile.phone`

Profile fields are fetched from `#__user_profiles` table and JSON-decoded if stored as JSON.

### Confidential Filtering

Work orders with `externtNr: "CONFIDENTIAL"` are filtered out in `helper.php::filterConfidentialWorkOrders()` for all GET requests to `/arbetsorder` endpoints.

### Session-Based Caching

Both OAuth2 and API tokens use Joomla session storage:
- Key: `mod_fbg_fabofelanm.oauth2_token` and `mod_fbg_fabofelanm.api_token`
- OAuth2 tokens refresh 60 seconds before expiry (buffer)
- API tokens refresh at expiry (no buffer)

### File Uploads

Handled as multipart/form-data in `helper.php::proxyAjax()`:
- Converts PHP uploaded files to `CURLFile` objects
- Proxied with appropriate Content-Type
- Logged if logging enabled

## Requirements

- Joomla 4.0+ or 5.x
- PHP 8.0+ (Joomla 4.x) or PHP 8.1+ (Joomla 5.x)
- FAST2 API credentials (OAuth2 + username/password)
- UIkit 3 (typically provided by Joomla template)

## Debugging React Widget

The widget initialization includes retry logic (50 retries × 100ms = 5 seconds max) in `tmpl/default.php`.

Check browser console for:
- `FelanmalanWidget failed to load` - JS file not loading
- `Error initializing widget` - Configuration or API issues

Widget exposes global: `window.FelanmalanWidget.init()`
