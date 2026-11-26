# Graph Report - clscashflow  (2026-11-23)

## Corpus Check
- 564 files · ~1,409,536 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .css 15, (none) 4, .webmanifest 2)

## Summary
- 5251 nodes · 16296 edges · 210 communities (188 shown, 22 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 627 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2345a118`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ai-keys.js
- useData
- constants.js
- esc
- domain/sales.js
- appwrite.js
- SalesPushPage.jsx
- __awaiter
- lib/invoice-share.js
- adminAnalytics.js
- settings.js
- App.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- cloud.service.js
- timesheetEdit.test.js
- ceylonry-site-runtime.js
- labelPrinter.js
- b
- store.mjs
- pos.mjs
- app.mjs
- clean
- pos-routing.test.js
- domain/format.js
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- OnlineOrders.jsx
- pos/onlineOrders.js
- functions/menu-share.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-accounts.test.js
- invoiceEscape
- usePos
- pagePath
- subscription.js
- d
- AccountDetail.jsx
- package.json
- pos/sales.js
- shopify-webhook.js
- features.js
- render
- Tables.jsx
- ref_node_assert
- appwrite-sdk.js
- Teams
- salesSplit.test.js
- render
- localAdmin.js
- boot
- ceylo.js
- panels.jsx
- plans.js
- logic.mjs
- pos-react/package.json
- boot
- useFeature
- getAuthUser
- adminInsights.js
- c
- AnalyticsTab.jsx
- Client
- Z
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- Functions
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
- portal.test.js
- normalizePlan
- nowIso
- MenuAdminPages.jsx
- printing.js
- Root test-suite audit (169 failing tests)
- ViewRouter.jsx
- User guide
- pos-admin-support-role.test.js
- account-danger-zone.js
- AdminApp.jsx
- ni
- Administrator guide
- submit-subscription-receipt.js
- pos-handoff.test.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- documents.js
- env.js
- adminFeedback.js
- SettingsHome.jsx
- supportLive.js
- functions/support-session.js
- Ce
- Settings Section Build Spec: what is still pending
- isAppwrite
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- scanner.js
- posRoute.js
- KdsHealthPages.jsx
- useInstall.js
- B
- lib/ogf-push.js
- Development guide
- react-dom
- KdsApp.jsx
- link.js
- hardware-order.js
- priority-support-chat.test.js
- Ceylonry POS — React + WatermelonDB
- SupportViewer.jsx
- net.js
- config-merge.js
- pos/catalog.js
- Project structure
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
- ref_node_fs
- pos-admin-rollup.test.js
- POS variants (verticals)
- landing-motion.js
- ogf-push-function.test.js
- imageTools.js
- ready.js
- BusinessTypeTab.jsx
- Ceylo.jsx
- Settings section: build status and plan
- build.py
- printBridge.js
- Ceylonry POS: New Feature Roll-out Notes
- supportControl.js
- Features
- account-purge.test.js
- Ceylonry POS: release notes, 2026-11-23
- node-appwrite
- apps-used.test.js
- Features
- ogf-push.test.js
- diagnosticsShared.js
- supportProtocol.test.js
- Role
- PosProvider.jsx
- serviceWorker.test.js
- OGF POS-02 UAT in Postman
- Live support session: relay server and testing
- lib/support-session.js
- README.md
- thirdPartyPayments.js
- onboarding-terms-acceptance.test.js
- Restaurant (OGF) and the OGF sales push
- adminInsightsParity.test.js
- FakePc
- supportViewerState.js
- pos-address.test.js
- Ceylonry POS: Release Notes, 2026-11-18
- normalizePlan
- growth-partner-commissions.test.js
- Architecture
- admin-auth.js
- pos-reported-bugs.test.js
- bug-report-20260810.test.js
- taxes.js
- appwriteCompat.js
- shopify-admin.js
- supportProtocol.js
- bug-report-20260811-email-modal-template.test.js
- Databases
- insightsRollup
- POS administration portal
- Deployment & operations
- EmailJS order e-mail template
- step
- Graphql
- Messaging

## God Nodes (most connected - your core abstractions)
1. `useData()` - 210 edges
2. `usePos()` - 204 edges
3. `react` - 142 edges
4. `useFeature()` - 99 edges
5. `__awaiter()` - 93 edges
6. `money()` - 93 edges
7. `vitest` - 81 edges
8. `AppwriteException` - 74 edges
9. `Modal()` - 67 edges
10. `nowIso()` - 66 edges

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

## Communities (210 total, 22 thin omitted)

### Community 0 - "ai-keys.js"
Cohesion: 0.12
Nodes (24): Anthropic, ask(), crypto, decrypt(), docId(), { getDocument, upsertDocument, deleteDocument }, keyFor(), { listModels } (+16 more)

### Community 1 - "useData"
Cohesion: 0.09
Nodes (54): Shell(), ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), PrintHelperPicker(), Modal() (+46 more)

### Community 2 - "constants.js"
Cohesion: 0.12
Nodes (30): NumberInput(), ADJUST_REASONS, CUSTOMER_TYPES, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, PAYMENT_ICONS, PLATFORM_CHANNELS, STOCK_TYPES (+22 more)

### Community 3 - "esc"
Cohesion: 0.20
Nodes (28): bindTables(), bookingDialog(), business(), cfg(), dateBar(), esc(), floorName(), floors() (+20 more)

### Community 4 - "domain/sales.js"
Cohesion: 0.17
Nodes (21): isOwnerRole(), OWNER_ROLES, REPORTING_ROLES, ACTIVE_STATUSES, activeTimeEntry(), currentCashShift(), expectedCash(), isOnBreak() (+13 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (54): 2.3 The seams that make this manageable, Phase 3: Data layer (5 to 8 days), bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log (+46 more)

### Community 6 - "SalesPushPage.jsx"
Cohesion: 0.37
Nodes (11): blankForm(), formFrom(), formProblems(), https(), INTERVALS, newRegister(), PAYMENT_ROWS, registerProblem() (+3 more)

### Community 7 - "__awaiter"
Cohesion: 0.10
Nodes (3): Account, AppwriteException, __awaiter()

### Community 8 - "lib/invoice-share.js"
Cohesion: 0.11
Nodes (48): {
  clean,
  headers,
  getUserFromEvent,
  getDocument,
  queryDocuments,
  upsertDocument,
  canWrite
}, customerMatches(), findCustomer(), findInvoiceSource(), handler(), {
  normalizeWhatsAppNumber,
  generatePublicToken,
  isValidPublicToken,
  buildVersionedPublicUrl,
  selectInvoiceSource,
  sanitizePublicInvoice,
  buildReminderMessage,
  assertSourceAccess
}, publicBase(), response() (+40 more)

### Community 9 - "adminAnalytics.js"
Cohesion: 0.24
Nodes (17): dailySeries(), day(), DEFAULT_TZ, fmt, group(), hourlyActivity(), hourlyRollup(), iso() (+9 more)

### Community 10 - "settings.js"
Cohesion: 0.07
Nodes (70): asStation(), connection(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf(), KITCHEN_CONNECTIONS (+62 more)

### Community 11 - "App.jsx"
Cohesion: 0.11
Nodes (24): App(), Gate(), Loading(), PublicMenuSync(), Ready(), Root(), SupportBridge(), ErrorBoundary (+16 more)

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
Nodes (37): { appwriteAdmin, ADMIN_EMAIL }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+29 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (21): PosStore, 5. Data layer (WatermelonDB), decode(), encode(), attachLines(), categoryId(), EMPTY_SNAPSHOT(), hintSeq() (+13 more)

### Community 17 - "cloud.service.js"
Cohesion: 0.10
Nodes (31): STORAGE, exactly(), profileHasPosAccess(), ALWAYS_LIVE_KEY, alwaysLive(), clone(), CloudSyncService, log (+23 more)

### Community 18 - "timesheetEdit.test.js"
Cohesion: 0.21
Nodes (16): AUDIT_ACTION, dayOf(), entryError(), entryLocked(), fromLocalInput(), LOCK_MONTHS, lockDate(), MAX_SHIFT_MS (+8 more)

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
Cohesion: 0.08
Nodes (50): Data model, go(), queueSeating(), refreshPos(), saveSettings(), signInView(), start(), viewMessages() (+42 more)

### Community 23 - "pos.mjs"
Cohesion: 0.27
Nodes (14): layoutDialog(), layoutError(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf() (+6 more)

### Community 24 - "app.mjs"
Cohesion: 0.10
Nodes (49): ACTIONS, billsOf(), bindGuestFill(), cancelDialog(), canSend(), detailDialog(), dialog(), dlg() (+41 more)

### Community 25 - "clean"
Cohesion: 0.05
Nodes (80): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+72 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (36): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+28 more)

### Community 27 - "domain/format.js"
Cohesion: 0.08
Nodes (60): Kpi(), birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats() (+52 more)

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

### Community 34 - "OnlineOrders.jsx"
Cohesion: 0.15
Nodes (30): ONLINE_CHANNELS, canAccept(), canDecline(), canFulfill(), canPack(), canTrack(), CARRIERS, customerMessage() (+22 more)

### Community 35 - "pos/onlineOrders.js"
Cohesion: 0.12
Nodes (34): Mapping Shopify to the POS, What the POS already has, cleanTracking(), trackingError(), code(), inboxToOpenOrder(), matchSku(), onlineLines() (+26 more)

### Community 36 - "functions/menu-share.js"
Cohesion: 0.16
Nodes (19): {
  clean,
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument
}, { generatePublicToken, isValidPublicToken }, handler(), { locationKey, sanitizeMenu }, publicBase(), response(), uniqueToken(), { clean, headers, getDocument } (+11 more)

### Community 37 - "vitest"
Cohesion: 0.08
Nodes (30): defaultsFor(), makeCtx(), cash(), addProduct(), createHarness(), line(), noDiscount, openShift() (+22 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.07
Nodes (53): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+45 more)

### Community 40 - "pos-admin-accounts.test.js"
Cohesion: 0.07
Nodes (27): handler(), assert, auth, call(), col(), docs, form, fs (+19 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "usePos"
Cohesion: 0.08
Nodes (48): NavIcon(), PATHS, PATHS, PortalIcon(), PortalHome(), PortalSettingsPage, PortalShell(), Reports (+40 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (29): assert, fs, { pagePath }, path, read(), root, test, assert (+21 more)

### Community 44 - "subscription.js"
Cohesion: 0.20
Nodes (17): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+9 more)

### Community 45 - "d"
Cohesion: 0.09
Nodes (44): ae(), at(), bc(), be(), C(), dt(), Ee(), Fe() (+36 more)

### Community 46 - "AccountDetail.jsx"
Cohesion: 0.21
Nodes (15): AccessTab(), AccountDetail(), TABS, BusinessTypeTab(), COUNT_LABELS, DeleteAccountTab(), accessWarning(), fmtDay() (+7 more)

### Community 47 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+13 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.08
Nodes (56): cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), serviceChargeAmount(), serviceChargeAuto(), splitByItems() (+48 more)

### Community 49 - "shopify-webhook.js"
Cohesion: 0.08
Nodes (35): base(), esc(), { getDocument, clean }, handler(), oauth, page(), { shopKey }, { appWebhookSecret } (+27 more)

### Community 50 - "features.js"
Cohesion: 0.13
Nodes (24): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, ONLINE, presetFlags() (+16 more)

### Community 51 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.19
Nodes (32): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+24 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.06
Nodes (26): assert, keys, lib, rows, test, assert, keys, test (+18 more)

### Community 54 - "appwrite-sdk.js"
Cohesion: 0.13
Nodes (5): Avatars, Permission, Query, Service, Storage

### Community 56 - "salesSplit.test.js"
Cohesion: 0.18
Nodes (9): combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef, ctxFor() (+1 more)

### Community 57 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 58 - "localAdmin.js"
Cohesion: 0.07
Nodes (36): DEV_ADMIN, getStore(), invoices(), localAdminApi(), localAdminSession, DEFAULT_WELCOME, createDatabase(), databaseNameFor() (+28 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 60 - "ceylo.js"
Cohesion: 0.26
Nodes (10): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, routeKitchenLines() (+2 more)

### Community 62 - "panels.jsx"
Cohesion: 0.09
Nodes (46): how(), KitchenStations(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel(), LocationsPanel() (+38 more)

### Community 63 - "plans.js"
Cohesion: 0.18
Nodes (14): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), ADDITIONAL_FEATURES (+6 more)

### Community 64 - "logic.mjs"
Cohesion: 0.11
Nodes (34): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+26 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (42): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+34 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 67 - "useFeature"
Cohesion: 0.11
Nodes (43): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+35 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "adminInsights.js"
Cohesion: 0.15
Nodes (26): activationFunnel(), ACTIVE, benchmark(), byBusinessType(), churnRisk(), FUNNEL, heatmap(), insightRollup() (+18 more)

### Community 70 - "c"
Cohesion: 0.12
Nodes (26): ai(), a(), bi(), ci(), Dg(), ef(), Eh(), hb() (+18 more)

### Community 71 - "AnalyticsTab.jsx"
Cohesion: 0.35
Nodes (15): BarChart(), HourlyPanel(), Kpi(), lkr(), METRICS, one(), RankedBars(), AnalyticsTab() (+7 more)

### Community 72 - "Client"
Cohesion: 0.15
Nodes (3): __classPrivateFieldGet(), Client, ID

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

### Community 80 - "SystemOptionsPages.jsx"
Cohesion: 0.14
Nodes (52): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), ConditionalGroup() (+44 more)

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
Cohesion: 0.13
Nodes (14): 1. Summary, 2.1 Separate POS database, 2.2 Document storage format (netlify/lib/appwrite.js), 2.3 Function actions (netlify/functions/appwrite-docs.js), 2.4 Storage, 2.5 Sales history split (switched ON in production), 2.6 Guest Manager database (`gm` / `gm_documents`), 2. Database changes (+6 more)

### Community 87 - "Plan: move from Netlify + Appwrite Cloud to a VPS"
Cohesion: 0.17
Nodes (11): Open questions, Phase 0: decisions (needed before starting), Phase 1: server setup (no code changes), Phase 2: replace Netlify (small code change), Phase 3: move the data, Phase 4: cutover, Phase 5: running it, Plan: move from Netlify + Appwrite Cloud to a VPS (+3 more)

### Community 88 - "UsersPages.jsx"
Cohesion: 0.20
Nodes (21): ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError(), jobsOf() (+13 more)

### Community 89 - "security.js"
Cohesion: 0.05
Nodes (63): corsHeaders, { guard, siteOrigin, siteUrl }, handler(), json(), ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin, siteUrl } (+55 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (33): AssistBar(), log, BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig(), diffConfig() (+25 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 95 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

### Community 96 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 97 - "nowIso"
Cohesion: 0.07
Nodes (69): T, TABLE_BY_NAME, parseStockCountRows(), isEmail(), nowIso(), phoneKey(), whatsappPhone(), adjustmentChange() (+61 more)

### Community 98 - "MenuAdminPages.jsx"
Cohesion: 0.05
Nodes (86): ARRAY_FIELDS, assignGroupEdits(), catalogDraftChanges(), categoryEditError(), cleanCategoryEdit(), cleanGroupEdit(), draftList(), draftNewItems() (+78 more)

### Community 99 - "printing.js"
Cohesion: 0.16
Nodes (19): prepName(), kitchenPrinterHook(), kitchenMode(), docCtx(), downloadReceipt(), kdsNotice(), kitchenDestination(), locationFor() (+11 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "ViewRouter.jsx"
Cohesion: 0.06
Nodes (33): AutomobileShell(), BusinessSettings(), Customers, Detailing, Icon(), ICONS, Inventory, ITEMS (+25 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "pos-admin-support-role.test.js"
Cohesion: 0.18
Nodes (11): assert, auth, call(), data, diagnostics, lib, record, storePath (+3 more)

### Community 104 - "account-danger-zone.js"
Cohesion: 0.11
Nodes (27): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}, log (+19 more)

### Community 105 - "AdminApp.jsx"
Cohesion: 0.31
Nodes (12): Admin portal, AdminApp(), log, AdminLogin(), ChurnPanel(), FunnelPanel(), HeatmapPanel(), KitchenPanel() (+4 more)

### Community 106 - "ni"
Cohesion: 0.13
Nodes (21): Bf(), e(), k(), eb(), ff(), gd(), hc(), kb() (+13 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "submit-subscription-receipt.js"
Cohesion: 0.07
Nodes (39): getAdmin(), { appwriteAdmin }, { guard, siteOrigin, siteUrl }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean() (+31 more)

### Community 109 - "pos-handoff.test.js"
Cohesion: 0.20
Nodes (10): { guard, reply }, handler(), lib, log, assert, call(), { handler }, issued (+2 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.14
Nodes (23): accessAllowed(), billingWarning(), isTestAccount(), PAID_STATUSES, posAccessProfile(), handOff(), log, loadCatalogueImages() (+15 more)

### Community 113 - "documents.js"
Cohesion: 0.12
Nodes (28): esc(), modifierLabel(), receiptName(), receiptDate(), openKotWindow(), testStation(), kotBody(), kotEscPos() (+20 more)

### Community 114 - "env.js"
Cohesion: 0.10
Nodes (30): adminApi(), log, sendAdminRequest(), adminSession, log, MenuImport(), NUMBERS, log (+22 more)

### Community 115 - "adminFeedback.js"
Cohesion: 0.29
Nodes (7): adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText(), useAdminFeedback()

### Community 116 - "SettingsHome.jsx"
Cohesion: 0.09
Nodes (36): PublishBar(), SaveBar(), SettingsShell(), TopRow(), useSystemOptionsDraft(), ServiceChargePanel(), CAPABILITIES, hasCapability() (+28 more)

### Community 117 - "supportLive.js"
Cohesion: 0.16
Nodes (25): spaced(), SupportBanner(), annotationSubs, answerRequest(), ask(), call(), connect(), endSupport() (+17 more)

### Community 118 - "functions/support-session.js"
Cohesion: 0.09
Nodes (36): verifyAdmin(), { getAdmin, audit }, { guard, reply }, handler(), { isAdminEmail, verifyToken, canUsePortal }, log, store, verifyAdmin() (+28 more)

### Community 119 - "Ce"
Cohesion: 0.20
Nodes (15): Ce(), ed(), fc(), gh(), Ij(), Lb(), mj(), oh() (+7 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "isAppwrite"
Cohesion: 0.28
Nodes (14): isAppwrite(), buildMenuSnapshot(), enabledKeys(), httpsImage(), linkKey(), linkOf(), call(), disablePublicMenu() (+6 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 123 - "scanner.js"
Cohesion: 0.39
Nodes (7): sizeSlug(), findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants()

### Community 124 - "posRoute.js"
Cohesion: 0.26
Nodes (9): addressForType(), addressOfPage(), POS_BASE_HOST, POS_URLS, posRedirect(), servesPosAtRoot(), AUTO, MAIN (+1 more)

### Community 125 - "KdsHealthPages.jsx"
Cohesion: 0.37
Nodes (11): formatBytes(), healthIssues(), rateLatency(), cleanKds(), KDS_DEFAULTS, kdsError(), kdsSettingsOf(), whole() (+3 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "B"
Cohesion: 0.22
Nodes (11): B(), fn(), Lt(), M(), N(), oa(), Ot(), pn() (+3 more)

### Community 128 - "lib/ogf-push.js"
Cohesion: 0.09
Nodes (47): batchCode(), cleanConfig(), collect(), configProblems(), crypto, deleteSecret(), emptyState(), getToken() (+39 more)

### Community 129 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 130 - "react-dom"
Cohesion: 0.19
Nodes (9): AssignmentTree(), byTerm(), GroupBox(), LocationChecks(), groups, html(), html(), locations (+1 more)

### Community 131 - "KdsApp.jsx"
Cohesion: 0.21
Nodes (21): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+13 more)

### Community 132 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+4 more)

### Community 133 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 134 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.12
Nodes (16): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 6. Services (abstractions), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing (+8 more)

### Community 136 - "SupportViewer.jsx"
Cohesion: 0.15
Nodes (19): DESTINATIONS, newId(), Stage(), TEXT_TYPES, TOOLS, clearNotice(), onPageEvent(), resetViewer() (+11 more)

### Community 137 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "pos/catalog.js"
Cohesion: 0.15
Nodes (27): categoryKey(), productCategories(), stalePresetCategory(), visibleProductCategories(), carryCategoryRename(), activeLocationIds(), allows(), branchOf() (+19 more)

### Community 140 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 141 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 142 - "Detailing.jsx"
Cohesion: 0.11
Nodes (45): downloadBlob(), advanceJob(), clash(), createInvoice(), find(), finishJob(), guard(), JOB_FLOW (+37 more)

### Community 143 - "Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)"
Cohesion: 0.06
Nodes (31): 10. Rough timeline, 11. Open questions, 1. Goal and decisions already made, 2.1 What Netlify does for us, 2.2 What Appwrite does for us, 2. What exists today (inventory), 3.1 Frontend and backend, kept separate, 3.2 Why PostgreSQL and not MongoDB (+23 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.20
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "kitchenPrinters.js"
Cohesion: 0.14
Nodes (23): chooseKitchenPrinter(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket(), usbSupported() (+15 more)

### Community 152 - "diagnostics.service.js"
Cohesion: 0.13
Nodes (21): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+13 more)

### Community 153 - "ref_node_fs"
Cohesion: 0.09
Nodes (17): PLANS, POS_PLANS, walk(), assert, compat, fs, path, test (+9 more)

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

### Community 160 - "BusinessTypeTab.jsx"
Cohesion: 0.53
Nodes (4): businessTypeLabel(), BLANK, NewAccountPanel(), ADMIN_BUSINESS_TYPE_OPTIONS

### Community 162 - "Ceylo.jsx"
Cohesion: 0.11
Nodes (29): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+21 more)

### Community 163 - "Settings section: build status and plan"
Cohesion: 0.14
Nodes (13): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 6): Taxes, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers) (+5 more)

### Community 165 - "printBridge.js"
Cohesion: 0.16
Nodes (12): connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), loadQz(), log, sendRaw() (+4 more)

### Community 166 - "Ceylonry POS: New Feature Roll-out Notes"
Cohesion: 0.22
Nodes (8): 1. Item stock counts and ingredients, 2. Branch-specific menus, 3. Demo and Test accounts no longer ask for payment, 4. Trial length and plan prices are consistent, 5. Modifier groups: assign to items by tree, 6. Fixes, Ceylonry POS: New Feature Roll-out Notes, Notes

### Community 170 - "supportControl.js"
Cohesion: 0.43
Nodes (7): denyReason(), NEVER_TYPES, place(), runAction(), scrollable(), sensitiveName(), setValue()

### Community 171 - "Features"
Cohesion: 0.22
Nodes (8): Ceylonry POS: Release Notes, 2026-11-17, Features, Fixes, New landing page, Other, Plan finder: devices per location, QR menu (digital menu for restaurants and cafés), Visual refresh

### Community 172 - "account-purge.test.js"
Cohesion: 0.26
Nodes (10): businessLabel(), confirmWord(), createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert (+2 more)

### Community 173 - "Ceylonry POS: release notes, 2026-11-23"
Cohesion: 0.29
Nodes (6): 1. Live support session (#179), 2. Support-only admin accounts, Ceylonry POS: release notes, 2026-11-23, Features, Fixes, Other

### Community 174 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 175 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 176 - "Features"
Cohesion: 0.17
Nodes (11): 1. Online orders from Shopify, 2. Shopify customers in the CRM, 3. Online Orders report, 4. Items with short ingredients are blocked when selected, 5. Manager override for low stock, 6. Ceylo AI: pick the model from a list, with a key guide, 7. QR menu: admin switch, Ceylonry POS: Release Notes, 2026-11-19 (+3 more)

### Community 177 - "ogf-push.test.js"
Cohesion: 0.18
Nodes (11): assert, CLIENT, config(), deps(), http, mall, push, run() (+3 more)

### Community 178 - "diagnosticsShared.js"
Cohesion: 0.13
Nodes (25): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+17 more)

### Community 179 - "supportProtocol.test.js"
Cohesion: 0.28
Nodes (10): LiveSupportPanel(), spaced(), useCountdown(), droppable(), keepTrying(), linkLabel(), MOVEMENT, RECONNECT_MS (+2 more)

### Community 182 - "PosProvider.jsx"
Cohesion: 0.09
Nodes (37): Ctx, SystemOptionsProvider(), AppearancePanel(), SETTINGS_PAGE_OF_VIEW, VIEW_TITLES, readyBeep(), applyPatch(), autoClockOutDue() (+29 more)

### Community 183 - "serviceWorker.test.js"
Cohesion: 0.16
Nodes (10): isHashed(), isPosPage(), SHELL, strategyFor(), code, handlers, pick(), req() (+2 more)

### Community 184 - "OGF POS-02 UAT in Postman"
Cohesion: 0.33
Nodes (5): OGF POS-02 UAT in Postman, Points the Postman guide shows (to confirm with OGF), Rebuild, Run it, What each request is

### Community 185 - "Live support session: relay server and testing"
Cohesion: 0.18
Nodes (10): 1. Install coturn on the server, 2. Tell the functions about it, 3. Check it works, How the connection works, Live support session: relay server and testing, Reconnecting, Relay server (coturn), Slow networks (+2 more)

### Community 186 - "lib/support-session.js"
Cohesion: 0.12
Nodes (9): agentView(), crypto, iceServers(), join(), newSession(), newSessionId(), offerKey(), text() (+1 more)

### Community 187 - "README.md"
Cohesion: 0.14
Nodes (9): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification (+1 more)

### Community 188 - "thirdPartyPayments.js"
Cohesion: 0.27
Nodes (11): PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), reorder() (+3 more)

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
Cohesion: 0.18
Nodes (18): SupportViewer(), buffer, call(), endViewer(), eventSubs, finish(), IDLE, joinSupport() (+10 more)

### Community 194 - "pos-address.test.js"
Cohesion: 0.18
Nodes (7): assert, fs, path, redirects, root, test, toml

### Community 195 - "Ceylonry POS: Release Notes, 2026-11-18"
Cohesion: 0.33
Nodes (5): Ceylonry POS: Release Notes, 2026-11-18, Features, Fixes, Ingredient check when an item is selected, Other

### Community 196 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 197 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 198 - "Architecture"
Cohesion: 0.10
Nodes (14): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack (+6 more)

### Community 200 - "admin-auth.js"
Cohesion: 0.12
Nodes (21): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, ADMIN_ROLES, b64url() (+13 more)

### Community 201 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 202 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 203 - "taxes.js"
Cohesion: 0.31
Nodes (8): calculateTaxes(), cleanTax(), MAX_RATE, partsOf(), previewTax(), round2(), taxIdFor(), text()

### Community 204 - "appwriteCompat.js"
Cohesion: 0.07
Nodes (16): KdsGate(), forgetUser(), getAppwriteCompat(), installGlobalClsBackend(), log, rememberedUser(), rememberUser(), AppwriteAuthProvider (+8 more)

### Community 205 - "shopify-admin.js"
Cohesion: 0.09
Nodes (35): Connecting a store: two options, How it would work, Questions for you, Risks and open decisions, Shopify facts that shape the design, Shopify orders into the POS: feasibility, Status: phase 1 (receive) built, Status: phase 3 (accept, decline, fulfil) (+27 more)

### Community 206 - "supportProtocol.js"
Cohesion: 0.25
Nodes (11): clamp(), cleanAnnotation(), cleanCommand(), FRAME, frameReader(), num(), toFrames(), TOOLS (+3 more)

### Community 208 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 212 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 213 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 214 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 215 - "step"
Cohesion: 0.50
Nodes (4): adopt(), fulfilled(), rejected(), step()

## Knowledge Gaps
- **1116 isolated node(s):** `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}`, `log`, `OPERATIONAL_COLLECTIONS` (+1111 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1449 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `ai-keys.js`, `react-dom`, `KdsApp.jsx`, `SalesPushPage.jsx`, `adminAnalytics.js`, `settings.js`, `net.js`, `pos/catalog.js`, `Detailing.jsx`, `logger.js`, `kitchenPrinters.js`, `timesheetEdit.test.js`, `labelPrinter.js`, `diagnostics.service.js`, `ref_node_fs`, `domain/format.js`, `pos-admin-data.js`, `OnlineOrders.jsx`, `printBridge.js`, `reportBuilders.js`, `usePos`, `subscription.js`, `pos/sales.js`, `features.js`, `supportProtocol.test.js`, `Tables.jsx`, `PosProvider.jsx`, `serviceWorker.test.js`, `salesSplit.test.js`, `localAdmin.js`, `ceylo.js`, `thirdPartyPayments.js`, `adminInsightsParity.test.js`, `plans.js`, `pos-react/package.json`, `adminInsights.js`, `appwriteCompat.js`, `UsersPages.jsx`, `assist.js`, `receiptPrinter`, `portal.test.js`, `MenuAdminPages.jsx`, `ViewRouter.jsx`, `SessionProvider.jsx`, `documents.js`, `env.js`, `adminFeedback.js`, `SettingsHome.jsx`, `posRoute.js`, `KdsHealthPages.jsx`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `react` connect `useData` to `react-dom`, `KdsApp.jsx`, `domain/sales.js`, `constants.js`, `SalesPushPage.jsx`, `SupportViewer.jsx`, `App.jsx`, `Detailing.jsx`, `domain/format.js`, `BusinessTypeTab.jsx`, `Ceylo.jsx`, `OnlineOrders.jsx`, `printBridge.js`, `usePos`, `subscription.js`, `AccountDetail.jsx`, `diagnosticsShared.js`, `features.js`, `supportProtocol.test.js`, `Tables.jsx`, `PosProvider.jsx`, `serviceWorker.test.js`, `localAdmin.js`, `panels.jsx`, `plans.js`, `pos-react/package.json`, `supportViewerState.js`, `useFeature`, `AnalyticsTab.jsx`, `appwriteCompat.js`, `SystemOptionsPages.jsx`, `UsersPages.jsx`, `assist.js`, `MenuAdminPages.jsx`, `ViewRouter.jsx`, `AdminApp.jsx`, `SessionProvider.jsx`, `env.js`, `adminFeedback.js`, `SettingsHome.jsx`, `supportLive.js`, `posRoute.js`, `KdsHealthPages.jsx`, `useInstall.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `r()` connect `b` to `c`, `d`, `ceylonry-site-runtime.js`, `pos-routing.test.js`, `adminInsightsParity.test.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
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
  _1116 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai-keys.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11822660098522167 - nodes in this community are weakly interconnected._
- **Should `useData` be split into smaller, more focused modules?**
  _Cohesion score 0.09320987654320988 - nodes in this community are weakly interconnected._
- **Should `constants.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12100840336134454 - nodes in this community are weakly interconnected._