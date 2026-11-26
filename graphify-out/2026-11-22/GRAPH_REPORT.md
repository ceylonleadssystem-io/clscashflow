# Graph Report - clscashflow  (2026-11-22)

## Corpus Check
- 550 files · ~1,381,867 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .css 15, (none) 4, .webmanifest 2)

## Summary
- 5093 nodes · 15850 edges · 210 communities (189 shown, 21 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 603 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b068bf5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ai-keys.js
- useData
- domain/format.js
- esc
- PosProvider.jsx
- appwrite.js
- SalesPushPage.jsx
- __awaiter
- lib/invoice-share.js
- adminAnalytics.js
- settings.js
- admin-auth.js
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- cloud.service.js
- pos/staff.js
- ceylonry-site-runtime.js
- labelPrinter.js
- b
- store.mjs
- pos.mjs
- app.mjs
- guard
- pos-routing.test.js
- DataProvider.jsx
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- locations.js
- printing.js
- functions/menu-share.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-accounts.test.js
- invoiceEscape
- analytics.js
- pagePath
- subscription.js
- d
- AdminApp.jsx
- AnalyticsTab.jsx
- pos/sales.js
- shopify-store.js
- domain.test.js
- render
- Tables.jsx
- ref_node_assert
- .toString
- AppwriteException
- salesSplit.js
- render
- tables/index.js
- boot
- PortalShell.jsx
- panels.jsx
- plans.js
- logic.mjs
- pos-react/package.json
- boot
- useFeature
- getAuthUser
- adminInsights.js
- c
- package.json
- Client
- Z
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- LocalAuthProvider
- SystemOptionsPages.jsx
- m
- xk
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- Plan: move from Netlify + Appwrite Cloud to a VPS
- UsersPages.jsx
- security.js
- security-endpoints.test.js
- assist.js
- appwrite-compat-session.test.js
- receiptPrinter
- labelPrinter
- normalizePlan
- normalizePlan
- nowIso
- MenuAdminPages.jsx
- Shopify orders into the POS: feasibility
- Root test-suite audit (169 failing tests)
- portal.test.js
- User guide
- dateStr
- ref_node_path
- pos/inventory.js
- ni
- Administrator guide
- thirdPartyPayments.js
- ogf-sales.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- documents.js
- createLogger
- send-contact.js
- DevicePages.jsx
- supportLive.js
- functions/support-session.js
- Ce
- Settings Section Build Spec: what is still pending
- domain/inventory.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- submit-subscription-receipt.js
- businessTypeLocked
- account-danger-zone.js
- useInstall.js
- B
- lib/ogf-push.js
- pos/detailing.js
- AssignmentTree
- KdsApp.jsx
- link.js
- hardware-order.js
- payroll.test.js
- Ceylonry POS — React + WatermelonDB
- SupportOverlay.jsx
- net.js
- config-merge.js
- pos/catalog.js
- 5. Phases
- diagnostics-store.js
- Detailing.jsx
- Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)
- appwrite-files.js
- kitchenPrinters.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- diagnostics.service.js
- appwriteCompat.test.js
- pos-admin-rollup.test.js
- POS variants (verticals)
- landing-motion.js
- ogf-push-function.test.js
- imageTools.js
- ready.js
- growth-partner-commissions.test.js
- pos-address.test.js
- Ceylo.jsx
- account-purge.test.js
- build.py
- printBridge.js
- Ceylonry POS: New Feature Roll-out Notes
- KdsHealthPages.jsx
- Architecture
- systemOptions.js
- supportControl.js
- Features
- Settings section: build status and plan
- node-appwrite
- scanner.js
- seo.test.js
- Features
- ogf-push.test.js
- diagnosticsShared.js
- POS administration portal
- salesLog.js
- Role
- pos-reported-bugs.test.js
- ref_node_fs
- OGF POS-02 UAT in Postman
- Live support session: relay server and testing
- lib/support-session.js
- LiveSupportPanel.jsx
- bug-report-20260810.test.js
- onboarding-terms-acceptance.test.js
- Restaurant (OGF) and the OGF sales push
- adminInsightsParity.test.js
- FakePc
- supportViewerState.js
- admin-visits-conversion.test.js
- Ceylonry POS: Release Notes, 2026-11-18
- Storage
- Project structure
- docs/README.md
- collect
- bug-report-20260811-email-modal-template.test.js
- insightsRollup
- buildReport
- apps-used.test.js
- appwriteCompat.js
- shopifyOrders.test.js
- supportProtocol.test.js
- Deployment & operations
- ErrorBoundary.jsx
- README.md

## God Nodes (most connected - your core abstractions)
1. `useData()` - 210 edges
2. `usePos()` - 202 edges
3. `react` - 141 edges
4. `useFeature()` - 99 edges
5. `__awaiter()` - 93 edges
6. `money()` - 93 edges
7. `vitest` - 79 edges
8. `AppwriteException` - 74 edges
9. `Modal()` - 64 edges
10. `useUi()` - 63 edges

## Surprising Connections (you probably didn't know these)
- `Where data lives (Appwrite project `6a947d6e0012c551dfde`, Singapore)` --references--> `storeFor()`  [INFERRED]
  README.md → netlify/lib/appwrite.js
- `Phase 4: Authentication (6 to 10 days)` --references--> `getUserFromEvent()`  [INFERRED]
  docs/migration/self-hosting-plan.md → netlify/lib/appwrite.js
- `Troubleshooting` --references--> `queryDocuments()`  [INFERRED]
  pos-react/docs/deployment.md → netlify/lib/appwrite.js
- `Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts` --references--> `applyCatalogDrafts()`  [INFERRED]
  docs/settings-build-plan.md → pos-react/src/services/pos/catalog.js
- `Points the Postman guide shows (to confirm with OGF)` --references--> `Sales()`  [INFERRED]
  docs/ogf-postman/README.md → pos-react/src/views/Sales.jsx

## Import Cycles
- None detected.

## Communities (210 total, 21 thin omitted)

### Community 0 - "ai-keys.js"
Cohesion: 0.12
Nodes (22): Anthropic, ask(), crypto, docId(), { getDocument, upsertDocument, deleteDocument }, keyFor(), { listModels }, load() (+14 more)

### Community 1 - "useData"
Cohesion: 0.09
Nodes (69): CloudBanner(), Shell(), LabelAlignWizard(), SIDES, LabelStockPicker(), Modal(), ModalBody(), NumberInput() (+61 more)

### Community 2 - "domain/format.js"
Cohesion: 0.11
Nodes (26): AutomobileShell(), BusinessSettings(), Customers, Detailing, Icon(), ICONS, Inventory, ITEMS (+18 more)

### Community 3 - "esc"
Cohesion: 0.14
Nodes (39): bindGuestFill(), bindTables(), bookingDialog(), business(), cancelDialog(), cfg(), dateBar(), dialog() (+31 more)

### Community 4 - "PosProvider.jsx"
Cohesion: 0.08
Nodes (41): App(), Gate(), Loading(), PublicMenuSync(), Ready(), Root(), SupportBridge(), AssistMissing() (+33 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (53): 2.3 The seams that make this manageable, Phase 3: Data layer (5 to 8 days), bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log (+45 more)

### Community 6 - "SalesPushPage.jsx"
Cohesion: 0.34
Nodes (11): blankForm(), formFrom(), formProblems(), https(), INTERVALS, newRegister(), PAYMENT_ROWS, registerProblem() (+3 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "lib/invoice-share.js"
Cohesion: 0.11
Nodes (47): {
  clean,
  headers,
  getUserFromEvent,
  getDocument,
  queryDocuments,
  upsertDocument,
  canWrite
}, findInvoiceSource(), handler(), {
  normalizeWhatsAppNumber,
  generatePublicToken,
  isValidPublicToken,
  buildVersionedPublicUrl,
  selectInvoiceSource,
  sanitizePublicInvoice,
  buildReminderMessage,
  assertSourceAccess
}, publicBase(), response(), uniqueToken(), uniqueToken() (+39 more)

### Community 9 - "adminAnalytics.js"
Cohesion: 0.15
Nodes (24): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), dailySeries(), day(), DEFAULT_TZ, fmt (+16 more)

### Community 10 - "settings.js"
Cohesion: 0.08
Nodes (47): ARRAY_FIELDS, assignGroupEdits(), categoryEditError(), cleanCategoryEdit(), cleanGroupEdit(), ITEM_FIELDS, itemChanges(), itemEditError() (+39 more)

### Community 11 - "admin-auth.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (36): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+28 more)

### Community 14 - "logger.js"
Cohesion: 0.12
Nodes (30): el(), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS (+22 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin, ADMIN_EMAIL }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (22): PosStore, 5. Data layer (WatermelonDB), decode(), encode(), attachLines(), categoryId(), EMPTY_SNAPSHOT(), hintSeq() (+14 more)

### Community 17 - "cloud.service.js"
Cohesion: 0.10
Nodes (31): profileHasPosAccess(), ALWAYS_LIVE_KEY, alwaysLive(), clone(), CloudSyncService, log, pullDelay(), withTimeout() (+23 more)

### Community 18 - "pos/staff.js"
Cohesion: 0.12
Nodes (30): AUDIT_ACTION, auditDetails(), dayOf(), diffEntry(), entryError(), entryLocked(), fromLocalInput(), LOCK_MONTHS (+22 more)

### Community 19 - "ceylonry-site-runtime.js"
Cohesion: 0.04
Nodes (71): $a(), Ab(), Bd(), bh(), bj(), ch(), Ck(), cn() (+63 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.12
Nodes (31): cleanBarcode(), CODE128, code128Units(), code128Values(), drawCode128(), sizedBarcode(), alignmentAdjust(), barcodeLabelCopy() (+23 more)

### Community 21 - "b"
Cohesion: 0.08
Nodes (58): ac(), an(), e(), n(), c(), Bt(), dd(), dh() (+50 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (36): Data model, Styling, Build, DEFAULT_SETTINGS, mergeRows(), base(), boot(), bucketOf() (+28 more)

### Community 23 - "pos.mjs"
Cohesion: 0.22
Nodes (17): layoutDialog(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf(), fromPos(), gmAllowed() (+9 more)

### Community 24 - "app.mjs"
Cohesion: 0.11
Nodes (34): ACTIONS, billsOf(), canSend(), detailDialog(), guestDialog(), guestOf(), guestRows(), guestSpend() (+26 more)

### Community 25 - "guard"
Cohesion: 0.06
Nodes (50): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+42 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (35): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+27 more)

### Community 27 - "DataProvider.jsx"
Cohesion: 0.08
Nodes (44): Kpi(), defaultRange(), rangeDates(), downloadCsv(), today(), batchStatus(), commissionRows(), customerName() (+36 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.09
Nodes (39): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, billingPatchForStatus(), clampNum(), clean() (+31 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.09
Nodes (16): auth(), CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef() (+8 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 34 - "locations.js"
Cohesion: 0.12
Nodes (30): OnlineOrdersButton(), ONLINE_CHANNELS, isOwnerRole(), NAV_ITEMS, OWNER_ROLES, REPORTING_ROLES, SETTINGS_PAGE_OF_VIEW, VIEW_TITLES (+22 more)

### Community 35 - "printing.js"
Cohesion: 0.16
Nodes (20): prepName(), kitchenPrinterHook(), kitchenMode(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log (+12 more)

### Community 36 - "functions/menu-share.js"
Cohesion: 0.17
Nodes (18): {
  clean,
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument
}, { generatePublicToken, isValidPublicToken }, handler(), { locationKey, sanitizeMenu }, publicBase(), response(), { clean, headers, getDocument }, handler() (+10 more)

### Community 37 - "vitest"
Cohesion: 0.11
Nodes (25): makeCtx(), bind(), bindServices(), cash(), addProduct(), createHarness(), line(), noDiscount (+17 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.10
Nodes (30): activeSales(), AUDIT, BUILDERS, byLocation(), C, day(), GIFT, groupItems() (+22 more)

### Community 40 - "pos-admin-accounts.test.js"
Cohesion: 0.07
Nodes (27): handler(), assert, auth, call(), col(), docs, form, fs (+19 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "analytics.js"
Cohesion: 0.17
Nodes (28): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+20 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (29): assert, fs, { pagePath }, path, read(), root, test, assert (+21 more)

### Community 44 - "subscription.js"
Cohesion: 0.18
Nodes (20): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+12 more)

### Community 45 - "d"
Cohesion: 0.09
Nodes (44): ae(), at(), bc(), be(), C(), dt(), Ee(), Fe() (+36 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.13
Nodes (31): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, sendAdminRequest(), AdminApp() (+23 more)

### Community 47 - "AnalyticsTab.jsx"
Cohesion: 0.29
Nodes (18): BarChart(), HourlyPanel(), Kpi(), lkr(), METRICS, one(), RankedBars(), AnalyticsTab() (+10 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.09
Nodes (50): cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), serviceChargeAmount(), serviceChargeAuto(), splitByItems() (+42 more)

### Community 49 - "shopify-store.js"
Cohesion: 0.10
Nodes (34): { _encrypt: encrypt }, { getUserFromEvent, getDocument, upsertDocument, deleteDocument, clean }, { guard, reply }, handler(), log, { normalizeShop, shopKey, normalizeCurrency, normalizeEmail }, publicBase(), view() (+26 more)

### Community 50 - "domain.test.js"
Cohesion: 0.10
Nodes (30): FeaturesTab(), NO_OVERRIDE, typesWith(), FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, ONLINE (+22 more)

### Community 51 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.19
Nodes (30): allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey(), gmBooking() (+22 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.07
Nodes (23): assert, keys, lib, rows, test, assert, keys, test (+15 more)

### Community 55 - "AppwriteException"
Cohesion: 0.11
Nodes (4): AppwriteException, Databases, Functions, Teams

### Community 56 - "salesSplit.js"
Cohesion: 0.31
Nodes (7): combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef

### Community 57 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 58 - "tables/index.js"
Cohesion: 0.07
Nodes (29): createDatabase(), log, migrations, tableColumns(), TYPE, CashShift, Customer, InventoryItem (+21 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 60 - "PortalShell.jsx"
Cohesion: 0.08
Nodes (46): NavIcon(), PATHS, PATHS, PortalIcon(), PortalHome(), PortalSettingsPage, PortalShell(), Reports (+38 more)

### Community 62 - "panels.jsx"
Cohesion: 0.09
Nodes (45): ConnectButton(), HardwarePanel(), Ctx, SystemOptionsProvider(), how(), KitchenStations(), BillingPanel(), BusinessProfilePanel() (+37 more)

### Community 63 - "plans.js"
Cohesion: 0.15
Nodes (16): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), Switch() (+8 more)

### Community 64 - "logic.mjs"
Cohesion: 0.10
Nodes (35): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, bookingsMap() (+27 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (42): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+34 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 67 - "useFeature"
Cohesion: 0.13
Nodes (40): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+32 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "adminInsights.js"
Cohesion: 0.16
Nodes (27): ChurnPanel(), FunnelPanel(), HeatmapPanel(), KitchenPanel(), LossPanel(), Panel(), TypesPanel(), activationFunnel() (+19 more)

### Community 70 - "c"
Cohesion: 0.12
Nodes (26): ai(), a(), bi(), ci(), Dg(), ef(), Eh(), hb() (+18 more)

### Community 71 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+14 more)

### Community 73 - "Z"
Cohesion: 0.14
Nodes (25): aa(), ah(), fb(), $g(), gf(), gi(), hi(), ia() (+17 more)

### Community 74 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 75 - "Working rules: do not break existing functionality"
Cohesion: 0.12
Nodes (16): 10. Do not claim testing that was not done, 11. Dependencies, 12. Database and API safety, 13. When something breaks, 14. Final response format, 1. Change only what is required, 2. Before coding, decide, 3. Preserve existing behaviour (+8 more)

### Community 76 - "kds-store.js"
Cohesion: 0.30
Nodes (16): { ADMIN_DATABASE_ID }, bad(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 77 - "mountBillingWidget"
Cohesion: 0.13
Nodes (19): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+11 more)

### Community 78 - "appwrite-sdk.js"
Cohesion: 0.12
Nodes (7): __classPrivateFieldGet(), Graphql, ID, Messaging, Permission, Query, Service

### Community 79 - "LocalAuthProvider"
Cohesion: 0.11
Nodes (7): 4. Principles, 6. Services (abstractions), AppwriteAuthProvider, LocalAuthProvider, passwordHash(), useServices(), ctx()

### Community 80 - "SystemOptionsPages.jsx"
Cohesion: 0.09
Nodes (58): Delivered (slice 1), PublishBar(), ConditionalGroup(), DAYS, DayTimeRow(), DurationRow(), NumberRow(), PageHeader() (+50 more)

### Community 81 - "m"
Cohesion: 0.12
Nodes (25): Ag(), Bg(), Cc(), cd(), Cg(), de(), df(), gj() (+17 more)

### Community 82 - "xk"
Cohesion: 0.18
Nodes (23): af(), Bk(), cf(), Db(), Dc(), F(), fa(), hf() (+15 more)

### Community 83 - "health-check.mjs"
Cohesion: 0.13
Nodes (14): failures, files, generatedBinaryBundles, htmlFiles, ignoredDirectories, isModuleFile(), javascriptFiles, packageType() (+6 more)

### Community 84 - "pos-diagnostics.test.js"
Cohesion: 0.14
Nodes (9): assert, audits, auth, FakeDatabases, fs, path, rows, store (+1 more)

### Community 85 - "mountBillingWidget"
Cohesion: 0.13
Nodes (19): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+11 more)

### Community 86 - "POS database and sync changes: team update"
Cohesion: 0.14
Nodes (14): 1. Summary, 2.1 Separate POS database, 2.2 Document storage format (netlify/lib/appwrite.js), 2.3 Function actions (netlify/functions/appwrite-docs.js), 2.4 Storage, 2.5 Sales history split (switched ON in production), 2.6 Guest Manager database (`gm` / `gm_documents`), 2. Database changes (+6 more)

### Community 87 - "Plan: move from Netlify + Appwrite Cloud to a VPS"
Cohesion: 0.17
Nodes (11): Open questions, Phase 0: decisions (needed before starting), Phase 1: server setup (no code changes), Phase 2: replace Netlify (small code change), Phase 3: move the data, Phase 4: cutover, Phase 5: running it, Plan: move from Netlify + Appwrite Cloud to a VPS (+3 more)

### Community 88 - "UsersPages.jsx"
Cohesion: 0.17
Nodes (25): ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError(), jobsOf() (+17 more)

### Community 89 - "security.js"
Cohesion: 0.06
Nodes (53): corsHeaders, { guard, siteOrigin, siteUrl }, handler(), json(), esc(), { guard, siteOrigin }, handler(), nodemailer (+45 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.09
Nodes (42): getStore(), invoices(), localAdminApi(), localAdminSession, AssistBar(), log, DEFAULT_RECEIPT_FOOTER, flagsWithPlan() (+34 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 95 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 96 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 97 - "nowIso"
Cohesion: 0.17
Nodes (28): isEmail(), nowIso(), phoneKey(), whatsappPhone(), saveModifier(), newId(), stamp(), supportAuditEntry() (+20 more)

### Community 98 - "MenuAdminPages.jsx"
Cohesion: 0.06
Nodes (93): Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), LocationChecks(), TextRow() (+85 more)

### Community 99 - "Shopify orders into the POS: feasibility"
Cohesion: 0.18
Nodes (11): Connecting a store: two options, How it would work, Mapping Shopify to the POS, Questions for you, Risks and open decisions, Shopify facts that shape the design, Shopify orders into the POS: feasibility, Status: phase 1 (receive) built (+3 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "dateStr"
Cohesion: 0.24
Nodes (16): go(), lockedView(), posUrl(), queueSeating(), refreshPos(), render(), signInView(), start() (+8 more)

### Community 104 - "ref_node_path"
Cohesion: 0.12
Nodes (12): PLANS, POS_PLANS, walk(), assert, compat, fs, path, test (+4 more)

### Community 105 - "pos/inventory.js"
Cohesion: 0.25
Nodes (14): parseStockCountRows(), adjustmentChange(), stockMovement(), applyStockChange(), movementRow(), activeLocationId(), addStockBatch(), adjustStock() (+6 more)

### Community 106 - "ni"
Cohesion: 0.13
Nodes (21): Bf(), e(), k(), eb(), ff(), gd(), hc(), kb() (+13 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "thirdPartyPayments.js"
Cohesion: 0.23
Nodes (15): PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), reorder() (+7 more)

### Community 109 - "ogf-sales.js"
Cohesion: 0.17
Nodes (19): batchCode(), breakdown(), dateTimeOf(), DEFAULT_PAYMENT_NAMES, describe(), header(), itemRows(), num() (+11 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.08
Nodes (41): DEV_ADMIN, ADJUST_REASONS, DEFAULT_OWNER_PIN, PAYMENT_ICONS, PLATFORM_CHANNELS, STOCK_TYPES, STORAGE, SUPPORT_CODE_TTL_MS (+33 more)

### Community 113 - "documents.js"
Cohesion: 0.16
Nodes (21): DEFAULT_BUSINESS_NAME, esc(), receiptName(), receiptDate(), kotBody(), padLeft(), padRight(), prepLines() (+13 more)

### Community 114 - "createLogger"
Cohesion: 0.16
Nodes (20): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), cell(), firstColumn() (+12 more)

### Community 115 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 116 - "DevicePages.jsx"
Cohesion: 0.15
Nodes (27): asStation(), connection(), connectionLabel(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf() (+19 more)

### Community 117 - "supportLive.js"
Cohesion: 0.15
Nodes (27): spaced(), SupportBanner(), droppable(), reconnectDelay(), annotationSubs, answerRequest(), ask(), call() (+19 more)

### Community 118 - "functions/support-session.js"
Cohesion: 0.10
Nodes (33): verifyAdmin(), { getAdmin, audit }, { guard, reply }, handler(), { isAdminEmail, verifyToken }, log, store, verifyAdmin() (+25 more)

### Community 119 - "Ce"
Cohesion: 0.20
Nodes (15): Ce(), ed(), fc(), gh(), Ij(), Lb(), mj(), oh() (+7 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "domain/inventory.js"
Cohesion: 0.35
Nodes (11): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), hasSizedStock(), isService(), lineSize(), productStockItem(), stockProblem() (+3 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 123 - "submit-subscription-receipt.js"
Cohesion: 0.07
Nodes (38): { appwriteAdmin }, { guard, siteOrigin, siteUrl }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+30 more)

### Community 124 - "businessTypeLocked"
Cohesion: 0.15
Nodes (14): businessTypeLabel(), BusinessTypeTab(), BLANK, ADMIN_BUSINESS_TYPE_OPTIONS, businessTypeLocked(), addressForType(), addressOfPage(), POS_BASE_HOST (+6 more)

### Community 125 - "account-danger-zone.js"
Cohesion: 0.11
Nodes (29): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}, log (+21 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "B"
Cohesion: 0.22
Nodes (11): B(), fn(), Lt(), M(), N(), oa(), Ot(), pn() (+3 more)

### Community 128 - "lib/ogf-push.js"
Cohesion: 0.19
Nodes (24): cleanConfig(), configProblems(), crypto, deleteSecret(), emptyState(), getToken(), idOf(), loadSecrets() (+16 more)

### Community 129 - "pos/detailing.js"
Cohesion: 0.35
Nodes (16): advanceJob(), clash(), createInvoice(), find(), finishJob(), guard(), JOB_FLOW, put() (+8 more)

### Community 130 - "AssignmentTree"
Cohesion: 0.39
Nodes (5): AssignmentTree(), byTerm(), GroupBox(), groups, html()

### Community 131 - "KdsApp.jsx"
Cohesion: 0.21
Nodes (22): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+14 more)

### Community 132 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+4 more)

### Community 133 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 134 - "payroll.test.js"
Cohesion: 0.23
Nodes (15): bucketHours(), entryHours(), key(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS, split() (+7 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 136 - "SupportOverlay.jsx"
Cohesion: 0.38
Nodes (8): applyAnnotation(), arrow(), draw(), FADE_AFTER, FADE_FOR, pruneScene(), SupportOverlay(), onAnnotation()

### Community 137 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "pos/catalog.js"
Cohesion: 0.08
Nodes (48): isAppwrite(), categoryKey(), productCategories(), stalePresetCategory(), visibleProductCategories(), carryCategoryRename(), categorySettingBlank(), categorySettingsById() (+40 more)

### Community 140 - "5. Phases"
Cohesion: 0.15
Nodes (13): 5. Phases, 5a. Files, 5b. E-mail (replaces EmailJS), Phase 0: Confirm before buying (1 to 2 days), Phase 10: Cutover (1 to 2 days of work, plus preparation), Phase 11: Decommission and clean-up (2 days), Phase 1: Server and tooling (2 to 3 days), Phase 2: Repository structure and backend modules (8 to 12 days) (+5 more)

### Community 141 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 142 - "Detailing.jsx"
Cohesion: 0.10
Nodes (38): downloadBlob(), modifierLabel(), sendOrderEmail(), jobPaid(), jobTechs(), jobTotal(), buildInvoicePdf(), downloadInvoicePdf() (+30 more)

### Community 143 - "Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)"
Cohesion: 0.11
Nodes (17): 10. Rough timeline, 11. Open questions, 1. Goal and decisions already made, 2.1 What Netlify does for us, 2.2 What Appwrite does for us, 2. What exists today (inventory), 3.1 Frontend and backend, kept separate, 3.2 Why PostgreSQL and not MongoDB (+9 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.20
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "kitchenPrinters.js"
Cohesion: 0.18
Nodes (19): openKotWindow(), kotEscPos(), kotHtml(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log (+11 more)

### Community 152 - "diagnostics.service.js"
Cohesion: 0.13
Nodes (21): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+13 more)

### Community 154 - "pos-admin-rollup.test.js"
Cohesion: 0.22
Nodes (9): assert, end, fs, iso(), sale(), salesRollup, source, start (+1 more)

### Community 155 - "POS variants (verticals)"
Cohesion: 0.40
Nodes (4): Add a new business type, Add a new module (for example vehicles and job cards for Automotive), POS variants (verticals), Rules

### Community 157 - "ogf-push-function.test.js"
Cohesion: 0.11
Nodes (15): handler(), lib, log, push, assert, caller, docs, { handler } (+7 more)

### Community 158 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 159 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 160 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 161 - "pos-address.test.js"
Cohesion: 0.18
Nodes (7): assert, fs, path, redirects, root, test, toml

### Community 162 - "Ceylo.jsx"
Cohesion: 0.12
Nodes (28): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+20 more)

### Community 163 - "account-purge.test.js"
Cohesion: 0.26
Nodes (10): businessLabel(), confirmWord(), createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert (+2 more)

### Community 165 - "printBridge.js"
Cohesion: 0.16
Nodes (12): connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), loadQz(), log, sendRaw() (+4 more)

### Community 166 - "Ceylonry POS: New Feature Roll-out Notes"
Cohesion: 0.22
Nodes (8): 1. Item stock counts and ingredients, 2. Branch-specific menus, 3. Demo and Test accounts no longer ask for payment, 4. Trial length and plan prices are consistent, 5. Modifier groups: assign to items by tree, 6. Fixes, Ceylonry POS: New Feature Roll-out Notes, Notes

### Community 167 - "KdsHealthPages.jsx"
Cohesion: 0.13
Nodes (27): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, formatBytes() (+19 more)

### Community 168 - "Architecture"
Cohesion: 0.25
Nodes (8): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack

### Community 169 - "systemOptions.js"
Cohesion: 0.25
Nodes (13): applyPatch(), autoClockOutDue(), defaultsFor(), FIELDS, isOverridden(), LANDING_VIEWS, landingView(), OPTION_PAGES (+5 more)

### Community 170 - "supportControl.js"
Cohesion: 0.43
Nodes (7): denyReason(), NEVER_TYPES, place(), runAction(), scrollable(), sensitiveName(), setValue()

### Community 171 - "Features"
Cohesion: 0.22
Nodes (8): Ceylonry POS: Release Notes, 2026-11-17, Features, Fixes, New landing page, Other, Plan finder: devices per location, QR menu (digital menu for restaurants and cafés), Visual refresh

### Community 172 - "Settings section: build status and plan"
Cohesion: 0.14
Nodes (13): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 6): Taxes, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers) (+5 more)

### Community 173 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 174 - "scanner.js"
Cohesion: 0.16
Nodes (13): sizeSlug(), findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), claimOutput() (+5 more)

### Community 175 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 176 - "Features"
Cohesion: 0.17
Nodes (11): 1. Online orders from Shopify, 2. Shopify customers in the CRM, 3. Online Orders report, 4. Items with short ingredients are blocked when selected, 5. Manager override for low stock, 6. Ceylo AI: pick the model from a list, with a key guide, 7. QR menu: admin switch, Ceylonry POS: Release Notes, 2026-11-19 (+3 more)

### Community 177 - "ogf-push.test.js"
Cohesion: 0.18
Nodes (11): assert, CLIENT, config(), deps(), http, mall, push, run() (+3 more)

### Community 178 - "diagnosticsShared.js"
Cohesion: 0.13
Nodes (25): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+17 more)

### Community 179 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 180 - "salesLog.js"
Cohesion: 0.36
Nodes (9): userName(), staffName(), day(), DELETED_ACTION, inLocation(), parseDeletedDetails(), refundRows(), voidRows() (+1 more)

### Community 182 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 183 - "ref_node_fs"
Cohesion: 0.15
Nodes (10): isHashed(), isPosPage(), SHELL, strategyFor(), code, handlers, pick(), req() (+2 more)

### Community 184 - "OGF POS-02 UAT in Postman"
Cohesion: 0.33
Nodes (5): OGF POS-02 UAT in Postman, Points the Postman guide shows (to confirm with OGF), Rebuild, Run it, What each request is

### Community 185 - "Live support session: relay server and testing"
Cohesion: 0.20
Nodes (9): 1. Install coturn on the server, 2. Tell the functions about it, 3. Check it works, How the connection works, Live support session: relay server and testing, Reconnecting, Relay server (coturn), Slow networks (+1 more)

### Community 186 - "lib/support-session.js"
Cohesion: 0.12
Nodes (9): agentView(), crypto, iceServers(), join(), newSession(), newSessionId(), offerKey(), text() (+1 more)

### Community 187 - "LiveSupportPanel.jsx"
Cohesion: 0.31
Nodes (8): LiveSupportPanel(), spaced(), useCountdown(), GIVE_UP, linkLabel(), MOVEMENT, RECONNECT_MS, resetSupport()

### Community 188 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 189 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 190 - "Restaurant (OGF) and the OGF sales push"
Cohesion: 0.25
Nodes (7): Limits, OGF's Postman guide (what it adds), Restaurant (OGF) and the OGF sales push, Setting a business up, Things the documents leave open (to confirm with OGF), What is sent, Where it lives

### Community 191 - "adminInsightsParity.test.js"
Cohesion: 0.29
Nodes (7): ago(), end, payload, sale(), server, src, start

### Community 193 - "supportViewerState.js"
Cohesion: 0.12
Nodes (28): DESTINATIONS, newId(), Stage(), SupportViewer(), TEXT_TYPES, TOOLS, buffer, call() (+20 more)

### Community 194 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 195 - "Ceylonry POS: Release Notes, 2026-11-18"
Cohesion: 0.33
Nodes (5): Ceylonry POS: Release Notes, 2026-11-18, Features, Fixes, Ingredient check when an item is selected, Other

### Community 197 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 198 - "docs/README.md"
Cohesion: 0.12
Nodes (10): Conventions, Debugging, Development guide, Recipes, Setup, Ceylonry POS — Documentation, Automated coverage, Harness (+2 more)

### Community 199 - "collect"
Cohesion: 0.67
Nodes (4): collect(), keyOf(), pickRegister(), previewFor()

### Community 200 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 202 - "buildReport"
Cohesion: 0.38
Nodes (7): payCost(), buildReport(), LOYALTY(), salesVsLabor(), TAXES(), totalsRow(), unavailable()

### Community 203 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 204 - "appwriteCompat.js"
Cohesion: 0.15
Nodes (10): forgetUser(), getAppwriteCompat(), installGlobalClsBackend(), log, rememberedUser(), rememberUser(), authHeaders(), call() (+2 more)

### Community 205 - "shopifyOrders.test.js"
Cohesion: 0.18
Nodes (18): VIEW_FEATURE, inboxToOpenOrder(), matchSku(), onlineLines(), openOrderIdOf(), POS_CURRENCY, rateFor(), alerted (+10 more)

### Community 206 - "supportProtocol.test.js"
Cohesion: 0.26
Nodes (12): clamp(), cleanAnnotation(), cleanCommand(), cleanReply(), FRAME, frameReader(), num(), toFrames() (+4 more)

### Community 207 - "Deployment & operations"
Cohesion: 0.33
Nodes (6): Backups and data, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 212 - "README.md"
Cohesion: 0.13
Nodes (9): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification (+1 more)

## Knowledge Gaps
- **1058 isolated node(s):** `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}`, `log`, `OPERATIONAL_COLLECTIONS` (+1053 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1387 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `ai-keys.js`, `AssignmentTree`, `KdsApp.jsx`, `PosProvider.jsx`, `SalesPushPage.jsx`, `payroll.test.js`, `adminAnalytics.js`, `settings.js`, `net.js`, `pos/catalog.js`, `Detailing.jsx`, `logger.js`, `pos/staff.js`, `labelPrinter.js`, `diagnostics.service.js`, `appwriteCompat.test.js`, `DataProvider.jsx`, `pos-admin-data.js`, `locations.js`, `printBridge.js`, `KdsHealthPages.jsx`, `systemOptions.js`, `subscription.js`, `AdminApp.jsx`, `scanner.js`, `domain.test.js`, `salesLog.js`, `Tables.jsx`, `ref_node_fs`, `tables/index.js`, `PortalShell.jsx`, `adminInsightsParity.test.js`, `plans.js`, `pos-react/package.json`, `adminInsights.js`, `appwriteCompat.js`, `shopifyOrders.test.js`, `supportProtocol.test.js`, `SystemOptionsPages.jsx`, `UsersPages.jsx`, `assist.js`, `MenuAdminPages.jsx`, `portal.test.js`, `ref_node_path`, `thirdPartyPayments.js`, `SessionProvider.jsx`, `documents.js`, `createLogger`, `DevicePages.jsx`, `domain/inventory.js`, `businessTypeLocked`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **Why does `react` connect `useData` to `domain/format.js`, `AssignmentTree`, `PosProvider.jsx`, `KdsApp.jsx`, `SalesPushPage.jsx`, `SupportOverlay.jsx`, `Detailing.jsx`, `DataProvider.jsx`, `Ceylo.jsx`, `locations.js`, `printBridge.js`, `KdsHealthPages.jsx`, `analytics.js`, `subscription.js`, `AdminApp.jsx`, `AnalyticsTab.jsx`, `diagnosticsShared.js`, `domain.test.js`, `Tables.jsx`, `ref_node_fs`, `LiveSupportPanel.jsx`, `PortalShell.jsx`, `panels.jsx`, `plans.js`, `pos-react/package.json`, `supportViewerState.js`, `useFeature`, `adminInsights.js`, `ErrorBoundary.jsx`, `SystemOptionsPages.jsx`, `UsersPages.jsx`, `assist.js`, `MenuAdminPages.jsx`, `SessionProvider.jsx`, `createLogger`, `DevicePages.jsx`, `supportLive.js`, `businessTypeLocked`, `useInstall.js`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `r()` connect `b` to `c`, `d`, `ceylonry-site-runtime.js`, `pos-routing.test.js`, `adminInsightsParity.test.js`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}` to the rest of the system?**
  _1058 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai-keys.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `useData` be split into smaller, more focused modules?**
  _Cohesion score 0.08505050505050506 - nodes in this community are weakly interconnected._
- **Should `domain/format.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11260504201680673 - nodes in this community are weakly interconnected._