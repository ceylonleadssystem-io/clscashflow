# Graph Report - clscashflow  (2026-11-02)

## Corpus Check
- 474 files · ~1,271,151 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 4177 nodes · 12651 edges · 186 communities (166 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 301 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a68ad83`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cloud.service.js
- SystemOptionsPages.jsx
- adminAnalytics.js
- app.mjs
- useFeature
- appwrite.js
- domain/inventory.js
- __awaiter
- invoice-share.test.js
- MenuImport.jsx
- guard
- reports.test.js
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore
- menuAdmin.js
- printing.js
- appwriteAdmin
- labelPrinter.js
- send-contact.js
- store.mjs
- pos.mjs
- esc
- labelPrinter
- pos-routing.test.js
- CloudSyncService
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- plans.js
- usePos
- adminInsights.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-login.js
- invoiceEscape
- env.js
- pagePath
- admin-data.cjs
- access.js
- AdminApp.jsx
- presets.js
- pos/sales.js
- ai-keys.js
- portal.test.js
- render
- Tables.jsx
- ref_node_assert
- .toString
- AppwriteException
- salesSplit.test.js
- render
- pos/catalog.js
- boot
- react
- ref_node_module
- bookingDialog
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
- reportPdf.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- LocalAuthProvider
- panels.jsx
- analytics.js
- MenuAdminPages.jsx
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
- receiptPrinter
- SaleRepository
- planFromPath
- planFromPath
- Timesheets.jsx
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- security.js
- User guide
- PosStore.js
- diagnosticsPeer.js
- useData
- account-purge.test.js
- Administrator guide
- cart.js
- salesLog.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- track-visit.cjs
- constants.js
- Architecture
- imageTools.js
- PosProvider.jsx
- Ceylo.jsx
- features.js
- Settings Section Build Spec: what is still pending
- serviceWorker.test.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- models/index.js
- useInstall.js
- ready.js
- bug-report-20260812.test.js
- BaseRepository
- getAdmin
- KdsApp.jsx
- Storage
- scanner.js
- pos-admin-catalog.test.js
- Ceylonry POS — React + WatermelonDB
- printHtmlInFrame
- hardware-order.js
- config-merge.js
- tolerant-match.cjs
- net.js
- admin-app/main.jsx
- Settings section: build status and plan
- appwriteCompat.test.js
- appwrite-files.js
- link.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- submit-ticket.cjs
- growth-partner-commissions.test.js
- pos-admin-rollup.test.js
- POS variants (verticals)
- tests/catalog.test.js
- qa-responsive-flow.test.js
- nowIso
- quote-email-ui.test.js
- send-invite.mjs
- insightsRollup
- settings.js
- devices.js
- adminInsightsParity.test.js
- health.test.js
- README.md
- kitchenPrinters.js
- localAdmin.js
- deleteApproval.js
- docs/README.md
- bug-report-20260813-mobile.test.js
- apps-used.test.js
- payroll.test.js
- bug-report-20260811-email-modal-template.test.js
- submit-subscription-receipt.js
- priority-support-chat.test.js
- poddo-success-story.test.js
- business.js
- POS administration portal
- sanitize
- Deployment & operations
- pos-offline-category.test.js
- AssignmentTree.jsx
- settingsGroups.test.js
- imageStorage.test.js

## God Nodes (most connected - your core abstractions)
1. `useData()` - 182 edges
2. `usePos()` - 175 edges
3. `react` - 118 edges
4. `__awaiter()` - 93 edges
5. `useFeature()` - 93 edges
6. `money()` - 77 edges
7. `AppwriteException` - 74 edges
8. `vitest` - 58 edges
9. `useUi()` - 55 edges
10. `Modal()` - 54 edges

## Surprising Connections (you probably didn't know these)
- `Where data lives (Appwrite project `6a947d6e0012c551dfde`, Singapore)` --references--> `storeFor()`  [INFERRED]
  README.md → netlify/lib/appwrite.js
- `Troubleshooting` --references--> `queryDocuments()`  [INFERRED]
  pos-react/docs/deployment.md → netlify/lib/appwrite.js
- `Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts` --references--> `applyCatalogDrafts()`  [INFERRED]
  docs/settings-build-plan.md → pos-react/src/services/pos/catalog.js
- `Styling` --references--> `base()`  [INFERRED]
  pos-react/docs/architecture.md → reservation-system/js/store.mjs
- `Build` --references--> `base()`  [INFERRED]
  pos-react/docs/deployment.md → reservation-system/js/store.mjs

## Import Cycles
- None detected.

## Communities (186 total, 20 thin omitted)

### Community 0 - "cloud.service.js"
Cohesion: 0.16
Nodes (25): STORAGE, ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted() (+17 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.10
Nodes (69): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), PublishBar() (+61 more)

### Community 2 - "adminAnalytics.js"
Cohesion: 0.15
Nodes (24): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), dailySeries(), day(), DEFAULT_TZ, fmt (+16 more)

### Community 3 - "app.mjs"
Cohesion: 0.09
Nodes (45): ACTIONS, billsOf(), bindGuestFill(), business(), cancelDialog(), canSend(), detailDialog(), ensureGuest() (+37 more)

### Community 4 - "useFeature"
Cohesion: 0.11
Nodes (38): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+30 more)

### Community 5 - "appwrite.js"
Cohesion: 0.08
Nodes (69): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean
}, log (+61 more)

### Community 6 - "domain/inventory.js"
Cohesion: 0.30
Nodes (13): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), hasSizedStock(), isService(), lineSize(), productSizeItem() (+5 more)

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

### Community 9 - "MenuImport.jsx"
Cohesion: 0.16
Nodes (20): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), cell(), firstColumn() (+12 more)

### Community 10 - "guard"
Cohesion: 0.09
Nodes (31): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+23 more)

### Community 11 - "reports.test.js"
Cohesion: 0.26
Nodes (12): firstSub(), groupOf(), MANAGER_ONLY, PAYROLL_ROLES, REPORT_GROUPS, visibleGroups(), useReportGroups(), line() (+4 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.07
Nodes (29): camelToSnake(), columnName(), decode(), defineModel(), defineTable(), pascal(), RESERVED, categories (+21 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (31): log, capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS (+23 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore"
Cohesion: 0.19
Nodes (6): EMPTY_SNAPSHOT(), nextSeq(), nowIso(), PosStore, rawToPlain(), sortBySeq()

### Community 17 - "menuAdmin.js"
Cohesion: 0.09
Nodes (34): catalogDraftChanges(), allowedCategoryKeys(), APPLY_KEYS, assignItems(), brief(), DEFAULT_PREFIXES, draftChanges(), FIELD_LABELS (+26 more)

### Community 18 - "printing.js"
Cohesion: 0.15
Nodes (22): routeKitchenLines(), prepName(), kitchenPrinterHook(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log (+14 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.08
Nodes (33): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+25 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.17
Nodes (24): esc(), barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128() (+16 more)

### Community 21 - "send-contact.js"
Cohesion: 0.29
Nodes (9): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+1 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (35): DEFAULT_SETTINGS, mergeRows(), pushSeating(), readPos(), base(), bucketOf(), BUCKETS, call() (+27 more)

### Community 23 - "pos.mjs"
Cohesion: 0.27
Nodes (14): layoutDialog(), layoutError(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf() (+6 more)

### Community 24 - "esc"
Cohesion: 0.18
Nodes (32): bindTables(), cfg(), dateBar(), esc(), floorName(), floors(), go(), guestOf() (+24 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (33): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+25 more)

### Community 27 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

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
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 34 - "plans.js"
Cohesion: 0.14
Nodes (17): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), DEV_ADMIN, localAdminSession, fmt() (+9 more)

### Community 35 - "usePos"
Cohesion: 0.08
Nodes (57): Delivered (slice 11): moves, business type, admin portal, Modal(), ModalBody(), NumberInput(), planForSettings(), BUSINESS_TYPE_OPTIONS, resolveWelcome(), businessTypeLocked() (+49 more)

### Community 36 - "adminInsights.js"
Cohesion: 0.12
Nodes (45): BarChart(), HourlyPanel(), Kpi(), lkr(), METRICS, one(), RankedBars(), AnalyticsTab() (+37 more)

### Community 37 - "vitest"
Cohesion: 0.13
Nodes (22): makeCtx(), bind(), bindServices(), cash(), addProduct(), createHarness(), line(), noDiscount (+14 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (37): activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day(), GIFT (+29 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.13
Nodes (21): verifyAdmin(), verifyAdmin(), { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store (+13 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "env.js"
Cohesion: 0.08
Nodes (19): env, KdsGate(), getAppwriteCompat(), installGlobalClsBackend(), log, AppwriteAuthProvider, friendlyAuthError(), getAuthService() (+11 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (29): assert, fs, { pagePath }, path, read(), root, test, assert (+21 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "access.js"
Cohesion: 0.20
Nodes (16): FULL_SETTINGS_ROLES, ROLE_VIEWS, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError(), PERMISSION_KEYS (+8 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.13
Nodes (29): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, AdminApp(), fmtDate() (+21 more)

### Community 47 - "presets.js"
Cohesion: 0.23
Nodes (11): BusinessTypeTab(), label(), CAPABILITIES, typesWith(), commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS (+3 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.10
Nodes (41): markSent(), firstShortIngredient(), saleStockNeeds(), modifierLabel(), formatOrderNumber(), isSequential(), mergeOrders(), migrateOrderNumbers() (+33 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 50 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.14
Nodes (39): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, orderTotal() (+31 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.06
Nodes (26): assert, keys, lib, rows, test, assert, keys, test (+18 more)

### Community 55 - "AppwriteException"
Cohesion: 0.14
Nodes (3): AppwriteException, Databases, Teams

### Community 56 - "salesSplit.test.js"
Cohesion: 0.17
Nodes (10): createDatabase(), combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef (+2 more)

### Community 57 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 58 - "pos/catalog.js"
Cohesion: 0.17
Nodes (22): productCategories(), carryCategoryRename(), addCategory(), addCommonModifiers(), addSubcategory(), applyCatalogDrafts(), deleteCategory(), deleteModifier() (+14 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "react"
Cohesion: 0.06
Nodes (67): Gate(), Loading(), Ready(), Root(), AssistMissing(), CloudBanner(), IosInstallGuide(), NavIcon() (+59 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "bookingDialog"
Cohesion: 0.19
Nodes (20): bookingDialog(), dialog(), dlg(), saveSettings(), seatDialog(), setStatus(), toast(), waitDialog() (+12 more)

### Community 63 - "subscription.js"
Cohesion: 0.18
Nodes (20): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+12 more)

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
Nodes (24): walk(), assert, compat, fs, path, test, assert, fs (+16 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "payable-webhook.cjs"
Cohesion: 0.24
Nodes (18): authCandidates(), clean(), crypto, firstValue(), { getAdmin }, handler(), header(), headers() (+10 more)

### Community 70 - "diagnostics-store.js"
Cohesion: 0.08
Nodes (34): { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, audit(), { Databases, Query, ID }, db() (+26 more)

### Community 71 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+13 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "reportPdf.js"
Cohesion: 0.29
Nodes (5): buildReportPdf(), downloadReportPdf(), PLAIN, jspdf, jspdf-autotable

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

### Community 80 - "panels.jsx"
Cohesion: 0.07
Nodes (60): how(), KitchenStations(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel() (+52 more)

### Community 81 - "analytics.js"
Cohesion: 0.15
Nodes (24): VIP_SPEND, birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerStats(), dashboardData() (+16 more)

### Community 82 - "MenuAdminPages.jsx"
Cohesion: 0.09
Nodes (58): TextAreaRow(), categoryKey(), stalePresetCategory(), visibleProductCategories(), ARRAY_FIELDS, categoryEditError(), cleanCategoryEdit(), cleanGroupEdit() (+50 more)

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
Cohesion: 0.24
Nodes (17): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+9 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (34): AssistBar(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+26 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "Timesheets.jsx"
Cohesion: 0.25
Nodes (15): dayOf(), entryError(), entryLocked(), fromLocalInput(), LOCK_MONTHS, lockDate(), MAX_SHIFT_MS, ms() (+7 more)

### Community 98 - "documents.js"
Cohesion: 0.18
Nodes (17): receiptName(), receiptDate(), padLeft(), padRight(), receiptHtml(), receiptLayout(), receiptMessage(), receiptSocialLines() (+9 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.10
Nodes (31): adminSignals(), buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS (+23 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "security.js"
Cohesion: 0.06
Nodes (52): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+44 more)

### Community 102 - "User guide"
Cohesion: 0.11
Nodes (18): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Menu Admin (Settings), Open orders & kitchen (restaurant / café), Printers by device (Settings > Device Manager), Products, categories, modifiers (+10 more)

### Community 103 - "PosStore.js"
Cohesion: 0.24
Nodes (11): encode(), attachLines(), hintSeq(), LEGACY_ARRAY_TABLES, log, canonical(), comparable(), lineRowId() (+3 more)

### Community 104 - "diagnosticsPeer.js"
Cohesion: 0.22
Nodes (15): discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog(), saveLog() (+7 more)

### Community 105 - "useData"
Cohesion: 0.09
Nodes (45): Kpi(), OWNER_ROLES, REPORTING_ROLES, customerSegment(), defaultRange(), rangeDates(), csvEscape(), downloadCsv() (+37 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.26
Nodes (9): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), realDeps(), assert, { createPurger, kindOf, imageIdsOf } (+1 more)

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "cart.js"
Cohesion: 0.29
Nodes (12): addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature(), selectionExtra() (+4 more)

### Community 109 - "salesLog.js"
Cohesion: 0.31
Nodes (11): userName(), staffName(), day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails() (+3 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.19
Nodes (17): accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages(), loadPlatformScript(), log, openBankTransfer() (+9 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "constants.js"
Cohesion: 0.12
Nodes (23): ADJUST_REASONS, CUSTOMER_TYPES, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, DEFAULT_RECEIPT_FOOTER, PAYMENT_ICONS, PAYMENT_METHODS, PLATFORM_CHANNELS (+15 more)

### Community 115 - "Architecture"
Cohesion: 0.18
Nodes (11): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, PosStore, Responsive layout (+3 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "PosProvider.jsx"
Cohesion: 0.10
Nodes (31): Ctx, SystemOptionsProvider(), UI_THEMES, MANAGER_ROLES, ROLES, SETTINGS_PAGE_OF_VIEW, VIEW_TITLES, applyPatch() (+23 more)

### Community 118 - "Ceylo.jsx"
Cohesion: 0.16
Nodes (22): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+14 more)

### Community 119 - "features.js"
Cohesion: 0.18
Nodes (17): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+9 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "serviceWorker.test.js"
Cohesion: 0.12
Nodes (13): isHashed(), SHELL, store(), strategyFor(), 6. Services (abstractions), useServices(), ctx(), code (+5 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "models/index.js"
Cohesion: 0.18
Nodes (10): CashShift, Customer, InventoryItem, Location, ModifierGroup, Product, Sale, SaleLine (+2 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 128 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 129 - "BaseRepository"
Cohesion: 0.06
Nodes (16): 5. Data layer (WatermelonDB), categoryId(), BaseRepository, CashShiftRepository, CategoryRepository, createRepositories(), CustomerRepository, generic() (+8 more)

### Community 130 - "getAdmin"
Cohesion: 0.17
Nodes (14): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+6 more)

### Community 131 - "KdsApp.jsx"
Cohesion: 0.26
Nodes (15): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, KDS_DESTINATION, kdsStatus(), kdsTickets(), NEXT (+7 more)

### Community 133 - "scanner.js"
Cohesion: 0.25
Nodes (8): sizeSlug(), findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), createEmitter()

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 136 - "printHtmlInFrame"
Cohesion: 0.40
Nodes (7): batch, localPrintPreview(), showLabelPreview(), showPrintPreview(), tsplBytesToDataUrl(), printHtmlInFrame(), printHtmlInWindow()

### Community 137 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "net.js"
Cohesion: 0.36
Nodes (11): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), run() (+3 more)

### Community 141 - "admin-app/main.jsx"
Cohesion: 0.24
Nodes (5): App(), ErrorBoundary, DialogModal(), UiProvider(), react-dom

### Community 142 - "Settings section: build status and plan"
Cohesion: 0.15
Nodes (12): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 6): Taxes, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts (+4 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "link.js"
Cohesion: 0.38
Nodes (11): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+3 more)

### Community 152 - "submit-ticket.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), headers(), nodemailer, { handler }, require

### Community 153 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 154 - "pos-admin-rollup.test.js"
Cohesion: 0.22
Nodes (9): assert, end, fs, iso(), sale(), salesRollup, source, start (+1 more)

### Community 155 - "POS variants (verticals)"
Cohesion: 0.40
Nodes (4): Add a new business type, Add a new module (for example vehicles and job cards for Automotive), POS variants (verticals), Rules

### Community 156 - "tests/catalog.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 157 - "qa-responsive-flow.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 158 - "nowIso"
Cohesion: 0.10
Nodes (52): T, TABLE_BY_NAME, parseStockCountRows(), isEmail(), nowIso(), phoneKey(), whatsappPhone(), adjustmentChange() (+44 more)

### Community 159 - "quote-email-ui.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 160 - "send-invite.mjs"
Cohesion: 0.38
Nodes (5): esc(), handler(), nodemailer, { handler }, require

### Community 162 - "settings.js"
Cohesion: 0.12
Nodes (40): jobsOf(), cleanStations(), cleanSalesCategory(), nextDrafts(), workingOf(), taxUses(), isDataImage(), storeImage() (+32 more)

### Community 163 - "devices.js"
Cohesion: 0.16
Nodes (25): asStation(), connection(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf(), KITCHEN_CONNECTIONS (+17 more)

### Community 164 - "adminInsightsParity.test.js"
Cohesion: 0.29
Nodes (7): ago(), end, payload, sale(), server, src, start

### Community 165 - "health.test.js"
Cohesion: 0.42
Nodes (6): formatBytes(), healthIssues(), rateLatency(), cleanKds(), KDS_DEFAULTS, whole()

### Community 166 - "README.md"
Cohesion: 0.09
Nodes (15): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Applications, Backend (+7 more)

### Community 167 - "kitchenPrinters.js"
Cohesion: 0.29
Nodes (10): kotEscPos(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket(), claimUsbOutput() (+2 more)

### Community 168 - "localAdmin.js"
Cohesion: 0.15
Nodes (18): sendAdminRequest(), getStore(), invoices(), localAdminApi(), flagsWithPlan(), databaseNameFor(), log, migrations (+10 more)

### Community 169 - "deleteApproval.js"
Cohesion: 0.33
Nodes (5): categorySettingBlank(), categorySettingsById(), DEFAULT_GRACE, MAX_GRACE, removalNeedsApproval()

### Community 170 - "docs/README.md"
Cohesion: 0.12
Nodes (10): Conventions, Debugging, Development guide, Recipes, Setup, Ceylonry POS — Documentation, Automated coverage, Harness (+2 more)

### Community 171 - "bug-report-20260813-mobile.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 172 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 173 - "payroll.test.js"
Cohesion: 0.22
Nodes (16): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+8 more)

### Community 174 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 175 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 176 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 177 - "poddo-success-story.test.js"
Cohesion: 0.29
Nodes (6): assert, fs, page, path, root, test

### Community 178 - "business.js"
Cohesion: 0.33
Nodes (5): appMeta, locationAudit, locations, settings, supportAudit

### Community 179 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 180 - "sanitize"
Cohesion: 0.67
Nodes (3): createLogger(), write(), sanitize()

### Community 181 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 182 - "pos-offline-category.test.js"
Cohesion: 0.29
Nodes (6): assert, fs, path, root, test, worker

## Knowledge Gaps
- **888 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+883 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1169 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `BaseRepository`, `adminAnalytics.js`, `KdsApp.jsx`, `scanner.js`, `domain/inventory.js`, `MenuImport.jsx`, `reports.test.js`, `logger.js`, `appwriteCompat.test.js`, `menuAdmin.js`, `labelPrinter.js`, `plans.js`, `devices.js`, `adminInsights.js`, `adminInsightsParity.test.js`, `health.test.js`, `env.js`, `access.js`, `AdminApp.jsx`, `presets.js`, `pos/sales.js`, `payroll.test.js`, `portal.test.js`, `Tables.jsx`, `salesSplit.test.js`, `settingsGroups.test.js`, `imageStorage.test.js`, `subscription.js`, `pos-react/package.json`, `ref_node_fs`, `panels.jsx`, `analytics.js`, `assist.js`, `Timesheets.jsx`, `documents.js`, `diagnosticsShared.js`, `useData`, `salesLog.js`, `constants.js`, `PosProvider.jsx`, `features.js`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `SystemOptionsPages.jsx`, `KdsApp.jsx`, `useFeature`, `MenuImport.jsx`, `admin-app/main.jsx`, `logger.js`, `plans.js`, `usePos`, `adminInsights.js`, `env.js`, `AdminApp.jsx`, `presets.js`, `Tables.jsx`, `AssignmentTree.jsx`, `subscription.js`, `pos-react/package.json`, `panels.jsx`, `MenuAdminPages.jsx`, `ReportPage.jsx`, `assist.js`, `Timesheets.jsx`, `diagnosticsPeer.js`, `useData`, `SessionProvider.jsx`, `PosProvider.jsx`, `Ceylo.jsx`, `features.js`, `serviceWorker.test.js`, `useInstall.js`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `5. Data layer (WatermelonDB)` connect `BaseRepository` to `Ceylonry POS — React + WatermelonDB`, `assets/catalog.js`, `defineTable.js`, `PosStore`, `PosProvider.jsx`, `store.mjs`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _888 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SystemOptionsPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10284810126582279 - nodes in this community are weakly interconnected._
- **Should `adminAnalytics.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1455026455026455 - nodes in this community are weakly interconnected._
- **Should `app.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08788159111933395 - nodes in this community are weakly interconnected._