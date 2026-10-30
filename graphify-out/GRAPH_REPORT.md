# Graph Report - clscashflow  (2026-10-30)

## Corpus Check
- 447 files · ~1,234,553 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3929 nodes · 11570 edges · 193 communities (170 shown, 23 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 279 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `28d7bebb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- security.js
- SystemOptionsPages.jsx
- domain/format.js
- cloud.service.js
- useFeature
- appwrite.js
- settings.js
- __awaiter
- invoice-share.test.js
- createLogger
- PosProvider.jsx
- App.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- guard
- app.mjs
- appwriteAdmin
- labelPrinter.js
- pos/inventory.js
- store.mjs
- pos.mjs
- database.js
- labelPrinter
- pos-routing.test.js
- menuAdmin.js
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- features.js
- react
- pos/sales.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-login.js
- invoiceEscape
- SessionProvider.jsx
- pagePath
- admin-data.cjs
- UsersPages.jsx
- AdminApp.jsx
- receiptPrinter
- systemOptions.js
- ai-keys.js
- LocalAuthProvider
- render
- Tables.jsx
- ref_node_assert
- .toString
- AppwriteException
- salesSplit.test.js
- render
- pos/catalog.js
- boot
- esc
- ref_node_module
- kitchenPrinters.js
- Reports.jsx
- logic.mjs
- pos-react/package.json
- boot
- ref_node_fs
- getAuthUser
- payable-webhook.cjs
- diagnostics-store.js
- appwrite-files.js
- Client
- serviceWorker.test.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- env.js
- panels.jsx
- ViewRouter.jsx
- plans.js
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- Plan: move from Netlify + Appwrite Cloud to a VPS
- payable-create-checkout.cjs
- ReportPage.jsx
- security-endpoints.test.js
- assist.js
- appwrite-compat-session.test.js
- admin-app/main.jsx
- usePos
- planFromPath
- planFromPath
- account-danger-zone.js
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- pos-reported-bugs.test.js
- User guide
- thirdPartyPayments.js
- constants.js
- EndOfDay.jsx
- account-purge.test.js
- Administrator guide
- send-contact.js
- getAdmin
- kds-pair.test.js
- Locale
- useData
- track-visit.cjs
- CloudSyncService
- Architecture
- imageTools.js
- admin-store.js
- Ceylo.jsx
- link.js
- send-invoice.js
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- useUi
- useInstall.js
- ready.js
- bookingDialog
- SaleRepository
- submit-ticket.cjs
- appwriteCompat.test.js
- Storage
- Development guide
- pos-admin-catalog.test.js
- printing.js
- Deployment & operations
- tables/sales.js
- config-merge.js
- tolerant-match.cjs
- bug-report-20260811-email-modal-template.test.js
- KdsApp.jsx
- subscription.js
- EmailJS order e-mail template
- common.js
- BaseRepository
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- scanner.js
- growth-partner-commissions.test.js
- portal.test.js
- POS variants (verticals)
- salesLog.js
- taxes.js
- nowIso
- bug-report-20260810.test.js
- node-appwrite
- seo.test.js
- ceylo.js
- DevicePages.jsx
- SettingsRepository
- apps-used.test.js
- Project structure
- bug-report-20260813-mobile.test.js
- priority-support-chat.test.js
- repositories/index.js
- README.md
- IMPORTANT: This is NOT a rebuild of the POS system.
- localAdmin.js
- payroll.test.js
- business.js
- submit-subscription-receipt.js
- tables/industry.js
- tables/catalog.js
- Settings section: build status and plan
- onboarding-terms-acceptance.test.js
- reportPdf.js
- admin-visits-conversion.test.js
- bug-report-20260812.test.js
- POS administration portal
- InventoryRepository
- gm-routing.test.js
- imageStorage.test.js
- tables/inventory.js
- tables/staff.js
- CustomerRepository
- OpenOrderRepository
- StockMovementRepository
- UserRepository

## God Nodes (most connected - your core abstractions)
1. `useData()` - 164 edges
2. `usePos()` - 159 edges
3. `react` - 109 edges
4. `__awaiter()` - 93 edges
5. `useFeature()` - 78 edges
6. `money()` - 75 edges
7. `AppwriteException` - 74 edges
8. `useUi()` - 53 edges
9. `Modal()` - 52 edges
10. `vitest` - 51 edges

## Surprising Connections (you probably didn't know these)
- `Where data lives (Appwrite project `6a947d6e0012c551dfde`, Singapore)` --references--> `storeFor()`  [INFERRED]
  README.md → netlify/lib/appwrite.js
- `Troubleshooting` --references--> `queryDocuments()`  [INFERRED]
  pos-react/docs/deployment.md → netlify/lib/appwrite.js
- `Styling` --references--> `base()`  [INFERRED]
  pos-react/docs/architecture.md → reservation-system/js/store.mjs
- `Build` --references--> `base()`  [INFERRED]
  pos-react/docs/deployment.md → reservation-system/js/store.mjs
- `5. Data layer (WatermelonDB)` --references--> `categories()`  [INFERRED]
  pos-react/README.md → assets/catalog.js

## Import Cycles
- None detected.

## Communities (193 total, 23 thin omitted)

### Community 0 - "security.js"
Cohesion: 0.08
Nodes (37): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+29 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.17
Nodes (42): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AssignmentTree(), GroupBox(), AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList() (+34 more)

### Community 2 - "domain/format.js"
Cohesion: 0.10
Nodes (36): PLATFORM_CHANNELS, addConfiguredLine(), changeQty(), EMPTY_DISCOUNT, equalSplit(), missingRequiredGroup(), modifierSignature(), productModifiers() (+28 more)

### Community 3 - "cloud.service.js"
Cohesion: 0.13
Nodes (31): STORAGE, EMPTY_SNAPSHOT(), ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches() (+23 more)

### Community 4 - "useFeature"
Cohesion: 0.27
Nodes (20): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+12 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (51): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+43 more)

### Community 6 - "settings.js"
Cohesion: 0.11
Nodes (42): cleanStations(), taxUses(), thirdPartyList(), isDataImage(), storeImage(), audit(), addStandardSalesCategories(), copyDevicePrinters() (+34 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "invoice-share.test.js"
Cohesion: 0.11
Nodes (46): {
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
}, publicBase(), response(), uniqueToken(), {
  clean,
  headers,
  getDocument
} (+38 more)

### Community 9 - "createLogger"
Cohesion: 0.15
Nodes (22): log, MenuImport(), NUMBERS, log, MenuTab(), STALE_PRESET_CATEGORIES, catalogueNumber(), cell() (+14 more)

### Community 10 - "PosProvider.jsx"
Cohesion: 0.12
Nodes (22): AppearancePanel(), CustomerMessageModal(), setUploadFailureHandler(), birthdayMessage(), specialMessage(), DataContext, useDataRef(), useRepositories() (+14 more)

### Community 11 - "App.jsx"
Cohesion: 0.11
Nodes (32): Gate(), Loading(), Ready(), Root(), AssistMissing(), CloudBanner(), NavIcon(), PATHS (+24 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.24
Nodes (10): Data model, camelToSnake(), columnName(), decode(), defineModel(), defineTable(), pascal(), RESERVED (+2 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (31): auth(), POS app (browser), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString() (+23 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (17): PosStore, encode(), attachLines(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq(), nowIso() (+9 more)

### Community 17 - "guard"
Cohesion: 0.11
Nodes (30): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+22 more)

### Community 18 - "app.mjs"
Cohesion: 0.09
Nodes (45): ACTIONS, billsOf(), bindGuestFill(), business(), cancelDialog(), canSend(), detailDialog(), ensureGuest() (+37 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.05
Nodes (47): esc(), handler(), nodemailer, { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders (+39 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.17
Nodes (22): barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128(), sizedBarcode() (+14 more)

### Community 21 - "pos/inventory.js"
Cohesion: 0.35
Nodes (11): parseStockCountRows(), stockMovement(), applyStockChange(), movementRow(), activeLocationId(), adjustStock(), importStockCountFile(), log (+3 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (35): DEFAULT_SETTINGS, mergeRows(), pushSeating(), readPos(), base(), bucketOf(), BUCKETS, call() (+27 more)

### Community 23 - "pos.mjs"
Cohesion: 0.27
Nodes (14): layoutDialog(), layoutError(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf() (+6 more)

### Community 24 - "database.js"
Cohesion: 0.13
Nodes (17): log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses, ModifierGroup (+9 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (33): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+25 more)

### Community 27 - "menuAdmin.js"
Cohesion: 0.11
Nodes (31): PublishBar(), allowedCategoryKeys(), assignItems(), brief(), cleanMenu(), cleanSalesCategory(), draftChanges(), FIELD_LABELS (+23 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.12
Nodes (30): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+22 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.11
Nodes (12): CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef(), request() (+4 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 34 - "features.js"
Cohesion: 0.18
Nodes (17): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+9 more)

### Community 35 - "react"
Cohesion: 0.09
Nodes (42): FieldError(), Modal(), ModalBody(), productMargin(), productSizeGroup(), subcategoriesFor(), parseNumber(), productSizeItem() (+34 more)

### Community 36 - "pos/sales.js"
Cohesion: 0.11
Nodes (37): Delivered (slice 6): Taxes, cartTotals(), chargeableSubtotal(), discountAmount(), isChargeable(), serviceChargeAmount(), firstShortIngredient(), saleStockNeeds() (+29 more)

### Community 37 - "vitest"
Cohesion: 0.14
Nodes (21): makeCtx(), bind(), bindServices(), cash(), addProduct(), createHarness(), line(), noDiscount (+13 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (37): payCost(), activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day() (+29 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.10
Nodes (25): KdsGate(), getAppwriteCompat(), installGlobalClsBackend(), AppwriteAuthProvider, friendlyAuthError(), getAuthService(), log, accessAllowed() (+17 more)

### Community 43 - "pagePath"
Cohesion: 0.08
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "UsersPages.jsx"
Cohesion: 0.20
Nodes (21): FULL_SETTINGS_ROLES, ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError() (+13 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.13
Nodes (29): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, AdminApp(), fmtDate() (+21 more)

### Community 48 - "systemOptions.js"
Cohesion: 0.14
Nodes (27): SaveBar(), SettingsShell(), Ctx, SystemOptionsProvider(), useSystemOptionsDraft(), applyPatch(), autoClockOutDue(), defaultsFor() (+19 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.19
Nodes (31): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+23 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.08
Nodes (20): assert, keys, lib, rows, test, assert, keys, test (+12 more)

### Community 55 - "AppwriteException"
Cohesion: 0.14
Nodes (3): AppwriteException, Databases, Teams

### Community 56 - "salesSplit.test.js"
Cohesion: 0.16
Nodes (11): createDatabase(), combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef (+3 more)

### Community 57 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 58 - "pos/catalog.js"
Cohesion: 0.18
Nodes (21): categoryKey(), productCategories(), stalePresetCategory(), visibleProductCategories(), addCategory(), addCommonModifiers(), deleteCategory(), deleteModifier() (+13 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "esc"
Cohesion: 0.18
Nodes (32): bindTables(), cfg(), dateBar(), esc(), floorName(), floors(), go(), guestOf() (+24 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "kitchenPrinters.js"
Cohesion: 0.18
Nodes (18): kotEscPos(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket(), batch (+10 more)

### Community 63 - "Reports.jsx"
Cohesion: 0.25
Nodes (13): PATHS, PortalIcon(), ReportNav(), firstSub(), groupOf(), MANAGER_ONLY, PAYROLL_ROLES, subOf() (+5 more)

### Community 64 - "logic.mjs"
Cohesion: 0.13
Nodes (26): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, bookingsMap() (+18 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (40): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, react, react-dom (+32 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.08
Nodes (21): assert, compat, fs, path, test, assert, fs, page (+13 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "payable-webhook.cjs"
Cohesion: 0.24
Nodes (18): authCandidates(), clean(), crypto, firstValue(), { getAdmin }, handler(), header(), headers() (+10 more)

### Community 70 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 71 - "appwrite-files.js"
Cohesion: 0.06
Nodes (36): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+28 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "serviceWorker.test.js"
Cohesion: 0.12
Nodes (13): isHashed(), SHELL, store(), strategyFor(), 6. Services (abstractions), useServices(), ctx(), code (+5 more)

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
Cohesion: 0.18
Nodes (15): billingCycleFor(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount(), injectBillingCardStyle(), isProfilePaidRecord() (+7 more)

### Community 78 - "appwrite-sdk.js"
Cohesion: 0.11
Nodes (6): Functions, Graphql, Messaging, Permission, Query, Service

### Community 79 - "env.js"
Cohesion: 0.11
Nodes (18): CeyloAiKeyPanel(), PROVIDERS, env, isAppwrite(), log, aiKey(), askCeylo(), post() (+10 more)

### Community 80 - "panels.jsx"
Cohesion: 0.11
Nodes (36): how(), KitchenStations(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel(), LocationsPanel() (+28 more)

### Community 81 - "ViewRouter.jsx"
Cohesion: 0.15
Nodes (13): CUSTOMER_TYPES, customerStats(), cap(), Customers(), Customers, Inventory, Orders, Products (+5 more)

### Community 82 - "plans.js"
Cohesion: 0.15
Nodes (16): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), Switch() (+8 more)

### Community 83 - "health-check.mjs"
Cohesion: 0.13
Nodes (14): failures, files, generatedBinaryBundles, htmlFiles, ignoredDirectories, isModuleFile(), javascriptFiles, packageType() (+6 more)

### Community 84 - "pos-diagnostics.test.js"
Cohesion: 0.14
Nodes (9): assert, audits, auth, FakeDatabases, fs, path, rows, store (+1 more)

### Community 85 - "mountBillingWidget"
Cohesion: 0.18
Nodes (15): billingCycleFor(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount(), injectBillingCardStyle(), isProfilePaidRecord() (+7 more)

### Community 86 - "POS database and sync changes: team update"
Cohesion: 0.13
Nodes (14): 1. Summary, 2.1 Separate POS database, 2.2 Document storage format (netlify/lib/appwrite.js), 2.3 Function actions (netlify/functions/appwrite-docs.js), 2.4 Storage, 2.5 Sales history split (switched ON in production), 2.6 Guest Manager database (`gm` / `gm_documents`), 2. Database changes (+6 more)

### Community 87 - "Plan: move from Netlify + Appwrite Cloud to a VPS"
Cohesion: 0.17
Nodes (11): Open questions, Phase 0: decisions (needed before starting), Phase 1: server setup (no code changes), Phase 2: replace Netlify (small code change), Phase 3: move the data, Phase 4: cutover, Phase 5: running it, Plan: move from Netlify + Appwrite Cloud to a VPS (+3 more)

### Community 88 - "payable-create-checkout.cjs"
Cohesion: 0.23
Nodes (13): appendQuery(), clean(), findCheckoutUrl(), { getAdmin }, handler(), headers(), normalizePlan(), payableWebhookUrl() (+5 more)

### Community 89 - "ReportPage.jsx"
Cohesion: 0.19
Nodes (20): formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine(), REPORT_GROUPS (+12 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (35): AssistBar(), log, ORDER_CHANNELS, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES (+27 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "admin-app/main.jsx"
Cohesion: 0.21
Nodes (6): App(), ErrorBoundary, log, DialogModal(), UiProvider(), react-dom

### Community 94 - "usePos"
Cohesion: 0.37
Nodes (10): downloadCsv(), saleItemCount(), statusOf(), useScopedData(), usePos(), Receipts(), log, Sales() (+2 more)

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "account-danger-zone.js"
Cohesion: 0.23
Nodes (16): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean
}, log (+8 more)

### Community 98 - "documents.js"
Cohesion: 0.18
Nodes (19): esc(), receiptDate(), openKotWindow(), kotBody(), kotHtml(), padLeft(), padRight(), prepLines() (+11 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.08
Nodes (46): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+38 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 102 - "User guide"
Cohesion: 0.11
Nodes (17): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Menu Admin (Settings), Open orders & kitchen (restaurant / café), Printers by device (Settings > Device Manager), Products, categories, modifiers (+9 more)

### Community 103 - "thirdPartyPayments.js"
Cohesion: 0.30
Nodes (10): SPLIT_PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), reorder(), splitChoices() (+2 more)

### Community 104 - "constants.js"
Cohesion: 0.09
Nodes (37): NumberInput(), ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, DEFAULT_RECEIPT_FOOTER, PAYMENT_ICONS, PAYMENT_METHODS, STOCK_TYPES (+29 more)

### Community 105 - "EndOfDay.jsx"
Cohesion: 0.18
Nodes (30): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), dashboardData(), defaultRange() (+22 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "send-contact.js"
Cohesion: 0.29
Nodes (9): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+1 more)

### Community 109 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "useData"
Cohesion: 0.15
Nodes (21): Kpi(), batchStatus(), commissionRows(), customerName(), collectionOf, defaults, IndustryModals(), saverOf (+13 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 115 - "Architecture"
Cohesion: 0.20
Nodes (9): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack (+1 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "admin-store.js"
Cohesion: 0.16
Nodes (19): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+11 more)

### Community 118 - "Ceylo.jsx"
Cohesion: 0.11
Nodes (27): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+19 more)

### Community 119 - "link.js"
Cohesion: 0.20
Nodes (22): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+14 more)

### Community 120 - "send-invoice.js"
Cohesion: 0.14
Nodes (18): esc(), { guard, siteOrigin }, handler(), money(), nodemailer, { validEmail }, clean(), esc() (+10 more)

### Community 121 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "useUi"
Cohesion: 0.21
Nodes (15): ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), log, useBarcodeScanning(), BarcodeModalHost() (+7 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 128 - "bookingDialog"
Cohesion: 0.19
Nodes (20): bookingDialog(), dialog(), dlg(), saveSettings(), seatDialog(), setStatus(), toast(), waitDialog() (+12 more)

### Community 130 - "submit-ticket.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), headers(), nodemailer, { handler }, require

### Community 133 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "printing.js"
Cohesion: 0.17
Nodes (19): routeKitchenLines(), kitchenPrinterHook(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log, printReceipt() (+11 more)

### Community 136 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 137 - "tables/sales.js"
Cohesion: 0.33
Nodes (5): kitchenTickets, openOrders, saleLines, sales, voidOrders

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 141 - "KdsApp.jsx"
Cohesion: 0.25
Nodes (15): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, KDS_DESTINATION, kdsStatus(), kdsTickets(), NEXT (+7 more)

### Community 142 - "subscription.js"
Cohesion: 0.18
Nodes (20): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+12 more)

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 144 - "common.js"
Cohesion: 0.29
Nodes (11): CAPABILITIES, hasCapability(), typesWith(), commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS, RETIRED_MODIFIER_NAMES (+3 more)

### Community 145 - "BaseRepository"
Cohesion: 0.14
Nodes (4): 5. Data layer (WatermelonDB), BaseRepository, CashShiftRepository, ProductRepository

### Community 152 - "scanner.js"
Cohesion: 0.27
Nodes (7): findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), createEmitter()

### Community 153 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 154 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

### Community 155 - "POS variants (verticals)"
Cohesion: 0.40
Nodes (4): Add a new business type, Add a new module (for example vehicles and job cards for Automotive), POS variants (verticals), Rules

### Community 156 - "salesLog.js"
Cohesion: 0.33
Nodes (10): userName(), staffName(), day(), DELETED_ACTION, findApprover(), inLocation(), parseDeletedDetails(), refundRows() (+2 more)

### Community 157 - "taxes.js"
Cohesion: 0.26
Nodes (10): calculateTaxes(), cleanTax(), cleanTaxRules(), MAX_RATE, partsOf(), previewTax(), round2(), rulesOf() (+2 more)

### Community 158 - "nowIso"
Cohesion: 0.13
Nodes (33): T, TABLE_BY_NAME, isEmail(), nowIso(), phoneKey(), whatsappPhone(), addSubcategory(), saveModifier() (+25 more)

### Community 159 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 160 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 161 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 162 - "ceylo.js"
Cohesion: 0.29
Nodes (9): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, products (+1 more)

### Community 163 - "DevicePages.jsx"
Cohesion: 0.13
Nodes (33): asStation(), connection(), connectionLabel(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf() (+25 more)

### Community 165 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 166 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 167 - "bug-report-20260813-mobile.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 168 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 169 - "repositories/index.js"
Cohesion: 0.21
Nodes (5): categoryId(), CategoryRepository, createRepositories(), generic(), TimeEntryRepository

### Community 170 - "README.md"
Cohesion: 0.11
Nodes (12): How they were recorded, Product walkthroughs, Logging, Netlify functions (server), Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup, Ceylonry POS — Documentation (+4 more)

### Community 171 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 172 - "localAdmin.js"
Cohesion: 0.33
Nodes (7): sendAdminRequest(), DEV_ADMIN, getStore(), invoices(), localAdminApi(), localAdminSession, databaseNameFor()

### Community 173 - "payroll.test.js"
Cohesion: 0.23
Nodes (15): bucketHours(), entryHours(), key(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS, split() (+7 more)

### Community 174 - "business.js"
Cohesion: 0.33
Nodes (5): appMeta, locationAudit, locations, settings, supportAudit

### Community 175 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 176 - "tables/industry.js"
Cohesion: 0.33
Nodes (5): appointments, commissionPayments, medicineBatches, memberships, prescriptions

### Community 177 - "tables/catalog.js"
Cohesion: 0.40
Nodes (4): categories, modifierGroups, products, subcategories

### Community 178 - "Settings section: build status and plan"
Cohesion: 0.25
Nodes (7): Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Next slices, in the spec's order, Only settings that act today are listed (no dead switches), Register flow (changed with slice 2), Settings section: build status and plan

### Community 179 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 180 - "reportPdf.js"
Cohesion: 0.25
Nodes (6): buildReportPdf(), downloadReportPdf(), pdfSupportsText(), PLAIN, jspdf, jspdf-autotable

### Community 181 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 182 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 183 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 185 - "gm-routing.test.js"
Cohesion: 0.29
Nodes (6): assert, chain, fake, lib, Module, test

### Community 187 - "tables/inventory.js"
Cohesion: 0.50
Nodes (3): inventoryItems, stockMovements, stockTransfers

### Community 188 - "tables/staff.js"
Cohesion: 0.50
Nodes (3): cashShifts, timeEntries, users

## Knowledge Gaps
- **847 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+842 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1116 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `domain/format.js`, `appwriteCompat.test.js`, `cloud.service.js`, `createLogger`, `PosProvider.jsx`, `KdsApp.jsx`, `logger.js`, `subscription.js`, `common.js`, `labelPrinter.js`, `scanner.js`, `portal.test.js`, `menuAdmin.js`, `salesLog.js`, `features.js`, `DevicePages.jsx`, `ceylo.js`, `UsersPages.jsx`, `AdminApp.jsx`, `payroll.test.js`, `systemOptions.js`, `Tables.jsx`, `salesSplit.test.js`, `imageStorage.test.js`, `pos-react/package.json`, `serviceWorker.test.js`, `env.js`, `plans.js`, `ReportPage.jsx`, `assist.js`, `documents.js`, `diagnosticsShared.js`, `thirdPartyPayments.js`, `useData`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `opts()` connect `payroll.test.js` to `public/assets/platform.js`, `assets/platform.js`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `SystemOptionsPages.jsx`, `domain/format.js`, `useFeature`, `createLogger`, `PosProvider.jsx`, `App.jsx`, `KdsApp.jsx`, `subscription.js`, `menuAdmin.js`, `features.js`, `DevicePages.jsx`, `SessionProvider.jsx`, `localAdmin.js`, `UsersPages.jsx`, `AdminApp.jsx`, `systemOptions.js`, `Tables.jsx`, `Reports.jsx`, `pos-react/package.json`, `serviceWorker.test.js`, `env.js`, `panels.jsx`, `ViewRouter.jsx`, `plans.js`, `ReportPage.jsx`, `assist.js`, `admin-app/main.jsx`, `usePos`, `diagnosticsShared.js`, `constants.js`, `EndOfDay.jsx`, `useData`, `Ceylo.jsx`, `useUi`, `useInstall.js`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _847 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `security.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07777777777777778 - nodes in this community are weakly interconnected._
- **Should `domain/format.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1026827012025902 - nodes in this community are weakly interconnected._
- **Should `cloud.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1253968253968254 - nodes in this community are weakly interconnected._