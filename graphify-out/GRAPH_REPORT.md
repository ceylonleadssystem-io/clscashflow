# Graph Report - clscashflow  (2026-10-18)

## Corpus Check
- 359 files · ~1,149,771 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3261 nodes · 9096 edges · 174 communities (154 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 216 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59ec832e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- security.js
- PosProvider.jsx
- Reports.jsx
- KdsApp.jsx
- repositories/index.js
- appwrite.js
- diagnosticsShared.js
- __awaiter
- invoice-share.test.js
- domain/format.js
- useData
- react
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- settings.js
- app.mjs
- appwriteAdmin
- labelPrinter.js
- nowIso
- store.mjs
- pos.mjs
- database.js
- cloud.service.js
- pos-routing.test.js
- esc
- pos/sales.js
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- FeaturesTab.jsx
- CloudSyncService
- cart.js
- harness.js
- invoiceEscape
- nodemailer
- pos-admin-login.js
- invoiceEscape
- SessionProvider.jsx
- pagePath
- admin-data.cjs
- submit-subscription-receipt.js
- AdminApp.jsx
- adminApi.js
- admin.test.js
- clean
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
- getAdmin
- ref_node_module
- admin-store.js
- subscription.js
- logic.mjs
- pos-react/package.json
- boot
- ref_node_fs
- getAuthUser
- payable-webhook.cjs
- diagnostics-store.js
- package.json
- Client
- account-danger-zone.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- MenuTab.jsx
- panels.jsx
- auth.service.js
- pos/inventory.js
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- reportPdf.js
- payable-create-checkout.cjs
- appwrite-files.js
- security-endpoints.test.js
- usePos
- printing.js
- labelPrinter
- diagnostics.service.js
- planFromPath
- planFromPath
- receiptPrinter.js
- Ceylonry POS — React + WatermelonDB
- domain.test.js
- Root test-suite audit (169 failing tests)
- README.md
- User guide
- salesLog.js
- receiptPrinter
- barcodeScanner
- account-purge.test.js
- Administrator guide
- SaleRepository
- localPrintPreview.js
- kds-pair.test.js
- Locale
- createLogger
- track-visit.cjs
- send-contact.js
- Architecture
- documents.js
- guard
- growth-partner-commissions.test.js
- pos-reported-bugs.test.js
- dependencies
- public/sw.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- useInstall.js
- serviceWorker.test.js
- pos-diagnostics.js
- bug-report-20260811-email-modal-template.test.js
- bug-report-20260812.test.js
- tests/catalog.test.js
- priority-support-chat.test.js
- qa-responsive-flow.test.js
- quote-email-ui.test.js
- Project structure
- devDependencies
- Deployment & operations
- Development guide
- scripts
- tolerant-match.cjs
- IMPORTANT: This is NOT a rebuild of the POS system.
- Functions
- node-appwrite
- EmailJS order e-mail template
- Netlify Story Form Email Setup
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- admin-signin.js
- admin-app/main.jsx
- net.js
- 5. Data layer (WatermelonDB)
- link.js
- hardware-order.js
- BaseRepository
- imageTools.js
- submit-ticket.cjs
- track-visit.js
- SubscriptionManagement.jsx
- SettingsRepository
- submit-ticket.js
- localAdmin.js
- onboarding-terms-acceptance.test.js
- catalogExport.test.js
- bug-report-20260813-mobile.test.js
- CategoryRepository
- vite.config.js
- 7. Administration portal (separate login)
- Test plan

## God Nodes (most connected - your core abstractions)
1. `useData()` - 106 edges
2. `usePos()` - 106 edges
3. `__awaiter()` - 93 edges
4. `react` - 86 edges
5. `AppwriteException` - 74 edges
6. `money()` - 65 edges
7. `useFeature()` - 61 edges
8. `Modal()` - 52 edges
9. `ModalBody()` - 50 edges
10. `Account` - 49 edges

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

## Communities (174 total, 20 thin omitted)

### Community 0 - "security.js"
Cohesion: 0.25
Nodes (12): esc(), { guard, siteOrigin }, handler(), nodemailer, { validEmail, trustedLink }, allowedOrigins(), buckets, corsHeaders() (+4 more)

### Community 1 - "PosProvider.jsx"
Cohesion: 0.08
Nodes (34): NavIcon(), PATHS, Sidebar(), AppearancePanel(), planForSettings(), BUSINESS_TYPE_OPTIONS, INDUSTRY_TYPES, KITCHEN_TYPES (+26 more)

### Community 2 - "Reports.jsx"
Cohesion: 0.07
Nodes (57): Kpi(), closedShiftsInRange(), customerInsights(), customerReport(), dashboardData(), defaultRange(), digits(), feedbackDue() (+49 more)

### Community 3 - "KdsApp.jsx"
Cohesion: 0.25
Nodes (16): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, KDS_DESTINATION, kdsStatus(), kdsTickets(), NEXT (+8 more)

### Community 4 - "repositories/index.js"
Cohesion: 0.14
Nodes (7): createRepositories(), generic(), InventoryRepository, OpenOrderRepository, StockMovementRepository, TimeEntryRepository, UserRepository

### Community 5 - "appwrite.js"
Cohesion: 0.16
Nodes (33): deleteWorkspace(), chunkId(), chunkPath(), { Client, Account, Databases, Users, Query, ID }, collection(), crypto, databases(), deleteDocument() (+25 more)

### Community 6 - "diagnosticsShared.js"
Cohesion: 0.13
Nodes (25): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+17 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "invoice-share.test.js"
Cohesion: 0.11
Nodes (45): {
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
} (+37 more)

### Community 9 - "domain/format.js"
Cohesion: 0.23
Nodes (22): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+14 more)

### Community 10 - "useData"
Cohesion: 0.10
Nodes (45): Modal(), ModalBody(), NumberInput(), groupedValue(), parseNumber(), locationStock(), stockStatus(), currentCashShift() (+37 more)

### Community 11 - "react"
Cohesion: 0.09
Nodes (44): Gate(), Loading(), Ready(), Root(), CloudBanner(), IosInstallGuide(), Shell(), SyncIndicator() (+36 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (34): camelToSnake(), columnName(), decode(), defineModel(), defineTable(), pascal(), RESERVED, appMeta (+26 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (31): auth(), POS app (browser), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString() (+23 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (37): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+29 more)

### Community 16 - "PosStore.js"
Cohesion: 0.14
Nodes (18): PosStore, encode(), attachLines(), EMPTY_SNAPSHOT(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq() (+10 more)

### Community 17 - "settings.js"
Cohesion: 0.19
Nodes (19): isAppwrite(), commonModifierPresets(), isDataImage(), storeImage(), addCommonModifiers(), supportAuditEntry(), applyPosSetup(), dismissPosSetup() (+11 more)

### Community 18 - "app.mjs"
Cohesion: 0.09
Nodes (48): ACTIONS, billsOf(), bindGuestFill(), bookingDialog(), business(), cancelDialog(), canSend(), detailDialog() (+40 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.13
Nodes (19): getAdmin(), { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean() (+11 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.19
Nodes (18): CODE128, code128Units(), code128Values(), CODE39, drawCode128(), alignmentAdjust(), DEFAULT_LABEL_STOCK, drawAlignmentLabel() (+10 more)

### Community 21 - "nowIso"
Cohesion: 0.14
Nodes (34): T, TABLE_BY_NAME, isEmail(), nowIso(), phoneKey(), whatsappPhone(), activeTimeEntry(), audit() (+26 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (42): go(), refreshPos(), viewMessages(), addDays(), dateStr(), DEFAULT_SETTINGS, mergeRows(), monthOf() (+34 more)

### Community 23 - "pos.mjs"
Cohesion: 0.13
Nodes (23): layoutDialog(), queueSeating(), syncGuests(), layoutError(), ownLayout(), effectiveLocation(), emptyPos, floorKey() (+15 more)

### Community 24 - "database.js"
Cohesion: 0.09
Nodes (21): createDatabase(), log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses (+13 more)

### Community 25 - "cloud.service.js"
Cohesion: 0.13
Nodes (29): STORAGE, ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted() (+21 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.08
Nodes (23): hash, { hashPassword, verifyPassword }, { Client, Databases, Query }, FIELDS, lib, listPosRows(), migrate(), pick() (+15 more)

### Community 27 - "esc"
Cohesion: 0.19
Nodes (27): bindTables(), cfg(), dateBar(), esc(), floorName(), floors(), guestRows(), lockedView() (+19 more)

### Community 28 - "pos/sales.js"
Cohesion: 0.16
Nodes (24): DEFAULT_RECEIPT_FOOTER, firstShortIngredient(), saleStockNeeds(), formatOrderNumber(), isSequential(), mergeOrders(), migrateOrderNumbers(), nextSequence() (+16 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.12
Nodes (30): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+22 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.12
Nodes (12): CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef(), request() (+4 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 34 - "FeaturesTab.jsx"
Cohesion: 0.19
Nodes (17): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+9 more)

### Community 35 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 36 - "cart.js"
Cohesion: 0.33
Nodes (10): addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature(), selectionExtra() (+2 more)

### Community 37 - "harness.js"
Cohesion: 0.18
Nodes (15): makeCtx(), cash(), form(), addProduct(), createHarness(), line(), noDiscount, openShift() (+7 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "nodemailer"
Cohesion: 0.11
Nodes (22): esc(), handler(), nodemailer, esc(), { guard, siteOrigin }, handler(), money(), nodemailer (+14 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (21): handler(), { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url() (+13 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.17
Nodes (19): accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages(), loadPlatformScript(), log, openBankTransfer() (+11 more)

### Community 43 - "pagePath"
Cohesion: 0.10
Nodes (21): assert, fs, { pagePath }, path, read(), root, test, assert (+13 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.22
Nodes (20): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), AdminApp(), fmtDate(), log (+12 more)

### Community 47 - "adminApi.js"
Cohesion: 0.23
Nodes (9): log, adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText(), useAdminFeedback() (+1 more)

### Community 48 - "admin.test.js"
Cohesion: 0.15
Nodes (16): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), Switch() (+8 more)

### Community 49 - "clean"
Cohesion: 0.18
Nodes (23): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+15 more)

### Community 50 - "LocalAuthProvider"
Cohesion: 0.13
Nodes (8): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal, LocalAuthProvider, passwordHash()

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.24
Nodes (26): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+18 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.10
Nodes (15): { appsUsed }, assert, test, assert, fn, test, assert, chain (+7 more)

### Community 55 - "AppwriteException"
Cohesion: 0.14
Nodes (3): AppwriteException, Databases, Teams

### Community 56 - "salesSplit.test.js"
Cohesion: 0.18
Nodes (9): combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef, ctxFor() (+1 more)

### Community 57 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 58 - "pos/catalog.js"
Cohesion: 0.19
Nodes (19): categoryKey(), productCategories(), addCategory(), addSubcategory(), deleteCategory(), deleteModifier(), deleteProduct(), deleteSubcategory() (+11 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "admin-store.js"
Cohesion: 0.16
Nodes (19): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+11 more)

### Community 63 - "subscription.js"
Cohesion: 0.29
Nodes (11): limit(), SubscriptionTab(), activeCount(), limitOrNull(), locationLimitError(), normalizeSubscription(), standardSubscription(), subscriptionOf() (+3 more)

### Community 64 - "logic.mjs"
Cohesion: 0.13
Nodes (31): setStatus(), esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE (+23 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.14
Nodes (13): description, engines, node, appwrite, name, private, type, version (+5 more)

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

### Community 71 - "package.json"
Cohesion: 0.10
Nodes (20): dependencies, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description, engines (+12 more)

### Community 73 - "account-danger-zone.js"
Cohesion: 0.21
Nodes (16): crypto, deleteAuthUser(), deleteOperationalData(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean
}, log, normalizeAction() (+8 more)

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
Cohesion: 0.12
Nodes (6): Graphql, ID, Messaging, Permission, Query, Service

### Community 79 - "MenuTab.jsx"
Cohesion: 0.36
Nodes (8): log, MenuTab(), menuFileName(), csvEscape(), downloadBlob(), downloadCsv(), toCsv(), loadXlsx()

### Community 80 - "panels.jsx"
Cohesion: 0.08
Nodes (51): BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel(), LocationsPanel(), PlanSupportPanel(), PosTypePanel() (+43 more)

### Community 81 - "auth.service.js"
Cohesion: 0.18
Nodes (7): KdsGate(), getAppwriteCompat(), installGlobalClsBackend(), AppwriteAuthProvider, friendlyAuthError(), getAuthService(), log

### Community 82 - "pos/inventory.js"
Cohesion: 0.32
Nodes (12): parseStockCountRows(), adjustmentChange(), stockMovement(), applyStockChange(), movementRow(), activeLocationId(), adjustStock(), importStockCountFile() (+4 more)

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

### Community 87 - "reportPdf.js"
Cohesion: 0.29
Nodes (5): buildReportPdf(), downloadReportPdf(), PLAIN, jspdf, jspdf-autotable

### Community 88 - "payable-create-checkout.cjs"
Cohesion: 0.23
Nodes (13): appendQuery(), clean(), findCheckoutUrl(), { getAdmin }, handler(), headers(), normalizePlan(), payableWebhookUrl() (+5 more)

### Community 89 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "usePos"
Cohesion: 0.13
Nodes (32): ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), STALE_PRESET_CATEGORIES, catalogueNumber(), cell() (+24 more)

### Community 92 - "printing.js"
Cohesion: 0.18
Nodes (16): kitchenPrinterHook(), bind(), bindServices(), docCtx(), downloadReceipt(), kitchenDestination(), locationFor(), log (+8 more)

### Community 94 - "diagnostics.service.js"
Cohesion: 0.13
Nodes (21): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+13 more)

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "receiptPrinter.js"
Cohesion: 0.20
Nodes (11): sizeSlug(), log, findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants() (+3 more)

### Community 98 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.25
Nodes (8): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB, Deliberate differences from the original

### Community 99 - "domain.test.js"
Cohesion: 0.19
Nodes (18): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), hasSizedStock(), isService(), lineSize(), productSizeItem() (+10 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "README.md"
Cohesion: 0.19
Nodes (5): How they were recorded, Product walkthroughs, Logging, Netlify functions (server), Ceylonry POS — Documentation

### Community 102 - "User guide"
Cohesion: 0.15
Nodes (12): Checkout, Customers & loyalty, Inventory & stock, Open orders & kitchen (restaurant / café), Products, categories, modifiers, Reports, Roles, Sales, refunds and voids (+4 more)

### Community 103 - "salesLog.js"
Cohesion: 0.28
Nodes (11): APPROVER_ROLES, day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails(), refundRows() (+3 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.26
Nodes (9): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), realDeps(), assert, { createPurger, kindOf, imageIdsOf } (+1 more)

### Community 107 - "Administrator guide"
Cohesion: 0.18
Nodes (11): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Invoices, Known gaps, Related Netlify configuration, Signing in (+3 more)

### Community 109 - "localPrintPreview.js"
Cohesion: 0.44
Nodes (7): batch, localPrintPreview(), showLabelPreview(), showPrintPreview(), tsplBytesToDataUrl(), printHtmlInFrame(), printHtmlInWindow()

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "createLogger"
Cohesion: 0.14
Nodes (13): env, log, authHeaders(), call(), log, endSupportSession(), log, SUPPORT_USER (+5 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 115 - "Architecture"
Cohesion: 0.18
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 116 - "documents.js"
Cohesion: 0.19
Nodes (17): esc(), receiptDate(), openKotWindow(), kotHtml(), padLeft(), padRight(), receiptHtml(), receiptLayout() (+9 more)

### Community 117 - "guard"
Cohesion: 0.14
Nodes (18): corsHeaders, { guard, siteOrigin }, handler(), json(), { guard, reply }, handler(), log, store (+10 more)

### Community 118 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 119 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 120 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, react, react-dom (+1 more)

### Community 121 - "public/sw.js"
Cohesion: 0.25
Nodes (7): isHashed(), SHELL, store(), strategyFor(), 6. Services (abstractions), useServices(), res()

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 126 - "serviceWorker.test.js"
Cohesion: 0.29
Nodes (5): code, handlers, pick(), req(), worker

### Community 127 - "pos-diagnostics.js"
Cohesion: 0.14
Nodes (9): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), log, store, { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response() (+1 more)

### Community 128 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 129 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 130 - "tests/catalog.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 131 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 132 - "qa-responsive-flow.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 133 - "quote-email-ui.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 134 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 135 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/plugin-proposal-decorators, @babel/plugin-transform-class-properties, fake-indexeddb, vite, @vitejs/plugin-react, vitest

### Community 136 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 137 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 138 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint:syntax, preview, test

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 142 - "node-appwrite"
Cohesion: 0.29
Nodes (3): node-appwrite, db, db

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 145 - "Netlify Story Form Email Setup"
Cohesion: 0.50
Nodes (3): Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup

### Community 153 - "admin-signin.js"
Cohesion: 0.19
Nodes (13): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+5 more)

### Community 154 - "admin-app/main.jsx"
Cohesion: 0.21
Nodes (6): App(), ErrorBoundary, log, DialogModal(), UiProvider(), react-dom

### Community 155 - "net.js"
Cohesion: 0.36
Nodes (11): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), run() (+3 more)

### Community 156 - "5. Data layer (WatermelonDB)"
Cohesion: 0.17
Nodes (4): 5. Data layer (WatermelonDB), CashShiftRepository, CustomerRepository, ProductRepository

### Community 157 - "link.js"
Cohesion: 0.30
Nodes (10): answer(), attach(), closeLink(), flush(), kdsLink, listeners, outbox(), sendRaw() (+2 more)

### Community 158 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 160 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 161 - "submit-ticket.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), headers(), nodemailer, { handler }, require

### Community 162 - "track-visit.js"
Cohesion: 0.31
Nodes (8): { appwriteAdmin }, clean(), getAdmin(), { guard, siteOrigin }, headers(), isLandingPath(), handler(), log

### Community 163 - "SubscriptionManagement.jsx"
Cohesion: 0.40
Nodes (8): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), STANDARD_LIMITS

### Community 165 - "submit-ticket.js"
Cohesion: 0.33
Nodes (8): { appwriteAdmin }, clean(), esc(), getAdmin(), { guard, siteOrigin }, headers(), handler(), nodemailer

### Community 166 - "localAdmin.js"
Cohesion: 0.33
Nodes (7): sendAdminRequest(), DEV_ADMIN, getStore(), invoices(), localAdminApi(), localAdminSession, databaseNameFor()

### Community 167 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 168 - "catalogExport.test.js"
Cohesion: 0.43
Nodes (6): CATALOGUE_HEADERS, catalogueExportMatrix(), exportStock(), plain(), inventory, products

### Community 169 - "bug-report-20260813-mobile.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 171 - "vite.config.js"
Cohesion: 0.47
Nodes (5): adminRoute(), configurePreviewServer(), configureServer(), vite, @vitejs/plugin-react

### Community 172 - "7. Administration portal (separate login)"
Cohesion: 0.40
Nodes (5): 7. Administration portal (separate login), Image storage, Inventory behaviour, Order e-mail, Sync cost

### Community 173 - "Test plan"
Cohesion: 0.50
Nodes (4): Automated coverage, Harness, Manual checklist (not automated), Test plan

## Knowledge Gaps
- **699 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+694 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 933 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PosProvider.jsx`, `Reports.jsx`, `KdsApp.jsx`, `diagnosticsShared.js`, `domain/format.js`, `useData`, `admin-app/main.jsx`, `FeaturesTab.jsx`, `SubscriptionManagement.jsx`, `localAdmin.js`, `SessionProvider.jsx`, `AdminApp.jsx`, `adminApi.js`, `admin.test.js`, `Tables.jsx`, `subscription.js`, `pos-react/package.json`, `MenuTab.jsx`, `panels.jsx`, `auth.service.js`, `usePos`, `useInstall.js`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `line()` connect `harness.js` to `public/assets/platform.js`, `assets/platform.js`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `5. Data layer (WatermelonDB)` connect `5. Data layer (WatermelonDB)` to `PosProvider.jsx`, `Ceylonry POS — React + WatermelonDB`, `assets/catalog.js`, `defineTable.js`, `PosStore.js`, `store.mjs`, `BaseRepository`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _699 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PosProvider.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08325624421831637 - nodes in this community are weakly interconnected._
- **Should `Reports.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0716297786720322 - nodes in this community are weakly interconnected._
- **Should `repositories/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._