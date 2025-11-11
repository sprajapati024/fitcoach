# Debugging Nutrition Logging Issue

## Step 1: Check Browser Console

Open your browser's DevTools (F12) and go to the Console tab. Look for any errors when you try to log nutrition.

## Step 2: Run This Diagnostic Script

Copy and paste this into your browser console:

```javascript
// Diagnostic Script for Nutrition Logging
(async function() {
  console.log('=== NUTRITION LOGGING DIAGNOSTIC ===');

  // Check if IndexedDB is supported
  console.log('1. IndexedDB supported:', typeof indexedDB !== 'undefined');

  // Check if database exists
  const dbs = await indexedDB.databases();
  console.log('2. Databases:', dbs);

  // Open the database and check version
  const dbRequest = indexedDB.open('FitCoachLocalDB');
  dbRequest.onsuccess = function(event) {
    const db = event.target.result;
    console.log('3. Database version:', db.version);
    console.log('4. Object stores:', Array.from(db.objectStoreNames));

    // Check if meals store exists
    if (db.objectStoreNames.contains('meals')) {
      console.log('5. Meals store exists: ✓');

      // Try to read meals
      const tx = db.transaction('meals', 'readonly');
      const store = tx.objectStore('meals');
      const request = store.getAll();

      request.onsuccess = function() {
        console.log('6. Meals in database:', request.result.length);
        console.log('7. Sample meals:', request.result.slice(0, 3));
      };
    } else {
      console.log('5. Meals store exists: ✗ ERROR!');
    }

    // Check waterLogs
    if (db.objectStoreNames.contains('waterLogs')) {
      console.log('8. WaterLogs store exists: ✓');
    } else {
      console.log('8. WaterLogs store exists: ✗ ERROR!');
    }

    db.close();
  };

  dbRequest.onerror = function(event) {
    console.error('Error opening database:', event);
  };
})();
```

## Step 3: Check Network Tab

1. Open Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Try logging a meal
4. Look for:
   - Any failed requests (red)
   - `/api/sync/push` request (should happen after logging)

## Step 4: Check Application Tab

1. Go to Application tab in DevTools
2. Expand "IndexedDB" in left sidebar
3. Click "FitCoachLocalDB"
4. Check if you see:
   - meals
   - waterLogs
   - profiles
   etc.

## Common Issues & Solutions

### Issue 1: Database Version is 1 (Expected: 2)
**Solution:** Clear browser data and reload
1. DevTools → Application → Storage
2. Click "Clear site data"
3. Reload page
4. Log in again

### Issue 2: Meals store doesn't exist
**Solution:** Same as Issue 1 - clear browser data

### Issue 3: Meals are saved but not displayed
**Solution:** Check React Query cache
```javascript
// Check React Query cache
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.client?.getQueryCache()?.getAll()
```

### Issue 4: Network errors when syncing
**Solution:** Check browser console for sync errors:
```javascript
// Look for these messages:
// [SyncEngine] Sync requested via event
// [SyncEngine] Push complete
// [SyncEngine] Pull complete
```

## Step 5: Force Refresh

If nothing works, try:
1. Close all tabs with the app
2. Clear browser cache (Ctrl+Shift+Del)
3. Clear IndexedDB:
   ```javascript
   indexedDB.deleteDatabase('FitCoachLocalDB');
   ```
4. Hard reload (Ctrl+Shift+R)
5. Log in again

## Step 6: Check if Sync is Running

```javascript
// Check sync status
console.log('Sync status:', window.localStorage.getItem('sync-store'));

// Manually trigger sync
window.dispatchEvent(new CustomEvent('fitcoach:sync-requested'));
```

---

## Expected Behavior

When you log nutrition, you should see:

1. **Console logs:**
   ```
   [SyncEngine] Sync requested via event
   [SyncEngine] Push complete: 0 workoutLogs, 1 meals, 0 profiles
   ```

2. **Network requests:**
   - POST to `/api/sync/push` with your meal data
   - Response with `{ success: true, synced: { meals: [...] } }`

3. **IndexedDB:**
   - New record in `meals` table
   - `_isDirty: true` initially
   - `_isDirty: false` after sync

4. **UI:**
   - Meal appears immediately in the list
   - Persists after page refresh

---

## Send Me This Info

After running the diagnostic, send me:
1. Database version number
2. List of object stores
3. Number of meals in database
4. Any console errors
5. Whether `/api/sync/push` is being called

This will help me identify exactly what's wrong!
