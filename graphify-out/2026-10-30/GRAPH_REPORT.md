# Graph Report - clscashflow  (2026-10-30)

## Corpus Check
- 406 files · ~1,199,685 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3635 nodes · 10286 edges · 174 communities (156 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 242 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4dac36f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- guard
- PosProvider.jsx
- useFeature
- diagnostics.service.js
- esc
- appwrite.js
- diagnosticsShared.js
- __awaiter
- invoice-share.test.js
- domain/catalog.js
- index.jsx
- Ceylo.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore
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
- scanner.js
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
- reportBuilders.js
- pos-admin-login.js
- invoiceEscape
- SessionProvider.jsx
- pagePath
- admin-data.cjs
- submit-subscription-receipt.js
- AdminApp.jsx
- receiptPrinter
- documents.js
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
- kitchenPrinters.js
- reports.test.js
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
- security.js
- panels.jsx
- App.jsx
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
- public/sw.js
- domain/inventory.js
- planFromPath
- planFromPath
- account-danger-zone.js
- pos/inventory.js
- bookingDialog
- Root test-suite audit (169 failing tests)
- link.js
- User guide
- apps-used.test.js
- send-contact.js
- usePos
- account-purge.test.js
- Administrator guide
- KdsApp.jsx
- getAdmin
- kds-pair.test.js
- Locale
- POS administration portal
- track-visit.cjs
- nodemailer
- Architecture
- 4. Run it locally for testing
- admin-store.js
- appwrite-files.js
- SaleRepository
- domain.test.js
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- printHtmlInFrame
- useInstall.js
- ready.js
- cloud.service.js
- tests/catalog.test.js
- bug-report-20260812.test.js
- Storage
- tables/index.js
- pos-admin-catalog.test.js
- printing.js
- Deployment & operations
- admin-visits-conversion.test.js
- config-merge.js
- tolerant-match.cjs
- bug-report-20260811-email-modal-template.test.js
- quote-email-ui.test.js
- pos/staff.js
- EmailJS order e-mail template
- hash-admin-password.mjs
- adminApi.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- createLogger
- PortalShell.jsx
- CustomerModal.jsx
- salesLog.js
- PosStore.js
- appwriteCompat.test.js
- bug-report-20260810.test.js
- node-appwrite
- IMPORTANT: This is NOT a rebuild of the POS system.
- hardware-order.js
- adminFeedback.js
- admin-app/main.jsx
- ceylo.js
- Project structure
- onboarding-terms-acceptance.test.js
- growth-partner-commissions.test.js
- CategoryRepository
- poddo-success-story.test.js
- Development guide
- Netlify Story Form Email Setup
- README.md

## God Nodes (most connected - your core abstractions)
1. `usePos()` - 134 edges
2. `useData()` - 129 edges
3. `react` - 96 edges
4. `__awaiter()` - 93 edges
5. `AppwriteException` - 74 edges
6. `useFeature()` - 74 edges
7. `money()` - 69 edges
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

## Communities (174 total, 18 thin omitted)

### Community 0 - "guard"
Cohesion: 0.09
Nodes (31): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+23 more)

### Community 1 - "PosProvider.jsx"
Cohesion: 0.11
Nodes (24): NavIcon(), PATHS, ReportNav(), Sidebar(), UI_THEMES, planForSettings(), resolveWelcome(), WelcomeModal() (+16 more)

### Community 2 - "useFeature"
Cohesion: 0.10
Nodes (46): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+38 more)

### Community 3 - "diagnostics.service.js"
Cohesion: 0.13
Nodes (21): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+13 more)

### Community 4 - "esc"
Cohesion: 0.18
Nodes (32): bindTables(), cfg(), dateBar(), esc(), floorName(), floors(), go(), guestOf() (+24 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (54): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+46 more)

### Community 6 - "diagnosticsShared.js"
Cohesion: 0.13
Nodes (25): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+17 more)

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

### Community 9 - "domain/catalog.js"
Cohesion: 0.16
Nodes (21): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), cell(), firstColumn() (+13 more)

### Community 10 - "index.jsx"
Cohesion: 0.13
Nodes (30): Modal(), ModalBody(), NumberInput(), groupedValue(), locationStock(), CustomerMessageModal(), blank(), BranchStockModal() (+22 more)

### Community 11 - "Ceylo.jsx"
Cohesion: 0.14
Nodes (23): AskCeylo(), CeyloButton(), CeyloPanel(), DOT, EYES, Item(), MOVES, reducedMotion() (+15 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (33): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+25 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (31): auth(), POS app (browser), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString() (+23 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore"
Cohesion: 0.20
Nodes (8): PosStore, attachLines(), EMPTY_SNAPSHOT(), nowIso(), PosStore, rawToPlain(), rowPlainToLine(), sortBySeq()

### Community 17 - "settings.js"
Cohesion: 0.09
Nodes (37): ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, DEFAULT_RECEIPT_FOOTER, PAYMENT_ICONS, PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, STOCK_TYPES (+29 more)

### Community 18 - "app.mjs"
Cohesion: 0.09
Nodes (45): ACTIONS, billsOf(), bindGuestFill(), business(), cancelDialog(), canSend(), detailDialog(), ensureGuest() (+37 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.08
Nodes (33): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+25 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.19
Nodes (18): CODE128, code128Units(), code128Values(), CODE39, drawCode128(), alignmentAdjust(), DEFAULT_LABEL_STOCK, drawAlignmentLabel() (+10 more)

### Community 21 - "nowIso"
Cohesion: 0.17
Nodes (27): isEmail(), nowIso(), phoneKey(), whatsappPhone(), saveModifier(), audit(), newId(), stamp() (+19 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (35): DEFAULT_SETTINGS, mergeRows(), pushSeating(), readPos(), base(), bucketOf(), BUCKETS, call() (+27 more)

### Community 23 - "pos.mjs"
Cohesion: 0.27
Nodes (14): layoutDialog(), layoutError(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf() (+6 more)

### Community 24 - "database.js"
Cohesion: 0.09
Nodes (18): log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses, ModifierGroup (+10 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.10
Nodes (21): { Client, Databases, Query }, FIELDS, lib, listPosRows(), migrate(), pick(), readOrNull(), verify() (+13 more)

### Community 27 - "EndOfDay.jsx"
Cohesion: 0.16
Nodes (29): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+21 more)

### Community 28 - "scanner.js"
Cohesion: 0.14
Nodes (8): barcodeScanner, findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), createEmitter()

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
Nodes (18): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+10 more)

### Community 35 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 36 - "pos/sales.js"
Cohesion: 0.11
Nodes (37): PLATFORM_CHANNELS, addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature() (+29 more)

### Community 37 - "vitest"
Cohesion: 0.16
Nodes (17): makeCtx(), bind(), bindServices(), cash(), form(), addProduct(), createHarness(), line() (+9 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (37): activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day(), GIFT (+29 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.15
Nodes (21): App(), accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages(), loadPlatformScript(), log (+13 more)

### Community 43 - "pagePath"
Cohesion: 0.08
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.21
Nodes (20): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), AdminApp(), fmtDate(), log (+12 more)

### Community 48 - "documents.js"
Cohesion: 0.18
Nodes (18): esc(), receiptDate(), kotBody(), padLeft(), padRight(), prepLines(), receiptHtml(), receiptLayout() (+10 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.22
Nodes (28): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+20 more)

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
Cohesion: 0.16
Nodes (23): commonModifierPresets(), categoryKey(), productCategories(), stalePresetCategory(), visibleProductCategories(), addCategory(), addCommonModifiers(), addSubcategory() (+15 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "submit-ticket.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), headers(), nodemailer, { handler }, require

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "kitchenPrinters.js"
Cohesion: 0.26
Nodes (12): kotEscPos(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket() (+4 more)

### Community 63 - "reports.test.js"
Cohesion: 0.25
Nodes (13): firstSub(), groupOf(), MANAGER_ONLY, PAYROLL_ROLES, REPORT_GROUPS, subOf(), visibleGroups(), useReportGroups() (+5 more)

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
Cohesion: 0.07
Nodes (24): assert, compat, fs, path, test, assert, fs, path (+16 more)

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
Nodes (21): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+13 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "serviceWorker.test.js"
Cohesion: 0.29
Nodes (5): code, handlers, pick(), req(), worker

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
Cohesion: 0.09
Nodes (34): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+26 more)

### Community 80 - "panels.jsx"
Cohesion: 0.08
Nodes (50): CeyloMascot(), how(), KitchenStations(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel() (+42 more)

### Community 81 - "App.jsx"
Cohesion: 0.08
Nodes (48): Gate(), Loading(), Ready(), CeyloAiKeyPanel(), PROVIDERS, CloudBanner(), Shell(), changeQty() (+40 more)

### Community 82 - "plans.js"
Cohesion: 0.15
Nodes (16): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), DEV_ADMIN, fmt(), PlansGrid() (+8 more)

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
Cohesion: 0.16
Nodes (21): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+13 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.11
Nodes (38): Root(), AssistBar(), AssistMissing(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS (+30 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "public/sw.js"
Cohesion: 0.22
Nodes (8): isHashed(), SHELL, store(), strategyFor(), 6. Services (abstractions), useServices(), ctx(), res()

### Community 94 - "domain/inventory.js"
Cohesion: 0.30
Nodes (13): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), hasSizedStock(), isService(), lineSize(), productSizeItem() (+5 more)

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

### Community 98 - "pos/inventory.js"
Cohesion: 0.32
Nodes (12): parseStockCountRows(), adjustmentChange(), stockMovement(), applyStockChange(), movementRow(), activeLocationId(), adjustStock(), importStockCountFile() (+4 more)

### Community 99 - "bookingDialog"
Cohesion: 0.19
Nodes (20): bookingDialog(), dialog(), dlg(), saveSettings(), seatDialog(), setStatus(), toast(), waitDialog() (+12 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "link.js"
Cohesion: 0.20
Nodes (22): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+14 more)

### Community 102 - "User guide"
Cohesion: 0.14
Nodes (13): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Open orders & kitchen (restaurant / café), Products, categories, modifiers, Reports, Roles (+5 more)

### Community 103 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 104 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 105 - "usePos"
Cohesion: 0.12
Nodes (38): ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), today(), customerName(), saleItemCount() (+30 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.26
Nodes (9): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), realDeps(), assert, { createPurger, kindOf, imageIdsOf } (+1 more)

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "KdsApp.jsx"
Cohesion: 0.25
Nodes (15): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, KDS_DESTINATION, kdsStatus(), kdsTickets(), NEXT (+7 more)

### Community 109 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "nodemailer"
Cohesion: 0.11
Nodes (22): esc(), handler(), nodemailer, esc(), { guard, siteOrigin }, handler(), money(), nodemailer (+14 more)

### Community 115 - "Architecture"
Cohesion: 0.18
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 116 - "4. Run it locally for testing"
Cohesion: 0.33
Nodes (6): 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing, 4.3 Guest Manager only (no backend), 4.4 CashFlow pages, 4.5 Tests and checks, 4. Run it locally for testing

### Community 117 - "admin-store.js"
Cohesion: 0.16
Nodes (18): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+10 more)

### Community 118 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 120 - "domain.test.js"
Cohesion: 0.25
Nodes (13): ACTIVE_STATUSES, applyReversal(), calculateRefundAmount(), realLines(), refundableLines(), refundRate(), selectedRefundLines(), statusOf() (+5 more)

### Community 121 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.15
Nodes (13): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 5. Environment variables, 6. One-time setup and deployment (+5 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "printHtmlInFrame"
Cohesion: 0.44
Nodes (7): batch, localPrintPreview(), showLabelPreview(), showPrintPreview(), tsplBytesToDataUrl(), printHtmlInFrame(), printHtmlInWindow()

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 129 - "cloud.service.js"
Cohesion: 0.16
Nodes (25): STORAGE, ALWAYS_LIVE_KEY, alwaysLive(), log, pullDelay(), cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches() (+17 more)

### Community 130 - "tests/catalog.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 131 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 133 - "tables/index.js"
Cohesion: 0.07
Nodes (16): 5. Data layer (WatermelonDB), BaseRepository, CashShiftRepository, createRepositories(), CustomerRepository, generic(), InventoryRepository, MetaRepository (+8 more)

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "printing.js"
Cohesion: 0.16
Nodes (20): routeKitchenLines(), kitchenPrinterHook(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log, openKotWindow() (+12 more)

### Community 136 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 137 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

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

### Community 142 - "pos/staff.js"
Cohesion: 0.15
Nodes (23): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+15 more)

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 144 - "hash-admin-password.mjs"
Cohesion: 0.18
Nodes (12): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+4 more)

### Community 145 - "adminApi.js"
Cohesion: 0.18
Nodes (15): log, sendAdminRequest(), adminSession, getStore(), invoices(), localAdminApi(), localAdminSession, createDatabase() (+7 more)

### Community 153 - "createLogger"
Cohesion: 0.08
Nodes (23): env, isAppwrite(), KdsGate(), getAppwriteCompat(), installGlobalClsBackend(), log, AppwriteAuthProvider, friendlyAuthError() (+15 more)

### Community 154 - "PortalShell.jsx"
Cohesion: 0.09
Nodes (33): Modifiers, PortalHome(), PortalShell(), Products, Reports, Settings, Shop, Timesheets (+25 more)

### Community 155 - "CustomerModal.jsx"
Cohesion: 0.40
Nodes (10): FieldError(), cleanPhoneInput(), EMAIL_RE, emailError(), phoneError(), requiredError(), blank(), CustomerModalHost() (+2 more)

### Community 156 - "salesLog.js"
Cohesion: 0.33
Nodes (10): userName(), staffName(), day(), DELETED_ACTION, findApprover(), inLocation(), parseDeletedDetails(), refundRows() (+2 more)

### Community 157 - "PosStore.js"
Cohesion: 0.22
Nodes (11): decode(), encode(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq(), canonical(), comparable() (+3 more)

### Community 159 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 160 - "node-appwrite"
Cohesion: 0.29
Nodes (3): node-appwrite, db, db

### Community 161 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 162 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 163 - "adminFeedback.js"
Cohesion: 0.29
Nodes (7): adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText(), useAdminFeedback()

### Community 164 - "admin-app/main.jsx"
Cohesion: 0.24
Nodes (3): ErrorBoundary, log, react-dom

### Community 165 - "ceylo.js"
Cohesion: 0.31
Nodes (9): ago(), isEmbedded(), isWebLink(), plural(), repeats(), RETAIL_TYPES, runSetupChecks(), WEAK_PINS (+1 more)

### Community 166 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 167 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 168 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 170 - "poddo-success-story.test.js"
Cohesion: 0.29
Nodes (6): assert, fs, page, path, root, test

### Community 171 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 172 - "Netlify Story Form Email Setup"
Cohesion: 0.50
Nodes (3): Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup

### Community 173 - "README.md"
Cohesion: 0.15
Nodes (9): How they were recorded, Product walkthroughs, Logging, Netlify functions (server), Ceylonry POS — Documentation, Automated coverage, Harness, Manual checklist (not automated) (+1 more)

## Knowledge Gaps
- **803 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+798 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1061 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `usePos` to `PosProvider.jsx`, `useFeature`, `diagnosticsShared.js`, `domain/catalog.js`, `index.jsx`, `Ceylo.jsx`, `pos/staff.js`, `createLogger`, `PortalShell.jsx`, `CustomerModal.jsx`, `EndOfDay.jsx`, `features.js`, `adminFeedback.js`, `admin-app/main.jsx`, `SessionProvider.jsx`, `AdminApp.jsx`, `Tables.jsx`, `reports.test.js`, `pos-react/package.json`, `serviceWorker.test.js`, `panels.jsx`, `App.jsx`, `plans.js`, `ReportPage.jsx`, `assist.js`, `KdsApp.jsx`, `useInstall.js`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `PosProvider.jsx`, `diagnostics.service.js`, `tables/index.js`, `domain/catalog.js`, `logger.js`, `pos/staff.js`, `labelPrinter.js`, `database.js`, `createLogger`, `PortalShell.jsx`, `EndOfDay.jsx`, `scanner.js`, `salesLog.js`, `appwriteCompat.test.js`, `features.js`, `adminFeedback.js`, `documents.js`, `Tables.jsx`, `salesSplit.test.js`, `reports.test.js`, `pos-react/package.json`, `serviceWorker.test.js`, `plans.js`, `assist.js`, `domain/inventory.js`, `KdsApp.jsx`, `domain.test.js`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `key()` connect `panels.jsx` to `public/assets/platform.js`, `public/sw.js`, `assets/platform.js`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _803 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `guard` be split into smaller, more focused modules?**
  _Cohesion score 0.09047619047619047 - nodes in this community are weakly interconnected._
- **Should `PosProvider.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11229946524064172 - nodes in this community are weakly interconnected._
- **Should `useFeature` be split into smaller, more focused modules?**
  _Cohesion score 0.09821428571428571 - nodes in this community are weakly interconnected._