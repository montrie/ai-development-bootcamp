# Playwright: Asserting All Rows Match a Condition

## The problem — count snapshot + for-loop is racy

```typescript
const rows = page.locator('#audit-log-table tbody tr');
await expect(rows.first()).toBeVisible();   // resolves against OLD DOM state
const count = await rows.count();           // snapshot taken here
for (let i = 0; i < count; i++) {
  await expect(rows.nth(i)).toContainText('USER_LOGIN');  // DOM may have changed
}
```

When the page triggers a re-fetch (e.g. after clicking "Apply Filters"), the initial
unfiltered rows are already visible. `rows.first()` resolves immediately against those,
`count` is snapshotted from the old unfiltered state (e.g. 3), but by the time the loop
reaches `nth(2)` the filtered response has arrived and the table only has 2 rows — the
element no longer exists and the assertion times out.

**Symptom:**
```
Error: expect(locator).toContainText(expected) failed
Locator: locator('#audit-log-table tbody tr').nth(2)
Error: element(s) not found
```

---

## Fix: declarative `filter({ hasNotText })` assertions

Replace the count snapshot + loop with two Playwright assertions that auto-retry
against a stable DOM:

```typescript
const rows = page.locator('#audit-log-table tbody tr');
await expect(rows).not.toHaveCount(0);                          // at least one result
await expect(rows.filter({ hasNotText: 'USER_LOGIN' })).toHaveCount(0); // all rows match
```

**Why it works:**

- `rows.filter({ hasNotText: 'USER_LOGIN' })` selects every row that does NOT contain
  the expected text. After filtering, this set should be empty.
- Both `toHaveCount` assertions are retried by Playwright until they pass or timeout —
  no snapshot can go stale.
- No for-loop, no index arithmetic, no timing dependency.

`filter({ hasText })` and `filter({ hasNotText })` accept strings or `RegExp`.

---

## Root cause: why "Apply Filters" buttons need this pattern

Native browser date pickers do not fire `keydown` events on the `<input>` when a date
is selected via the calendar widget — the interaction happens in a browser-native overlay.
This makes Enter-key shortcuts unreliable for date inputs.

The right pattern is an explicit "Apply Filters" button. After clicking it:

- State updates from `onChange` handlers have already committed (React batches within
  the same event, but the button click is a separate event).
- The button `onClick` calls `loadLogs()`, which reads the latest committed state via
  the `useCallback` closure.

The stale-closure problem (where `loadLogs` captures old state) only occurs if the
callback fires in the *same* event as the `onChange` that updates state — e.g. a
`handleKeyDown` on the same input. A separate button click always fires after React
has committed the updated state.

After clicking the Apply button in E2E tests, always use the `filter({ hasNotText })`
pattern (or `waitForResponse`) rather than snapshotting row count, because the fetch
triggered by the click is async and will replace the table contents mid-assertion.
