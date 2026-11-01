# Confirmed housing pages and unified living bill

Default-city new quotes: family $500 / no deposit, shared $900 / $900 deposit, Studio $1,400 / $1,400 deposit, one-bedroom $1,600 / $1,600 deposit. Existing signed leases, historical receipts and deposits retain their amounts; existing renewal rules still apply. Other city and inflation multipliers are retained.

Life shows current housing and the combined monthly bill. Housing opens the four-option selection. Initial occupancy pays first rent plus deposit. Later moves are free cancellable bookings for next month, settled atomically with the actual old deposit refunded. The bill itemizes living costs and rent with separate paid-once receipts; move-month rent already paid is excluded. Existing care/vehicle costs stay in living costs. Deposits are excluded from recurring bills. Insufficient cash does not partially pay the combined bill.

Approved images: four housing types each in unoccupied/occupied state plus the life overview. Family unoccupied reuses the previously shipped family image. Dynamic figures, status and actions cover illustrative sample values. Initial selection uses Confirm Occupancy; an existing resident sees Book Next Month; a current home shows Change Housing / Return to Life. No separate monthly rent action is required inside housing details.

The agreed return-home card rotation (monthly once, persist result before animation, skippable animation and no rerolls) remains a design record. It is not enabled by this release: event content, effects and edge-case decisions still need approval. Do not introduce the earlier tentative housing bonuses.

Validation: `node qa/housing-bills.test.cjs`, `node qa/housing-lease.test.cjs`, `node qa/rest-state.test.cjs`, `node qa/approved-pages.test.cjs` (the last requires full checkout assets, or REMOTE_PATHS for a partially materialized checkout). Static render inspected; real iPhone Safari/PWA interaction remains unverified.
