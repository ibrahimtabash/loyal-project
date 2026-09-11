# Rejaa monolith

Laravel owns HTTP routes, validation, sessions, authorization, database writes and checkout. React pages receive explicit props through Inertia. There is no separate API server or browser-to-Supabase dependency in the active application.

## Active code

- `routes/web.php`: public storefront, checkout, merchant and authentication routes.
- `app/Http/Controllers`: storefront, merchant, login/registration and media behavior.
- `app/Models` and `database/migrations`: independent Laravel commerce schema.
- `resources/js/pages`: new React storefront, landing, authentication, confirmation and merchant screens.
- `resources/css/app.css`: responsive Arabic design system.
- `src/components/ui/{sheet,dialog}.tsx` and `src/lib/utils.ts`: reused accessible primitives only.

The remaining `src/routes`, `src/integrations`, `src/lib` and `supabase` files are legacy reference code, not active Laravel routes. Original build manifests/configuration are preserved under `legacy/`. Original local Supabase environment values were preserved in ignored `.env.supabase.local`; do not publish that file. No hosted Supabase data has been changed or imported.

## Data and security decisions

One store per newly registered merchant in this first release; each merchant query derives the store from the authenticated user. Never accept the tenant identifier from a product or settings payload. Store-specific product/order lookups return 404 across tenants. Public responses contain an explicit allowlist of storefront fields.

Prices use integer hundredths of the displayed currency (85.00 = 8500). Checkout accepts IDs and quantities; the server looks up current availability, prices, points and delivery fees. Order and item snapshots are saved inside one database transaction. Store-row locking serializes conflicting checkouts, and a unique store/idempotency key prevents duplicate insertion. Retry access and order confirmations are bound to the creating session; the UUID is not a public customer-data credential.

The initial order state is `new`. Allowed transitions: `new → confirmed → preparing → delivered`, with cancellation allowed before delivery. Final states cannot reopen. Confirming an order attaches a tenant-scoped customer; delivering it credits the customer's wallet using the order's point snapshot. A unique `point_entries.order_id` makes granting idempotent, even for older orders that already have `points_awarded_at` but no ledger entry.

## Customers and loyalty

`LoyaltyService` owns order attachment, earned points, corrections, and reward redemption. Every balance or reward-stock mutation runs in a database transaction, locks the store first, then the affected order/customer/reward, and writes an append-only point entry with actor, delta, reason, and resulting balance. Application-model updates/deletes of point entries are rejected. Customer balances cannot become negative; manual adjustments require a reason and a unique retry key. There are no routes to directly set wallet balances or delete history.

Reward redemption is a merchant-confirmed fulfillment, not a public shopper action. It uses the current server-side cost, checks availability/balance, reduces finite stock, and records the debit in the same transaction. Each reward has a revision: stale redemption confirmations and stale edit forms are rejected instead of silently charging a changed cost or restoring already-redeemed stock. A retry key is bound to its original customer/reward or adjustment payload; successful retries do not repeat the mutation.

Customer identity is scoped by store and conservatively normalized phone number: an explicit `+` or `00` international prefix is equivalent, but local numbers are not guessed or automatically merged with international numbers. Existing customer names are not overwritten by anonymous checkout details. Customers have private notes, order history, a paginated ledger and merchant-only profile updates; phone changes/merges require a separate audited workflow. There is no public wallet lookup by phone. The merchant must verify the customer before handing over a reward.

`php artisan loyalty:sync-orders` safely attaches existing confirmed/preparing/delivered Laravel orders and credits delivered orders missing a ledger entry. It is rerunnable, supports `--store=<numeric ID>`, and preserves older award timestamps. It does not import Supabase customers or balances. If opening balances already include historic order points, reconcile them before using this command.

Images are authenticated uploads, limited to JPG/PNG/WebP, 4 MiB and 4096 × 4096 pixels. They use generated filenames in tenant folders on Laravel's local private disk and are served through constrained routes. Unpublished store images are available only to the owner. SVG and executable uploads are rejected. External HTTPS image links are also supported; Laravel does not fetch those URLs.

Laravel CSRF protection stays enabled. Login, registration, uploads and checkout are rate-limited. Sessions regenerate on login and registration; logout invalidates them. Private responses are not cacheable. Public store content must never include account credentials, notes, or customer records.

## WhatsApp behavior

Checkout saves the order first, then redirects to a session-protected confirmation with a link containing the server-generated order summary. The shopper opens WhatsApp and chooses to send. Opening the app does not mean a message was sent or the order confirmed. No Cloud API message or payment is sent automatically. Pickup has no delivery charge.

## Migration boundary and remaining work

This is a working new commerce slice, not a data migration of the entire old SaaS. Before replacing an existing production deployment, inventory and migrate users, businesses, products, orders, customers and loyalty history with explicit UUID-to-new-ID mappings. Supabase Auth password migration/reset must be planned; do not copy plaintext credentials or silently invalidate existing users. Use a separate target database: legacy `products` and `orders` have different schemas.

Customer profiles, notes, wallets and reward redemption are now implemented in Laravel; legacy CRM/customer/reward data has not been imported. Receipts, subscription billing and automated WhatsApp campaigns are not ported. Password reset/email verification, staff roles, multiple stores per user, product variants, product inventory quantities, payment gateways, return/refund flows, wallet expiry rules and custom domains remain outside this commerce slice. Implement and test required business features before launch.

## Verification

`php artisan test` covers server-price authority, tenant isolation, unpublished/unavailable products, invalid quantities, atomic checkout, idempotency, delivery/pickup, session-protected confirmations, login/registration, final order states and safe image uploads. Loyalty tests cover one-time order credits, historic backfill, non-negative balances, redemption retries, hidden/exhausted rewards, stale reward revisions, customer privacy and append-only history. Tests use an isolated in-memory SQLite database. Request-replay tests are sequential: repeat against the intended PostgreSQL version and exercise actual concurrent checkout/redemption in staging before production.

`npm run build` runs TypeScript validation and produces Vite assets. A real browser was unavailable in the agent session; responsive rules are implemented, but desktop/mobile visual and interaction QA must still be completed in a browser.
