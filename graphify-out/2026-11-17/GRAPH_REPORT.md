# Graph Report - clscashflow  (2026-11-12)

## Corpus Check
- 492 files · ~1,304,413 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 4348 nodes · 13438 edges · 178 communities (159 shown, 19 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 346 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e2bd5588`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ceylo.jsx
- SystemOptionsPages.jsx
- account-danger-zone.js
- esc
- useFeature
- appwrite.js
- App.jsx
- __awaiter
- invoice-share.test.js
- createLogger
- security.js
- systemOptions.js
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- MenuAdminPages.jsx
- documents.js
- appwriteAdmin
- labelPrinter.js
- PosProvider.jsx
- store.mjs
- pos.mjs
- app.mjs
- labelPrinter
- pos-routing.test.js
- CloudSyncService
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- ErrorBoundary.jsx
- usePos
- adminInsights.js
- vitest
- invoiceEscape
- reportBuilders.js
- admin-auth.js
- invoiceEscape
- env.js
- pagePath
- Detailing.jsx
- DevicePages.jsx
- AdminApp.jsx
- Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)
- pos/sales.js
- ai-keys.js
- plans.js
- render
- Tables.jsx
- ref_node_assert
- .toString
- AppwriteException
- salesSplit.test.js
- render
- pos/catalog.js
- boot
- reports.test.js
- react
- features.js
- logic.mjs
- pos-react/package.json
- boot
- pos-address.test.js
- getAuthUser
- UsersPages.jsx
- diagnostics-store.js
- appwrite-files.js
- Client
- link.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- LocalAuthProvider
- panels.jsx
- domain/format.js
- hardware-order.js
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- Plan: move from Netlify + Appwrite Cloud to a VPS
- cloud.service.js
- ReportPage.jsx
- security-endpoints.test.js
- assist.js
- appwrite-compat-session.test.js
- receiptPrinter
- pos-reported-bugs.test.js
- normalizePlan
- normalizePlan
- pos/staff.js
- subscription.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- guard
- User guide
- kitchenPrinters.js
- DiagnosticsTab.jsx
- useData
- account-purge.test.js
- Administrator guide
- settings.js
- salesLog.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- printing.js
- appwriteCompat.js
- Architecture
- imageTools.js
- appwriteCompat.test.js
- submit-subscription-receipt.js
- presets.js
- Settings Section Build Spec: what is still pending
- serviceWorker.test.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- localAdmin.js
- database.js
- useInstall.js
- menuLocation.js
- lib/ogf-push.js
- quote-email-ui.test.js
- react-dom
- KdsApp.jsx
- Storage
- pos-handoff.test.js
- pos-admin-catalog.test.js
- Ceylonry POS — React + WatermelonDB
- ref_node_fs
- ogf-sales.js
- config-merge.js
- taxes.js
- net.js
- portal.test.js
- Settings section: build status and plan
- admin-visits-conversion.test.js
- bug-report-20260811-email-modal-template.test.js
- receiptPrinter.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- Development guide
- Netlify Story Form Email Setup
- pos-admin-rollup.test.js
- POS variants (verticals)
- ogf-push-function.test.js
- nowIso
- pos-admin-accounts.test.js
- insightsRollup
- admin-store.js
- KdsHealthPages.jsx
- pos/detailing.js
- printBridge.js
- IMPORTANT: This is NOT a rebuild of the POS system.
- payroll.test.js
- Project structure
- README.md
- FakePc
- ogf-push.test.js
- POS administration portal
- Deployment & operations
- ready.js
- reportPdf.js
- Restaurant (OGF) and the OGF sales push
- SettingsHome.jsx
- collect
- node-appwrite

## God Nodes (most connected - your core abstractions)
1. `useData()` - 196 edges
2. `usePos()` - 188 edges
3. `react` - 129 edges
4. `useFeature()` - 95 edges
5. `__awaiter()` - 93 edges
6. `money()` - 86 edges
7. `AppwriteException` - 74 edges
8. `vitest` - 72 edges
9. `Modal()` - 62 edges
10. `useUi()` - 61 edges

## Surprising Connections (you probably didn't know these)
- `Where data lives (Appwrite project `6a947d6e0012c551dfde`, Singapore)` --references--> `storeFor()`  [INFERRED]
  README.md → netlify/lib/appwrite.js
- `Phase 4: Authentication (6 to 10 days)` --references--> `getUserFromEvent()`  [INFERRED]
  docs/migration/self-hosting-plan.md → netlify/lib/appwrite.js
- `Troubleshooting` --references--> `queryDocuments()`  [INFERRED]
  pos-react/docs/deployment.md → netlify/lib/appwrite.js
- `Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts` --references--> `applyCatalogDrafts()`  [INFERRED]
  docs/settings-build-plan.md → pos-react/src/services/pos/catalog.js
- `Styling` --references--> `base()`  [INFERRED]
  pos-react/docs/architecture.md → reservation-system/js/store.mjs

## Import Cycles
- None detected.

## Communities (178 total, 19 thin omitted)

### Community 0 - "Ceylo.jsx"
Cohesion: 0.15
Nodes (21): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+13 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.16
Nodes (48): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), ConditionalGroup() (+40 more)

### Community 2 - "account-danger-zone.js"
Cohesion: 0.11
Nodes (27): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}, log (+19 more)

### Community 3 - "esc"
Cohesion: 0.13
Nodes (43): bindGuestFill(), bindTables(), bookingDialog(), cfg(), dateBar(), dialog(), dlg(), ensureGuest() (+35 more)

### Community 4 - "useFeature"
Cohesion: 0.16
Nodes (30): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+22 more)

### Community 5 - "appwrite.js"
Cohesion: 0.12
Nodes (48): 2.3 The seams that make this manageable, Phase 3: Data layer (5 to 8 days), bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log (+40 more)

### Community 6 - "App.jsx"
Cohesion: 0.08
Nodes (40): App(), Gate(), Loading(), Ready(), Root(), AssistMissing(), AutomobileShell(), BusinessSettings() (+32 more)

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

### Community 9 - "createLogger"
Cohesion: 0.16
Nodes (22): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), cell(), firstColumn() (+14 more)

### Community 10 - "security.js"
Cohesion: 0.06
Nodes (57): corsHeaders, { guard, siteOrigin, siteUrl }, handler(), json(), ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin, siteUrl } (+49 more)

### Community 11 - "systemOptions.js"
Cohesion: 0.17
Nodes (23): Ctx, SystemOptionsProvider(), missingRequiredGroup(), globalModifiersOf(), limitsById(), prefixesOf(), publishedOf(), applyPatch() (+15 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (36): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+28 more)

### Community 14 - "logger.js"
Cohesion: 0.10
Nodes (33): buildLogText(), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS (+25 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin, ADMIN_EMAIL }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (22): Data model, PosStore, 5. Data layer (WatermelonDB), decode(), encode(), attachLines(), categoryId(), EMPTY_SNAPSHOT() (+14 more)

### Community 17 - "MenuAdminPages.jsx"
Cohesion: 0.06
Nodes (78): categoryKey(), ARRAY_FIELDS, assignGroupEdits(), categoryEditError(), cleanCategoryEdit(), cleanGroupEdit(), draftNewItems(), effectiveCategory() (+70 more)

### Community 18 - "documents.js"
Cohesion: 0.17
Nodes (21): esc(), receiptName(), receiptDate(), testStation(), kotBody(), kotTicketsHtml(), padLeft(), padRight() (+13 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.08
Nodes (32): { appwriteAdmin }, { guard, siteOrigin, siteUrl }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+24 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.13
Nodes (28): CODE128, code128Units(), code128Values(), drawCode128(), alignmentAdjust(), barcodeLabelCopy(), crc32(), crcTable (+20 more)

### Community 21 - "PosProvider.jsx"
Cohesion: 0.08
Nodes (33): AppearancePanel(), ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, ORDER_CHANNELS, PAYMENT_ICONS, PAYMENT_METHODS, PLATFORM_CHANNELS (+25 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (41): go(), refreshPos(), viewMessages(), addDays(), dateStr(), mergeRows(), monthOf(), readPos() (+33 more)

### Community 23 - "pos.mjs"
Cohesion: 0.30
Nodes (13): layoutDialog(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf(), fromPos() (+5 more)

### Community 24 - "app.mjs"
Cohesion: 0.10
Nodes (41): ACTIONS, billsOf(), business(), cancelDialog(), canSend(), detailDialog(), guestDialog(), guestOf() (+33 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (35): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+27 more)

### Community 27 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.10
Nodes (37): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+29 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.09
Nodes (16): auth(), CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef() (+8 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 35 - "usePos"
Cohesion: 0.13
Nodes (37): Staff, FULL_SETTINGS_ROLES, isOwnerRole(), NAV_ITEMS, OWNER_ROLES, REPORTING_ROLES, SETTINGS_PAGE_OF_VIEW, VIEW_TITLES (+29 more)

### Community 36 - "adminInsights.js"
Cohesion: 0.06
Nodes (76): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), BarChart(), HourlyPanel(), Kpi(), lkr() (+68 more)

### Community 37 - "vitest"
Cohesion: 0.14
Nodes (21): makeCtx(), cash(), addProduct(), createHarness(), line(), noDiscount, openShift(), productForm() (+13 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (38): payCost(), activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day() (+30 more)

### Community 40 - "admin-auth.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "env.js"
Cohesion: 0.13
Nodes (17): env, isAppwrite(), aiKey(), askCeylo(), post(), authHeaders(), call(), isDataImage() (+9 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (29): assert, fs, { pagePath }, path, read(), root, test, assert (+21 more)

### Community 44 - "Detailing.jsx"
Cohesion: 0.13
Nodes (33): downloadBlob(), modifierLabel(), JOB_FLOW, jobPaid(), jobTechs(), jobTotal(), buildInvoicePdf(), downloadInvoicePdf() (+25 more)

### Community 45 - "DevicePages.jsx"
Cohesion: 0.17
Nodes (25): asStation(), connection(), connectionLabel(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf() (+17 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.13
Nodes (30): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, sendAdminRequest(), AdminApp() (+22 more)

### Community 47 - "Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)"
Cohesion: 0.06
Nodes (31): 10. Rough timeline, 11. Open questions, 1. Goal and decisions already made, 2.1 What Netlify does for us, 2.2 What Appwrite does for us, 2. What exists today (inventory), 3.1 Frontend and backend, kept separate, 3.2 Why PostgreSQL and not MongoDB (+23 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.09
Nodes (53): Delivered (slice 6): Taxes, addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, equalSplit() (+45 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 50 - "plans.js"
Cohesion: 0.14
Nodes (17): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), DEV_ADMIN, localAdminSession, fmt() (+9 more)

### Community 51 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.19
Nodes (32): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+24 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.06
Nodes (29): assert, keys, lib, rows, test, assert, keys, test (+21 more)

### Community 55 - "AppwriteException"
Cohesion: 0.14
Nodes (3): AppwriteException, Databases, Teams

### Community 56 - "salesSplit.test.js"
Cohesion: 0.18
Nodes (9): combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef, ctxFor() (+1 more)

### Community 57 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 58 - "pos/catalog.js"
Cohesion: 0.18
Nodes (22): productCategories(), carryCategoryRename(), ensureProductInventory(), addCategory(), addCommonModifiers(), applyCatalogDrafts(), deleteCategory(), deleteModifier() (+14 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 60 - "reports.test.js"
Cohesion: 0.23
Nodes (15): CAPABILITIES, firstSub(), groupOf(), kitchenReportsOn(), MANAGER_ONLY, PAYROLL_ROLES, REPORT_GROUPS, subOf() (+7 more)

### Community 62 - "react"
Cohesion: 0.11
Nodes (41): Shell(), Modal(), ModalBody(), NumberInput(), STOCK_UNITS, productSizeGroup(), groupedValue(), parseNumber() (+33 more)

### Community 63 - "features.js"
Cohesion: 0.17
Nodes (18): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+10 more)

### Community 64 - "logic.mjs"
Cohesion: 0.10
Nodes (36): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+28 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (41): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+33 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 67 - "pos-address.test.js"
Cohesion: 0.18
Nodes (7): assert, fs, path, redirects, root, test, toml

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "UsersPages.jsx"
Cohesion: 0.19
Nodes (21): ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError(), jobsOf() (+13 more)

### Community 70 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 71 - "appwrite-files.js"
Cohesion: 0.06
Nodes (36): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+28 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+4 more)

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
Cohesion: 0.13
Nodes (19): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+11 more)

### Community 78 - "appwrite-sdk.js"
Cohesion: 0.11
Nodes (6): Functions, Graphql, Messaging, Permission, Query, Service

### Community 80 - "panels.jsx"
Cohesion: 0.08
Nodes (54): CeyloAiKeyPanel(), PROVIDERS, ConnectButton(), HardwarePanel(), how(), KitchenStations(), LabelAlignWizard(), SIDES (+46 more)

### Community 81 - "domain/format.js"
Cohesion: 0.10
Nodes (43): Customers, FieldError(), CUSTOMER_TYPES, birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport() (+35 more)

### Community 82 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 83 - "health-check.mjs"
Cohesion: 0.13
Nodes (14): failures, files, generatedBinaryBundles, htmlFiles, ignoredDirectories, isModuleFile(), javascriptFiles, packageType() (+6 more)

### Community 84 - "pos-diagnostics.test.js"
Cohesion: 0.14
Nodes (9): assert, audits, auth, FakeDatabases, fs, path, rows, store (+1 more)

### Community 85 - "mountBillingWidget"
Cohesion: 0.13
Nodes (19): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+11 more)

### Community 86 - "POS database and sync changes: team update"
Cohesion: 0.13
Nodes (14): 1. Summary, 2.1 Separate POS database, 2.2 Document storage format (netlify/lib/appwrite.js), 2.3 Function actions (netlify/functions/appwrite-docs.js), 2.4 Storage, 2.5 Sales history split (switched ON in production), 2.6 Guest Manager database (`gm` / `gm_documents`), 2. Database changes (+6 more)

### Community 87 - "Plan: move from Netlify + Appwrite Cloud to a VPS"
Cohesion: 0.17
Nodes (11): Open questions, Phase 0: decisions (needed before starting), Phase 1: server setup (no code changes), Phase 2: replace Netlify (small code change), Phase 3: move the data, Phase 4: cutover, Phase 5: running it, Plan: move from Netlify + Appwrite Cloud to a VPS (+3 more)

### Community 88 - "cloud.service.js"
Cohesion: 0.18
Nodes (23): ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted(), freshAccountDb() (+15 more)

### Community 89 - "ReportPage.jsx"
Cohesion: 0.25
Nodes (16): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+8 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (34): AssistBar(), log, DEFAULT_RECEIPT_FOOTER, BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+26 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 94 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 95 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 96 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 97 - "pos/staff.js"
Cohesion: 0.13
Nodes (28): activeTimeEntry(), AUDIT_ACTION, auditDetails(), dayOf(), diffEntry(), entryError(), entryLocked(), fromLocalInput() (+20 more)

### Community 98 - "subscription.js"
Cohesion: 0.19
Nodes (19): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+11 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.09
Nodes (34): adminSignals(), log, memory, checkIn(), cloudSignals(), handled, localPosSignals, log (+26 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "guard"
Cohesion: 0.08
Nodes (39): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+31 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "kitchenPrinters.js"
Cohesion: 0.18
Nodes (19): openKotWindow(), kotEscPos(), kotHtml(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log (+11 more)

### Community 104 - "DiagnosticsTab.jsx"
Cohesion: 0.42
Nodes (8): discardLog(), keyFor(), loadLog(), openCache(), requestLog(), saveLog(), BUSY, DiagnosticsTab()

### Community 105 - "useData"
Cohesion: 0.08
Nodes (52): Kpi(), today(), batchStatus(), commissionRows(), customerName(), userName(), ACTIVE_STATUSES, realLines() (+44 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.26
Nodes (10): businessLabel(), confirmWord(), createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert (+2 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "settings.js"
Cohesion: 0.09
Nodes (50): catalogDraftChanges(), draftList(), draftChanges(), nextDrafts(), same(), workingOf(), activeThirdParty(), MAX_NAME (+42 more)

### Community 109 - "salesLog.js"
Cohesion: 0.32
Nodes (10): day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails(), refundRows(), voidRows() (+2 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.14
Nodes (23): accessAllowed(), billingWarning(), isTestAccount(), PAID_STATUSES, posAccessProfile(), handOff(), log, loadCatalogueImages() (+15 more)

### Community 113 - "printing.js"
Cohesion: 0.15
Nodes (21): markSent(), routeKitchenLines(), prepName(), kitchenPrinterHook(), kitchenMode(), docCtx(), downloadReceipt(), kdsNotice() (+13 more)

### Community 114 - "appwriteCompat.js"
Cohesion: 0.15
Nodes (11): KdsGate(), forgetUser(), getAppwriteCompat(), installGlobalClsBackend(), log, rememberedUser(), rememberUser(), AppwriteAuthProvider (+3 more)

### Community 115 - "Architecture"
Cohesion: 0.20
Nodes (9): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack (+1 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 118 - "submit-subscription-receipt.js"
Cohesion: 0.14
Nodes (19): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+11 more)

### Community 119 - "presets.js"
Cohesion: 0.23
Nodes (12): businessTypeLabel(), BLANK, NewAccountPanel(), typesWith(), ADMIN_BUSINESS_TYPE_OPTIONS, commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES (+4 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "serviceWorker.test.js"
Cohesion: 0.16
Nodes (10): isHashed(), isPosPage(), SHELL, strategyFor(), code, handlers, pick(), req() (+2 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 124 - "localAdmin.js"
Cohesion: 0.25
Nodes (13): getStore(), invoices(), localAdminApi(), createDatabase(), databaseNameFor(), applyConfig(), clone(), KNOWN_TOP_LEVEL (+5 more)

### Community 125 - "database.js"
Cohesion: 0.09
Nodes (21): log, migrations, tableColumns(), TYPE, CashShift, Customer, InventoryItem, Location (+13 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "menuLocation.js"
Cohesion: 0.31
Nodes (11): activeLocationIds(), allows(), branchOf(), categoryAllowedAt(), cleanLocationIds(), itemAllowedAt(), itemsAt(), newItemLocationIds() (+3 more)

### Community 128 - "lib/ogf-push.js"
Cohesion: 0.19
Nodes (24): cleanConfig(), configProblems(), crypto, deleteSecret(), emptyState(), getToken(), idOf(), loadSecrets() (+16 more)

### Community 129 - "quote-email-ui.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 130 - "react-dom"
Cohesion: 0.19
Nodes (9): AssignmentTree(), byTerm(), GroupBox(), LocationChecks(), groups, html(), html(), locations (+1 more)

### Community 131 - "KdsApp.jsx"
Cohesion: 0.22
Nodes (22): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+14 more)

### Community 133 - "pos-handoff.test.js"
Cohesion: 0.20
Nodes (10): { guard, reply }, handler(), lib, log, assert, call(), { handler }, issued (+2 more)

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.14
Nodes (12): handler(), call(), assert, auth, call(), col(), docs, { handler } (+4 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.12
Nodes (16): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 6. Services (abstractions), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing (+8 more)

### Community 136 - "ref_node_fs"
Cohesion: 0.06
Nodes (28): walk(), assert, compat, fs, path, test, admin, assert (+20 more)

### Community 137 - "ogf-sales.js"
Cohesion: 0.17
Nodes (19): batchCode(), breakdown(), dateTimeOf(), DEFAULT_PAYMENT_NAMES, describe(), header(), itemRows(), num() (+11 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "taxes.js"
Cohesion: 0.27
Nodes (9): calculateTaxes(), cleanTax(), MAX_RATE, partsOf(), previewTax(), round2(), taxIdFor(), taxUses() (+1 more)

### Community 140 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 141 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

### Community 142 - "Settings section: build status and plan"
Cohesion: 0.10
Nodes (22): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts (+14 more)

### Community 143 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 144 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 145 - "receiptPrinter.js"
Cohesion: 0.15
Nodes (14): sizeSlug(), log, findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants() (+6 more)

### Community 152 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 153 - "Netlify Story Form Email Setup"
Cohesion: 0.50
Nodes (3): Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup

### Community 154 - "pos-admin-rollup.test.js"
Cohesion: 0.22
Nodes (9): assert, end, fs, iso(), sale(), salesRollup, source, start (+1 more)

### Community 155 - "POS variants (verticals)"
Cohesion: 0.40
Nodes (4): Add a new business type, Add a new module (for example vehicles and job cards for Automotive), POS variants (verticals), Rules

### Community 157 - "ogf-push-function.test.js"
Cohesion: 0.11
Nodes (15): handler(), lib, log, push, assert, caller, docs, { handler } (+7 more)

### Community 158 - "nowIso"
Cohesion: 0.10
Nodes (45): T, TABLE_BY_NAME, parseStockCountRows(), isEmail(), nowIso(), phoneKey(), whatsappPhone(), adjustmentChange() (+37 more)

### Community 159 - "pos-admin-accounts.test.js"
Cohesion: 0.12
Nodes (15): assert, auth, col(), docs, form, fs, { handler }, lib (+7 more)

### Community 162 - "admin-store.js"
Cohesion: 0.16
Nodes (19): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+11 more)

### Community 163 - "KdsHealthPages.jsx"
Cohesion: 0.14
Nodes (26): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, formatBytes() (+18 more)

### Community 164 - "pos/detailing.js"
Cohesion: 0.38
Nodes (15): advanceJob(), clash(), createInvoice(), find(), finishJob(), guard(), put(), recordPayment() (+7 more)

### Community 165 - "printBridge.js"
Cohesion: 0.16
Nodes (13): PrintHelperPicker(), connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), loadQz(), log (+5 more)

### Community 166 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 168 - "payroll.test.js"
Cohesion: 0.23
Nodes (15): bucketHours(), entryHours(), key(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS, split() (+7 more)

### Community 169 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 170 - "README.md"
Cohesion: 0.17
Nodes (7): How they were recorded, Product walkthroughs, Ceylonry POS — Documentation, Automated coverage, Harness, Manual checklist (not automated), Test plan

### Community 177 - "ogf-push.test.js"
Cohesion: 0.18
Nodes (11): assert, CLIENT, config(), deps(), http, mall, push, run() (+3 more)

### Community 179 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 181 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 182 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 183 - "reportPdf.js"
Cohesion: 0.29
Nodes (5): buildReportPdf(), downloadReportPdf(), PLAIN, jspdf, jspdf-autotable

### Community 186 - "Restaurant (OGF) and the OGF sales push"
Cohesion: 0.29
Nodes (6): Limits, Restaurant (OGF) and the OGF sales push, Setting a business up, Things the documents leave open (to confirm with OGF), What is sent, Where it lives

### Community 187 - "SettingsHome.jsx"
Cohesion: 0.12
Nodes (28): PublishBar(), SaveBar(), SettingsShell(), TopRow(), useSystemOptionsDraft(), blankForm(), formFrom(), formProblems() (+20 more)

### Community 188 - "collect"
Cohesion: 0.67
Nodes (4): collect(), keyOf(), pickRegister(), previewFor()

### Community 189 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

## Knowledge Gaps
- **951 isolated node(s):** `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}`, `log`, `OPERATIONAL_COLLECTIONS` (+946 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1217 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `react-dom`, `KdsApp.jsx`, `ref_node_fs`, `createLogger`, `systemOptions.js`, `net.js`, `portal.test.js`, `logger.js`, `Settings section: build status and plan`, `MenuAdminPages.jsx`, `receiptPrinter.js`, `documents.js`, `labelPrinter.js`, `PosProvider.jsx`, `KdsHealthPages.jsx`, `adminInsights.js`, `printBridge.js`, `payroll.test.js`, `env.js`, `Detailing.jsx`, `DevicePages.jsx`, `AdminApp.jsx`, `pos/sales.js`, `plans.js`, `Tables.jsx`, `salesSplit.test.js`, `SettingsHome.jsx`, `reports.test.js`, `features.js`, `pos-react/package.json`, `UsersPages.jsx`, `assist.js`, `pos/staff.js`, `subscription.js`, `diagnosticsShared.js`, `useData`, `settings.js`, `salesLog.js`, `SessionProvider.jsx`, `appwriteCompat.js`, `appwriteCompat.test.js`, `presets.js`, `serviceWorker.test.js`, `localAdmin.js`, `database.js`, `menuLocation.js`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Ceylo.jsx`, `SystemOptionsPages.jsx`, `react-dom`, `KdsApp.jsx`, `useFeature`, `App.jsx`, `createLogger`, `systemOptions.js`, `logger.js`, `MenuAdminPages.jsx`, `PosProvider.jsx`, `ErrorBoundary.jsx`, `usePos`, `adminInsights.js`, `printBridge.js`, `KdsHealthPages.jsx`, `Detailing.jsx`, `DevicePages.jsx`, `AdminApp.jsx`, `plans.js`, `Tables.jsx`, `SettingsHome.jsx`, `reports.test.js`, `features.js`, `pos-react/package.json`, `UsersPages.jsx`, `panels.jsx`, `domain/format.js`, `ReportPage.jsx`, `assist.js`, `subscription.js`, `DiagnosticsTab.jsx`, `useData`, `SessionProvider.jsx`, `appwriteCompat.js`, `presets.js`, `serviceWorker.test.js`, `useInstall.js`, `menuLocation.js`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `5. Data layer (WatermelonDB)` connect `PosStore.js` to `assets/catalog.js`, `defineTable.js`, `store.mjs`, `Ceylonry POS — React + WatermelonDB`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}` to the rest of the system?**
  _951 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `account-danger-zone.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11397849462365592 - nodes in this community are weakly interconnected._
- **Should `esc` be split into smaller, more focused modules?**
  _Cohesion score 0.13067552602436322 - nodes in this community are weakly interconnected._
- **Should `appwrite.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11689291101055807 - nodes in this community are weakly interconnected._