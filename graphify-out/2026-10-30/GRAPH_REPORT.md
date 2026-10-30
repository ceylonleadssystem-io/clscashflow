# Graph Report - clscashflow  (2026-10-30)

## Corpus Check
- 445 files · ~1,230,566 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3906 nodes · 11465 edges · 180 communities (161 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 277 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `29977787`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- security.js
- SystemOptionsPages.jsx
- pos/sales.js
- cloud.service.js
- CheckoutProvider.jsx
- appwrite.js
- settings.js
- __awaiter
- invoice-share.test.js
- domain/catalog.js
- PosProvider.jsx
- useData
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore
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
- localAdmin.js
- index.jsx
- domain.test.js
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
- package.json
- Client
- public/sw.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- createLogger
- useFeature
- Products.jsx
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
- domain/sales.js
- planFromPath
- planFromPath
- account-danger-zone.js
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- pos-reported-bugs.test.js
- User guide
- thirdPartyPayments.js
- submit-ticket.js
- domain/format.js
- account-purge.test.js
- Administrator guide
- nodemailer
- getAdmin
- kds-pair.test.js
- Locale
- ViewRouter.jsx
- track-visit.cjs
- CloudSyncService
- Architecture
- imageTools.js
- admin-store.js
- appwrite-files.js
- link.js
- dependencies
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- devDependencies
- useInstall.js
- ready.js
- PosStore.js
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
- subscription.js
- EmailJS order e-mail template
- capabilities.test.js
- BaseRepository
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- receiptPrinter.js
- growth-partner-commissions.test.js
- PortalShell.jsx
- POS variants (verticals)
- salesLog.js
- serviceWorker.test.js
- nowIso
- bug-report-20260810.test.js
- node-appwrite
- seo.test.js
- DevicePages.jsx
- apps-used.test.js
- Project structure
- bug-report-20260813-mobile.test.js
- priority-support-chat.test.js
- CategoryRepository
- README.md
- IMPORTANT: This is NOT a rebuild of the POS system.
- payroll.test.js
- submit-subscription-receipt.js
- SettingsHome.jsx
- onboarding-terms-acceptance.test.js
- reportPdf.js
- admin-visits-conversion.test.js
- bug-report-20260812.test.js
- POS administration portal
- gm-routing.test.js
- imageStorage.test.js

## God Nodes (most connected - your core abstractions)
1. `useData()` - 163 edges
2. `usePos()` - 158 edges
3. `react` - 109 edges
4. `__awaiter()` - 93 edges
5. `useFeature()` - 78 edges
6. `AppwriteException` - 74 edges
7. `money()` - 73 edges
8. `useUi()` - 53 edges
9. `Modal()` - 52 edges
10. `vitest` - 50 edges

## Surprising Connections (you probably didn't know these)
- `Where data lives (Appwrite project `6a947d6e0012c551dfde`, Singapore)` --references--> `storeFor()`  [INFERRED]
  README.md → netlify/lib/appwrite.js
- `Troubleshooting` --references--> `queryDocuments()`  [INFERRED]
  pos-react/docs/deployment.md → netlify/lib/appwrite.js
- `5. Data layer (WatermelonDB)` --references--> `categories()`  [INFERRED]
  pos-react/README.md → assets/catalog.js
- `POS app (browser)` --references--> `inventory()`  [INFERRED]
  docs/reference/logging.md → netlify/lib/account-purge.js
- `Delivered (slice 1)` --references--> `PageHeader()`  [INFERRED]
  docs/settings-build-plan.md → pos-react/src/components/settings/kit/rows.jsx

## Import Cycles
- None detected.

## Communities (180 total, 19 thin omitted)

### Community 0 - "security.js"
Cohesion: 0.07
Nodes (44): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+36 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.16
Nodes (43): Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AssignmentTree(), GroupBox(), AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge() (+35 more)

### Community 2 - "pos/sales.js"
Cohesion: 0.18
Nodes (24): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), firstShortIngredient(), hasSizedStock(), isService(), lineSize(), productStockItem() (+16 more)

### Community 3 - "cloud.service.js"
Cohesion: 0.13
Nodes (29): DEFAULT_OWNER_PIN, STORAGE, TABLE_LIST, ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey() (+21 more)

### Community 4 - "CheckoutProvider.jsx"
Cohesion: 0.09
Nodes (42): CartLines(), CategoryRail(), CheckoutFields(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection(), useDiscountDraft() (+34 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (54): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+46 more)

### Community 6 - "settings.js"
Cohesion: 0.10
Nodes (49): isAppwrite(), device(), deviceNameError(), devicesOf(), text(), cleanStations(), draftChanges(), nextDrafts() (+41 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "invoice-share.test.js"
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

### Community 9 - "domain/catalog.js"
Cohesion: 0.17
Nodes (20): log, MenuImport(), NUMBERS, log, MenuTab(), STALE_PRESET_CATEGORIES, catalogueNumber(), cell() (+12 more)

### Community 10 - "PosProvider.jsx"
Cohesion: 0.15
Nodes (19): resolveWelcome(), setUploadFailureHandler(), useDataRef(), useRepositories(), useStore(), FeatureContext, useFeatures(), listeners (+11 more)

### Community 11 - "useData"
Cohesion: 0.08
Nodes (59): App(), Gate(), Loading(), Ready(), Root(), CeyloAiKeyPanel(), PROVIDERS, AssistMissing() (+51 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.07
Nodes (30): Data model, camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta (+22 more)

### Community 14 - "logger.js"
Cohesion: 0.12
Nodes (29): capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS, interactiveTarget() (+21 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore"
Cohesion: 0.22
Nodes (6): PosStore, attachLines(), EMPTY_SNAPSHOT(), nowIso(), PosStore, rowPlainToLine()

### Community 17 - "guard"
Cohesion: 0.10
Nodes (29): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+21 more)

### Community 18 - "app.mjs"
Cohesion: 0.09
Nodes (47): ACTIONS, billsOf(), business(), canSend(), detailDialog(), dlg(), ensureGuest(), guestDialog() (+39 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.08
Nodes (32): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+24 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.18
Nodes (22): esc(), barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128() (+14 more)

### Community 21 - "pos/inventory.js"
Cohesion: 0.31
Nodes (13): parseStockCountRows(), adjustmentChange(), locationStock(), stockMovement(), applyStockChange(), movementRow(), activeLocationId(), adjustStock() (+5 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (39): Styling, Build, go(), addDays(), DEFAULT_SETTINGS, mergeRows(), monthOf(), base() (+31 more)

### Community 23 - "pos.mjs"
Cohesion: 0.24
Nodes (16): layoutDialog(), refreshPos(), saveSettings(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey() (+8 more)

### Community 24 - "database.js"
Cohesion: 0.12
Nodes (18): createDatabase(), log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses (+10 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (33): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+25 more)

### Community 27 - "menuAdmin.js"
Cohesion: 0.14
Nodes (20): assignItems(), brief(), cleanMenu(), cleanSalesCategory(), FIELD_LABELS, hoursSummary(), inHours(), MAX_NAME (+12 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (11): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+3 more)

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
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 34 - "localAdmin.js"
Cohesion: 0.13
Nodes (24): FeaturesTab(), NO_OVERRIDE, DEV_ADMIN, getStore(), invoices(), localAdminApi(), localAdminSession, FEATURE_PRESET_MAP (+16 more)

### Community 35 - "index.jsx"
Cohesion: 0.08
Nodes (43): Modal(), ModalBody(), NumberInput(), MANAGER_ROLES, NAV_ITEMS, OWNER_ROLES, REPORTING_ROLES, VIEW_TITLES (+35 more)

### Community 36 - "domain.test.js"
Cohesion: 0.15
Nodes (24): addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, equalSplit(), isChargeable() (+16 more)

### Community 37 - "vitest"
Cohesion: 0.15
Nodes (19): makeCtx(), bind(), bindServices(), cash(), addProduct(), createHarness(), line(), noDiscount (+11 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (38): activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day(), GIFT (+30 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (22): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+14 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.16
Nodes (21): KdsGate(), friendlyAuthError(), getAuthService(), accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages() (+13 more)

### Community 43 - "pagePath"
Cohesion: 0.08
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "UsersPages.jsx"
Cohesion: 0.19
Nodes (22): ConditionalGroup(), FULL_SETTINGS_ROLES, ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions() (+14 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.13
Nodes (30): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, sendAdminRequest(), AdminApp() (+22 more)

### Community 48 - "systemOptions.js"
Cohesion: 0.18
Nodes (20): Ctx, SystemOptionsProvider(), allowedCategoryKeys(), menusInEffect(), publishedOf(), applyPatch(), autoClockOutDue(), FIELDS (+12 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.09
Nodes (56): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+48 more)

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
Cohesion: 0.12
Nodes (24): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+16 more)

### Community 58 - "pos/catalog.js"
Cohesion: 0.15
Nodes (24): categoryKey(), productCategories(), stalePresetCategory(), visibleProductCategories(), ensureProductInventory(), productSizeItem(), addCategory(), addCommonModifiers() (+16 more)

### Community 59 - "boot"
Cohesion: 0.14
Nodes (18): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+10 more)

### Community 60 - "esc"
Cohesion: 0.17
Nodes (37): bindGuestFill(), bindTables(), bookingDialog(), cancelDialog(), cfg(), dateBar(), dialog(), esc() (+29 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "kitchenPrinters.js"
Cohesion: 0.19
Nodes (17): openKotWindow(), kotEscPos(), kotHtml(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log (+9 more)

### Community 63 - "Reports.jsx"
Cohesion: 0.32
Nodes (10): firstSub(), groupOf(), MANAGER_ONLY, PAYROLL_ROLES, REPORT_GROUPS, subOf(), visibleGroups(), useReportGroups() (+2 more)

### Community 64 - "logic.mjs"
Cohesion: 0.11
Nodes (34): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+26 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.09
Nodes (24): description, engines, node, appwrite, name, private, scripts, build (+16 more)

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
Cohesion: 0.09
Nodes (22): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+14 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "public/sw.js"
Cohesion: 0.22
Nodes (8): isHashed(), SHELL, store(), strategyFor(), 6. Services (abstractions), useServices(), ctx(), res()

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

### Community 79 - "createLogger"
Cohesion: 0.08
Nodes (18): env, getAppwriteCompat(), installGlobalClsBackend(), log, AppwriteAuthProvider, log, pullDelay(), authHeaders() (+10 more)

### Community 80 - "useFeature"
Cohesion: 0.11
Nodes (42): how(), KitchenStations(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel() (+34 more)

### Community 81 - "Products.jsx"
Cohesion: 0.27
Nodes (11): productMargin(), productSizeGroup(), subcategoriesFor(), CatalogueImportModal(), blank(), ProductModal(), ProductModalHost(), ModalsContext (+3 more)

### Community 82 - "plans.js"
Cohesion: 0.16
Nodes (15): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), ADDITIONAL_FEATURES (+7 more)

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

### Community 89 - "ReportPage.jsx"
Cohesion: 0.21
Nodes (18): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+10 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.11
Nodes (37): AssistBar(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+29 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "admin-app/main.jsx"
Cohesion: 0.27
Nodes (3): ErrorBoundary, log, react-dom

### Community 94 - "domain/sales.js"
Cohesion: 0.19
Nodes (18): ACTIVE_STATUSES, activeTimeEntry(), applyReversal(), calculateRefundAmount(), currentCashShift(), expectedCash(), realLines(), refundableLines() (+10 more)

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
Nodes (17): receiptDate(), kotBody(), padLeft(), padRight(), prepLines(), receiptHtml(), receiptLayout(), receiptMessage() (+9 more)

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
Cohesion: 0.32
Nodes (10): activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), reorder(), splitChoices(), thirdPartyList() (+2 more)

### Community 104 - "submit-ticket.js"
Cohesion: 0.33
Nodes (8): { appwriteAdmin }, clean(), esc(), getAdmin(), { guard, siteOrigin }, headers(), handler(), nodemailer

### Community 105 - "domain/format.js"
Cohesion: 0.08
Nodes (58): CustomerSection(), Kpi(), birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment() (+50 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "nodemailer"
Cohesion: 0.10
Nodes (23): esc(), handler(), nodemailer, clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS (+15 more)

### Community 109 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "ViewRouter.jsx"
Cohesion: 0.10
Nodes (19): collectionOf, defaults, IndustryModals(), saverOf, TITLES, data(), render(), INDUSTRY_MODULES (+11 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 115 - "Architecture"
Cohesion: 0.22
Nodes (8): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "admin-store.js"
Cohesion: 0.16
Nodes (17): verifyAdmin(), { getAdmin, audit }, { guard, reply }, handler(), { isAdminEmail, verifyToken }, log, store, verifyAdmin() (+9 more)

### Community 118 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 119 - "link.js"
Cohesion: 0.12
Nodes (37): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, KDS_DESTINATION, kdsStatus(), kdsTickets(), NEXT (+29 more)

### Community 120 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, react, react-dom (+1 more)

### Community 121 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/plugin-proposal-decorators, @babel/plugin-transform-class-properties, fake-indexeddb, vite, @vitejs/plugin-react, vitest

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 128 - "PosStore.js"
Cohesion: 0.17
Nodes (13): decode(), encode(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq(), canonical(), comparable() (+5 more)

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
Nodes (21): routeKitchenLines(), kitchenPrinterHook(), kitchenMode(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log (+13 more)

### Community 136 - "Deployment & operations"
Cohesion: 0.33
Nodes (6): Backups and data, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

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

### Community 142 - "subscription.js"
Cohesion: 0.18
Nodes (19): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+11 more)

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 144 - "capabilities.test.js"
Cohesion: 0.35
Nodes (8): CAPABILITIES, typesWith(), commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS, RETIRED_MODIFIER_NAMES, SERVICE_CHARGE_TYPES

### Community 145 - "BaseRepository"
Cohesion: 0.08
Nodes (13): 5. Data layer (WatermelonDB), BaseRepository, CashShiftRepository, createRepositories(), CustomerRepository, generic(), InventoryRepository, MetaRepository (+5 more)

### Community 152 - "receiptPrinter.js"
Cohesion: 0.22
Nodes (11): sizeSlug(), log, findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants() (+3 more)

### Community 153 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 154 - "PortalShell.jsx"
Cohesion: 0.12
Nodes (26): PATHS, PortalIcon(), Modifiers, PortalHome(), PortalShell(), Products, Reports, Settings (+18 more)

### Community 155 - "POS variants (verticals)"
Cohesion: 0.40
Nodes (4): Add a new business type, Add a new module (for example vehicles and job cards for Automotive), POS variants (verticals), Rules

### Community 156 - "salesLog.js"
Cohesion: 0.40
Nodes (8): day(), DELETED_ACTION, findApprover(), inLocation(), parseDeletedDetails(), refundRows(), voidRows(), users

### Community 157 - "serviceWorker.test.js"
Cohesion: 0.29
Nodes (5): code, handlers, pick(), req(), worker

### Community 158 - "nowIso"
Cohesion: 0.14
Nodes (30): T, TABLE_BY_NAME, isEmail(), nowIso(), phoneKey(), whatsappPhone(), saveModifier(), newId() (+22 more)

### Community 159 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 160 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 161 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 163 - "DevicePages.jsx"
Cohesion: 0.13
Nodes (26): asStation(), connection(), connectionLabel(), copyPrinters(), DEVICE_KINDS, KITCHEN_CONNECTIONS, MAX_COPIES, MAX_NAME (+18 more)

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

### Community 170 - "README.md"
Cohesion: 0.14
Nodes (10): How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup, Ceylonry POS — Documentation, Automated coverage, Harness (+2 more)

### Community 171 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 173 - "payroll.test.js"
Cohesion: 0.22
Nodes (16): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+8 more)

### Community 175 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 178 - "SettingsHome.jsx"
Cohesion: 0.13
Nodes (17): Delivered (slice 1), Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Next slices, in the spec's order, Only settings that act today are listed (no dead switches), Register flow (changed with slice 2), Settings section: build status and plan (+9 more)

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

## Knowledge Gaps
- **842 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+837 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1108 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useData` to `SystemOptionsPages.jsx`, `CheckoutProvider.jsx`, `domain/catalog.js`, `PosProvider.jsx`, `subscription.js`, `PortalShell.jsx`, `serviceWorker.test.js`, `localAdmin.js`, `index.jsx`, `DevicePages.jsx`, `SessionProvider.jsx`, `UsersPages.jsx`, `AdminApp.jsx`, `systemOptions.js`, `Tables.jsx`, `pos-react/package.json`, `createLogger`, `useFeature`, `Products.jsx`, `plans.js`, `ReportPage.jsx`, `assist.js`, `admin-app/main.jsx`, `diagnosticsShared.js`, `domain/format.js`, `ViewRouter.jsx`, `link.js`, `useInstall.js`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `appwriteCompat.test.js`, `domain/catalog.js`, `PosProvider.jsx`, `logger.js`, `subscription.js`, `capabilities.test.js`, `labelPrinter.js`, `database.js`, `receiptPrinter.js`, `PortalShell.jsx`, `salesLog.js`, `serviceWorker.test.js`, `localAdmin.js`, `DevicePages.jsx`, `domain.test.js`, `UsersPages.jsx`, `AdminApp.jsx`, `payroll.test.js`, `systemOptions.js`, `Tables.jsx`, `salesSplit.test.js`, `imageStorage.test.js`, `pos-react/package.json`, `createLogger`, `plans.js`, `ReportPage.jsx`, `assist.js`, `documents.js`, `diagnosticsShared.js`, `thirdPartyPayments.js`, `domain/format.js`, `ViewRouter.jsx`, `link.js`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `line()` connect `guard` to `public/assets/platform.js`, `appwrite.js`, `assets/platform.js`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _842 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `security.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0693815987933635 - nodes in this community are weakly interconnected._
- **Should `cloud.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13068181818181818 - nodes in this community are weakly interconnected._
- **Should `CheckoutProvider.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08821548821548822 - nodes in this community are weakly interconnected._