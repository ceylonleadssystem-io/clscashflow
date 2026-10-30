# Graph Report - clscashflow  (2026-10-30)

## Corpus Check
- 436 files · ~1,219,128 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3812 nodes · 11045 edges · 181 communities (156 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 270 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0f106f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- guard
- SystemOptionsPages.jsx
- adminApi.js
- cloud.service.js
- useFeature
- appwrite.js
- settings.js
- __awaiter
- invoice-share.test.js
- domain/catalog.js
- PosProvider.jsx
- usePos
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- ceylo-ask.js
- app.mjs
- appwriteAdmin
- labelPrinter.js
- nowIso
- store.mjs
- pos.mjs
- localAdmin.js
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
- constants.js
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
- public/sw.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- createLogger
- panels.jsx
- react
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
- CustomerModal.jsx
- domain/inventory.js
- planFromPath
- planFromPath
- account-danger-zone.js
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- pos-reported-bugs.test.js
- User guide
- thirdPartyPayments.js
- nodemailer
- useData
- account-purge.test.js
- Administrator guide
- hardware-order.js
- getAdmin
- kds-pair.test.js
- Locale
- SettingsHome.jsx
- track-visit.cjs
- Jobs
- Architecture
- imageTools.js
- admin-store.js
- appwrite-files.js
- dependencies
- bookingDialog
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- welcome.js
- useInstall.js
- ready.js
- BaseRepository
- SaleRepository
- submit-ticket.cjs
- appwriteCompat.test.js
- Storage
- 5. Data layer (WatermelonDB)
- pos-admin-catalog.test.js
- printing.js
- Deployment & operations
- SettingsRepository
- config-merge.js
- tolerant-match.cjs
- bug-report-20260811-email-modal-template.test.js
- send-invite.mjs
- adminApi
- EmailJS order e-mail template
- hasCapability
- createRepositories
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- scanner.js
- growth-partner-commissions.test.js
- portal.test.js
- POS variants (verticals)
- salesLog.js
- serviceWorker.test.js
- qa-responsive-flow.test.js
- bug-report-20260810.test.js
- node-appwrite
- seo.test.js
- quote-email-ui.test.js
- pos-offline-category.test.js
- AppwriteAuthProvider
- apps-used.test.js
- Project structure
- bug-report-20260813-mobile.test.js
- priority-support-chat.test.js
- repositories/index.js
- docs/README.md
- README.md
- Development guide
- devDependencies
- InventoryRepository
- CustomerRepository
- OpenOrderRepository
- UserRepository
- Settings section: build status and plan
- scripts
- vite.config.js

## God Nodes (most connected - your core abstractions)
1. `useData()` - 154 edges
2. `usePos()` - 149 edges
3. `react` - 104 edges
4. `__awaiter()` - 93 edges
5. `useFeature()` - 76 edges
6. `AppwriteException` - 74 edges
7. `money()` - 73 edges
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

## Communities (181 total, 25 thin omitted)

### Community 0 - "guard"
Cohesion: 0.05
Nodes (70): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, handler(), corsHeaders, { guard, siteOrigin } (+62 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.28
Nodes (22): Delivered (slice 1), ConditionalGroup(), DAYS, DayTimeRow(), DurationRow(), NumberRow(), PageHeader(), SectionCard() (+14 more)

### Community 2 - "adminApi.js"
Cohesion: 0.21
Nodes (10): log, sendAdminRequest(), adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText() (+2 more)

### Community 3 - "cloud.service.js"
Cohesion: 0.11
Nodes (30): STORAGE, exactly(), profileHasPosAccess(), ALWAYS_LIVE_KEY, alwaysLive(), clone(), CloudSyncService, log (+22 more)

### Community 4 - "useFeature"
Cohesion: 0.10
Nodes (45): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+37 more)

### Community 5 - "appwrite.js"
Cohesion: 0.10
Nodes (58): deleteOperationalData(), deleteWorkspace(), feedbackId(), nowIso(), saveFeedback(), bodyOf(), handle(), handler() (+50 more)

### Community 6 - "settings.js"
Cohesion: 0.15
Nodes (32): cleanStations(), floorsFor(), floorsKey(), thirdPartyList(), isDataImage(), storeImage(), deleteJob(), deleteThirdPartyPayment() (+24 more)

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
Cohesion: 0.17
Nodes (20): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), cell(), firstColumn() (+12 more)

### Community 10 - "PosProvider.jsx"
Cohesion: 0.09
Nodes (28): resolveWelcome(), log, collectionOf, defaults, IndustryModals(), saverOf, TITLES, setUploadFailureHandler() (+20 more)

### Community 11 - "usePos"
Cohesion: 0.08
Nodes (50): App(), Gate(), Loading(), Ready(), Root(), AskCeylo(), CeyloButton(), CeyloMascot() (+42 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (33): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+25 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (31): capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS, interactiveTarget() (+23 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (18): PosStore, decode(), encode(), attachLines(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq() (+10 more)

### Community 17 - "ceylo-ask.js"
Cohesion: 0.20
Nodes (10): Anthropic, contextText(), { getUserFromEvent, getDocument, clean }, { guard, reply }, keys, line(), log, assert (+2 more)

### Community 18 - "app.mjs"
Cohesion: 0.09
Nodes (45): ACTIONS, billsOf(), bindGuestFill(), business(), cancelDialog(), canSend(), detailDialog(), ensureGuest() (+37 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.08
Nodes (33): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+25 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.16
Nodes (25): esc(), barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128() (+17 more)

### Community 21 - "nowIso"
Cohesion: 0.09
Nodes (51): T, TABLE_BY_NAME, parseStockCountRows(), isEmail(), nowIso(), phoneKey(), whatsappPhone(), adjustmentChange() (+43 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (35): DEFAULT_SETTINGS, mergeRows(), pushSeating(), readPos(), base(), bucketOf(), BUCKETS, call() (+27 more)

### Community 23 - "pos.mjs"
Cohesion: 0.27
Nodes (14): layoutDialog(), layoutError(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf() (+6 more)

### Community 24 - "localAdmin.js"
Cohesion: 0.07
Nodes (32): getStore(), invoices(), localAdminApi(), createDatabase(), databaseNameFor(), log, migrations, CashShift (+24 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (33): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+25 more)

### Community 27 - "EndOfDay.jsx"
Cohesion: 0.15
Nodes (34): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), dashboardData(), defaultRange() (+26 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.12
Nodes (30): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+22 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.09
Nodes (16): auth(), CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef() (+8 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (11): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+3 more)

### Community 34 - "features.js"
Cohesion: 0.17
Nodes (19): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+11 more)

### Community 35 - "constants.js"
Cohesion: 0.13
Nodes (27): ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, DEFAULT_RECEIPT_FOOTER, PAYMENT_ICONS, PLATFORM_CHANNELS, STOCK_TYPES, STOCK_UNITS (+19 more)

### Community 36 - "pos/sales.js"
Cohesion: 0.09
Nodes (46): addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature(), selectionExtra() (+38 more)

### Community 37 - "vitest"
Cohesion: 0.15
Nodes (15): makeCtx(), cash(), addProduct(), createHarness(), line(), noDiscount, openShift(), productForm() (+7 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.07
Nodes (53): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+45 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (22): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+14 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.20
Nodes (16): accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages(), loadPlatformScript(), log, patchReceiptSubmission() (+8 more)

### Community 43 - "pagePath"
Cohesion: 0.08
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "UsersPages.jsx"
Cohesion: 0.21
Nodes (21): FULL_SETTINGS_ROLES, ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError() (+13 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.17
Nodes (20): Admin portal, AccessTab(), AccountDetail(), TABS, AdminApp(), fmtDate(), log, AdminLogin() (+12 more)

### Community 48 - "systemOptions.js"
Cohesion: 0.23
Nodes (17): Ctx, SystemOptionsProvider(), applyPatch(), autoClockOutDue(), defaultsFor(), FIELDS, isOverridden(), LANDING_VIEWS (+9 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 51 - "render"
Cohesion: 0.12
Nodes (24): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+16 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.23
Nodes (26): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), gmBooking(), gmSeating() (+18 more)

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
Cohesion: 0.19
Nodes (20): categoryKey(), productCategories(), stalePresetCategory(), visibleProductCategories(), addCategory(), deleteCategory(), deleteModifier(), deleteProduct() (+12 more)

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
Cohesion: 0.16
Nodes (21): openKotWindow(), kotEscPos(), kotHtml(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log (+13 more)

### Community 63 - "PortalShell.jsx"
Cohesion: 0.15
Nodes (20): NavIcon(), PATHS, PATHS, PortalIcon(), Modifiers, PortalHome(), PortalShell(), Products (+12 more)

### Community 64 - "logic.mjs"
Cohesion: 0.13
Nodes (26): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, bookingsMap() (+18 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.12
Nodes (15): description, engines, node, appwrite, name, private, type, version (+7 more)

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

### Community 73 - "public/sw.js"
Cohesion: 0.22
Nodes (8): isHashed(), SHELL, store(), strategyFor(), 6. Services (abstractions), useServices(), ctx(), res()

### Community 74 - "getAuthUser"
Cohesion: 0.20
Nodes (17): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+9 more)

### Community 75 - "Working rules: do not break existing functionality"
Cohesion: 0.12
Nodes (16): 10. Do not claim testing that was not done, 11. Dependencies, 12. Database and API safety, 13. When something breaks, 14. Final response format, 1. Change only what is required, 2. Before coding, decide, 3. Preserve existing behaviour (+8 more)

### Community 76 - "kds-store.js"
Cohesion: 0.28
Nodes (17): serverClient(), { ADMIN_DATABASE_ID }, bad(), checkSdp(), { Databases }, db(), docId(), expired() (+9 more)

### Community 77 - "mountBillingWidget"
Cohesion: 0.15
Nodes (17): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+9 more)

### Community 78 - "appwrite-sdk.js"
Cohesion: 0.11
Nodes (6): Functions, Graphql, Messaging, Permission, Query, Service

### Community 79 - "createLogger"
Cohesion: 0.09
Nodes (24): CeyloAiKeyPanel(), PROVIDERS, ErrorBoundary, log, env, isAppwrite(), KdsGate(), getAppwriteCompat() (+16 more)

### Community 80 - "panels.jsx"
Cohesion: 0.09
Nodes (45): ConnectButton(), HardwarePanel(), how(), KitchenStations(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel() (+37 more)

### Community 81 - "react"
Cohesion: 0.09
Nodes (46): CloudBanner(), Shell(), LabelAlignWizard(), SIDES, LabelStockPicker(), Modal(), ModalBody(), NumberInput() (+38 more)

### Community 82 - "plans.js"
Cohesion: 0.19
Nodes (14): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), ADDITIONAL_FEATURES (+6 more)

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
Cohesion: 0.14
Nodes (14): 1. Summary, 2.1 Separate POS database, 2.2 Document storage format (netlify/lib/appwrite.js), 2.3 Function actions (netlify/functions/appwrite-docs.js), 2.4 Storage, 2.5 Sales history split (switched ON in production), 2.6 Guest Manager database (`gm` / `gm_documents`), 2. Database changes (+6 more)

### Community 87 - "Plan: move from Netlify + Appwrite Cloud to a VPS"
Cohesion: 0.17
Nodes (11): Open questions, Phase 0: decisions (needed before starting), Phase 1: server setup (no code changes), Phase 2: replace Netlify (small code change), Phase 3: move the data, Phase 4: cutover, Phase 5: running it, Plan: move from Netlify + Appwrite Cloud to a VPS (+3 more)

### Community 88 - "payable-create-checkout.cjs"
Cohesion: 0.23
Nodes (13): appendQuery(), clean(), findCheckoutUrl(), { getAdmin }, handler(), headers(), normalizePlan(), payableWebhookUrl() (+5 more)

### Community 89 - "ReportPage.jsx"
Cohesion: 0.10
Nodes (35): downloadBlob(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+27 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (34): AssistBar(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+26 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "CustomerModal.jsx"
Cohesion: 0.40
Nodes (10): FieldError(), cleanPhoneInput(), EMAIL_RE, emailError(), phoneError(), requiredError(), blank(), CustomerModalHost() (+2 more)

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
Cohesion: 0.12
Nodes (23): crypto, deleteAuthUser(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean
}, log, normalizeAction(), OPERATIONAL_COLLECTIONS, readBody() (+15 more)

### Community 98 - "documents.js"
Cohesion: 0.23
Nodes (14): receiptDate(), kotBody(), padLeft(), padRight(), prepLines(), receiptHtml(), receiptLayout(), receiptSocialLines() (+6 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.05
Nodes (81): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+73 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 102 - "User guide"
Cohesion: 0.13
Nodes (15): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Open orders & kitchen (restaurant / café), Products, categories, modifiers, Reports, Roles (+7 more)

### Community 103 - "thirdPartyPayments.js"
Cohesion: 0.27
Nodes (11): PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), reorder() (+3 more)

### Community 104 - "nodemailer"
Cohesion: 0.12
Nodes (20): { appwriteAdmin }, clean(), esc(), handler(), log, nodemailer, reply(), ALLOWED_TOPICS (+12 more)

### Community 105 - "useData"
Cohesion: 0.17
Nodes (20): batchStatus(), commissionRows(), customerName(), ACTIVE_STATUSES, realLines(), saleItemCount(), statusOf(), applyReportFilters() (+12 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 109 - "getAdmin"
Cohesion: 0.17
Nodes (14): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+6 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SettingsHome.jsx"
Cohesion: 0.27
Nodes (10): SaveBar(), SettingsShell(), useSystemOptionsDraft(), SYSTEM_PAGES, PAGE_COMPONENTS, SettingsHome(), Overview(), PAGE_COMPONENTS (+2 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "Jobs"
Cohesion: 0.49
Nodes (10): Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), TextRow(), ThirdPartyPayments() (+2 more)

### Community 115 - "Architecture"
Cohesion: 0.20
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "admin-store.js"
Cohesion: 0.16
Nodes (17): verifyAdmin(), { getAdmin, audit }, { guard, reply }, handler(), { isAdminEmail, verifyToken }, log, store, verifyAdmin() (+9 more)

### Community 118 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 119 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, react, react-dom (+1 more)

### Community 120 - "bookingDialog"
Cohesion: 0.19
Nodes (20): bookingDialog(), dialog(), dlg(), saveSettings(), seatDialog(), setStatus(), toast(), waitDialog() (+12 more)

### Community 121 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 130 - "submit-ticket.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), headers(), nodemailer, { handler }, require

### Community 133 - "5. Data layer (WatermelonDB)"
Cohesion: 0.22
Nodes (3): 5. Data layer (WatermelonDB), CashShiftRepository, ProductRepository

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "printing.js"
Cohesion: 0.12
Nodes (27): kitchenStations(), named(), routeKitchenLines(), station(), STATION_TYPES, stationPrinter(), kdsLink, kitchenPrinterHook() (+19 more)

### Community 136 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 141 - "send-invite.mjs"
Cohesion: 0.38
Nodes (5): esc(), handler(), nodemailer, { handler }, require

### Community 142 - "adminApi"
Cohesion: 0.19
Nodes (18): adminApi(), FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement() (+10 more)

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 144 - "hasCapability"
Cohesion: 0.14
Nodes (21): CAPABILITIES, hasCapability(), typesWith(), BUSINESS_TYPE_OPTIONS, commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS (+13 more)

### Community 145 - "createRepositories"
Cohesion: 0.25
Nodes (4): createRepositories(), generic(), StockMovementRepository, TimeEntryRepository

### Community 152 - "scanner.js"
Cohesion: 0.31
Nodes (7): findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), createEmitter()

### Community 153 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 154 - "portal.test.js"
Cohesion: 0.23
Nodes (11): PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day(), timesheetRows() (+3 more)

### Community 155 - "POS variants (verticals)"
Cohesion: 0.40
Nodes (4): Add a new business type, Add a new module (for example vehicles and job cards for Automotive), POS variants (verticals), Rules

### Community 156 - "salesLog.js"
Cohesion: 0.38
Nodes (8): day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails(), voidRows(), users

### Community 157 - "serviceWorker.test.js"
Cohesion: 0.25
Nodes (6): code, handlers, pick(), req(), worker, react-dom

### Community 158 - "qa-responsive-flow.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 159 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 160 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 161 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 162 - "quote-email-ui.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 163 - "pos-offline-category.test.js"
Cohesion: 0.29
Nodes (6): assert, fs, path, root, test, worker

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

### Community 170 - "docs/README.md"
Cohesion: 0.20
Nodes (5): Ceylonry POS — Documentation, Automated coverage, Harness, Manual checklist (not automated), Test plan

### Community 171 - "README.md"
Cohesion: 0.09
Nodes (15): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification (+7 more)

### Community 172 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 173 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/plugin-proposal-decorators, @babel/plugin-transform-class-properties, fake-indexeddb, vite, @vitejs/plugin-react, vitest

### Community 178 - "Settings section: build status and plan"
Cohesion: 0.33
Nodes (5): Delivered (slice 3): Users, Jobs and permission keys, Next slices, in the spec's order, Only settings that act today are listed (no dead switches), Register flow (changed with slice 2), Settings section: build status and plan

### Community 179 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint:syntax, preview, test

### Community 180 - "vite.config.js"
Cohesion: 0.47
Nodes (5): adminRoute(), configurePreviewServer(), configureServer(), vite, @vitejs/plugin-react

## Knowledge Gaps
- **830 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+825 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1093 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SystemOptionsPages.jsx`, `adminApi.js`, `useFeature`, `domain/catalog.js`, `PosProvider.jsx`, `usePos`, `adminApi`, `logger.js`, `EndOfDay.jsx`, `serviceWorker.test.js`, `features.js`, `constants.js`, `SessionProvider.jsx`, `UsersPages.jsx`, `AdminApp.jsx`, `systemOptions.js`, `Tables.jsx`, `PortalShell.jsx`, `pos-react/package.json`, `createLogger`, `panels.jsx`, `plans.js`, `ReportPage.jsx`, `assist.js`, `CustomerModal.jsx`, `diagnosticsShared.js`, `useData`, `Jobs`, `welcome.js`, `useInstall.js`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `adminApi.js`, `appwriteCompat.test.js`, `printing.js`, `domain/catalog.js`, `PosProvider.jsx`, `logger.js`, `adminApi`, `hasCapability`, `labelPrinter.js`, `localAdmin.js`, `portal.test.js`, `salesLog.js`, `serviceWorker.test.js`, `features.js`, `pos/sales.js`, `reportBuilders.js`, `UsersPages.jsx`, `systemOptions.js`, `Tables.jsx`, `salesSplit.test.js`, `kitchenPrinters.js`, `pos-react/package.json`, `plans.js`, `ReportPage.jsx`, `assist.js`, `domain/inventory.js`, `documents.js`, `diagnosticsShared.js`, `thirdPartyPayments.js`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `line()` connect `ceylo-ask.js` to `public/assets/platform.js`, `appwrite.js`, `assets/platform.js`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _830 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `guard` be split into smaller, more focused modules?**
  _Cohesion score 0.047898912724067 - nodes in this community are weakly interconnected._
- **Should `cloud.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1069182389937107 - nodes in this community are weakly interconnected._
- **Should `useFeature` be split into smaller, more focused modules?**
  _Cohesion score 0.10312004230565838 - nodes in this community are weakly interconnected._