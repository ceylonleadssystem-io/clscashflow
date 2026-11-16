# Graph Report - clscashflow  (2026-11-03)

## Corpus Check
- 477 files · ~1,273,945 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 4206 nodes · 12732 edges · 183 communities (161 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 300 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `594483fa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cloud.service.js
- MenuAdminPages.jsx
- account-danger-zone.js
- app.mjs
- react
- appwrite.js
- domain/inventory.js
- __awaiter
- clean
- createLogger
- adminApi.js
- pos/inventory.js
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
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
- admin-store.js
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
- PortalShell.jsx
- ref_node_module
- handle
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
- receipt.test.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- LocalAuthProvider
- useData
- EndOfDay.jsx
- taxes.test.js
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
- scanner.js
- SaleRepository
- planFromPath
- planFromPath
- pos/staff.js
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- guard
- User guide
- 5. Data layer (WatermelonDB)
- diagnosticsPeer.js
- ViewRouter.jsx
- account-purge.test.js
- Administrator guide
- domain.test.js
- salesLog.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- track-visit.cjs
- constants.js
- Architecture
- imageTools.js
- SettingsHome.jsx
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
- repositories/index.js
- getAdmin
- KdsApp.jsx
- Storage
- BaseRepository
- pos-admin-catalog.test.js
- Ceylonry POS — React + WatermelonDB
- SettingsRepository
- locations.js
- config-merge.js
- tolerant-match.cjs
- net.js
- App.jsx
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
- pos-reported-bugs.test.js
- imageStorage.js
- nowIso
- bug-report-20260810.test.js
- onboarding-terms-acceptance.test.js
- insightsRollup
- settings.js
- devices.js
- seo.test.js
- health.test.js
- README.md
- kitchenPrinters.js
- localAdmin.js
- Project structure
- docs/README.md
- bug-report-20260813-mobile.test.js
- apps-used.test.js
- CategoryRepository
- bug-report-20260811-email-modal-template.test.js
- submit-subscription-receipt.js
- FakePc
- InventoryRepository
- POS administration portal
- Deployment & operations
- pos-offline-category.test.js
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
8. `vitest` - 60 edges
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
- `5. Data layer (WatermelonDB)` --references--> `categories()`  [INFERRED]
  pos-react/README.md → assets/catalog.js

## Import Cycles
- None detected.

## Communities (183 total, 22 thin omitted)

### Community 0 - "cloud.service.js"
Cohesion: 0.16
Nodes (25): STORAGE, ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted() (+17 more)

### Community 1 - "MenuAdminPages.jsx"
Cohesion: 0.06
Nodes (115): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AssignmentTree(), GroupBox(), AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList() (+107 more)

### Community 2 - "account-danger-zone.js"
Cohesion: 0.11
Nodes (28): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean
}, log (+20 more)

### Community 3 - "app.mjs"
Cohesion: 0.08
Nodes (49): ACTIONS, billsOf(), bindGuestFill(), business(), canSend(), detailDialog(), dlg(), ensureGuest() (+41 more)

### Community 4 - "react"
Cohesion: 0.11
Nodes (46): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+38 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (52): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+44 more)

### Community 6 - "domain/inventory.js"
Cohesion: 0.31
Nodes (13): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), hasSizedStock(), isService(), lineSize(), productSizeItem() (+5 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "clean"
Cohesion: 0.11
Nodes (49): {
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
}, publicBase(), response() (+41 more)

### Community 9 - "createLogger"
Cohesion: 0.14
Nodes (24): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), cell(), firstColumn() (+16 more)

### Community 10 - "adminApi.js"
Cohesion: 0.21
Nodes (10): log, sendAdminRequest(), adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText() (+2 more)

### Community 11 - "pos/inventory.js"
Cohesion: 0.32
Nodes (12): parseStockCountRows(), adjustmentChange(), stockMovement(), applyStockChange(), movementRow(), activeLocationId(), adjustStock(), importStockCountFile() (+4 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (33): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+25 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (32): capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS, interactiveTarget() (+24 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (18): PosStore, decode(), encode(), attachLines(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq() (+10 more)

### Community 17 - "menuAdmin.js"
Cohesion: 0.12
Nodes (29): PublishBar(), missingRequiredGroup(), catalogDraftChanges(), assignItems(), brief(), DEFAULT_PREFIXES, draftChanges(), FIELD_LABELS (+21 more)

### Community 18 - "printing.js"
Cohesion: 0.17
Nodes (20): routeKitchenLines(), prepName(), kitchenPrinterHook(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log (+12 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.08
Nodes (33): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+25 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.16
Nodes (25): esc(), barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128() (+17 more)

### Community 21 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (41): Build, go(), refreshPos(), addDays(), dateStr(), mergeRows(), monthOf(), readPos() (+33 more)

### Community 23 - "pos.mjs"
Cohesion: 0.30
Nodes (13): layoutDialog(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf(), fromPos() (+5 more)

### Community 24 - "esc"
Cohesion: 0.15
Nodes (42): bindTables(), bookingDialog(), cancelDialog(), cfg(), dateBar(), dialog(), esc(), floorName() (+34 more)

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
Cohesion: 0.14
Nodes (19): ACCOUNT_STATUSES, accountStatus(), { appsUsed }, { appwriteAdmin }, clean(), cleanFounders(), cleanSubscription(), configMerge (+11 more)

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
Nodes (18): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), DEV_ADMIN, localAdminSession, fmt() (+10 more)

### Community 35 - "usePos"
Cohesion: 0.08
Nodes (56): Gate(), CloudBanner(), Shell(), ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker() (+48 more)

### Community 36 - "adminInsights.js"
Cohesion: 0.06
Nodes (76): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), BarChart(), HourlyPanel(), Kpi(), lkr() (+68 more)

### Community 37 - "vitest"
Cohesion: 0.18
Nodes (15): makeCtx(), cash(), addProduct(), createHarness(), line(), noDiscount, openShift(), productForm() (+7 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.07
Nodes (53): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+45 more)

### Community 40 - "admin-store.js"
Cohesion: 0.07
Nodes (39): verifyAdmin(), { getAdmin, audit }, { guard, reply }, handler(), { isAdminEmail, verifyToken }, log, store, verifyAdmin() (+31 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "env.js"
Cohesion: 0.10
Nodes (15): env, forgetUser(), getAppwriteCompat(), installGlobalClsBackend(), log, rememberedUser(), rememberUser(), log (+7 more)

### Community 43 - "pagePath"
Cohesion: 0.06
Nodes (35): assert, fs, { pagePath }, path, read(), root, test, assert (+27 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "access.js"
Cohesion: 0.19
Nodes (18): FULL_SETTINGS_ROLES, ROLE_VIEWS, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError(), jobsOf() (+10 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.22
Nodes (20): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), AdminApp(), fmtDate(), log (+12 more)

### Community 47 - "presets.js"
Cohesion: 0.21
Nodes (12): BusinessTypeTab(), label(), CAPABILITIES, typesWith(), commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS (+4 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.19
Nodes (20): markSent(), firstShortIngredient(), saleStockNeeds(), modifierLabel(), makeDiscountLine(), makeServiceLine(), makeTaxLine(), kitchenMode() (+12 more)

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
Cohesion: 0.18
Nodes (32): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+24 more)

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
Nodes (21): T, TABLE_BY_NAME, productCategories(), carryCategoryRename(), addCategory(), applyCatalogDrafts(), deleteCategory(), deleteModifier() (+13 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "PortalShell.jsx"
Cohesion: 0.08
Nodes (38): IosInstallGuide(), NavIcon(), PATHS, PATHS, PortalIcon(), PortalHome(), PortalSettingsPage, PortalShell() (+30 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "handle"
Cohesion: 0.23
Nodes (12): addBillingPeriod(), clampNum(), defaultWorkspace(), handle(), headers(), isPosUser(), loadWorkspace(), paymentState() (+4 more)

### Community 63 - "subscription.js"
Cohesion: 0.18
Nodes (18): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+10 more)

### Community 64 - "logic.mjs"
Cohesion: 0.11
Nodes (28): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+20 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (40): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, react, react-dom (+32 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.08
Nodes (23): walk(), assert, fs, { pagePath }, path, read(), root, test (+15 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "payable-webhook.cjs"
Cohesion: 0.24
Nodes (18): authCandidates(), clean(), crypto, firstValue(), { getAdmin }, handler(), header(), headers() (+10 more)

### Community 70 - "diagnostics-store.js"
Cohesion: 0.15
Nodes (20): serverClient(), { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired() (+12 more)

### Community 71 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+14 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "receipt.test.js"
Cohesion: 0.18
Nodes (11): isNum(), reportHtml(), buildReportPdf(), downloadReportPdf(), pdfSupportsText(), PLAIN, ctx, sale (+3 more)

### Community 74 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 75 - "Working rules: do not break existing functionality"
Cohesion: 0.12
Nodes (16): 10. Do not claim testing that was not done, 11. Dependencies, 12. Database and API safety, 13. When something breaks, 14. Final response format, 1. Change only what is required, 2. Before coding, decide, 3. Preserve existing behaviour (+8 more)

### Community 76 - "kds-store.js"
Cohesion: 0.27
Nodes (16): { ADMIN_DATABASE_ID }, bad(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 77 - "mountBillingWidget"
Cohesion: 0.18
Nodes (15): billingCycleFor(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount(), injectBillingCardStyle(), isProfilePaidRecord() (+7 more)

### Community 78 - "appwrite-sdk.js"
Cohesion: 0.11
Nodes (6): Functions, Graphql, Messaging, Permission, Query, Service

### Community 79 - "LocalAuthProvider"
Cohesion: 0.11
Nodes (6): 6. Services (abstractions), AppwriteAuthProvider, LocalAuthProvider, passwordHash(), useServices(), ctx()

### Community 80 - "useData"
Cohesion: 0.06
Nodes (76): CeyloAiKeyPanel(), PROVIDERS, how(), KitchenStations(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel() (+68 more)

### Community 81 - "EndOfDay.jsx"
Cohesion: 0.17
Nodes (27): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+19 more)

### Community 82 - "taxes.test.js"
Cohesion: 0.20
Nodes (14): calculateTaxes(), cleanTax(), MAX_RATE, partsOf(), previewTax(), round2(), taxIdFor(), text() (+6 more)

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
Cohesion: 0.15
Nodes (25): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+17 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.13
Nodes (32): AssistBar(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+24 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "scanner.js"
Cohesion: 0.15
Nodes (8): receiptPrinter, findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), createEmitter()

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "pos/staff.js"
Cohesion: 0.17
Nodes (22): AUDIT_ACTION, auditDetails(), dayOf(), diffEntry(), entryError(), entryLocked(), fromLocalInput(), LOCK_MONTHS (+14 more)

### Community 98 - "documents.js"
Cohesion: 0.29
Nodes (12): receiptName(), receiptDate(), kotBody(), padLeft(), padRight(), prepLines(), receiptLayout(), receiptMessage() (+4 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.11
Nodes (28): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+20 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "guard"
Cohesion: 0.04
Nodes (83): esc(), handler(), nodemailer, { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log (+75 more)

### Community 102 - "User guide"
Cohesion: 0.10
Nodes (20): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Menu Admin (Settings), Open orders & kitchen (restaurant / café), Printers by device (Settings > Device Manager) (+12 more)

### Community 103 - "5. Data layer (WatermelonDB)"
Cohesion: 0.20
Nodes (3): 5. Data layer (WatermelonDB), CustomerRepository, ProductRepository

### Community 104 - "diagnosticsPeer.js"
Cohesion: 0.22
Nodes (15): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+7 more)

### Community 105 - "ViewRouter.jsx"
Cohesion: 0.06
Nodes (56): Kpi(), Panel(), today(), batchStatus(), commissionRows(), customerName(), ACTIVE_STATUSES, activeTimeEntry() (+48 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "domain.test.js"
Cohesion: 0.14
Nodes (24): addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature() (+16 more)

### Community 109 - "salesLog.js"
Cohesion: 0.24
Nodes (14): userName(), applyReversal(), calculateRefundAmount(), refundRate(), day(), DELETED_ACTION, deletedDetails(), findApprover() (+6 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.15
Nodes (21): KdsGate(), friendlyAuthError(), getAuthService(), accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages() (+13 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "constants.js"
Cohesion: 0.12
Nodes (23): ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, DEFAULT_RECEIPT_FOOTER, PAYMENT_ICONS, PAYMENT_METHODS, PLATFORM_CHANNELS, SPLIT_PAYMENT_METHODS (+15 more)

### Community 115 - "Architecture"
Cohesion: 0.20
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "SettingsHome.jsx"
Cohesion: 0.11
Nodes (32): Delivered (slice 11): moves, business type, admin portal, SaveBar(), SettingsShell(), TopRow(), Ctx, SystemOptionsProvider(), applyPatch(), autoClockOutDue() (+24 more)

### Community 118 - "Ceylo.jsx"
Cohesion: 0.13
Nodes (28): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+20 more)

### Community 119 - "features.js"
Cohesion: 0.16
Nodes (20): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+12 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "serviceWorker.test.js"
Cohesion: 0.15
Nodes (9): isHashed(), SHELL, strategyFor(), code, handlers, pick(), req(), worker (+1 more)

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

### Community 129 - "repositories/index.js"
Cohesion: 0.16
Nodes (7): CashShiftRepository, createRepositories(), generic(), OpenOrderRepository, StockMovementRepository, TimeEntryRepository, UserRepository

### Community 130 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 131 - "KdsApp.jsx"
Cohesion: 0.22
Nodes (22): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+14 more)

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 137 - "locations.js"
Cohesion: 0.29
Nodes (8): audit(), bind(), bindServices(), auditLocationSwitch(), auditLogin(), log, saveLocation(), approveItemRemoval()

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 141 - "App.jsx"
Cohesion: 0.15
Nodes (15): App(), Loading(), Ready(), Root(), ErrorBoundary, log, AssistMissing(), BusinessGate() (+7 more)

### Community 142 - "Settings section: build status and plan"
Cohesion: 0.15
Nodes (12): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 6): Taxes, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts (+4 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+4 more)

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

### Community 156 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 157 - "imageStorage.js"
Cohesion: 0.36
Nodes (8): authHeaders(), call(), isDataImage(), log, setUploadFailureHandler(), storeImage(), moveImagesToCloud(), publishMenu()

### Community 158 - "nowIso"
Cohesion: 0.16
Nodes (28): isEmail(), nowIso(), phoneKey(), whatsappPhone(), addSubcategory(), saveModifier(), newId(), stamp() (+20 more)

### Community 159 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 160 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 162 - "settings.js"
Cohesion: 0.10
Nodes (39): deviceNameError(), cleanStations(), APPLY_KEYS, PAGE_KEYS, SALES_DEFAULTS, taxUses(), addCommonModifiers(), addStandardSalesCategories() (+31 more)

### Community 163 - "devices.js"
Cohesion: 0.16
Nodes (23): asStation(), connection(), copyPrinters(), device(), DEVICE_KINDS, devicesOf(), KITCHEN_CONNECTIONS, MAX_COPIES (+15 more)

### Community 164 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 165 - "health.test.js"
Cohesion: 0.40
Nodes (7): formatBytes(), healthIssues(), rateLatency(), cleanKds(), KDS_DEFAULTS, kdsSettingsOf(), whole()

### Community 166 - "README.md"
Cohesion: 0.13
Nodes (9): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification (+1 more)

### Community 167 - "kitchenPrinters.js"
Cohesion: 0.17
Nodes (19): openKotWindow(), kotEscPos(), kotHtml(), claimed, endpointFor(), identity(), log, matches() (+11 more)

### Community 168 - "localAdmin.js"
Cohesion: 0.16
Nodes (19): getStore(), invoices(), localAdminApi(), createDatabase(), databaseNameFor(), log, migrations, modelClasses (+11 more)

### Community 169 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 170 - "docs/README.md"
Cohesion: 0.12
Nodes (10): Conventions, Debugging, Development guide, Recipes, Setup, Ceylonry POS — Documentation, Automated coverage, Harness (+2 more)

### Community 171 - "bug-report-20260813-mobile.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 172 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 174 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 175 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 179 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 181 - "Deployment & operations"
Cohesion: 0.33
Nodes (6): Backups and data, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 182 - "pos-offline-category.test.js"
Cohesion: 0.29
Nodes (6): assert, fs, path, root, test, worker

## Knowledge Gaps
- **892 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+887 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1182 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `KdsApp.jsx`, `createLogger`, `adminApi.js`, `net.js`, `logger.js`, `appwriteCompat.test.js`, `menuAdmin.js`, `labelPrinter.js`, `plans.js`, `devices.js`, `adminInsights.js`, `health.test.js`, `reportBuilders.js`, `localAdmin.js`, `env.js`, `access.js`, `presets.js`, `portal.test.js`, `Tables.jsx`, `salesSplit.test.js`, `settingsGroups.test.js`, `imageStorage.test.js`, `subscription.js`, `pos-react/package.json`, `ref_node_fs`, `receipt.test.js`, `useData`, `EndOfDay.jsx`, `taxes.test.js`, `ReportPage.jsx`, `assist.js`, `scanner.js`, `pos/staff.js`, `diagnosticsShared.js`, `ViewRouter.jsx`, `domain.test.js`, `salesLog.js`, `constants.js`, `SettingsHome.jsx`, `features.js`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `MenuAdminPages.jsx`, `KdsApp.jsx`, `createLogger`, `adminApi.js`, `App.jsx`, `menuAdmin.js`, `plans.js`, `usePos`, `adminInsights.js`, `env.js`, `AdminApp.jsx`, `presets.js`, `Tables.jsx`, `PortalShell.jsx`, `subscription.js`, `pos-react/package.json`, `useData`, `EndOfDay.jsx`, `ReportPage.jsx`, `assist.js`, `diagnosticsPeer.js`, `ViewRouter.jsx`, `SessionProvider.jsx`, `SettingsHome.jsx`, `Ceylo.jsx`, `features.js`, `serviceWorker.test.js`, `useInstall.js`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `5. Data layer (WatermelonDB)` connect `5. Data layer (WatermelonDB)` to `BaseRepository`, `Ceylonry POS — React + WatermelonDB`, `assets/catalog.js`, `defineTable.js`, `PosStore.js`, `useData`, `store.mjs`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _892 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MenuAdminPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06422244094488189 - nodes in this community are weakly interconnected._
- **Should `account-danger-zone.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11182795698924732 - nodes in this community are weakly interconnected._
- **Should `app.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._