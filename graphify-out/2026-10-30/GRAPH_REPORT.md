# Graph Report - clscashflow  (2026-10-30)

## Corpus Check
- 426 files · ~1,207,720 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3727 nodes · 10636 edges · 170 communities (156 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 258 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49ffd2a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- guard
- SystemOptionsPages.jsx
- constants.js
- ViewRouter.jsx
- money
- appwrite.js
- diagnosticsShared.js
- __awaiter
- invoice-share.test.js
- env.js
- index.jsx
- react
- assets/catalog.js
- tables/index.js
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
- labelPrinter
- pos-routing.test.js
- EndOfDay.jsx
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- features.js
- cloud.service.js
- pos/sales.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-login.js
- invoiceEscape
- SessionProvider.jsx
- pagePath
- admin-data.cjs
- submit-subscription-receipt.js
- AdminApp.jsx
- receiptPrinter
- reportPdf.js
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
- cfg
- ref_node_module
- kitchenPrinters.js
- PortalShell.jsx
- logic.mjs
- pos-react/package.json
- boot
- ref_node_fs
- getAuthUser
- payable-webhook.cjs
- diagnostics-store.js
- package.json
- Client
- serviceWorker.test.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- createLogger
- PosProvider.jsx
- usePos
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
- localAdmin.js
- domain/inventory.js
- planFromPath
- planFromPath
- account-danger-zone.js
- documents.js
- diagnostics.service.js
- Root test-suite audit (169 failing tests)
- pos-reported-bugs.test.js
- User guide
- KdsApp.jsx
- send-contact.js
- useData
- account-purge.test.js
- Administrator guide
- link.js
- getAdmin
- kds-pair.test.js
- Locale
- POS administration portal
- track-visit.cjs
- security.js
- Architecture
- reports.test.js
- admin-store.js
- appwrite-files.js
- net.js
- dateStr
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- dependencies
- useInstall.js
- ready.js
- devDependencies
- scripts
- tests/catalog.test.js
- bug-report-20260812.test.js
- Storage
- BaseRepository
- pos-admin-catalog.test.js
- printing.js
- Deployment & operations
- send-story-submission.cjs
- config-merge.js
- tolerant-match.cjs
- bug-report-20260811-email-modal-template.test.js
- quote-email-ui.test.js
- subscription.js
- EmailJS order e-mail template
- support.js
- SubscriptionManagement.jsx
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- scanner.js
- growth-partner-commissions.test.js
- portal.test.js
- POS variants (verticals)
- salesLog.js
- catalogExport.test.js
- appwriteCompat.test.js
- bug-report-20260810.test.js
- node-appwrite
- seo.test.js
- poddo-success-story.test.js
- adminApi.js
- imageStorage.js
- apps-used.test.js
- Project structure
- 7. Administration portal (separate login)
- docs/README.md
- README.md

## God Nodes (most connected - your core abstractions)
1. `useData()` - 145 edges
2. `usePos()` - 138 edges
3. `react` - 102 edges
4. `__awaiter()` - 93 edges
5. `AppwriteException` - 74 edges
6. `useFeature()` - 74 edges
7. `money()` - 69 edges
8. `Modal()` - 52 edges
9. `useUi()` - 51 edges
10. `ModalBody()` - 50 edges

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

## Communities (170 total, 14 thin omitted)

### Community 0 - "guard"
Cohesion: 0.09
Nodes (30): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+22 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.10
Nodes (44): Delivered (slice 1), Next slices, in the spec's order, Only settings that act today are listed (no dead switches), Settings section: build status and plan, ConditionalGroup(), DurationRow(), NumberRow(), PageHeader() (+36 more)

### Community 2 - "constants.js"
Cohesion: 0.12
Nodes (26): FieldError(), ADJUST_REASONS, CUSTOMER_TYPES, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, PAYMENT_ICONS, PAYMENT_METHODS, PLATFORM_CHANNELS (+18 more)

### Community 3 - "ViewRouter.jsx"
Cohesion: 0.09
Nodes (20): collectionOf, defaults, IndustryModals(), saverOf, TITLES, data(), render(), INDUSTRY_MODULES (+12 more)

### Community 4 - "money"
Cohesion: 0.15
Nodes (29): CartLines(), CategoryRail(), CheckoutFields(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection(), useDiscountDraft() (+21 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (53): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+45 more)

### Community 6 - "diagnosticsShared.js"
Cohesion: 0.11
Nodes (27): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+19 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "invoice-share.test.js"
Cohesion: 0.11
Nodes (47): {
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
}, publicBase(), response() (+39 more)

### Community 9 - "env.js"
Cohesion: 0.22
Nodes (15): log, MenuImport(), NUMBERS, log, MenuTab(), env, catalogueNumber(), cell() (+7 more)

### Community 10 - "index.jsx"
Cohesion: 0.08
Nodes (44): Modal(), ModalBody(), NumberInput(), FULL_SETTINGS_ROLES, MANAGER_ROLES, OWNER_ROLES, REPORTING_ROLES, ROLE_VIEWS (+36 more)

### Community 11 - "react"
Cohesion: 0.07
Nodes (50): App(), Gate(), Loading(), Ready(), Root(), AskCeylo(), CeyloButton(), CeyloMascot() (+42 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "tables/index.js"
Cohesion: 0.06
Nodes (35): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+27 more)

### Community 14 - "logger.js"
Cohesion: 0.12
Nodes (28): capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS, interactiveTarget() (+20 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (18): PosStore, decode(), encode(), attachLines(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq() (+10 more)

### Community 17 - "settings.js"
Cohesion: 0.14
Nodes (29): DEFAULT_RECEIPT_FOOTER, isAppwrite(), isDataImage(), storeImage(), supportAuditEntry(), dismissPosSetup(), generateCode(), log (+21 more)

### Community 18 - "app.mjs"
Cohesion: 0.10
Nodes (51): ACTIONS, billsOf(), bindGuestFill(), bookingDialog(), cancelDialog(), canSend(), detailDialog(), dialog() (+43 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.07
Nodes (37): esc(), handler(), nodemailer, { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders (+29 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.16
Nodes (24): esc(), barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128() (+16 more)

### Community 21 - "nowIso"
Cohesion: 0.10
Nodes (44): parseStockCountRows(), isEmail(), nowIso(), phoneKey(), whatsappPhone(), adjustmentChange(), stockMovement(), activeTimeEntry() (+36 more)

### Community 22 - "store.mjs"
Cohesion: 0.12
Nodes (35): Data model, DEFAULT_SETTINGS, mergeRows(), base(), boot(), bucketOf(), BUCKETS, call() (+27 more)

### Community 23 - "pos.mjs"
Cohesion: 0.23
Nodes (16): layoutDialog(), syncGuests(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf() (+8 more)

### Community 24 - "database.js"
Cohesion: 0.13
Nodes (16): log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses, ModifierGroup (+8 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (33): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+25 more)

### Community 27 - "EndOfDay.jsx"
Cohesion: 0.16
Nodes (31): CustomerSection(), birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), dashboardData() (+23 more)

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
Nodes (11): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+3 more)

### Community 34 - "features.js"
Cohesion: 0.18
Nodes (17): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+9 more)

### Community 35 - "cloud.service.js"
Cohesion: 0.10
Nodes (31): exactly(), profileHasPosAccess(), ALWAYS_LIVE_KEY, alwaysLive(), clone(), CloudSyncService, log, withTimeout() (+23 more)

### Community 36 - "pos/sales.js"
Cohesion: 0.10
Nodes (45): addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature(), selectionExtra() (+37 more)

### Community 37 - "vitest"
Cohesion: 0.17
Nodes (17): makeCtx(), bind(), bindServices(), cash(), form(), addProduct(), createHarness(), line() (+9 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.10
Nodes (33): activeSales(), AUDIT, BUILDERS, byLocation(), C, day(), GIFT, groupItems() (+25 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.18
Nodes (18): accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages(), loadPlatformScript(), log, openBankTransfer() (+10 more)

### Community 43 - "pagePath"
Cohesion: 0.06
Nodes (35): assert, fs, { pagePath }, path, read(), root, test, assert (+27 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.22
Nodes (20): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), AdminApp(), fmtDate(), log (+12 more)

### Community 48 - "reportPdf.js"
Cohesion: 0.29
Nodes (5): buildReportPdf(), downloadReportPdf(), PLAIN, jspdf, jspdf-autotable

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 50 - "LocalAuthProvider"
Cohesion: 0.11
Nodes (7): store(), 6. Services (abstractions), AppwriteAuthProvider, LocalAuthProvider, passwordHash(), useServices(), ctx()

### Community 51 - "render"
Cohesion: 0.12
Nodes (24): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+16 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.15
Nodes (36): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, orderTotal() (+28 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.07
Nodes (23): assert, keys, lib, rows, test, assert, keys, test (+15 more)

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
Cohesion: 0.18
Nodes (21): commonModifierPresets(), categoryKey(), productCategories(), stalePresetCategory(), visibleProductCategories(), addCategory(), addCommonModifiers(), addSubcategory() (+13 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "cfg"
Cohesion: 0.17
Nodes (31): bindTables(), business(), cfg(), dateBar(), floorName(), floors(), noTables(), pillFor() (+23 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "kitchenPrinters.js"
Cohesion: 0.16
Nodes (22): openKotWindow(), kotEscPos(), kotHtml(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log (+14 more)

### Community 63 - "PortalShell.jsx"
Cohesion: 0.17
Nodes (20): PATHS, PortalIcon(), Modifiers, PortalHome(), PortalShell(), Products, Reports, Settings (+12 more)

### Community 64 - "logic.mjs"
Cohesion: 0.12
Nodes (27): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+19 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.12
Nodes (18): description, engines, node, appwrite, name, private, type, version (+10 more)

### Community 66 - "boot"
Cohesion: 0.14
Nodes (18): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+10 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.08
Nodes (23): assert, compat, fs, path, test, assert, fs, onboarding (+15 more)

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
Cohesion: 0.09
Nodes (22): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+14 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "serviceWorker.test.js"
Cohesion: 0.16
Nodes (9): isHashed(), SHELL, strategyFor(), code, handlers, pick(), req(), worker (+1 more)

### Community 74 - "getAuthUser"
Cohesion: 0.20
Nodes (17): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+9 more)

### Community 75 - "Working rules: do not break existing functionality"
Cohesion: 0.12
Nodes (16): 10. Do not claim testing that was not done, 11. Dependencies, 12. Database and API safety, 13. When something breaks, 14. Final response format, 1. Change only what is required, 2. Before coding, decide, 3. Preserve existing behaviour (+8 more)

### Community 76 - "kds-store.js"
Cohesion: 0.30
Nodes (16): { ADMIN_DATABASE_ID }, bad(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 77 - "mountBillingWidget"
Cohesion: 0.15
Nodes (17): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+9 more)

### Community 78 - "appwrite-sdk.js"
Cohesion: 0.11
Nodes (6): Functions, Graphql, Messaging, Permission, Query, Service

### Community 79 - "createLogger"
Cohesion: 0.14
Nodes (11): auth(), POS app (browser), ErrorBoundary, log, KdsGate(), friendlyAuthError(), getAuthService(), log (+3 more)

### Community 80 - "PosProvider.jsx"
Cohesion: 0.07
Nodes (60): CeyloAiKeyPanel(), PROVIDERS, Ctx, SystemOptionsProvider(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel() (+52 more)

### Community 81 - "usePos"
Cohesion: 0.10
Nodes (43): Shell(), Sidebar(), LabelAlignWizard(), SIDES, LabelStockPicker(), SPLIT_PAYMENT_METHODS, planForSettings(), resolveWelcome() (+35 more)

### Community 82 - "plans.js"
Cohesion: 0.14
Nodes (17): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), DEV_ADMIN, localAdminSession, fmt() (+9 more)

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
Cohesion: 0.23
Nodes (18): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+10 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.11
Nodes (34): adminSession, AssistBar(), log, BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+26 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "localAdmin.js"
Cohesion: 0.15
Nodes (16): getStore(), invoices(), localAdminApi(), flagsWithPlan(), createDatabase(), databaseNameFor(), EMPTY_SNAPSHOT(), T (+8 more)

### Community 94 - "domain/inventory.js"
Cohesion: 0.31
Nodes (12): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), hasSizedStock(), isService(), lineSize(), productSizeItem() (+4 more)

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "account-danger-zone.js"
Cohesion: 0.11
Nodes (30): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean
}, log (+22 more)

### Community 98 - "documents.js"
Cohesion: 0.17
Nodes (18): receiptDate(), testStation(), kotBody(), kotTicketsHtml(), padLeft(), padRight(), prepLines(), receiptHtml() (+10 more)

### Community 99 - "diagnostics.service.js"
Cohesion: 0.16
Nodes (19): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+11 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 102 - "User guide"
Cohesion: 0.15
Nodes (13): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Open orders & kitchen (restaurant / café), Products, categories, modifiers, Reports, Roles (+5 more)

### Community 103 - "KdsApp.jsx"
Cohesion: 0.32
Nodes (13): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, kdsStatus(), kdsTickets(), NEXT, nextStatus() (+5 more)

### Community 104 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 105 - "useData"
Cohesion: 0.13
Nodes (29): Kpi(), csvEscape(), downloadCsv(), toCsv(), batchStatus(), commissionRows(), customerName(), ACTIVE_STATUSES (+21 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), kdsLink, linkFor(), links, listeners, notify() (+4 more)

### Community 109 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), { getAdmin }, handler(), inferPlan(), stripe, clean(), esc() (+8 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "security.js"
Cohesion: 0.06
Nodes (48): clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS, log, money(), nodemailer (+40 more)

### Community 115 - "Architecture"
Cohesion: 0.22
Nodes (9): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack (+1 more)

### Community 116 - "reports.test.js"
Cohesion: 0.31
Nodes (8): buildReport(), LOYALTY(), TAXES(), unavailable(), REPORT_GROUPS, line(), range, sale()

### Community 117 - "admin-store.js"
Cohesion: 0.16
Nodes (19): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+11 more)

### Community 118 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 119 - "net.js"
Cohesion: 0.36
Nodes (11): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), run() (+3 more)

### Community 120 - "dateStr"
Cohesion: 0.23
Nodes (13): go(), handoverSnapshot(), queueSeating(), refreshPos(), saveSettings(), viewMessages(), addDays(), bookingsMap() (+5 more)

### Community 121 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.25
Nodes (8): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB, Deliberate differences from the original

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, react, react-dom (+1 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 128 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/plugin-proposal-decorators, @babel/plugin-transform-class-properties, fake-indexeddb, vite, @vitejs/plugin-react, vitest

### Community 129 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint:syntax, preview, test

### Community 130 - "tests/catalog.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 131 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 133 - "BaseRepository"
Cohesion: 0.05
Nodes (17): 5. Data layer (WatermelonDB), categoryId(), BaseRepository, CashShiftRepository, CategoryRepository, createRepositories(), CustomerRepository, generic() (+9 more)

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "printing.js"
Cohesion: 0.12
Nodes (27): cleanStations(), kitchenStations(), named(), routeKitchenLines(), station(), STATION_TYPES, stationPrinter(), KDS_DESTINATION (+19 more)

### Community 136 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 137 - "send-story-submission.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission(), { handler }, require

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 141 - "quote-email-ui.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 142 - "subscription.js"
Cohesion: 0.27
Nodes (12): limit(), SubscriptionTab(), activeCount(), limitOrNull(), locationLimitError(), normalizeSubscription(), standardSubscription(), subscriptionOf() (+4 more)

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 144 - "support.js"
Cohesion: 0.40
Nodes (5): endSupportSession(), log, SUPPORT_USER, supportModeActive(), supportSession()

### Community 145 - "SubscriptionManagement.jsx"
Cohesion: 0.40
Nodes (8): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), STANDARD_LIMITS

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

### Community 157 - "catalogExport.test.js"
Cohesion: 0.39
Nodes (7): CATALOGUE_HEADERS, catalogueExportMatrix(), exportStock(), menuFileName(), plain(), inventory, products

### Community 159 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 160 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 161 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 162 - "poddo-success-story.test.js"
Cohesion: 0.29
Nodes (6): assert, fs, page, path, root, test

### Community 163 - "adminApi.js"
Cohesion: 0.24
Nodes (9): log, sendAdminRequest(), adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText() (+1 more)

### Community 164 - "imageStorage.js"
Cohesion: 0.16
Nodes (10): getAppwriteCompat(), installGlobalClsBackend(), log, aiKey(), askCeylo(), post(), authHeaders(), call() (+2 more)

### Community 165 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 166 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 167 - "7. Administration portal (separate login)"
Cohesion: 0.40
Nodes (5): 7. Administration portal (separate login), Image storage, Inventory behaviour, Order e-mail, Sync cost

### Community 171 - "docs/README.md"
Cohesion: 0.12
Nodes (10): Conventions, Debugging, Development guide, Recipes, Setup, Ceylonry POS — Documentation, Automated coverage, Harness (+2 more)

### Community 173 - "README.md"
Cohesion: 0.12
Nodes (11): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Logging, Netlify functions (server) (+3 more)

## Knowledge Gaps
- **816 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+811 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1076 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SystemOptionsPages.jsx`, `constants.js`, `ViewRouter.jsx`, `money`, `diagnosticsShared.js`, `env.js`, `index.jsx`, `subscription.js`, `SubscriptionManagement.jsx`, `EndOfDay.jsx`, `features.js`, `adminApi.js`, `SessionProvider.jsx`, `AdminApp.jsx`, `Tables.jsx`, `PortalShell.jsx`, `pos-react/package.json`, `serviceWorker.test.js`, `createLogger`, `PosProvider.jsx`, `usePos`, `plans.js`, `ReportPage.jsx`, `assist.js`, `KdsApp.jsx`, `useData`, `useInstall.js`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `key()` connect `usePos` to `serviceWorker.test.js`, `public/assets/platform.js`, `assets/platform.js`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `SystemOptionsPages.jsx`, `ViewRouter.jsx`, `printing.js`, `logger.js`, `subscription.js`, `labelPrinter.js`, `scanner.js`, `portal.test.js`, `salesLog.js`, `catalogExport.test.js`, `appwriteCompat.test.js`, `features.js`, `adminApi.js`, `pos/sales.js`, `imageStorage.js`, `Tables.jsx`, `salesSplit.test.js`, `pos-react/package.json`, `serviceWorker.test.js`, `PosProvider.jsx`, `plans.js`, `assist.js`, `localAdmin.js`, `documents.js`, `diagnostics.service.js`, `KdsApp.jsx`, `reports.test.js`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _816 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `guard` be split into smaller, more focused modules?**
  _Cohesion score 0.09411764705882353 - nodes in this community are weakly interconnected._
- **Should `SystemOptionsPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10196078431372549 - nodes in this community are weakly interconnected._
- **Should `constants.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12096774193548387 - nodes in this community are weakly interconnected._