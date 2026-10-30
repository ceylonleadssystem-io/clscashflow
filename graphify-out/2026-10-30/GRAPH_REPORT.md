# Graph Report - clscashflow  (2026-10-30)

## Corpus Check
- 461 files · ~1,254,767 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 4064 nodes · 12185 edges · 184 communities (168 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 293 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0c5bf60a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- diagnostics.service.js
- SystemOptionsPages.jsx
- adminAnalytics.js
- account.js
- react
- appwrite.js
- PortalShell.jsx
- __awaiter
- clean
- createLogger
- settings.js
- App.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- account-danger-zone.js
- printing.js
- appwriteAdmin
- labelPrinter.js
- guard
- store.mjs
- pos.mjs
- app.mjs
- labelPrinter
- pos-routing.test.js
- menuAdmin.js
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- plans.js
- usePos
- pos/sales.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-login.js
- invoiceEscape
- SessionProvider.jsx
- pagePath
- admin-data.cjs
- access.js
- AdminApp.jsx
- kitchenPrinters.js
- common.js
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
- PosProvider.jsx
- ref_node_module
- BaseRepository
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
- public/sw.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- auth.service.js
- panels.jsx
- useData
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
- serviceWorker.test.js
- hash-admin-password.mjs
- planFromPath
- planFromPath
- constants.js
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- pos-reported-bugs.test.js
- User guide
- admin-app/main.jsx
- link.js
- EndOfDay.jsx
- account-purge.test.js
- Administrator guide
- send-contact.js
- net.js
- kds-pair.test.js
- Locale
- imageStorage.js
- track-visit.cjs
- cloud.service.js
- Architecture
- imageTools.js
- admin-store.js
- Ceylo.jsx
- features.js
- Settings Section Build Spec: what is still pending
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- admin-visits-conversion.test.js
- useInstall.js
- ready.js
- bug-report-20260812.test.js
- SaleRepository
- getAdmin
- appwriteCompat.test.js
- Storage
- Development guide
- pos-admin-catalog.test.js
- 5. Data layer (WatermelonDB)
- Deployment & operations
- hardware-order.js
- config-merge.js
- tolerant-match.cjs
- bug-report-20260811-email-modal-template.test.js
- KdsApp.jsx
- reports.test.js
- EmailJS order e-mail template
- appwrite-files.js
- repositories/index.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- submit-ticket.cjs
- growth-partner-commissions.test.js
- pos-admin-rollup.test.js
- POS variants (verticals)
- salesLog.js
- taxes.test.js
- nowIso
- catalogExport.test.js
- node-appwrite
- seo.test.js
- thirdPartyPayments.js
- DevicePages.jsx
- domain/catalog.js
- quote-email-ui.test.js
- Project structure
- receiptPrinter
- database.js
- send-welcome.mjs
- README.md
- support.js
- 4. Run it locally for testing
- payroll.test.js
- priority-support-chat.test.js
- submit-subscription-receipt.js
- localAdmin.js
- scanner.js
- Settings section: build status and plan
- businessTypeLocked
- IMPORTANT: This is NOT a rebuild of the POS system.
- Netlify Story Form Email Setup
- POS administration portal
- printHtmlInFrame

## God Nodes (most connected - your core abstractions)
1. `useData()` - 175 edges
2. `usePos()` - 168 edges
3. `react` - 114 edges
4. `__awaiter()` - 93 edges
5. `useFeature()` - 86 edges
6. `money()` - 77 edges
7. `AppwriteException` - 74 edges
8. `useUi()` - 55 edges
9. `Modal()` - 54 edges
10. `vitest` - 52 edges

## Surprising Connections (you probably didn't know these)
- `Where data lives (Appwrite project `6a947d6e0012c551dfde`, Singapore)` --references--> `storeFor()`  [INFERRED]
  README.md → netlify/lib/appwrite.js
- `Troubleshooting` --references--> `queryDocuments()`  [INFERRED]
  pos-react/docs/deployment.md → netlify/lib/appwrite.js
- `Delivered (slice 11): moves, business type, admin portal` --references--> `businessTypeLocked()`  [INFERRED]
  docs/settings-build-plan.md → pos-react/src/domain/businessType.js
- `Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts` --references--> `applyCatalogDrafts()`  [INFERRED]
  docs/settings-build-plan.md → pos-react/src/services/pos/catalog.js
- `Styling` --references--> `base()`  [INFERRED]
  pos-react/docs/architecture.md → reservation-system/js/store.mjs

## Import Cycles
- None detected.

## Communities (184 total, 16 thin omitted)

### Community 0 - "diagnostics.service.js"
Cohesion: 0.13
Nodes (22): adminSignals(), buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS (+14 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.15
Nodes (55): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), ConditionalGroup() (+47 more)

### Community 2 - "adminAnalytics.js"
Cohesion: 0.24
Nodes (17): BarChart(), Kpi(), lkr(), RankedBars(), AnalyticsTab(), RANGES, OverallAnalytics(), dailySeries() (+9 more)

### Community 3 - "account.js"
Cohesion: 0.15
Nodes (24): STORAGE, EMPTY_SNAPSHOT(), cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted(), freshAccountDb(), log (+16 more)

### Community 4 - "react"
Cohesion: 0.10
Nodes (46): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+38 more)

### Community 5 - "appwrite.js"
Cohesion: 0.10
Nodes (57): deleteOperationalData(), deleteWorkspace(), feedbackId(), nowIso(), saveFeedback(), bodyOf(), handle(), handler() (+49 more)

### Community 6 - "PortalShell.jsx"
Cohesion: 0.20
Nodes (17): PATHS, PortalIcon(), MenuAdminPortal, PortalHome(), PortalShell(), Reports, Settings, Shop (+9 more)

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
Cohesion: 0.25
Nodes (14): log, MenuImport(), NUMBERS, log, MenuTab(), env, catalogueNumber(), firstColumn() (+6 more)

### Community 10 - "settings.js"
Cohesion: 0.11
Nodes (43): jobError(), jobsOf(), ROLE_JOBS, device(), deviceNameError(), devicesOf(), text(), cleanStations() (+35 more)

### Community 11 - "App.jsx"
Cohesion: 0.09
Nodes (38): Gate(), Loading(), Ready(), Root(), AssistMissing(), CloudBanner(), IosInstallGuide(), NavIcon() (+30 more)

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

### Community 16 - "PosStore.js"
Cohesion: 0.12
Nodes (19): PosStore, decode(), encode(), attachLines(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq() (+11 more)

### Community 17 - "account-danger-zone.js"
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

### Community 18 - "printing.js"
Cohesion: 0.19
Nodes (18): prepName(), kitchenPrinterHook(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log, printKotForSale() (+10 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.07
Nodes (37): { appwriteAdmin }, clean(), esc(), handler(), log, nodemailer, reply(), { appwriteAdmin } (+29 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.18
Nodes (22): esc(), barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128() (+14 more)

### Community 21 - "guard"
Cohesion: 0.06
Nodes (59): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, handler(), corsHeaders, { guard, siteOrigin } (+51 more)

### Community 22 - "store.mjs"
Cohesion: 0.10
Nodes (45): go(), queueSeating(), refreshPos(), signInView(), start(), viewMessages(), addDays(), dateStr() (+37 more)

### Community 23 - "pos.mjs"
Cohesion: 0.23
Nodes (16): layoutDialog(), syncGuests(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf() (+8 more)

### Community 24 - "app.mjs"
Cohesion: 0.10
Nodes (70): ACTIONS, billsOf(), bindGuestFill(), bindTables(), bookingDialog(), business(), cancelDialog(), canSend() (+62 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.09
Nodes (21): { Client, Databases, Query }, FIELDS, lib, listPosRows(), migrate(), pick(), readOrNull(), verify() (+13 more)

### Community 27 - "menuAdmin.js"
Cohesion: 0.08
Nodes (40): catalogDraftChanges(), allowedCategoryKeys(), APPLY_KEYS, assignItems(), brief(), cleanGlobalModifier(), cleanLimit(), cleanMenu() (+32 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.09
Nodes (35): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+27 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.11
Nodes (12): CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef(), request() (+4 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 34 - "plans.js"
Cohesion: 0.19
Nodes (14): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), ADDITIONAL_FEATURES (+6 more)

### Community 35 - "usePos"
Cohesion: 0.07
Nodes (68): LabelAlignWizard(), SIDES, LabelStockPicker(), Modal(), ModalBody(), NumberInput(), equalSplit(), productSizeGroup() (+60 more)

### Community 36 - "pos/sales.js"
Cohesion: 0.08
Nodes (57): Delivered (slice 6): Taxes, addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable() (+49 more)

### Community 37 - "vitest"
Cohesion: 0.17
Nodes (17): makeCtx(), bind(), bindServices(), cash(), addProduct(), createHarness(), line(), noDiscount (+9 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (32): activeSales(), AUDIT, BUILDERS, byLocation(), C, day(), GIFT, groupItems() (+24 more)

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

### Community 45 - "access.js"
Cohesion: 0.11
Nodes (27): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), FULL_SETTINGS_ROLES, MANAGER_ROLES, OWNER_ROLES, REPORTING_ROLES (+19 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.12
Nodes (31): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, sendAdminRequest(), AdminApp() (+23 more)

### Community 47 - "kitchenPrinters.js"
Cohesion: 0.22
Nodes (15): kotEscPos(), kotHtml(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log, matches() (+7 more)

### Community 48 - "common.js"
Cohesion: 0.26
Nodes (10): CAPABILITIES, typesWith(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS, RETIRED_MODIFIER_NAMES, SERVICE_CHARGE_TYPES, kitchenMode() (+2 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.12
Nodes (25): Anthropic, contextText(), { getUserFromEvent, getDocument, clean }, { guard, reply }, keys, line(), log, Anthropic (+17 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.15
Nodes (37): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, orderTotal() (+29 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.07
Nodes (23): assert, keys, lib, rows, test, assert, keys, test (+15 more)

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
Nodes (23): commonModifierPresets(), productCategories(), carryCategoryRename(), addCategory(), addCommonModifiers(), addSubcategory(), applyCatalogDrafts(), deleteCategory() (+15 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "PosProvider.jsx"
Cohesion: 0.09
Nodes (39): Ctx, SystemOptionsProvider(), missingRequiredGroup(), selectionExtra(), globalModifiersOf(), limitsById(), prefixesOf(), publishedOf() (+31 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 63 - "subscription.js"
Cohesion: 0.18
Nodes (20): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+12 more)

### Community 64 - "logic.mjs"
Cohesion: 0.09
Nodes (40): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, bookingsMap() (+32 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (40): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, react, react-dom (+32 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.06
Nodes (29): assert, compat, fs, path, test, assert, fs, onboarding (+21 more)

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

### Community 79 - "auth.service.js"
Cohesion: 0.13
Nodes (8): KdsGate(), getAppwriteCompat(), installGlobalClsBackend(), log, AppwriteAuthProvider, friendlyAuthError(), getAuthService(), log

### Community 80 - "panels.jsx"
Cohesion: 0.09
Nodes (50): CeyloAiKeyPanel(), PROVIDERS, ConnectButton(), HardwarePanel(), PublishBar(), SaveBar(), SettingsShell(), how() (+42 more)

### Community 81 - "useData"
Cohesion: 0.13
Nodes (29): Kpi(), downloadCsv(), today(), batchStatus(), commissionRows(), customerName(), saleItemCount(), statusOf() (+21 more)

### Community 82 - "MenuAdminPages.jsx"
Cohesion: 0.10
Nodes (46): AssignmentTree(), GroupBox(), categoryKey(), ARRAY_FIELDS, categoryEditError(), cleanCategoryEdit(), cleanGroupEdit(), draftList() (+38 more)

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
Cohesion: 0.30
Nodes (11): appendQuery(), clean(), findCheckoutUrl(), { getAdmin }, handler(), headers(), normalizePlan(), payableWebhookUrl() (+3 more)

### Community 89 - "ReportPage.jsx"
Cohesion: 0.20
Nodes (20): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+12 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (33): AssistBar(), log, BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig(), diffConfig() (+25 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "serviceWorker.test.js"
Cohesion: 0.29
Nodes (5): code, handlers, pick(), req(), worker

### Community 94 - "hash-admin-password.mjs"
Cohesion: 0.20
Nodes (12): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+4 more)

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "constants.js"
Cohesion: 0.14
Nodes (22): FieldError(), ADJUST_REASONS, CUSTOMER_TYPES, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, PAYMENT_ICONS, PLATFORM_CHANNELS, SPLIT_PAYMENT_METHODS (+14 more)

### Community 98 - "documents.js"
Cohesion: 0.11
Nodes (26): DEFAULT_RECEIPT_FOOTER, downloadBlob(), modifierLabel(), receiptName(), receiptDate(), kotBody(), padLeft(), padRight() (+18 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.13
Nodes (24): discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog(), saveLog() (+16 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 102 - "User guide"
Cohesion: 0.11
Nodes (18): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Menu Admin (Settings), Open orders & kitchen (restaurant / café), Printers by device (Settings > Device Manager), Products, categories, modifiers (+10 more)

### Community 103 - "admin-app/main.jsx"
Cohesion: 0.21
Nodes (6): App(), ErrorBoundary, log, DialogModal(), UiProvider(), react-dom

### Community 104 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), kdsLink, linkFor(), links, listeners, notify() (+4 more)

### Community 105 - "EndOfDay.jsx"
Cohesion: 0.15
Nodes (31): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+23 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 109 - "net.js"
Cohesion: 0.36
Nodes (11): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), run() (+3 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "imageStorage.js"
Cohesion: 0.26
Nodes (8): isAppwrite(), authHeaders(), call(), isDataImage(), log, storeImage(), moveImagesToCloud(), user

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "cloud.service.js"
Cohesion: 0.17
Nodes (11): exactly(), profileHasPosAccess(), ALWAYS_LIVE_KEY, alwaysLive(), clone(), CloudSyncService, log, pullDelay() (+3 more)

### Community 115 - "Architecture"
Cohesion: 0.17
Nodes (11): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+3 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "admin-store.js"
Cohesion: 0.16
Nodes (19): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+11 more)

### Community 118 - "Ceylo.jsx"
Cohesion: 0.18
Nodes (20): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+12 more)

### Community 119 - "features.js"
Cohesion: 0.18
Nodes (17): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+9 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.15
Nodes (13): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 5. Environment variables, 6. One-time setup and deployment (+5 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 128 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 129 - "SaleRepository"
Cohesion: 0.11
Nodes (3): MetaRepository, SaleRepository, SettingsRepository

### Community 130 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 133 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "5. Data layer (WatermelonDB)"
Cohesion: 0.17
Nodes (4): 5. Data layer (WatermelonDB), CashShiftRepository, CustomerRepository, ProductRepository

### Community 136 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 137 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 141 - "KdsApp.jsx"
Cohesion: 0.26
Nodes (15): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, KDS_DESTINATION, kdsStatus(), kdsTickets(), NEXT (+7 more)

### Community 142 - "reports.test.js"
Cohesion: 0.24
Nodes (9): buildReport(), LOYALTY(), unavailable(), MANAGER_ONLY, PAYROLL_ROLES, REPORT_GROUPS, line(), range (+1 more)

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 144 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "repositories/index.js"
Cohesion: 0.12
Nodes (8): categoryId(), CategoryRepository, createRepositories(), generic(), OpenOrderRepository, StockMovementRepository, TimeEntryRepository, UserRepository

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

### Community 156 - "salesLog.js"
Cohesion: 0.27
Nodes (12): userName(), staffName(), day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails() (+4 more)

### Community 157 - "taxes.test.js"
Cohesion: 0.18
Nodes (16): calculateTaxes(), cleanTax(), MAX_RATE, partsOf(), previewTax(), round2(), taxError(), taxIdFor() (+8 more)

### Community 158 - "nowIso"
Cohesion: 0.13
Nodes (34): T, TABLE_BY_NAME, isEmail(), nowIso(), phoneKey(), whatsappPhone(), activeTimeEntry(), saveModifier() (+26 more)

### Community 159 - "catalogExport.test.js"
Cohesion: 0.39
Nodes (7): CATALOGUE_HEADERS, catalogueExportMatrix(), exportStock(), menuFileName(), plain(), inventory, products

### Community 160 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 161 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 162 - "thirdPartyPayments.js"
Cohesion: 0.33
Nodes (9): PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), splitChoices(), usedNames() (+1 more)

### Community 163 - "DevicePages.jsx"
Cohesion: 0.11
Nodes (30): asStation(), connection(), connectionLabel(), copyPrinters(), DEVICE_KINDS, KITCHEN_CONNECTIONS, MAX_COPIES, MAX_NAME (+22 more)

### Community 164 - "domain/catalog.js"
Cohesion: 0.21
Nodes (16): STALE_PRESET_CATEGORIES, cell(), parseStockCountRows(), stalePresetCategory(), visibleProductCategories(), adjustmentChange(), stockMovement(), applyStockChange() (+8 more)

### Community 165 - "quote-email-ui.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 166 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 168 - "database.js"
Cohesion: 0.09
Nodes (18): log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses, ModifierGroup (+10 more)

### Community 169 - "send-welcome.mjs"
Cohesion: 0.38
Nodes (5): esc(), handler(), nodemailer, { handler }, require

### Community 170 - "README.md"
Cohesion: 0.15
Nodes (9): How they were recorded, Product walkthroughs, Logging, Netlify functions (server), Ceylonry POS — Documentation, Automated coverage, Harness, Manual checklist (not automated) (+1 more)

### Community 171 - "support.js"
Cohesion: 0.40
Nodes (5): endSupportSession(), log, SUPPORT_USER, supportModeActive(), supportSession()

### Community 172 - "4. Run it locally for testing"
Cohesion: 0.33
Nodes (6): 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing, 4.3 Guest Manager only (no backend), 4.4 CashFlow pages, 4.5 Tests and checks, 4. Run it locally for testing

### Community 173 - "payroll.test.js"
Cohesion: 0.21
Nodes (17): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+9 more)

### Community 174 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 175 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 176 - "localAdmin.js"
Cohesion: 0.29
Nodes (10): DEV_ADMIN, getStore(), invoices(), localAdminApi(), localAdminSession, databaseNameFor(), applyConfig(), clone() (+2 more)

### Community 177 - "scanner.js"
Cohesion: 0.33
Nodes (7): sizeSlug(), findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants()

### Community 178 - "Settings section: build status and plan"
Cohesion: 0.15
Nodes (12): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts (+4 more)

### Community 179 - "businessTypeLocked"
Cohesion: 0.70
Nodes (3): BusinessTypeTab(), label(), businessTypeLocked()

### Community 180 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 181 - "Netlify Story Form Email Setup"
Cohesion: 0.50
Nodes (3): Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup

### Community 183 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 184 - "printHtmlInFrame"
Cohesion: 0.38
Nodes (8): openKotWindow(), batch, localPrintPreview(), showLabelPreview(), showPrintPreview(), tsplBytesToDataUrl(), printHtmlInFrame(), printHtmlInWindow()

## Knowledge Gaps
- **872 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+867 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1145 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SystemOptionsPages.jsx`, `adminAnalytics.js`, `PortalShell.jsx`, `createLogger`, `App.jsx`, `KdsApp.jsx`, `plans.js`, `usePos`, `DevicePages.jsx`, `SessionProvider.jsx`, `AdminApp.jsx`, `localAdmin.js`, `businessTypeLocked`, `Tables.jsx`, `PosProvider.jsx`, `subscription.js`, `pos-react/package.json`, `auth.service.js`, `panels.jsx`, `useData`, `MenuAdminPages.jsx`, `ReportPage.jsx`, `assist.js`, `serviceWorker.test.js`, `constants.js`, `diagnosticsShared.js`, `admin-app/main.jsx`, `EndOfDay.jsx`, `Ceylo.jsx`, `features.js`, `useInstall.js`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `diagnostics.service.js`, `adminAnalytics.js`, `appwriteCompat.test.js`, `KdsApp.jsx`, `logger.js`, `reports.test.js`, `PosStore.js`, `labelPrinter.js`, `menuAdmin.js`, `salesLog.js`, `taxes.test.js`, `catalogExport.test.js`, `plans.js`, `DevicePages.jsx`, `pos/sales.js`, `thirdPartyPayments.js`, `database.js`, `access.js`, `AdminApp.jsx`, `payroll.test.js`, `common.js`, `scanner.js`, `Tables.jsx`, `salesSplit.test.js`, `PosProvider.jsx`, `subscription.js`, `pos-react/package.json`, `useData`, `assist.js`, `serviceWorker.test.js`, `documents.js`, `imageStorage.js`, `features.js`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `line()` connect `ai-keys.js` to `clean`, `public/assets/platform.js`, `assets/platform.js`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _872 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `diagnostics.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `SystemOptionsPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.146697837521917 - nodes in this community are weakly interconnected._
- **Should `account.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._