# Design: Save Work Orders to Local Database

**Date:** 2026-01-30
**Status:** Approved

## Overview

Save successfully created work orders to a local database table for tracking purposes. When the FAST2 API returns a work order ID after successful creation, store the work order ID and user ID in the local `fbg_fabo_felanm` table.

## Requirements

- Track all work order types (felanmälan and beställning)
- Store work order ID and user ID in local database
- Database insert failures should be logged but not block the API success response
- Minimal impact on existing code and performance

## Database Schema

**Table:** `fbg_fabo_felanm` (no Joomla prefix)

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Work order number from FAST2 API |
| `user` | int | Joomla user ID who created the work order |
| `ts_created` | timestamp | Auto-populated (DEFAULT CURRENT_TIMESTAMP) |

Note: Table already exists in database.

## Architecture

### Implementation Location

Add logic in `helper.php::proxyAjax()` method, immediately after `ProxyToRealApi::proxyRequest()` returns a successful response.

### Flow

1. User submits POST request to `/arbetsorder` endpoint
2. `ProxyToRealApi::proxyRequest()` calls FAST2 API
3. API returns success response with work order ID
4. **New logic:**
   - Check if response is successful (HTTP 200-299)
   - Extract work order ID from JSON response
   - Get current user ID from Joomla session
   - INSERT into `fbg_fabo_felanm` table
   - Log any database errors but continue
5. Return API response to React widget (regardless of database result)

### Why This Approach

- Minimal code changes to existing flow
- Work order creation is primary operation - local tracking is secondary
- User sees immediate success when FAST2 confirms
- Database failures don't impact user experience

## Implementation Details

### Request Identification

Only save work orders when:
- HTTP method is POST
- Endpoint matches `/arbetsorder` (not `/arbetsorder/{id}/bilagor`)
- Response status is 200-299
- Response contains valid `id` field

### ID Extraction

FAST2 API response format:
```json
{
  "id": 12345,
  "status": {...},
  ...
}
```

Code:
```php
$responseData = json_decode($response, true);
if (isset($responseData['id']) && is_numeric($responseData['id'])) {
    $workOrderId = (int)$responseData['id'];
    // Perform INSERT
}
```

### Database Interaction

Use Joomla Database API:

```php
use Joomla\CMS\Factory;

$db = Factory::getDbo();
$query = $db->getQuery(true);

$query
    ->insert($db->quoteName('fbg_fabo_felanm'))
    ->columns($db->quoteName(['id', 'user']))
    ->values($workOrderId . ', ' . $userId);

try {
    $db->setQuery($query);
    $db->execute();
} catch (Exception $e) {
    error_log('Failed to save work order to local DB: ' . $e->getMessage());
    // Continue - return success to user anyway
}
```

### Error Handling

Database insert failures are logged but don't affect the response:

```php
try {
    $db->setQuery($query);
    $db->execute();
} catch (Exception $e) {
    error_log('Failed to save work order to local DB: ' . $e->getMessage());

    // Optional: use ApiLogger if enabled
    if ($this->params->get('enable_logging')) {
        $this->logger->logError('DB insert failed', [
            'workOrderId' => $workOrderId,
            'userId' => $userId,
            'error' => $e->getMessage()
        ]);
    }
}
```

### Security

- Use Joomla's `quoteName()` for column/table names
- Cast values to appropriate types (int)
- No direct string concatenation in SQL
- Parameterized queries prevent SQL injection

## Edge Cases

### 1. User Not Logged In
Should not happen (module requires login), but check as safeguard:
```php
$user = Factory::getUser();
if ($user->guest) {
    return; // Skip database insert
}
```

### 2. Duplicate Inserts
If user refreshes immediately after creation:
- Table should have UNIQUE constraint on `id` column, OR
- Catch duplicate key errors gracefully in try-catch

### 3. Invalid API Response
If response doesn't contain valid ID:
- Skip INSERT silently
- No error needed (work order may not have been created)

### 4. Database Connection Failure
Caught by try-catch, logged, execution continues

## Performance Impact

- Single INSERT query per work order creation
- Estimated overhead: 1-5ms
- No noticeable impact on user experience
- No impact on API response time (happens after API call succeeds)

## Testing Checklist

- [ ] Create felanmälan - verify database entry
- [ ] Create beställning - verify database entry
- [ ] Check `ts_created` auto-populates correctly
- [ ] Simulate database error - verify graceful handling
- [ ] Verify API success still returned when database fails
- [ ] Check error logging works
- [ ] Verify no SQL injection vulnerabilities
- [ ] Test with logged out user (should not crash)

## Rollback Plan

If issues arise:
1. Comment out database INSERT code
2. Module continues to function normally
3. No data loss (work orders still created in FAST2)
