# Graph Report - sneaker-cleaning-manager  (2026-06-10)

## Corpus Check
- 107 files · ~52,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 656 nodes · 1000 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50504e99`
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
- [[_COMMUNITY_Community 12|Community 12]]
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
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `@shopify/shopify-app-template-remix` - 19 edges
2. `compilerOptions` - 18 edges
3. `scripts` - 17 edges
4. `action()` - 16 edges
5. `fetchAdminSettings()` - 14 edges
6. `verifyAndBuySelectedRate()` - 13 edges
7. `@shopify/shopify-app-template-react-router` - 12 edges
8. `processBookingInBackground()` - 11 edges
9. `getSetting()` - 11 edges
10. `Gotchas / Troubleshooting` - 11 edges

## Surprising Connections (you probably didn't know these)
- `action()` --calls--> `saveBookingAcknowledgments()`  [INFERRED]
  app/routes/api.update.settings.js → app/utils/adminSettings.server.js
- `SneakerCard()` --calls--> `fetchAdminSettings()`  [EXTRACTED]
  sneaker-cleaning-ext/src/components/shared/SneakerCard/SneakerCard.jsx → sneaker-cleaning-ext/src/utils/adminSettings.js
- `action()` --calls--> `getShippingBoxLibrary()`  [EXTRACTED]
  app/routes/api.create.booking.js → app/utils/adminSettings.server.js
- `action()` --calls--> `getReturnShippingBufferPercentage()`  [EXTRACTED]
  app/routes/api.create.booking.js → app/utils/returnShippingBuffer.server.js
- `action()` --calls--> `getShippingCreditPerPair()`  [EXTRACTED]
  app/routes/api.create.booking.js → app/utils/returnShippingBuffer.server.js

## Import Cycles
- None detected.

## Communities (49 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (49): appSettingsSchema, loader(), loader(), action(), buildQuoteSummary(), buildTestRate(), buildTestShippingQuotes(), calculateCustomerFacingShipping() (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (24): ACTION_HANDLERS, cancelShopifyOrder(), deleteCleanedImage(), executeAdminBookingAction(), getNormalizedBooking(), sendCleanedEmail(), updateBookingStatus(), updateCleaningApproval() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (11): ay, im, jy, Lp, ly, nm, qp, Se (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (46): author, devDependencies, eslint, eslint-import-resolver-typescript, eslint-plugin-import, eslint-plugin-jsx-a11y, eslint-plugin-react, eslint-plugin-react-hooks (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (46): tempBookingSchema, action(), buildTestStoreToCustomerLabel(), buildTestStoreToCustomerPurchase(), getBookingShippingSelection(), TEST_STORE_ADDRESS, action(), calculateCustomerFacingShippingAmount() (+38 more)

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
Cohesion: 0.13
Nodes (4): EMPTY_SNEAKER, SIZE_UNITS, EMPTY_SNEAKER, SIZE_UNITS

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (3): ADD_ONS, SERVICE_TIERS, SneakerCard()

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (5): DEFAULT_BOOKING_AGREEMENTS, DEFAULT_SHIPPING_SELECTION, EMPTY_HISTORY, FOOTWEAR_SUB_STEPS, VISUAL_STEPS

### Community 14 - "Community 14"
Cohesion: 0.23
Nodes (6): BookingDetails(), downloadImage(), formatDateTime(), getBookingStatusClassName(), getSneakerApprovalStatus(), BookingSneakerCard()

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (3): sneakerSchema, getImageUrls(), loader()

### Community 18 - "Community 18"
Cohesion: 0.31
Nodes (6): AgreementStep(), BookingWizard(), SneakerHistoryStep(), SummaryStep(), fetchAdminSettings(), getDefaultSettings()

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (7): De(), Fn(), fp(), mm(), ps(), Qc(), Yg()

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (7): Gg(), Kg(), Lg(), qg(), Vg(), Xg(), Zg()

### Community 22 - "Community 22"
Cohesion: 0.27
Nodes (8): bookingSchema, action(), escapeRegex(), getNormalizedBooking(), collectBookingImageIds(), getImageUrls(), normalizeBookingImages(), normalizeObjectId()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (3): formatCurrency(), HandoffMethodStep(), REQUIRED_ADDRESS_FIELDS

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (6): mcpServers, shopify-dev-mcp, name, args, command, version

### Community 26 - "Community 26"
Cohesion: 0.53
Nodes (3): loginErrorMessage(), action(), loader()

### Community 27 - "Community 27"
Cohesion: 0.40
Nodes (5): ap(), cp(), gp(), hp(), op()

### Community 28 - "Community 28"
Cohesion: 0.24
Nodes (11): action(), buildRefundConfirmationEmail(), canCreateRefundForFinancialStatus(), getAttributeValue(), getRefundPreview(), getRefundTransaction(), getSafeRefundErrorMessage(), getUnpaidRefundMessage() (+3 more)

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
Cohesion: 0.67
Nodes (3): cm(), ep(), il()

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (3): Jl(), pp(), wp()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (3): mp(), sp(), xp()

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (3): oy(), ry(), vm()

### Community 39 - "Community 39"
Cohesion: 0.60
Nodes (3): action(), action(), uploadImageToShopify()

## Knowledge Gaps
- **207 isolated node(s):** `PreToolUse`, `allow`, `npx`, `@shopify/dev-mcp`, `name` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 9` to `Community 3`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `allow`, `npx` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0672316384180791 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.07337526205450734 - nodes in this community are weakly interconnected._