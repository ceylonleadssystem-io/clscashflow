# Graph Report - clscashflow  (2026-10-30)

## Corpus Check
- 466 files · ~1,260,656 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 4093 nodes · 12372 edges · 181 communities (166 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 297 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ff48b4f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CloudSyncService
- MenuAdminPages.jsx
- adminAnalytics.js
- app.mjs
- useFeature
- appwrite.js
- completeSale
- __awaiter
- clean
- MenuTab.jsx
- settings.js
- usePos
- assets/catalog.js
- tables/index.js
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
- esc
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
- index.jsx
- domain/inventory.js
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
- PosProvider.jsx
- ref_node_module
- kitchenStations.js
- subscription.js
- logic.mjs
- pos-react/package.json
- boot
- ref_node_fs
- getAuthUser
- payable-webhook.cjs
- diagnostics-store.js
- ceylo-ask.js
- Client
- receipt.test.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- LocalAuthProvider
- panels.jsx
- useData
- saveMenuEntity
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
- diagnosticsPeer.js
- planFromPath
- planFromPath
- constants.js
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- pos-reported-bugs.test.js
- User guide
- createLogger
- net.js
- EndOfDay.jsx
- account-purge.test.js
- Administrator guide
- send-contact.js
- adminApi.js
- kds-pair.test.js
- Locale
- imageStorage.test.js
- track-visit.cjs
- cloud.service.js
- Architecture
- imageTools.js
- admin-store.js
- Ceylo.jsx
- features.js
- Settings Section Build Spec: what is still pending
- serviceWorker.test.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- admin-visits-conversion.test.js
- useInstall.js
- ready.js
- bug-report-20260812.test.js
- BaseRepository
- getAdmin
- appwriteCompat.test.js
- Storage
- pos/staff.js
- pos-admin-catalog.test.js
- Ceylonry POS — React + WatermelonDB
- Deployment & operations
- hardware-order.js
- config-merge.js
- tolerant-match.cjs
- bug-report-20260811-email-modal-template.test.js
- KdsApp.jsx
- Settings section: build status and plan
- link.js
- appwrite-files.js
- AppwriteAuthProvider
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- submit-ticket.cjs
- growth-partner-commissions.test.js
- pos-admin-rollup.test.js
- POS variants (verticals)
- salesLog.js
- taxes.js
- newId
- SubscriptionManagement.jsx
- node-appwrite
- seo.test.js
- thirdPartyPayments.js
- devices.js
- nowIso
- health.test.js
- README.md
- kitchenPrinters.js
- database.js
- bug-report-20260810.test.js
- docs/README.md
- bug-report-20260813-mobile.test.js
- apps-used.test.js
- payroll.test.js
- priority-support-chat.test.js
- submit-subscription-receipt.js
- send-invite.mjs
- scanner.js
- cloud.test.js
- pos-offline-category.test.js
- POS administration portal

## God Nodes (most connected - your core abstractions)
1. `useData()` - 182 edges
2. `usePos()` - 175 edges
3. `react` - 117 edges
4. `__awaiter()` - 93 edges
5. `useFeature()` - 93 edges
6. `money()` - 77 edges
7. `AppwriteException` - 74 edges
8. `useUi()` - 55 edges
9. `Modal()` - 54 edges
10. `vitest` - 53 edges

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

## Communities (181 total, 15 thin omitted)

### Community 0 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 1 - "MenuAdminPages.jsx"
Cohesion: 0.09
Nodes (90): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AssignmentTree(), GroupBox(), AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList() (+82 more)

### Community 2 - "adminAnalytics.js"
Cohesion: 0.14
Nodes (32): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), BarChart(), HourlyPanel(), Kpi(), lkr() (+24 more)

### Community 3 - "app.mjs"
Cohesion: 0.08
Nodes (49): ACTIONS, billsOf(), bindGuestFill(), business(), canSend(), detailDialog(), dlg(), ensureGuest() (+41 more)

### Community 4 - "useFeature"
Cohesion: 0.18
Nodes (25): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+17 more)

### Community 5 - "appwrite.js"
Cohesion: 0.10
Nodes (57): deleteOperationalData(), deleteWorkspace(), feedbackId(), nowIso(), saveFeedback(), bodyOf(), handle(), handler() (+49 more)

### Community 6 - "completeSale"
Cohesion: 0.16
Nodes (20): Delivered (slice 6): Taxes, PLATFORM_CHANNELS, addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable() (+12 more)

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

### Community 9 - "MenuTab.jsx"
Cohesion: 0.26
Nodes (13): MenuImport(), log, MenuTab(), CATALOGUE_HEADERS, catalogueExportMatrix(), exportStock(), menuFileName(), plain() (+5 more)

### Community 10 - "settings.js"
Cohesion: 0.10
Nodes (43): APPLY_KEYS, PAGE_KEYS, SALES_DEFAULTS, taxUses(), thirdPartyList(), isDataImage(), storeImage(), audit() (+35 more)

### Community 11 - "usePos"
Cohesion: 0.06
Nodes (73): App(), Gate(), Loading(), Ready(), Root(), AssistMissing(), CloudBanner(), IosInstallGuide() (+65 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "tables/index.js"
Cohesion: 0.07
Nodes (34): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+26 more)

### Community 14 - "logger.js"
Cohesion: 0.10
Nodes (32): capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS, interactiveTarget() (+24 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.12
Nodes (18): PosStore, decode(), encode(), attachLines(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq() (+10 more)

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
Cohesion: 0.13
Nodes (29): routeKitchenLines(), itemSettingsById(), prepName(), kitchenPrinterHook(), docCtx(), downloadReceipt(), kdsNotice(), locationFor() (+21 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.10
Nodes (25): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+17 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.16
Nodes (25): esc(), barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128() (+17 more)

### Community 21 - "guard"
Cohesion: 0.05
Nodes (71): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, handler(), corsHeaders, { guard, siteOrigin } (+63 more)

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

### Community 27 - "menuAdmin.js"
Cohesion: 0.11
Nodes (33): missingRequiredGroup(), productModifiers(), allowedCategoryKeys(), brief(), DEFAULT_PREFIXES, draftChanges(), FIELD_LABELS, GLOBAL_GROUP_ID (+25 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.11
Nodes (31): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+23 more)

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
Cohesion: 0.17
Nodes (15): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), fmt(), PlansGrid(), Switch() (+7 more)

### Community 35 - "index.jsx"
Cohesion: 0.09
Nodes (40): Modal(), ModalBody(), NumberInput(), REPORTING_ROLES, equalSplit(), groupedValue(), locationStock(), isOnBreak() (+32 more)

### Community 36 - "domain/inventory.js"
Cohesion: 0.24
Nodes (15): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), firstShortIngredient(), hasSizedStock(), isService(), lineSize() (+7 more)

### Community 37 - "vitest"
Cohesion: 0.12
Nodes (23): makeCtx(), cash(), addProduct(), createHarness(), line(), noDiscount, openShift(), productForm() (+15 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (35): activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day(), GIFT (+27 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.11
Nodes (24): verifyAdmin(), verifyAdmin(), { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store (+16 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.17
Nodes (20): getStore(), createDatabase(), databaseNameFor(), accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages() (+12 more)

### Community 43 - "pagePath"
Cohesion: 0.08
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "access.js"
Cohesion: 0.13
Nodes (24): FULL_SETTINGS_ROLES, MANAGER_ROLES, NAV_ITEMS, OWNER_ROLES, ROLE_VIEWS, ROLES, SETTINGS_PAGE_OF_VIEW, VIEW_TITLES (+16 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.17
Nodes (21): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), AdminApp(), fmtDate(), log (+13 more)

### Community 47 - "presets.js"
Cohesion: 0.18
Nodes (15): Delivered (slice 11): moves, business type, admin portal, BusinessTypeTab(), label(), CAPABILITIES, typesWith(), BUSINESS_TYPE_OPTIONS, commonModifierPresets(), INDUSTRY_TYPES (+7 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.14
Nodes (29): markSent(), formatOrderNumber(), isSequential(), mergeOrders(), migrateOrderNumbers(), nextSequence(), orderSequenceFrom(), orderTime() (+21 more)

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
Cohesion: 0.19
Nodes (32): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+24 more)

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
Cohesion: 0.22
Nodes (18): productCategories(), carryCategoryRename(), addCategory(), applyCatalogDrafts(), deleteCategory(), deleteModifier(), deleteProduct(), deleteSubcategory() (+10 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "PosProvider.jsx"
Cohesion: 0.09
Nodes (36): Ctx, SystemOptionsProvider(), AppearancePanel(), UI_THEMES, kdsSettingsOf(), applyPatch(), autoClockOutDue(), defaultsFor() (+28 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "kitchenStations.js"
Cohesion: 0.16
Nodes (14): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, cleanStations() (+6 more)

### Community 63 - "subscription.js"
Cohesion: 0.27
Nodes (12): limit(), SubscriptionTab(), activeCount(), flagsWithPlan(), limitOrNull(), locationLimitError(), normalizeSubscription(), standardSubscription() (+4 more)

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

### Community 71 - "ceylo-ask.js"
Cohesion: 0.06
Nodes (32): Anthropic, contextText(), { getUserFromEvent, getDocument, clean }, { guard, reply }, keys, line(), log, dependencies (+24 more)

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
Cohesion: 0.30
Nodes (16): { ADMIN_DATABASE_ID }, bad(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 77 - "mountBillingWidget"
Cohesion: 0.18
Nodes (15): billingCycleFor(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount(), injectBillingCardStyle(), isProfilePaidRecord() (+7 more)

### Community 78 - "appwrite-sdk.js"
Cohesion: 0.11
Nodes (6): Functions, Graphql, Messaging, Permission, Query, Service

### Community 79 - "LocalAuthProvider"
Cohesion: 0.18
Nodes (3): Changing or removing an administrator, LocalAuthProvider, passwordHash()

### Community 80 - "panels.jsx"
Cohesion: 0.08
Nodes (56): CeyloAiKeyPanel(), PROVIDERS, ConnectButton(), HardwarePanel(), how(), KitchenStations(), BillingPanel(), BusinessProfilePanel() (+48 more)

### Community 81 - "useData"
Cohesion: 0.08
Nodes (56): Kpi(), Panel(), cap(), csvEscape(), money(), toCsv(), today(), batchStatus() (+48 more)

### Community 82 - "saveMenuEntity"
Cohesion: 0.09
Nodes (39): STALE_PRESET_CATEGORIES, catalogueNumber(), categoryKey(), cell(), firstColumn(), normalHeader(), parseCatalogueRows(), stalePresetCategory() (+31 more)

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
Cohesion: 0.16
Nodes (24): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+16 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (33): AssistBar(), log, BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig(), diffConfig() (+25 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "localAdmin.js"
Cohesion: 0.22
Nodes (14): DEV_ADMIN, invoices(), localAdminApi(), localAdminSession, resolveFeatures(), EMPTY_SNAPSHOT(), T, applyConfig() (+6 more)

### Community 94 - "diagnosticsPeer.js"
Cohesion: 0.22
Nodes (15): discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog(), saveLog() (+7 more)

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "constants.js"
Cohesion: 0.12
Nodes (16): ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, DEFAULT_RECEIPT_FOOTER, PAYMENT_ICONS, PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, STOCK_TYPES (+8 more)

### Community 98 - "documents.js"
Cohesion: 0.26
Nodes (14): receiptName(), receiptDate(), kotBody(), kotEscPos(), kotTicketsHtml(), padLeft(), padRight(), prepLines() (+6 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.11
Nodes (28): adminSignals(), buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS (+20 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 102 - "User guide"
Cohesion: 0.11
Nodes (18): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Menu Admin (Settings), Open orders & kitchen (restaurant / café), Printers by device (Settings > Device Manager), Products, categories, modifiers (+10 more)

### Community 103 - "createLogger"
Cohesion: 0.11
Nodes (17): log, NUMBERS, ErrorBoundary, log, env, KdsGate(), getAppwriteCompat(), installGlobalClsBackend() (+9 more)

### Community 104 - "net.js"
Cohesion: 0.36
Nodes (11): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), run() (+3 more)

### Community 105 - "EndOfDay.jsx"
Cohesion: 0.19
Nodes (26): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+18 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 109 - "adminApi.js"
Cohesion: 0.21
Nodes (10): log, sendAdminRequest(), adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText() (+2 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "cloud.service.js"
Cohesion: 0.15
Nodes (26): STORAGE, ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted() (+18 more)

### Community 115 - "Architecture"
Cohesion: 0.20
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 116 - "imageTools.js"
Cohesion: 0.38
Nodes (9): binarize(), cleanReceiptQrImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs, solidBarLines() (+1 more)

### Community 117 - "admin-store.js"
Cohesion: 0.18
Nodes (15): { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, audit(), { Databases, Query, ID }, db() (+7 more)

### Community 118 - "Ceylo.jsx"
Cohesion: 0.18
Nodes (20): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+12 more)

### Community 119 - "features.js"
Cohesion: 0.20
Nodes (15): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+7 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "serviceWorker.test.js"
Cohesion: 0.16
Nodes (9): isHashed(), SHELL, strategyFor(), code, handlers, pick(), req(), worker (+1 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

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

### Community 129 - "BaseRepository"
Cohesion: 0.05
Nodes (17): 5. Data layer (WatermelonDB), categoryId(), BaseRepository, CashShiftRepository, CategoryRepository, createRepositories(), CustomerRepository, generic() (+9 more)

### Community 130 - "getAdmin"
Cohesion: 0.17
Nodes (14): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+6 more)

### Community 133 - "pos/staff.js"
Cohesion: 0.24
Nodes (13): activeTimeEntry(), currentCashShift(), expectedCash(), stamp(), transferOpenOrder(), voidCurrentOrder(), autoClockOutAll(), clockIn() (+5 more)

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 136 - "Deployment & operations"
Cohesion: 0.33
Nodes (6): Backups and data, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

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

### Community 142 - "Settings section: build status and plan"
Cohesion: 0.17
Nodes (11): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts, Next slices, in the spec's order (+3 more)

### Community 143 - "link.js"
Cohesion: 0.38
Nodes (11): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+3 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "AppwriteAuthProvider"
Cohesion: 0.20
Nodes (5): store(), 6. Services (abstractions), AppwriteAuthProvider, useServices(), ctx()

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
Cohesion: 0.31
Nodes (11): userName(), staffName(), day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails() (+3 more)

### Community 157 - "taxes.js"
Cohesion: 0.23
Nodes (11): calculateTaxes(), cleanTax(), cleanTaxRules(), MAX_RATE, partsOf(), previewTax(), round2(), rulesOf() (+3 more)

### Community 158 - "newId"
Cohesion: 0.16
Nodes (22): isEmail(), phoneKey(), whatsappPhone(), addSubcategory(), newId(), ensureCustomer(), requestFeedback(), saveCustomer() (+14 more)

### Community 159 - "SubscriptionManagement.jsx"
Cohesion: 0.40
Nodes (8): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), STANDARD_LIMITS

### Community 160 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 161 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 162 - "thirdPartyPayments.js"
Cohesion: 0.38
Nodes (8): activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), splitChoices(), usedNames(), settings

### Community 163 - "devices.js"
Cohesion: 0.16
Nodes (24): asStation(), connection(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf(), KITCHEN_CONNECTIONS (+16 more)

### Community 164 - "nowIso"
Cohesion: 0.23
Nodes (17): parseStockCountRows(), nowIso(), adjustmentChange(), stockMovement(), saveModifier(), applyStockChange(), movementRow(), serviceChargeSupported() (+9 more)

### Community 165 - "health.test.js"
Cohesion: 0.38
Nodes (7): formatBytes(), healthIssues(), rateLatency(), cleanKds(), KDS_DEFAULTS, kdsError(), whole()

### Community 166 - "README.md"
Cohesion: 0.09
Nodes (15): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Applications, Backend (+7 more)

### Community 167 - "kitchenPrinters.js"
Cohesion: 0.16
Nodes (11): claimed, endpointFor(), identity(), log, matches(), log, receiptPrinter, claimUsbOutput() (+3 more)

### Community 168 - "database.js"
Cohesion: 0.13
Nodes (17): log, migrations, CashShift, Customer, InventoryItem, Location, modelClasses, ModifierGroup (+9 more)

### Community 169 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

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
Cohesion: 0.21
Nodes (17): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+9 more)

### Community 174 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 175 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 176 - "send-invite.mjs"
Cohesion: 0.38
Nodes (5): esc(), handler(), nodemailer, { handler }, require

### Community 177 - "scanner.js"
Cohesion: 0.36
Nodes (6): findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants()

### Community 179 - "pos-offline-category.test.js"
Cohesion: 0.29
Nodes (6): assert, fs, path, root, test, worker

### Community 180 - "POS administration portal"
Cohesion: 0.33
Nodes (5): Admin screens, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

## Knowledge Gaps
- **875 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+870 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1148 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `usePos` to `MenuAdminPages.jsx`, `adminAnalytics.js`, `useFeature`, `MenuTab.jsx`, `KdsApp.jsx`, `logger.js`, `menuAdmin.js`, `SubscriptionManagement.jsx`, `plans.js`, `index.jsx`, `vitest`, `SessionProvider.jsx`, `AdminApp.jsx`, `presets.js`, `Tables.jsx`, `PosProvider.jsx`, `subscription.js`, `pos-react/package.json`, `panels.jsx`, `useData`, `ReportPage.jsx`, `assist.js`, `diagnosticsPeer.js`, `createLogger`, `EndOfDay.jsx`, `adminApi.js`, `Ceylo.jsx`, `features.js`, `serviceWorker.test.js`, `useInstall.js`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `adminAnalytics.js`, `appwriteCompat.test.js`, `MenuTab.jsx`, `KdsApp.jsx`, `logger.js`, `labelPrinter.js`, `menuAdmin.js`, `salesLog.js`, `plans.js`, `devices.js`, `domain/inventory.js`, `health.test.js`, `thirdPartyPayments.js`, `access.js`, `payroll.test.js`, `presets.js`, `pos/sales.js`, `scanner.js`, `cloud.test.js`, `portal.test.js`, `Tables.jsx`, `salesSplit.test.js`, `PosProvider.jsx`, `kitchenStations.js`, `subscription.js`, `pos-react/package.json`, `receipt.test.js`, `ReportPage.jsx`, `assist.js`, `localAdmin.js`, `diagnosticsShared.js`, `adminApi.js`, `imageStorage.test.js`, `features.js`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `total()` connect `adminAnalytics.js` to `public/assets/platform.js`, `assets/platform.js`, `Ceylonry POS — React + WatermelonDB`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _875 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MenuAdminPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0863909920403805 - nodes in this community are weakly interconnected._
- **Should `adminAnalytics.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13765182186234817 - nodes in this community are weakly interconnected._
- **Should `app.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._