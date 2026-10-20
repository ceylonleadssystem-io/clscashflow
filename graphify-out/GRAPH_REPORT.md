# Graph Report - clscashflow  (2026-10-20)

## Corpus Check
- 368 files · ~1,167,791 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3314 nodes · 9252 edges · 162 communities (144 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 217 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `572e2df6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- guard
- PosProvider.jsx
- useData
- react
- BaseRepository
- appwrite.js
- diagnosticsShared.js
- __awaiter
- invoice-share.test.js
- money
- index.jsx
- Ceylo.jsx
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
- constants.js
- pos-routing.test.js
- detailDialog
- labelPrinter
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- features.js
- CloudSyncService
- pos/sales.js
- vitest
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
- plans.js
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
- Reports.jsx
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- usePos
- panels.jsx
- auth.service.js
- link.js
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- Plan: move from Netlify + Appwrite Cloud to a VPS
- payable-create-checkout.cjs
- appwrite-files.js
- security-endpoints.test.js
- KdsApp.jsx
- printing.js
- diagnostics.service.js
- PosStore
- planFromPath
- planFromPath
- account-danger-zone.js
- payload.js
- domain/inventory.js
- Root test-suite audit (169 failing tests)
- README.md
- User guide
- salesLog.js
- localAdmin.js
- AppwriteAuthProvider
- account-purge.test.js
- Administrator guide
- SaleRepository
- public/sw.js
- kds-pair.test.js
- Locale
- env.js
- track-visit.cjs
- send-contact.js
- Architecture
- documents.js
- send-story-submission.js
- growth-partner-commissions.test.js
- pos-reported-bugs.test.js
- serviceWorker.test.js
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- useInstall.js
- POS administration portal
- ceylo-ask.js
- bug-report-20260811-email-modal-template.test.js
- bug-report-20260812.test.js
- tests/catalog.test.js
- priority-support-chat.test.js
- qa-responsive-flow.test.js
- quote-email-ui.test.js
- Project structure
- dependencies
- Deployment & operations
- Development guide
- CategoryRepository
- tolerant-match.cjs
- IMPORTANT: This is NOT a rebuild of the POS system.
- Functions
- node-appwrite
- EmailJS order e-mail template
- 4. Run it locally for testing
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- admin-signin.js
- admin-app/main.jsx
- hardware-order.js
- submit-ticket.cjs
- track-visit.js
- submit-ticket.js
- onboarding-terms-acceptance.test.js
- domain/format.js
- bug-report-20260813-mobile.test.js
- Test plan

## God Nodes (most connected - your core abstractions)
1. `usePos()` - 109 edges
2. `useData()` - 108 edges
3. `__awaiter()` - 93 edges
4. `react` - 87 edges
5. `AppwriteException` - 74 edges
6. `money()` - 65 edges
7. `useFeature()` - 63 edges
8. `Modal()` - 52 edges
9. `ModalBody()` - 50 edges
10. `Account` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Where data lives (Appwrite project `6a947d6e0012c551dfde`, Singapore)` --references--> `storeFor()`  [INFERRED]
  README.md → netlify/lib/appwrite.js
- `Troubleshooting` --references--> `queryDocuments()`  [INFERRED]
  pos-react/docs/deployment.md → netlify/lib/appwrite.js
- `Changing or removing an administrator` --references--> `passwordHash()`  [INFERRED]
  docs/setup/pos-admin-portal.md → pos-react/src/services/auth.service.js
- `One-time setup` --references--> `passwordHash()`  [INFERRED]
  docs/setup/pos-admin-portal.md → pos-react/src/services/auth.service.js
- `5. Data layer (WatermelonDB)` --references--> `categories()`  [INFERRED]
  pos-react/README.md → assets/catalog.js

## Import Cycles
- None detected.

## Communities (162 total, 18 thin omitted)

### Community 0 - "guard"
Cohesion: 0.09
Nodes (34): corsHeaders, { guard, siteOrigin }, handler(), json(), { appwriteAdmin }, { guard, siteOrigin }, handler(), reply() (+26 more)

### Community 1 - "PosProvider.jsx"
Cohesion: 0.07
Nodes (38): NavIcon(), PATHS, Sidebar(), UI_THEMES, planForSettings(), BUSINESS_TYPE_OPTIONS, INDUSTRY_TYPES, KITCHEN_TYPES (+30 more)

### Community 2 - "useData"
Cohesion: 0.14
Nodes (23): customerName(), saleItemCount(), useDeferredLocationOpen(), useScopedData(), SaleActionModal(), useData(), BranchStatus(), Dashboard() (+15 more)

### Community 3 - "react"
Cohesion: 0.10
Nodes (34): Gate(), Loading(), Ready(), Root(), CloudBanner(), Shell(), equalSplit(), missingRequiredGroup() (+26 more)

### Community 4 - "BaseRepository"
Cohesion: 0.07
Nodes (14): 5. Data layer (WatermelonDB), BaseRepository, CashShiftRepository, createRepositories(), CustomerRepository, generic(), InventoryRepository, MetaRepository (+6 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (44): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+36 more)

### Community 6 - "diagnosticsShared.js"
Cohesion: 0.11
Nodes (29): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+21 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "invoice-share.test.js"
Cohesion: 0.14
Nodes (35): {
  clean,
  headers,
  getDocument
}, handler(), {
  isValidPublicToken,
  publicTokenCandidates,
  sanitizePublicInvoice,
  sanitizePublicSnapshot,
  canUseMappedSource
}, permitted(), requests, resolvePublicShare(), response(), bounded() (+27 more)

### Community 9 - "money"
Cohesion: 0.15
Nodes (34): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+26 more)

### Community 10 - "index.jsx"
Cohesion: 0.15
Nodes (25): Modal(), ModalBody(), NumberInput(), locationStock(), stockStatus(), userName(), blank(), BranchStockModal() (+17 more)

### Community 11 - "Ceylo.jsx"
Cohesion: 0.16
Nodes (21): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), SUGGESTIONS (+13 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (33): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+25 more)

### Community 14 - "logger.js"
Cohesion: 0.12
Nodes (29): capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS, interactiveTarget() (+21 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.18
Nodes (15): decode(), encode(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq(), nowIso(), canonical() (+7 more)

### Community 17 - "settings.js"
Cohesion: 0.11
Nodes (30): SUPPORT_CODE_TTL_MS, isAppwrite(), authHeaders(), call(), isDataImage(), log, storeImage(), dismissPosSetup() (+22 more)

### Community 18 - "app.mjs"
Cohesion: 0.10
Nodes (66): ACTIONS, bindGuestFill(), bindTables(), bookingDialog(), business(), cancelDialog(), canSend(), cfg() (+58 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.22
Nodes (12): { appwriteAdmin }, clean(), esc(), handler(), log, nodemailer, reply(), { appwriteAdmin } (+4 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.10
Nodes (42): ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), productSizeGroup(), log, useBarcodeScanning() (+34 more)

### Community 21 - "nowIso"
Cohesion: 0.10
Nodes (48): T, TABLE_BY_NAME, parseStockCountRows(), nowIso(), adjustmentChange(), stockMovement(), activeTimeEntry(), currentCashShift() (+40 more)

### Community 22 - "store.mjs"
Cohesion: 0.10
Nodes (43): Styling, Build, go(), refreshPos(), viewMessages(), addDays(), dateStr(), DEFAULT_SETTINGS (+35 more)

### Community 23 - "pos.mjs"
Cohesion: 0.18
Nodes (19): layoutDialog(), queueSeating(), syncGuests(), ownLayout(), seatingMap(), effectiveLocation(), emptyPos, floorKey() (+11 more)

### Community 24 - "database.js"
Cohesion: 0.12
Nodes (19): createDatabase(), log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses (+11 more)

### Community 25 - "constants.js"
Cohesion: 0.12
Nodes (26): ADJUST_REASONS, DEFAULT_OWNER_PIN, PAYMENT_ICONS, PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, STOCK_TYPES, STOCK_UNITS, STORAGE (+18 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.08
Nodes (23): hash, { hashPassword, verifyPassword }, { Client, Databases, Query }, FIELDS, lib, listPosRows(), migrate(), pick() (+15 more)

### Community 27 - "detailDialog"
Cohesion: 0.25
Nodes (11): billsOf(), detailDialog(), guestOf(), guestSpend(), nums(), revenueOf(), statsOf(), billsFor() (+3 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (11): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+3 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.10
Nodes (34): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+26 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.09
Nodes (16): auth(), CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef() (+8 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 34 - "features.js"
Cohesion: 0.17
Nodes (16): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+8 more)

### Community 35 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 36 - "pos/sales.js"
Cohesion: 0.08
Nodes (53): PLATFORM_CHANNELS, addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature() (+45 more)

### Community 37 - "vitest"
Cohesion: 0.17
Nodes (16): makeCtx(), bind(), bindServices(), cash(), form(), addProduct(), createHarness(), line() (+8 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "nodemailer"
Cohesion: 0.11
Nodes (22): esc(), handler(), nodemailer, esc(), { guard, siteOrigin }, handler(), money(), nodemailer (+14 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.14
Nodes (24): databaseNameFor(), isEmbedded(), plural(), runSetupChecks(), WEAK_PINS, APPROVER_ROLES, accessAllowed(), billingWarning() (+16 more)

### Community 43 - "pagePath"
Cohesion: 0.10
Nodes (21): assert, fs, { pagePath }, path, read(), root, test, assert (+13 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "submit-subscription-receipt.js"
Cohesion: 0.18
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.18
Nodes (20): Admin portal, AccessTab(), AccountDetail(), TABS, AdminApp(), fmtDate(), log, AdminLogin() (+12 more)

### Community 47 - "adminApi.js"
Cohesion: 0.21
Nodes (11): adminApi(), log, sendAdminRequest(), adminFeedback, listeners, READ_ACTIONS, state, subscribe() (+3 more)

### Community 48 - "plans.js"
Cohesion: 0.18
Nodes (14): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), ADDITIONAL_FEATURES (+6 more)

### Community 49 - "clean"
Cohesion: 0.19
Nodes (22): {
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
}, publicBase(), response() (+14 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.24
Nodes (26): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+18 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.10
Nodes (15): assert, fn, test, assert, { _contextText }, test, assert, chain (+7 more)

### Community 55 - "AppwriteException"
Cohesion: 0.14
Nodes (3): AppwriteException, Databases, Teams

### Community 56 - "salesSplit.test.js"
Cohesion: 0.18
Nodes (9): combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef, ctxFor() (+1 more)

### Community 57 - "render"
Cohesion: 0.12
Nodes (24): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+16 more)

### Community 58 - "pos/catalog.js"
Cohesion: 0.18
Nodes (20): commonModifierPresets(), categoryKey(), productCategories(), addCategory(), addCommonModifiers(), deleteCategory(), deleteModifier(), deleteProduct() (+12 more)

### Community 59 - "boot"
Cohesion: 0.14
Nodes (18): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+10 more)

### Community 60 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "admin-store.js"
Cohesion: 0.16
Nodes (18): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+10 more)

### Community 63 - "subscription.js"
Cohesion: 0.20
Nodes (17): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+9 more)

### Community 64 - "logic.mjs"
Cohesion: 0.11
Nodes (33): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+25 more)

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
Cohesion: 0.20
Nodes (17): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+9 more)

### Community 69 - "payable-webhook.cjs"
Cohesion: 0.24
Nodes (18): authCandidates(), clean(), crypto, firstValue(), { getAdmin }, handler(), header(), headers() (+10 more)

### Community 70 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 71 - "package.json"
Cohesion: 0.12
Nodes (15): description, engines, node, appwrite, name, private, scripts, audit:prod (+7 more)

### Community 73 - "Reports.jsx"
Cohesion: 0.21
Nodes (24): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+16 more)

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

### Community 79 - "usePos"
Cohesion: 0.14
Nodes (23): Kpi(), apply(), DEFAULTS, FONT_SIZES, FONT_WEIGHTS, key(), read(), useApplyDisplayPrefs() (+15 more)

### Community 80 - "panels.jsx"
Cohesion: 0.13
Nodes (36): AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel(), LocationsPanel(), PlanSupportPanel() (+28 more)

### Community 81 - "auth.service.js"
Cohesion: 0.16
Nodes (7): KdsGate(), getAppwriteCompat(), installGlobalClsBackend(), log, friendlyAuthError(), getAuthService(), log

### Community 82 - "link.js"
Cohesion: 0.18
Nodes (21): answer(), attach(), closeLink(), flush(), kdsLink, listeners, outbox(), sendRaw() (+13 more)

### Community 83 - "health-check.mjs"
Cohesion: 0.13
Nodes (14): failures, files, generatedBinaryBundles, htmlFiles, ignoredDirectories, isModuleFile(), javascriptFiles, packageType() (+6 more)

### Community 84 - "pos-diagnostics.test.js"
Cohesion: 0.14
Nodes (9): assert, audits, auth, FakeDatabases, fs, path, rows, store (+1 more)

### Community 85 - "mountBillingWidget"
Cohesion: 0.15
Nodes (17): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+9 more)

### Community 86 - "POS database and sync changes: team update"
Cohesion: 0.13
Nodes (14): 1. Summary, 2.1 Separate POS database, 2.2 Document storage format (netlify/lib/appwrite.js), 2.3 Function actions (netlify/functions/appwrite-docs.js), 2.4 Storage, 2.5 Sales history split (switched ON in production), 2.6 Guest Manager database (`gm` / `gm_documents`), 2. Database changes (+6 more)

### Community 87 - "Plan: move from Netlify + Appwrite Cloud to a VPS"
Cohesion: 0.17
Nodes (11): Open questions, Phase 0: decisions (needed before starting), Phase 1: server setup (no code changes), Phase 2: replace Netlify (small code change), Phase 3: move the data, Phase 4: cutover, Phase 5: running it, Plan: move from Netlify + Appwrite Cloud to a VPS (+3 more)

### Community 88 - "payable-create-checkout.cjs"
Cohesion: 0.23
Nodes (13): appendQuery(), clean(), findCheckoutUrl(), { getAdmin }, handler(), headers(), normalizePlan(), payableWebhookUrl() (+5 more)

### Community 89 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "KdsApp.jsx"
Cohesion: 0.24
Nodes (16): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, KDS_DESTINATION, kdsStatus(), kdsTickets(), NEXT (+8 more)

### Community 92 - "printing.js"
Cohesion: 0.10
Nodes (26): kitchenPrinterHook(), docCtx(), downloadReceipt(), kitchenDestination(), locationFor(), log, openKotWindow(), printReceipt() (+18 more)

### Community 93 - "diagnostics.service.js"
Cohesion: 0.17
Nodes (17): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+9 more)

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

### Community 98 - "payload.js"
Cohesion: 0.22
Nodes (14): EMPTY_SNAPSHOT(), DELETED_KEYS, itemTime(), keyOf(), mergeInventoryList(), mergeList(), mergePayload(), payloadCovers() (+6 more)

### Community 99 - "domain/inventory.js"
Cohesion: 0.29
Nodes (12): changeQty(), ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), hasSizedStock(), isService(), lineSize() (+4 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "README.md"
Cohesion: 0.19
Nodes (6): How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup, Ceylonry POS — Documentation

### Community 102 - "User guide"
Cohesion: 0.15
Nodes (12): Checkout, Customers & loyalty, Inventory & stock, Open orders & kitchen (restaurant / café), Products, categories, modifiers, Reports, Roles, Sales, refunds and voids (+4 more)

### Community 103 - "salesLog.js"
Cohesion: 0.40
Nodes (8): day(), DELETED_ACTION, findApprover(), inLocation(), parseDeletedDetails(), refundRows(), voidRows(), users

### Community 104 - "localAdmin.js"
Cohesion: 0.38
Nodes (9): DEV_ADMIN, getStore(), invoices(), localAdminApi(), localAdminSession, resolveFeatures(), flagsWithPlan(), subscriptionOf() (+1 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.18
Nodes (11): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Invoices, Known gaps, Related Netlify configuration, Signing in (+3 more)

### Community 109 - "public/sw.js"
Cohesion: 0.25
Nodes (7): isHashed(), SHELL, store(), strategyFor(), 6. Services (abstractions), useServices(), res()

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "env.js"
Cohesion: 0.14
Nodes (9): env, pullDelay(), endSupportSession(), log, SUPPORT_USER, supportModeActive(), supportSession(), log (+1 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 115 - "Architecture"
Cohesion: 0.17
Nodes (11): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, PosStore, Responsive layout (+3 more)

### Community 116 - "documents.js"
Cohesion: 0.12
Nodes (22): DEFAULT_BUSINESS_NAME, DEFAULT_RECEIPT_FOOTER, esc(), receiptDate(), padLeft(), padRight(), receiptLayout(), receiptMessage() (+14 more)

### Community 117 - "send-story-submission.js"
Cohesion: 0.36
Nodes (7): { appwriteAdmin }, clean(), esc(), { guard, siteOrigin }, handler(), nodemailer, storeSubmission()

### Community 118 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 119 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 120 - "serviceWorker.test.js"
Cohesion: 0.29
Nodes (5): code, handlers, pick(), req(), worker

### Community 121 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.15
Nodes (13): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 5. Environment variables, 6. One-time setup and deployment (+5 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 126 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 127 - "ceylo-ask.js"
Cohesion: 0.13
Nodes (11): Anthropic, contextText(), { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), line(), log, { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID } (+3 more)

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

### Community 135 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe

### Community 136 - "Deployment & operations"
Cohesion: 0.33
Nodes (6): Backups and data, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 137 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 142 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 144 - "4. Run it locally for testing"
Cohesion: 0.33
Nodes (6): 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing, 4.3 Guest Manager only (no backend), 4.4 CashFlow pages, 4.5 Tests and checks, 4. Run it locally for testing

### Community 153 - "admin-signin.js"
Cohesion: 0.20
Nodes (14): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+6 more)

### Community 154 - "admin-app/main.jsx"
Cohesion: 0.21
Nodes (6): App(), ErrorBoundary, log, DialogModal(), UiProvider(), react-dom

### Community 158 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 161 - "submit-ticket.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), headers(), nodemailer, { handler }, require

### Community 162 - "track-visit.js"
Cohesion: 0.31
Nodes (8): { appwriteAdmin }, clean(), getAdmin(), { guard, siteOrigin }, headers(), isLandingPath(), handler(), log

### Community 165 - "submit-ticket.js"
Cohesion: 0.33
Nodes (8): { appwriteAdmin }, clean(), esc(), getAdmin(), { guard, siteOrigin }, headers(), handler(), nodemailer

### Community 167 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 168 - "domain/format.js"
Cohesion: 0.14
Nodes (23): log, MenuTab(), CATALOGUE_HEADERS, catalogueExportMatrix(), exportStock(), menuFileName(), plain(), csvEscape() (+15 more)

### Community 169 - "bug-report-20260813-mobile.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 173 - "Test plan"
Cohesion: 0.50
Nodes (4): Automated coverage, Harness, Manual checklist (not automated), Test plan

## Knowledge Gaps
- **721 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+716 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 957 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PosProvider.jsx`, `useData`, `diagnosticsShared.js`, `money`, `index.jsx`, `Ceylo.jsx`, `labelPrinter.js`, `admin-app/main.jsx`, `features.js`, `domain/format.js`, `SessionProvider.jsx`, `AdminApp.jsx`, `adminApi.js`, `plans.js`, `Tables.jsx`, `subscription.js`, `pos-react/package.json`, `Reports.jsx`, `usePos`, `panels.jsx`, `auth.service.js`, `KdsApp.jsx`, `env.js`, `serviceWorker.test.js`, `useInstall.js`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `line()` connect `ceylo-ask.js` to `clean`, `assets/platform.js`, `public/assets/platform.js`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `key()` connect `usePos` to `public/assets/platform.js`, `public/sw.js`, `assets/platform.js`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _721 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `guard` be split into smaller, more focused modules?**
  _Cohesion score 0.09024390243902439 - nodes in this community are weakly interconnected._
- **Should `PosProvider.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07294117647058823 - nodes in this community are weakly interconnected._
- **Should `useData` be split into smaller, more focused modules?**
  _Cohesion score 0.14193548387096774 - nodes in this community are weakly interconnected._