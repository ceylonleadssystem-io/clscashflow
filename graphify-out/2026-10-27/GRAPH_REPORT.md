# Graph Report - clscashflow  (2026-10-22)

## Corpus Check
- 374 files · ~1,174,062 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3390 nodes · 9406 edges · 170 communities (148 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 228 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `09f54fb4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- guard
- PosProvider.jsx
- domain/format.js
- useData
- scanner.js
- appwrite.js
- diagnosticsShared.js
- __awaiter
- invoice-share.test.js
- Products.jsx
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
- labelPrinter
- pos-routing.test.js
- cfg
- barcodeScanner
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
- hardware-order.js
- pos-admin-login.js
- invoiceEscape
- SessionProvider.jsx
- pagePath
- admin-data.cjs
- submit-subscription-receipt.js
- AdminApp.jsx
- receiptPrinter
- plans.js
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
- submit-ticket.cjs
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
- link.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- security.js
- panels.jsx
- usePos
- diagnostics.service.js
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- Plan: move from Netlify + Appwrite Cloud to a VPS
- payable-create-checkout.cjs
- appwrite-files.js
- security-endpoints.test.js
- constants.js
- appwrite-compat-session.test.js
- public/sw.js
- printing.js
- planFromPath
- planFromPath
- account-danger-zone.js
- tables/index.js
- cloud.service.js
- Root test-suite audit (169 failing tests)
- README.md
- User guide
- adminApi.js
- KdsApp.jsx
- useUi
- account-purge.test.js
- Administrator guide
- domain.test.js
- getAdmin
- kds-pair.test.js
- Locale
- POS administration portal
- track-visit.cjs
- send-contact.js
- Architecture
- AppwriteAuthProvider
- CustomerModal.jsx
- growth-partner-commissions.test.js
- pos-reported-bugs.test.js
- localPrintPreview.js
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- useInstall.js
- serviceWorker.test.js
- ready.js
- BaseRepository
- bug-report-20260811-email-modal-template.test.js
- tests/catalog.test.js
- bug-report-20260812.test.js
- Storage
- repositories/index.js
- dateStr
- env.js
- Deployment & operations
- imageTools.js
- track-visit.js
- tolerant-match.cjs
- SettingsRepository
- dependencies
- node-appwrite
- EmailJS order e-mail template
- SaleRepository
- Reports.jsx
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- localAdmin.js
- priority-support-chat.test.js
- dependencies
- apps-used.test.js
- devDependencies
- receiptPrinter.js
- scripts
- vite.config.js
- InventoryRepository
- CustomerRepository
- bug-report-20260813-mobile.test.js
- qa-responsive-flow.test.js
- OpenOrderRepository
- StockMovementRepository
- onboarding-terms-acceptance.test.js
- UserRepository
- docs/README.md

## God Nodes (most connected - your core abstractions)
1. `usePos()` - 113 edges
2. `useData()` - 111 edges
3. `__awaiter()` - 93 edges
4. `react` - 88 edges
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
- `Styling` --references--> `base()`  [INFERRED]
  pos-react/docs/architecture.md → reservation-system/js/store.mjs
- `Build` --references--> `base()`  [INFERRED]
  pos-react/docs/deployment.md → reservation-system/js/store.mjs
- `5. Data layer (WatermelonDB)` --references--> `categories()`  [INFERRED]
  pos-react/README.md → assets/catalog.js

## Import Cycles
- None detected.

## Communities (170 total, 22 thin omitted)

### Community 0 - "guard"
Cohesion: 0.08
Nodes (33): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+25 more)

### Community 1 - "PosProvider.jsx"
Cohesion: 0.10
Nodes (27): NavIcon(), PATHS, Sidebar(), planForSettings(), FULL_SETTINGS_ROLES, MANAGER_ROLES, NAV_ITEMS, OWNER_ROLES (+19 more)

### Community 2 - "domain/format.js"
Cohesion: 0.09
Nodes (53): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+45 more)

### Community 3 - "useData"
Cohesion: 0.18
Nodes (21): parseNumber(), ACTIVE_STATUSES, currentCashShift(), expectedCash(), isOnBreak(), realLines(), saleItemCount(), statusOf() (+13 more)

### Community 4 - "scanner.js"
Cohesion: 0.33
Nodes (7): sizeSlug(), findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants()

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (54): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+46 more)

### Community 6 - "diagnosticsShared.js"
Cohesion: 0.11
Nodes (28): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+20 more)

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

### Community 9 - "Products.jsx"
Cohesion: 0.25
Nodes (15): catalogueNumber(), cell(), firstColumn(), normalHeader(), parseCatalogueRows(), productMargin(), productSizeGroup(), stalePresetCategory() (+7 more)

### Community 10 - "index.jsx"
Cohesion: 0.13
Nodes (30): Modal(), ModalBody(), NumberInput(), groupedValue(), locationStock(), stockStatus(), CustomerMessageModal(), blank() (+22 more)

### Community 11 - "Ceylo.jsx"
Cohesion: 0.11
Nodes (30): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+22 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (33): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+25 more)

### Community 14 - "logger.js"
Cohesion: 0.12
Nodes (30): capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS, interactiveTarget() (+22 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.12
Nodes (19): PosStore, decode(), encode(), attachLines(), EMPTY_SNAPSHOT(), hintSeq(), LEGACY_ARRAY_TABLES, log (+11 more)

### Community 17 - "settings.js"
Cohesion: 0.14
Nodes (22): isAppwrite(), commonModifierPresets(), authHeaders(), call(), isDataImage(), log, storeImage(), addCommonModifiers() (+14 more)

### Community 18 - "app.mjs"
Cohesion: 0.10
Nodes (51): ACTIONS, billsOf(), bindGuestFill(), bookingDialog(), cancelDialog(), canSend(), detailDialog(), dialog() (+43 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.10
Nodes (26): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+18 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.20
Nodes (17): CODE128, code128Units(), code128Values(), CODE39, drawCode128(), DEFAULT_LABEL_STOCK, drawAlignmentLabel(), fitText() (+9 more)

### Community 21 - "nowIso"
Cohesion: 0.13
Nodes (36): isEmail(), nowIso(), phoneKey(), whatsappPhone(), activeTimeEntry(), addSubcategory(), saveModifier(), kitchenMode() (+28 more)

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
Cohesion: 0.08
Nodes (23): hash, { hashPassword, verifyPassword }, { Client, Databases, Query }, FIELDS, lib, listPosRows(), migrate(), pick() (+15 more)

### Community 27 - "cfg"
Cohesion: 0.17
Nodes (31): bindTables(), business(), cfg(), dateBar(), floorName(), floors(), noTables(), pillFor() (+23 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.13
Nodes (29): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+21 more)

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
Cohesion: 0.18
Nodes (17): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+9 more)

### Community 35 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 36 - "pos/sales.js"
Cohesion: 0.12
Nodes (30): stockRowForLine(), mergeOrders(), applyReversal(), calculateRefundAmount(), makeDiscountLine(), makeServiceLine(), refundableLines(), refundRate() (+22 more)

### Community 37 - "vitest"
Cohesion: 0.16
Nodes (17): makeCtx(), bind(), bindServices(), cash(), form(), addProduct(), createHarness(), line() (+9 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (21): handler(), { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url() (+13 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.11
Nodes (28): getStore(), createDatabase(), databaseNameFor(), TABLE_LIST, accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile() (+20 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.22
Nodes (20): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), AdminApp(), fmtDate(), log (+12 more)

### Community 48 - "plans.js"
Cohesion: 0.18
Nodes (14): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), ADDITIONAL_FEATURES (+6 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.14
Nodes (38): ago(), isEmbedded(), isWebLink(), plural(), repeats(), RETAIL_TYPES, runSetupChecks(), WEAK_PINS (+30 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.08
Nodes (20): assert, keys, lib, rows, test, assert, keys, test (+12 more)

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
Cohesion: 0.21
Nodes (18): categoryKey(), productCategories(), productSizeItem(), addCategory(), deleteCategory(), deleteModifier(), deleteProduct(), deleteSubcategory() (+10 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "submit-ticket.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), headers(), nodemailer, { handler }, require

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "admin-store.js"
Cohesion: 0.16
Nodes (18): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+10 more)

### Community 63 - "subscription.js"
Cohesion: 0.19
Nodes (19): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+11 more)

### Community 64 - "logic.mjs"
Cohesion: 0.12
Nodes (27): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+19 more)

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
Cohesion: 0.12
Nodes (15): description, engines, node, appwrite, name, private, scripts, audit:prod (+7 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "link.js"
Cohesion: 0.18
Nodes (22): answer(), attach(), closeLink(), flush(), listeners, outbox(), sendRaw(), state (+14 more)

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

### Community 79 - "security.js"
Cohesion: 0.05
Nodes (55): esc(), handler(), nodemailer, ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient() (+47 more)

### Community 80 - "panels.jsx"
Cohesion: 0.11
Nodes (38): AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel(), LocationsPanel(), PlanSupportPanel() (+30 more)

### Community 81 - "usePos"
Cohesion: 0.11
Nodes (29): App(), Gate(), Loading(), Ready(), Root(), ErrorBoundary, log, CloudBanner() (+21 more)

### Community 82 - "diagnostics.service.js"
Cohesion: 0.16
Nodes (18): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+10 more)

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

### Community 89 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "constants.js"
Cohesion: 0.14
Nodes (15): ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_RECEIPT_FOOTER, PAYMENT_ICONS, PAYMENT_METHODS, PLATFORM_CHANNELS, SPLIT_PAYMENT_METHODS, STOCK_TYPES (+7 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "public/sw.js"
Cohesion: 0.40
Nodes (4): isHashed(), SHELL, strategyFor(), res()

### Community 94 - "printing.js"
Cohesion: 0.14
Nodes (25): receiptDate(), KDS_DESTINATION, docCtx(), downloadReceipt(), kitchenDestination(), locationFor(), log, openKotWindow() (+17 more)

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

### Community 98 - "tables/index.js"
Cohesion: 0.20
Nodes (17): T, TABLE_BY_NAME, parseStockCountRows(), adjustmentChange(), stockMovement(), applyStockChange(), audit(), movementRow() (+9 more)

### Community 99 - "cloud.service.js"
Cohesion: 0.16
Nodes (25): DEFAULT_OWNER_PIN, STORAGE, ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches() (+17 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "README.md"
Cohesion: 0.10
Nodes (15): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Applications, Backend (+7 more)

### Community 102 - "User guide"
Cohesion: 0.17
Nodes (12): Checkout, Customers & loyalty, Inventory & stock, Open orders & kitchen (restaurant / café), Products, categories, modifiers, Reports, Roles, Sales, refunds and voids (+4 more)

### Community 103 - "adminApi.js"
Cohesion: 0.23
Nodes (9): log, adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText(), useAdminFeedback() (+1 more)

### Community 104 - "KdsApp.jsx"
Cohesion: 0.32
Nodes (13): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, kdsStatus(), kdsTickets(), NEXT, nextStatus() (+5 more)

### Community 105 - "useUi"
Cohesion: 0.26
Nodes (15): ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), BarcodeModalHost(), barcodeSvg(), cleanBarcode() (+7 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.26
Nodes (9): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), realDeps(), assert, { createPurger, kindOf, imageIdsOf } (+1 more)

### Community 107 - "Administrator guide"
Cohesion: 0.18
Nodes (11): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Invoices, Known gaps, Related Netlify configuration, Signing in (+3 more)

### Community 108 - "domain.test.js"
Cohesion: 0.12
Nodes (33): addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature() (+25 more)

### Community 109 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "POS administration portal"
Cohesion: 0.29
Nodes (7): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal, passwordHash()

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 115 - "Architecture"
Cohesion: 0.22
Nodes (9): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack (+1 more)

### Community 116 - "AppwriteAuthProvider"
Cohesion: 0.18
Nodes (4): store(), 6. Services (abstractions), AppwriteAuthProvider, useServices()

### Community 117 - "CustomerModal.jsx"
Cohesion: 0.26
Nodes (14): FieldError(), CUSTOMER_TYPES, cap(), cleanPhoneInput(), EMAIL_RE, emailError(), phoneError(), requiredError() (+6 more)

### Community 118 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 119 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 120 - "localPrintPreview.js"
Cohesion: 0.40
Nodes (7): batch, localPrintPreview(), showLabelPreview(), showPrintPreview(), tsplBytesToDataUrl(), printHtmlInFrame(), printHtmlInWindow()

### Community 121 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

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
Cohesion: 0.25
Nodes (6): code, handlers, pick(), req(), worker, react-dom

### Community 127 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 128 - "BaseRepository"
Cohesion: 0.14
Nodes (4): 5. Data layer (WatermelonDB), BaseRepository, CashShiftRepository, ProductRepository

### Community 129 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 130 - "tests/catalog.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 131 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 133 - "repositories/index.js"
Cohesion: 0.21
Nodes (5): categoryId(), CategoryRepository, createRepositories(), generic(), TimeEntryRepository

### Community 134 - "dateStr"
Cohesion: 0.23
Nodes (13): go(), handoverSnapshot(), queueSeating(), refreshPos(), saveSettings(), viewMessages(), addDays(), bookingsMap() (+5 more)

### Community 135 - "env.js"
Cohesion: 0.07
Nodes (16): env, KdsGate(), getAppwriteCompat(), installGlobalClsBackend(), log, friendlyAuthError(), getAuthService(), log (+8 more)

### Community 136 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 137 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 138 - "track-visit.js"
Cohesion: 0.31
Nodes (8): { appwriteAdmin }, clean(), getAdmin(), { guard, siteOrigin }, headers(), isLandingPath(), handler(), log

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 141 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, react, react-dom (+1 more)

### Community 142 - "node-appwrite"
Cohesion: 0.29
Nodes (3): node-appwrite, db, db

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 145 - "Reports.jsx"
Cohesion: 0.07
Nodes (50): log, MenuTab(), birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment() (+42 more)

### Community 153 - "localAdmin.js"
Cohesion: 0.29
Nodes (7): sendAdminRequest(), DEV_ADMIN, invoices(), localAdminApi(), localAdminSession, flagsWithPlan(), DEFAULT_WELCOME

### Community 154 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 155 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe

### Community 156 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 157 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/plugin-proposal-decorators, @babel/plugin-transform-class-properties, fake-indexeddb, vite, @vitejs/plugin-react, vitest

### Community 158 - "receiptPrinter.js"
Cohesion: 0.48
Nodes (5): log, claimUsbOutput(), createEmitter(), findUsbOutput(), transferChunks()

### Community 159 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint:syntax, preview, test

### Community 160 - "vite.config.js"
Cohesion: 0.47
Nodes (5): adminRoute(), configurePreviewServer(), configureServer(), vite, @vitejs/plugin-react

### Community 163 - "bug-report-20260813-mobile.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 164 - "qa-responsive-flow.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 167 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 173 - "docs/README.md"
Cohesion: 0.12
Nodes (10): Conventions, Debugging, Development guide, Recipes, Setup, Ceylonry POS — Documentation, Automated coverage, Harness (+2 more)

## Knowledge Gaps
- **747 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+742 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 998 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `usePos` to `PosProvider.jsx`, `domain/format.js`, `useData`, `diagnosticsShared.js`, `env.js`, `Products.jsx`, `index.jsx`, `Ceylo.jsx`, `Reports.jsx`, `localAdmin.js`, `features.js`, `SessionProvider.jsx`, `AdminApp.jsx`, `plans.js`, `Tables.jsx`, `subscription.js`, `pos-react/package.json`, `panels.jsx`, `constants.js`, `adminApi.js`, `KdsApp.jsx`, `useUi`, `CustomerModal.jsx`, `useInstall.js`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `PosProvider.jsx`, `scanner.js`, `env.js`, `logger.js`, `Reports.jsx`, `settings.js`, `labelPrinter.js`, `localAdmin.js`, `features.js`, `pos/sales.js`, `SessionProvider.jsx`, `plans.js`, `Tables.jsx`, `salesSplit.test.js`, `subscription.js`, `pos-react/package.json`, `diagnostics.service.js`, `adminApi.js`, `KdsApp.jsx`, `domain.test.js`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `line()` connect `guard` to `public/assets/platform.js`, `appwrite.js`, `assets/platform.js`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _747 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `guard` be split into smaller, more focused modules?**
  _Cohesion score 0.08232118758434548 - nodes in this community are weakly interconnected._
- **Should `PosProvider.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1006006006006006 - nodes in this community are weakly interconnected._
- **Should `domain/format.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08515364679748241 - nodes in this community are weakly interconnected._