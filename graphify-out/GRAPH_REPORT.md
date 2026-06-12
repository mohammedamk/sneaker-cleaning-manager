# Graph Report - sneaker-cleaning-manager  (2026-06-12)

## Corpus Check
- 107 files · ~55,383 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 663 nodes · 1041 edges · 48 communities (39 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `526c587a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `@shopify/shopify-app-template-remix` - 19 edges
2. `compilerOptions` - 18 edges
3. `action()` - 17 edges
4. `scripts` - 17 edges
5. `fetchAdminSettings()` - 16 edges
6. `verifyAndBuySelectedRate()` - 13 edges
7. `getSetting()` - 12 edges
8. `@shopify/shopify-app-template-react-router` - 12 edges
9. `processBookingInBackground()` - 11 edges
10. `Gotchas / Troubleshooting` - 11 edges

## Surprising Connections (you probably didn't know these)
- `action()` --calls--> `saveBookingAcknowledgments()`  [INFERRED]
  app/routes/api.update.settings.js → app/utils/adminSettings.server.js
- `HandoffMethodStep()` --calls--> `fetchAdminSettings()`  [EXTRACTED]
  sneaker-cleaning-ext/src/components/steps/HandoffMethodStep/HandoffMethodStep.jsx → sneaker-cleaning-ext/src/utils/adminSettings.js
- `SummaryStep()` --calls--> `fetchAdminSettings()`  [EXTRACTED]
  sneaker-cleaning-ext/src/components/steps/SummaryStep/SummaryStep.jsx → sneaker-cleaning-ext/src/utils/adminSettings.js
- `fetchQuotes()` --calls--> `getShippingQuotes()`  [EXTRACTED]
  app/routes/api.shipping.rates.js → app/utils/easyPostShipping.js
- `action()` --calls--> `getShippingInsuranceLineItem()`  [EXTRACTED]
  app/routes/api.create.booking.js → app/utils/shippingInsurance.js

## Import Cycles
- None detected.

## Communities (48 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (58): appSettingsSchema, action(), calculateCustomerFacingShippingAmount(), getShippingLineItems(), getTierPrice(), loader(), loader(), action() (+50 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (39): ACTION_HANDLERS, cancelShopifyOrder(), deleteCleanedImage(), getNormalizedBooking(), sendCleanedEmail(), updateBookingStatus(), updateCleaningApproval(), updateSneakerStatus() (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (11): cm, ey(), Hc, im, ip(), iy, je, kp (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (46): author, devDependencies, eslint, eslint-import-resolver-typescript, eslint-plugin-import, eslint-plugin-jsx-a11y, eslint-plugin-react, eslint-plugin-react-hooks (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (40): tempBookingSchema, action(), buildTestStoreToCustomerLabel(), buildTestStoreToCustomerPurchase(), getBookingShippingSelection(), TEST_STORE_ADDRESS, action(), buildCustomerBookingEmail() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (22): canBuyStoreToCustomerShipping(), formatDateTime(), formatMoney(), formatRateSummary(), getAddressLines(), getApprovalBadgeTone(), getBookingQrCodeUrl(), getBookingShippingSelection() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (31): 2024.08.19, 2024.09.17, 2024.09.18, 2024.10.02, 2024.10.29, 2024.11.06, 2024.11.26, 2024.12.04 (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (24): Application Storage, Authenticating and querying data, Build, Database tables don't exist, Deployment, Gotchas / Troubleshooting, Hosting, Incorrect GraphQL Hints (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (23): dependencies, react, react-dom, react-toastify, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (20): dependencies, dotenv, @easypost/api, isbot, mongoose, prisma, @prisma/client, react (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, allowSyntheticDefaultImports, baseUrl, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (4): EMPTY_SNEAKER, SIZE_UNITS, EMPTY_SNEAKER, SIZE_UNITS

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (5): DEFAULT_BOOKING_AGREEMENTS, DEFAULT_SHIPPING_SELECTION, EMPTY_HISTORY, FOOTWEAR_SUB_STEPS, VISUAL_STEPS

### Community 14 - "Community 14"
Cohesion: 0.21
Nodes (6): BookingDetails(), downloadImage(), formatDateTime(), getBookingStatusClassName(), getSneakerApprovalStatus(), BookingSneakerCard()

### Community 16 - "Community 16"
Cohesion: 0.38
Nodes (4): executeAdminBookingAction(), action(), loader(), getBookingStatuses()

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (10): AgreementStep(), BookingWizard(), ADD_ONS, QUOTED_SERVICES, SERVICE_TIERS, SneakerCard(), SneakerHistoryStep(), SummaryStep() (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (7): De(), dp(), Fn(), fp(), gm(), hm(), ps()

### Community 21 - "Community 21"
Cohesion: 0.35
Nodes (12): Gg(), Jg(), Kg(), Lg(), om(), Qc(), Qg(), St() (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (3): gp(), rp(), zp()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (3): formatCurrency(), HandoffMethodStep(), REQUIRED_ADDRESS_FIELDS

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (4): sneakerSchema, action(), action(), uploadImageToShopify()

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (6): mcpServers, shopify-dev-mcp, name, args, command, version

### Community 27 - "Community 27"
Cohesion: 0.50
Nodes (5): hp(), op(), pp(), up(), wp()

### Community 28 - "Community 28"
Cohesion: 0.53
Nodes (3): loginErrorMessage(), action(), loader()

### Community 29 - "Community 29"
Cohesion: 0.50
Nodes (3): npx, @shopify/dev-mcp, shopify-dev-mcp

### Community 30 - "Community 30"
Cohesion: 0.50
Nodes (3): npx, @shopify/dev-mcp, shopify-dev-mcp

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

### Community 33 - "Community 33"
Cohesion: 0.40
Nodes (5): am(), cl(), fm(), rm(), tp()

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (6): fl(), jp(), mp(), rl(), Sp(), Xp()

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (8): bm(), dy(), fy(), gy(), _m(), my(), py(), ry()

## Knowledge Gaps
- **207 isolated node(s):** `je`, `kp`, `nm`, `im`, `Hc` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 9` to `Community 3`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `action()` (e.g. with `saveAddOns()` and `saveAlterationOptions()`) actually correct?**
  _`action()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `je`, `kp`, `nm` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05995975855130785 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07987012987012987 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._