# Graph Report - clscashflow  (2026-10-13)

## Corpus Check
- 351 files · ~1,043,708 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3174 nodes · 8841 edges · 153 communities (136 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 212 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3dda8630`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- guard
- PosProvider.jsx
- useData
- link.js
- BaseRepository
- appwrite.js
- diagnosticsShared.js
- __awaiter
- invoice-share.test.js
- react
- index.jsx
- Shell.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- settings.js
- app.mjs
- appwriteAdmin
- domain/format.js
- nowIso
- store.mjs
- ModalBody
- tables/index.js
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
- domain.test.js
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
- Reports.jsx
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
- Modal
- auth.service.js
- pos/inventory.js
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- receipt.test.js
- payable-create-checkout.cjs
- appwrite-files.js
- security-endpoints.test.js
- Products.jsx
- printing.js
- labelPrinter
- dateStr
- planFromPath
- planFromPath
- scanner.js
- Ceylonry POS — React + WatermelonDB
- domain/inventory.js
- Root test-suite audit (169 failing tests)
- docs/README.md
- User guide
- salesLog.js
- receiptPrinter
- barcodeScanner
- account-purge.test.js
- Administrator guide
- SaleRepository
- receiptPrinter.js
- kds-pair.test.js
- Locale
- send-story-submission.cjs
- track-visit.cjs
- send-contact.js
- Architecture
- documents.js
- CLS CashFlow
- growth-partner-commissions.test.js
- pos-reported-bugs.test.js
- dependencies
- public/sw.js
- bug-report-20260810.test.js
- Role
- send-invoice.cjs
- useInstall.js
- serviceWorker.test.js
- admin-visits-conversion.test.js
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

## God Nodes (most connected - your core abstractions)
1. `useData()` - 106 edges
2. `usePos()` - 106 edges
3. `__awaiter()` - 93 edges
4. `react` - 85 edges
5. `AppwriteException` - 74 edges
6. `money()` - 65 edges
7. `useFeature()` - 61 edges
8. `Modal()` - 52 edges
9. `ModalBody()` - 50 edges
10. `Account` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Troubleshooting` --references--> `queryDocuments()`  [INFERRED]
  pos-react/docs/deployment.md → netlify/lib/appwrite.js
- `5. Data layer (WatermelonDB)` --references--> `categories()`  [INFERRED]
  pos-react/README.md → assets/catalog.js
- `POS app (browser)` --references--> `inventory()`  [INFERRED]
  docs/reference/logging.md → netlify/lib/account-purge.js
- `Changing or removing an administrator` --references--> `passwordHash()`  [INFERRED]
  docs/setup/pos-admin-portal.md → pos-react/src/services/auth.service.js
- `One-time setup` --references--> `passwordHash()`  [INFERRED]
  docs/setup/pos-admin-portal.md → pos-react/src/services/auth.service.js

## Import Cycles
- None detected.

## Communities (153 total, 17 thin omitted)

### Community 0 - "guard"
Cohesion: 0.05
Nodes (58): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+50 more)

### Community 1 - "PosProvider.jsx"
Cohesion: 0.07
Nodes (53): ConnectButton(), HardwarePanel(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel() (+45 more)

### Community 2 - "useData"
Cohesion: 0.10
Nodes (46): Kpi(), Panel(), money(), today(), customerName(), userName(), saleItemCount(), useScopedData() (+38 more)

### Community 3 - "link.js"
Cohesion: 0.08
Nodes (41): App(), ErrorBoundary, log, ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, kdsStatus() (+33 more)

### Community 4 - "BaseRepository"
Cohesion: 0.06
Nodes (16): 5. Data layer (WatermelonDB), categoryId(), BaseRepository, CashShiftRepository, CategoryRepository, createRepositories(), CustomerRepository, generic() (+8 more)

### Community 5 - "appwrite.js"
Cohesion: 0.12
Nodes (50): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logStripped(), mergePosPayload() (+42 more)

### Community 6 - "diagnosticsShared.js"
Cohesion: 0.08
Nodes (46): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+38 more)

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

### Community 9 - "react"
Cohesion: 0.11
Nodes (39): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+31 more)

### Community 10 - "index.jsx"
Cohesion: 0.10
Nodes (30): NumberInput(), ADJUST_REASONS, STOCK_TYPES, STOCK_UNITS, REPORTING_ROLES, groupedValue(), locationStock(), stockStatus() (+22 more)

### Community 11 - "Shell.jsx"
Cohesion: 0.11
Nodes (31): Gate(), Loading(), Ready(), Root(), CloudBanner(), IosInstallGuide(), NavIcon(), PATHS (+23 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (33): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+25 more)

### Community 14 - "logger.js"
Cohesion: 0.10
Nodes (33): auth(), Logging, Netlify functions (server), POS app (browser), capJson(), createRateLimiter(), createTapTracker(), cut() (+25 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (18): PosStore, decode(), encode(), attachLines(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq() (+10 more)

### Community 17 - "settings.js"
Cohesion: 0.10
Nodes (34): DEFAULT_RECEIPT_FOOTER, SUPPORT_CODE_TTL_MS, isAppwrite(), commonModifierPresets(), authHeaders(), call(), isDataImage(), log (+26 more)

### Community 18 - "app.mjs"
Cohesion: 0.10
Nodes (37): ACTIONS, billsOf(), bindGuestFill(), detailDialog(), ensureGuest(), guestDialog(), guestOf(), guestSpend() (+29 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.08
Nodes (33): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+25 more)

### Community 20 - "domain/format.js"
Cohesion: 0.14
Nodes (30): LabelAlignWizard(), SIDES, LabelStockPicker(), esc(), BarcodeModalHost(), barcodeSvg(), cleanBarcode(), CODE128 (+22 more)

### Community 21 - "nowIso"
Cohesion: 0.13
Nodes (31): isEmail(), nowIso(), phoneKey(), whatsappPhone(), activeTimeEntry(), saveModifier(), audit(), newId() (+23 more)

### Community 22 - "store.mjs"
Cohesion: 0.12
Nodes (29): Styling, Build, mergeRows(), monthOf(), base(), boot(), call(), dirty (+21 more)

### Community 23 - "ModalBody"
Cohesion: 0.13
Nodes (26): ModalBody(), SPLIT_PAYMENT_METHODS, FULL_SETTINGS_ROLES, MANAGER_ROLES, OWNER_ROLES, ROLE_VIEWS, ROLES, VIEW_TITLES (+18 more)

### Community 24 - "tables/index.js"
Cohesion: 0.09
Nodes (23): createDatabase(), log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses (+15 more)

### Community 25 - "cloud.service.js"
Cohesion: 0.13
Nodes (30): EMPTY_SNAPSHOT(), ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted() (+22 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.08
Nodes (23): hash, { hashPassword, verifyPassword }, { Client, Databases, Query }, FIELDS, lib, listPosRows(), migrate(), pick() (+15 more)

### Community 27 - "esc"
Cohesion: 0.15
Nodes (33): bindTables(), bookingDialog(), business(), cancelDialog(), canSend(), cfg(), dateBar(), esc() (+25 more)

### Community 28 - "pos/sales.js"
Cohesion: 0.14
Nodes (29): firstShortIngredient(), saleStockNeeds(), formatOrderNumber(), isSequential(), mergeOrders(), migrateOrderNumbers(), nextSequence(), orderSequenceFrom() (+21 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.13
Nodes (29): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appwriteAdmin }, clampNum(), clean(), cleanFounders(), cleanSubscription() (+21 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.12
Nodes (12): CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef(), request() (+4 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (11): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+3 more)

### Community 34 - "FeaturesTab.jsx"
Cohesion: 0.15
Nodes (19): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, KITCHEN, presetFlags(), SHOP, TOOLS (+11 more)

### Community 35 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 36 - "domain.test.js"
Cohesion: 0.15
Nodes (23): addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, equalSplit(), isChargeable() (+15 more)

### Community 37 - "harness.js"
Cohesion: 0.19
Nodes (14): makeCtx(), cash(), form(), addProduct(), createHarness(), line(), noDiscount, openShift() (+6 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "nodemailer"
Cohesion: 0.11
Nodes (22): esc(), handler(), nodemailer, esc(), { guard, siteOrigin }, handler(), money(), nodemailer (+14 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (21): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+13 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.16
Nodes (21): friendlyAuthError(), getAuthService(), accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages(), loadPlatformScript() (+13 more)

### Community 43 - "pagePath"
Cohesion: 0.09
Nodes (22): assert, fs, { pagePath }, path, read(), root, test, assert (+14 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "submit-subscription-receipt.js"
Cohesion: 0.12
Nodes (19): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID }, handler(), response(), { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc() (+11 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.22
Nodes (19): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), AdminApp(), fmtDate(), log (+11 more)

### Community 47 - "adminApi.js"
Cohesion: 0.14
Nodes (17): log, sendAdminRequest(), adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText() (+9 more)

### Community 48 - "admin.test.js"
Cohesion: 0.16
Nodes (15): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), ADDITIONAL_FEATURES (+7 more)

### Community 49 - "Reports.jsx"
Cohesion: 0.21
Nodes (23): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+15 more)

### Community 50 - "LocalAuthProvider"
Cohesion: 0.12
Nodes (8): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal, LocalAuthProvider, passwordHash()

### Community 51 - "render"
Cohesion: 0.12
Nodes (24): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+16 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.30
Nodes (20): orderTotal(), clamp(), findFreeSpot(), GRID, layoutFor(), layoutKey(), locationOrders(), moveTargets() (+12 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.09
Nodes (15): assert, fn, test, assert, { handler }, test, assert, fs (+7 more)

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
Nodes (16): { appwriteAdmin }, getAdmin(), { getAdmin }, handler(), inferPlan(), stripe, clean(), esc() (+8 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "admin-store.js"
Cohesion: 0.16
Nodes (18): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), verifyToken() (+10 more)

### Community 63 - "subscription.js"
Cohesion: 0.21
Nodes (17): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+9 more)

### Community 64 - "logic.mjs"
Cohesion: 0.16
Nodes (19): ACTIVE, buildReport(), conflicts(), csv(), DEFAULT_SETTINGS, endMin(), isFree(), openMinutes() (+11 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.12
Nodes (18): description, engines, node, appwrite, name, private, type, version (+10 more)

### Community 66 - "boot"
Cohesion: 0.14
Nodes (18): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+10 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.11
Nodes (15): assert, compat, fs, path, test, assert, fs, path (+7 more)

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
Cohesion: 0.11
Nodes (18): dependencies, appwrite, node-appwrite, nodemailer, stripe, description, engines, node (+10 more)

### Community 73 - "account-danger-zone.js"
Cohesion: 0.22
Nodes (17): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean
}, log (+9 more)

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
Cohesion: 0.12
Nodes (6): Graphql, ID, Messaging, Permission, Query, Service

### Community 79 - "MenuTab.jsx"
Cohesion: 0.23
Nodes (13): log, MenuTab(), CATALOGUE_HEADERS, catalogueExportMatrix(), exportStock(), menuFileName(), plain(), csvEscape() (+5 more)

### Community 80 - "Modal"
Cohesion: 0.35
Nodes (12): FieldError(), Modal(), cap(), cleanPhoneInput(), EMAIL_RE, emailError(), phoneError(), requiredError() (+4 more)

### Community 81 - "auth.service.js"
Cohesion: 0.17
Nodes (6): STORAGE, getAppwriteCompat(), installGlobalClsBackend(), log, AppwriteAuthProvider, log

### Community 82 - "pos/inventory.js"
Cohesion: 0.25
Nodes (14): parseStockCountRows(), adjustmentChange(), stockMovement(), applyStockChange(), movementRow(), activeLocationId(), adjustStock(), importStockCountFile() (+6 more)

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
Nodes (14): 1. Summary, 2.1 Separate POS database, 2.2 Document storage format (netlify/lib/appwrite.js), 2.3 Function actions (netlify/functions/appwrite-docs.js), 2.4 Storage, 2.5 Sales history split (switched ON in production), 2.6 Settings data, 2. Database changes (+6 more)

### Community 87 - "receipt.test.js"
Cohesion: 0.19
Nodes (10): isNum(), reportHtml(), buildReportPdf(), downloadReportPdf(), PLAIN, ctx, sale, settings (+2 more)

### Community 88 - "payable-create-checkout.cjs"
Cohesion: 0.23
Nodes (13): appendQuery(), clean(), findCheckoutUrl(), { getAdmin }, handler(), headers(), normalizePlan(), payableWebhookUrl() (+5 more)

### Community 89 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "Products.jsx"
Cohesion: 0.31
Nodes (12): STALE_PRESET_CATEGORIES, catalogueNumber(), cell(), firstColumn(), normalHeader(), parseCatalogueRows(), productMargin(), stalePresetCategory() (+4 more)

### Community 92 - "printing.js"
Cohesion: 0.19
Nodes (14): KDS_DESTINATION, kitchenPrinterHook(), docCtx(), downloadReceipt(), kitchenDestination(), locationFor(), log, openKotWindow() (+6 more)

### Community 94 - "dateStr"
Cohesion: 0.26
Nodes (15): dialog(), dlg(), handoverSnapshot(), pillFor(), resOn(), resRow(), seatDialog(), setStatus() (+7 more)

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "scanner.js"
Cohesion: 0.21
Nodes (10): sizeSlug(), findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), claimUsbOutput() (+2 more)

### Community 98 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 99 - "domain/inventory.js"
Cohesion: 0.31
Nodes (12): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), hasSizedStock(), isService(), lineSize(), productSizeItem() (+4 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "docs/README.md"
Cohesion: 0.20
Nodes (5): Ceylonry POS — Documentation, Automated coverage, Harness, Manual checklist (not automated), Test plan

### Community 102 - "User guide"
Cohesion: 0.17
Nodes (12): Checkout, Customers & loyalty, Inventory & stock, Open orders & kitchen (restaurant / café), Products, categories, modifiers, Reports, Roles, Sales, refunds and voids (+4 more)

### Community 103 - "salesLog.js"
Cohesion: 0.32
Nodes (10): APPROVER_ROLES, day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails(), refundRows() (+2 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.18
Nodes (11): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Invoices, Known gaps, Related Netlify configuration, Signing in (+3 more)

### Community 109 - "receiptPrinter.js"
Cohesion: 0.36
Nodes (8): batch, localPrintPreview(), showLabelPreview(), showPrintPreview(), tsplBytesToDataUrl(), printHtmlInFrame(), printHtmlInWindow(), log

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "send-story-submission.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission(), { handler }, require

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "send-contact.js"
Cohesion: 0.29
Nodes (9): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+1 more)

### Community 115 - "Architecture"
Cohesion: 0.20
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 116 - "documents.js"
Cohesion: 0.40
Nodes (9): receiptDate(), padLeft(), padRight(), receiptHtml(), receiptLayout(), receiptSocialLines(), receiptText(), wrapBalanced() (+1 more)

### Community 117 - "CLS CashFlow"
Cohesion: 0.20
Nodes (9): Appwrite, CLS CashFlow, EmailJS, Files, GitHub Upload, Netlify Deploy, Optional SMTP Environment Variables, Subscription Payments (+1 more)

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

### Community 122 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 126 - "serviceWorker.test.js"
Cohesion: 0.29
Nodes (5): code, handlers, pick(), req(), worker

### Community 127 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

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
Cohesion: 0.33
Nodes (6): Backups and data, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

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
Cohesion: 0.40
Nodes (3): realDeps(), node-appwrite, db

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 145 - "Netlify Story Form Email Setup"
Cohesion: 0.50
Nodes (3): Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup

## Knowledge Gaps
- **675 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+670 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 917 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PosProvider.jsx`, `useData`, `link.js`, `diagnosticsShared.js`, `index.jsx`, `Shell.jsx`, `domain/format.js`, `ModalBody`, `FeaturesTab.jsx`, `SessionProvider.jsx`, `AdminApp.jsx`, `adminApi.js`, `admin.test.js`, `Reports.jsx`, `Tables.jsx`, `subscription.js`, `pos-react/package.json`, `MenuTab.jsx`, `Modal`, `Products.jsx`, `useInstall.js`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `line()` connect `harness.js` to `public/assets/platform.js`, `assets/platform.js`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `key()` connect `PosProvider.jsx` to `public/assets/platform.js`, `assets/platform.js`, `public/sw.js`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _675 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `guard` be split into smaller, more focused modules?**
  _Cohesion score 0.05487269534679543 - nodes in this community are weakly interconnected._
- **Should `PosProvider.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07272727272727272 - nodes in this community are weakly interconnected._
- **Should `useData` be split into smaller, more focused modules?**
  _Cohesion score 0.10327868852459017 - nodes in this community are weakly interconnected._