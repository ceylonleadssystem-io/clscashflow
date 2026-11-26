# Graph Report - clscashflow  (2026-11-18)

## Corpus Check
- 508 files · ~1,335,334 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .css 15, (none) 4, .webmanifest 2)

## Summary
- 4786 nodes · 14889 edges · 195 communities (177 shown, 18 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 556 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b2b928d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- usePos
- SystemOptionsPages.jsx
- account-danger-zone.js
- esc
- DevicePages.jsx
- appwrite.js
- App.jsx
- __awaiter
- clean
- MenuTab.jsx
- appwriteAdmin
- PosProvider.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- useFeature
- documents.js
- ceylonry-site-runtime.js
- labelPrinter.js
- b
- store.mjs
- pos.mjs
- app.mjs
- adminAnalytics.js
- pos-routing.test.js
- cloud.service.js
- scanner.js
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- systemOptions.js
- useData
- adminInsights.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-accounts.test.js
- invoiceEscape
- subscription.js
- pagePath
- Detailing.jsx
- d
- AdminApp.jsx
- pos/publicMenu.js
- pos/sales.js
- ai-keys.js
- features.js
- render
- Tables.jsx
- ref_node_assert
- .toString
- AppwriteException
- salesSplit.test.js
- render
- domain/catalog.js
- boot
- reports.test.js
- Inventory.jsx
- plans.js
- logic.mjs
- pos-react/package.json
- boot
- MenuAdminPages.jsx
- getAuthUser
- access.js
- c
- package.json
- Client
- Z
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- LocalAuthProvider
- panels.jsx
- m
- xk
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- Plan: move from Netlify + Appwrite Cloud to a VPS
- ogf-sales.js
- ReportPage.jsx
- security-endpoints.test.js
- assist.js
- appwrite-compat-session.test.js
- receiptPrinter
- labelPrinter
- normalizePlan
- normalizePlan
- pos/staff.js
- pos/catalog.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- guard
- User guide
- admin-store.js
- diagnostics.service.js
- EndOfDay.jsx
- ni
- Administrator guide
- settings.js
- salesLog.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- printing.js
- createLogger
- Architecture
- imageTools.js
- PortalShell.jsx
- submit-subscription-receipt.js
- Ce
- Settings Section Build Spec: what is still pending
- serviceWorker.test.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- security.js
- Settings section: build status and plan
- database.js
- useInstall.js
- B
- lib/ogf-push.js
- pos/detailing.js
- react-dom
- KdsApp.jsx
- Storage
- send-contact.js
- dateStr
- Ceylonry POS — React + WatermelonDB
- ref_node_fs
- net.js
- config-merge.js
- presets.js
- bug-report-20260810.test.js
- diagnostics-store.js
- businessTypeLocked
- Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)
- appwrite-files.js
- kitchenPrinters.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- account-purge.test.js
- functions/menu-share.js
- pos-admin-rollup.test.js
- POS variants (verticals)
- landing-motion.js
- ogf-push-function.test.js
- nowIso
- pos-admin-catalog.test.js
- react
- pos-address.test.js
- admin-auth.js
- domain/inventory.js
- build.py
- printBridge.js
- Ceylonry POS: New Feature Roll-out Notes
- appwriteCompat.test.js
- payroll.test.js
- Project structure
- docs/README.md
- Features
- 5. Phases
- node-appwrite
- link.js
- printHtmlInFrame
- admin-visits-conversion.test.js
- ogf-push.test.js
- insightsRollup
- README.md
- onboarding-terms-acceptance.test.js
- Role
- ready.js
- Restaurant (OGF) and the OGF sales push
- OGF POS-02 UAT in Postman
- adminInsightsParity.test.js
- SettingsHome.jsx
- apps-used.test.js
- priority-support-chat.test.js
- 3. Target architecture
- collect
- Deployment & operations
- FakePc
- 2. What exists today (inventory)
- gm-routing.test.js

## God Nodes (most connected - your core abstractions)
1. `useData()` - 200 edges
2. `usePos()` - 192 edges
3. `react` - 131 edges
4. `useFeature()` - 95 edges
5. `__awaiter()` - 93 edges
6. `money()` - 86 edges
7. `AppwriteException` - 74 edges
8. `vitest` - 73 edges
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
- `Points the Postman guide shows (to confirm with OGF)` --references--> `Sales()`  [INFERRED]
  docs/ogf-postman/README.md → pos-react/src/views/Sales.jsx

## Import Cycles
- None detected.

## Communities (195 total, 18 thin omitted)

### Community 0 - "usePos"
Cohesion: 0.10
Nodes (43): AskCeylo(), CeyloButton(), CeyloPanel(), DOT, EYES, Item(), MOVES, reducedMotion() (+35 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.11
Nodes (64): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), ConditionalGroup() (+56 more)

### Community 2 - "account-danger-zone.js"
Cohesion: 0.12
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
Cohesion: 0.19
Nodes (28): bindTables(), bookingDialog(), business(), cancelDialog(), cfg(), dateBar(), esc(), floorName() (+20 more)

### Community 4 - "DevicePages.jsx"
Cohesion: 0.13
Nodes (31): asStation(), connection(), connectionLabel(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf() (+23 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (55): 2.3 The seams that make this manageable, Phase 3: Data layer (5 to 8 days), bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log (+47 more)

### Community 6 - "App.jsx"
Cohesion: 0.11
Nodes (27): App(), Gate(), Loading(), PublicMenuSync(), Ready(), Root(), AssistMissing(), AutomobileShell() (+19 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "clean"
Cohesion: 0.09
Nodes (55): {
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
}, publicBase(), response() (+47 more)

### Community 9 - "MenuTab.jsx"
Cohesion: 0.15
Nodes (18): MenuImport(), log, MenuTab(), CATALOGUE_HEADERS, catalogueExportMatrix(), exportStock(), menuFileName(), plain() (+10 more)

### Community 10 - "appwriteAdmin"
Cohesion: 0.07
Nodes (35): { appwriteAdmin }, { guard, siteOrigin, siteUrl }, handler(), reply(), responseHeaders, clean(), escapeHtml(), { guard, siteOrigin, siteUrl } (+27 more)

### Community 11 - "PosProvider.jsx"
Cohesion: 0.10
Nodes (28): how(), KitchenStations(), AppearancePanel(), STORAGE, resolveWelcome(), readyBeep(), PRINTER_KINDS, setUploadFailureHandler() (+20 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (36): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+28 more)

### Community 14 - "logger.js"
Cohesion: 0.12
Nodes (30): el(), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS (+22 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin, ADMIN_EMAIL }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (20): PosStore, 5. Data layer (WatermelonDB), decode(), encode(), attachLines(), categoryId(), hintSeq(), LEGACY_ARRAY_TABLES (+12 more)

### Community 17 - "useFeature"
Cohesion: 0.14
Nodes (36): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+28 more)

### Community 18 - "documents.js"
Cohesion: 0.16
Nodes (22): esc(), receiptName(), receiptDate(), openKotWindow(), testStation(), kotBody(), kotHtml(), kotTicketsHtml() (+14 more)

### Community 19 - "ceylonry-site-runtime.js"
Cohesion: 0.04
Nodes (71): $a(), Ab(), Bd(), bh(), bj(), ch(), Ck(), cn() (+63 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.13
Nodes (28): CODE128, code128Units(), code128Values(), drawCode128(), alignmentAdjust(), barcodeLabelCopy(), crc32(), crcTable (+20 more)

### Community 21 - "b"
Cohesion: 0.08
Nodes (58): ac(), an(), e(), n(), c(), Bt(), dd(), dh() (+50 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (38): go(), viewMessages(), addDays(), mergeRows(), monthOf(), base(), boot(), bucketOf() (+30 more)

### Community 23 - "pos.mjs"
Cohesion: 0.23
Nodes (16): layoutDialog(), refreshPos(), saveSettings(), layoutError(), effectiveLocation(), emptyPos, floorKey(), floorsKey() (+8 more)

### Community 24 - "app.mjs"
Cohesion: 0.10
Nodes (41): ACTIONS, billsOf(), bindGuestFill(), canSend(), detailDialog(), dlg(), ensureGuest(), guestDialog() (+33 more)

### Community 25 - "adminAnalytics.js"
Cohesion: 0.17
Nodes (21): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), dailySeries(), day(), DEFAULT_TZ, fmt (+13 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (35): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+27 more)

### Community 27 - "cloud.service.js"
Cohesion: 0.11
Nodes (30): DEFAULT_OWNER_PIN, RETIRED_MODIFIER_NAMES, exactly(), profileHasPosAccess(), alwaysLive(), clone(), CloudSyncService, log (+22 more)

### Community 28 - "scanner.js"
Cohesion: 0.15
Nodes (5): barcodeScanner, HID_MAP, HID_SHIFT, log, createEmitter()

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.10
Nodes (36): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+28 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.09
Nodes (16): auth(), CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef() (+8 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 34 - "systemOptions.js"
Cohesion: 0.24
Nodes (14): Ctx, SystemOptionsProvider(), applyPatch(), autoClockOutDue(), FIELDS, isOverridden(), LANDING_VIEWS, landingView() (+6 more)

### Community 35 - "useData"
Cohesion: 0.07
Nodes (57): Kpi(), csvEscape(), groupedValue(), toCsv(), today(), batchStatus(), commissionRows(), customerName() (+49 more)

### Community 36 - "adminInsights.js"
Cohesion: 0.12
Nodes (47): BarChart(), HourlyPanel(), Kpi(), lkr(), METRICS, one(), RankedBars(), AnalyticsTab() (+39 more)

### Community 37 - "vitest"
Cohesion: 0.12
Nodes (24): makeCtx(), bind(), bindServices(), cash(), addProduct(), createHarness(), line(), noDiscount (+16 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.08
Nodes (40): salesCategoryNameOf(), payCost(), activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C (+32 more)

### Community 40 - "pos-admin-accounts.test.js"
Cohesion: 0.12
Nodes (15): assert, auth, col(), docs, form, fs, { handler }, lib (+7 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "subscription.js"
Cohesion: 0.18
Nodes (20): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+12 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (29): assert, fs, { pagePath }, path, read(), root, test, assert (+21 more)

### Community 44 - "Detailing.jsx"
Cohesion: 0.14
Nodes (32): whatsappPhone(), modifierLabel(), jobPaid(), jobTechs(), jobTotal(), buildInvoicePdf(), downloadInvoicePdf(), fileName() (+24 more)

### Community 45 - "d"
Cohesion: 0.09
Nodes (44): ae(), at(), bc(), be(), C(), dt(), Ee(), Fe() (+36 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.12
Nodes (32): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, sendAdminRequest(), AdminApp() (+24 more)

### Community 47 - "pos/publicMenu.js"
Cohesion: 0.20
Nodes (16): isAppwrite(), buildMenuSnapshot(), enabledKeys(), httpsImage(), linkKey(), linkOf(), call(), disablePublicMenu() (+8 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.09
Nodes (51): Delivered (slice 6): Taxes, addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature() (+43 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 50 - "features.js"
Cohesion: 0.18
Nodes (17): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, presetFlags(), SHOP (+9 more)

### Community 51 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.20
Nodes (30): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+22 more)

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
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 58 - "domain/catalog.js"
Cohesion: 0.14
Nodes (19): STALE_PRESET_CATEGORIES, catalogueNumber(), cell(), firstColumn(), normalHeader(), parseCatalogueRows(), categorySettingBlank(), categorySettingsById() (+11 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 60 - "reports.test.js"
Cohesion: 0.23
Nodes (15): CAPABILITIES, firstSub(), groupOf(), kitchenReportsOn(), MANAGER_ONLY, PAYROLL_ROLES, REPORT_GROUPS, subOf() (+7 more)

### Community 62 - "Inventory.jsx"
Cohesion: 0.10
Nodes (39): Staff, NumberInput(), STOCK_UNITS, isOwnerRole(), OWNER_ROLES, REPORTING_ROLES, SETTINGS_PAGE_OF_VIEW, VIEW_TITLES (+31 more)

### Community 63 - "plans.js"
Cohesion: 0.15
Nodes (18): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), DEV_ADMIN, localAdminSession, fmt() (+10 more)

### Community 64 - "logic.mjs"
Cohesion: 0.11
Nodes (29): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+21 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (41): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+33 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 67 - "MenuAdminPages.jsx"
Cohesion: 0.06
Nodes (90): categoryKey(), stalePresetCategory(), visibleProductCategories(), ARRAY_FIELDS, assignGroupEdits(), catalogDraftChanges(), categoryEditError(), cleanCategoryEdit() (+82 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "access.js"
Cohesion: 0.13
Nodes (24): FULL_SETTINGS_ROLES, ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError() (+16 more)

### Community 70 - "c"
Cohesion: 0.12
Nodes (26): ai(), a(), bi(), ci(), Dg(), ef(), Eh(), hb() (+18 more)

### Community 71 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+14 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "Z"
Cohesion: 0.14
Nodes (25): aa(), ah(), fb(), $g(), gf(), gi(), hi(), ia() (+17 more)

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

### Community 79 - "LocalAuthProvider"
Cohesion: 0.14
Nodes (3): AppwriteAuthProvider, LocalAuthProvider, passwordHash()

### Community 80 - "panels.jsx"
Cohesion: 0.08
Nodes (53): CeyloMascot(), Customers, BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel(), LocationsPanel() (+45 more)

### Community 81 - "m"
Cohesion: 0.12
Nodes (25): Ag(), Bg(), Cc(), cd(), Cg(), de(), df(), gj() (+17 more)

### Community 82 - "xk"
Cohesion: 0.18
Nodes (23): af(), Bk(), cf(), Db(), Dc(), F(), fa(), hf() (+15 more)

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

### Community 88 - "ogf-sales.js"
Cohesion: 0.17
Nodes (19): batchCode(), breakdown(), dateTimeOf(), DEFAULT_PAYMENT_NAMES, describe(), header(), itemRows(), num() (+11 more)

### Community 89 - "ReportPage.jsx"
Cohesion: 0.21
Nodes (18): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+10 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.09
Nodes (48): getStore(), invoices(), localAdminApi(), AssistBar(), log, DEFAULT_RECEIPT_FOOTER, flagsWithPlan(), createDatabase() (+40 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 95 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 96 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 97 - "pos/staff.js"
Cohesion: 0.12
Nodes (32): Timesheets, AUDIT_ACTION, auditDetails(), dayOf(), diffEntry(), entryError(), entryLocked(), fromLocalInput() (+24 more)

### Community 98 - "pos/catalog.js"
Cohesion: 0.18
Nodes (22): productCategories(), carryCategoryRename(), ensureProductInventory(), addCategory(), addSubcategory(), applyCatalogDrafts(), deleteCategory(), deleteModifier() (+14 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.13
Nodes (25): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+17 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "guard"
Cohesion: 0.06
Nodes (45): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+37 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "admin-store.js"
Cohesion: 0.16
Nodes (19): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+11 more)

### Community 104 - "diagnostics.service.js"
Cohesion: 0.13
Nodes (21): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+13 more)

### Community 105 - "EndOfDay.jsx"
Cohesion: 0.17
Nodes (28): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+20 more)

### Community 106 - "ni"
Cohesion: 0.13
Nodes (21): Bf(), e(), k(), eb(), ff(), gd(), hc(), kb() (+13 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "settings.js"
Cohesion: 0.07
Nodes (58): jobsOf(), cleanStations(), taxUses(), activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices() (+50 more)

### Community 109 - "salesLog.js"
Cohesion: 0.32
Nodes (10): day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails(), refundRows(), voidRows() (+2 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.14
Nodes (24): assistActive(), assistSignedIn(), accessAllowed(), billingWarning(), isTestAccount(), PAID_STATUSES, posAccessProfile(), handOff() (+16 more)

### Community 113 - "printing.js"
Cohesion: 0.17
Nodes (18): routeKitchenLines(), prepName(), kitchenPrinterHook(), kitchenMode(), docCtx(), downloadReceipt(), kdsNotice(), locationFor() (+10 more)

### Community 114 - "createLogger"
Cohesion: 0.08
Nodes (20): log, NUMBERS, ErrorBoundary, log, env, KdsGate(), forgetUser(), getAppwriteCompat() (+12 more)

### Community 115 - "Architecture"
Cohesion: 0.20
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "PortalShell.jsx"
Cohesion: 0.12
Nodes (24): NavIcon(), PATHS, PATHS, PortalIcon(), PortalHome(), PortalSettingsPage, PortalShell(), Reports (+16 more)

### Community 118 - "submit-subscription-receipt.js"
Cohesion: 0.14
Nodes (19): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+11 more)

### Community 119 - "Ce"
Cohesion: 0.20
Nodes (15): Ce(), ed(), fc(), gh(), Ij(), Lb(), mj(), oh() (+7 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "serviceWorker.test.js"
Cohesion: 0.18
Nodes (9): isHashed(), isPosPage(), SHELL, strategyFor(), code, handlers, pick(), req() (+1 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 123 - "security.js"
Cohesion: 0.06
Nodes (54): corsHeaders, { guard, siteOrigin, siteUrl }, handler(), json(), esc(), { guard, siteOrigin }, handler(), nodemailer (+46 more)

### Community 124 - "Settings section: build status and plan"
Cohesion: 0.15
Nodes (12): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts (+4 more)

### Community 125 - "database.js"
Cohesion: 0.12
Nodes (18): log, migrations, tableColumns(), TYPE, CashShift, Customer, InventoryItem, Location (+10 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "B"
Cohesion: 0.22
Nodes (11): B(), fn(), Lt(), M(), N(), oa(), Ot(), pn() (+3 more)

### Community 128 - "lib/ogf-push.js"
Cohesion: 0.19
Nodes (24): cleanConfig(), configProblems(), crypto, deleteSecret(), emptyState(), getToken(), idOf(), loadSecrets() (+16 more)

### Community 129 - "pos/detailing.js"
Cohesion: 0.35
Nodes (16): advanceJob(), clash(), createInvoice(), find(), finishJob(), guard(), JOB_FLOW, put() (+8 more)

### Community 130 - "react-dom"
Cohesion: 0.19
Nodes (9): AssignmentTree(), byTerm(), GroupBox(), LocationChecks(), groups, html(), html(), locations (+1 more)

### Community 131 - "KdsApp.jsx"
Cohesion: 0.22
Nodes (22): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+14 more)

### Community 133 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 134 - "dateStr"
Cohesion: 0.19
Nodes (23): dialog(), pillFor(), resRow(), seatDialog(), setStatus(), tableDialog(), toast(), viewBookings() (+15 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.12
Nodes (16): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 6. Services (abstractions), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing (+8 more)

### Community 136 - "ref_node_fs"
Cohesion: 0.08
Nodes (20): walk(), assert, compat, fs, path, test, assert, config (+12 more)

### Community 137 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "presets.js"
Cohesion: 0.26
Nodes (10): businessTypeLabel(), BLANK, typesWith(), ADMIN_BUSINESS_TYPE_OPTIONS, BUSINESS_TYPE_OPTIONS, commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES (+2 more)

### Community 140 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 141 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 142 - "businessTypeLocked"
Cohesion: 0.21
Nodes (10): businessTypeLocked(), addressForType(), addressOfPage(), POS_BASE_HOST, POS_URLS, posRedirect(), servesPosAtRoot(), AUTO (+2 more)

### Community 143 - "Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)"
Cohesion: 0.15
Nodes (11): 10. Rough timeline, 11. Open questions, 1. Goal and decisions already made, 4. Principles, 6. Risks and how they are handled, 7. Go/no-go checklist for cutover, 8. Operations after the move, 9. Capacity and the path to 5,000 businesses (+3 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.20
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "kitchenPrinters.js"
Cohesion: 0.19
Nodes (15): kotEscPos(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket() (+7 more)

### Community 152 - "account-purge.test.js"
Cohesion: 0.26
Nodes (10): businessLabel(), confirmWord(), createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert (+2 more)

### Community 153 - "functions/menu-share.js"
Cohesion: 0.26
Nodes (13): {
  clean,
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument
}, { generatePublicToken, isValidPublicToken }, handler(), { locationKey, sanitizeMenu }, publicBase(), response(), uniqueToken(), generatePublicToken() (+5 more)

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
Cohesion: 0.12
Nodes (38): T, TABLE_BY_NAME, parseStockCountRows(), isEmail(), nowIso(), phoneKey(), adjustmentChange(), stockMovement() (+30 more)

### Community 159 - "pos-admin-catalog.test.js"
Cohesion: 0.14
Nodes (12): handler(), call(), assert, auth, call(), col(), docs, { handler } (+4 more)

### Community 160 - "react"
Cohesion: 0.09
Nodes (41): CeyloAiKeyPanel(), PROVIDERS, ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), PrintHelperPicker() (+33 more)

### Community 161 - "pos-address.test.js"
Cohesion: 0.18
Nodes (7): assert, fs, path, redirects, root, test, toml

### Community 162 - "admin-auth.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 163 - "domain/inventory.js"
Cohesion: 0.35
Nodes (11): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), hasSizedStock(), isService(), lineSize(), productStockItem(), stockProblem() (+3 more)

### Community 165 - "printBridge.js"
Cohesion: 0.16
Nodes (12): connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), loadQz(), log, sendRaw() (+4 more)

### Community 166 - "Ceylonry POS: New Feature Roll-out Notes"
Cohesion: 0.22
Nodes (8): 1. Item stock counts and ingredients, 2. Branch-specific menus, 3. Demo and Test accounts no longer ask for payment, 4. Trial length and plan prices are consistent, 5. Modifier groups: assign to items by tree, 6. Fixes, Ceylonry POS: New Feature Roll-out Notes, Notes

### Community 168 - "payroll.test.js"
Cohesion: 0.23
Nodes (15): bucketHours(), entryHours(), key(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS, split() (+7 more)

### Community 169 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 170 - "docs/README.md"
Cohesion: 0.12
Nodes (10): Conventions, Debugging, Development guide, Recipes, Setup, Ceylonry POS — Documentation, Automated coverage, Harness (+2 more)

### Community 171 - "Features"
Cohesion: 0.22
Nodes (8): Ceylonry POS: Release Notes, 2026-11-17, Features, Fixes, New landing page, Other, Plan finder: devices per location, QR menu (digital menu for restaurants and cafés), Visual refresh

### Community 172 - "5. Phases"
Cohesion: 0.15
Nodes (13): 5. Phases, 5a. Files, 5b. E-mail (replaces EmailJS), Phase 0: Confirm before buying (1 to 2 days), Phase 10: Cutover (1 to 2 days of work, plus preparation), Phase 11: Decommission and clean-up (2 days), Phase 1: Server and tooling (2 to 3 days), Phase 2: Repository structure and backend modules (8 to 12 days) (+5 more)

### Community 173 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 174 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+4 more)

### Community 175 - "printHtmlInFrame"
Cohesion: 0.44
Nodes (7): batch, localPrintPreview(), showLabelPreview(), showPrintPreview(), tsplBytesToDataUrl(), printHtmlInFrame(), printHtmlInWindow()

### Community 176 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 177 - "ogf-push.test.js"
Cohesion: 0.18
Nodes (11): assert, CLIENT, config(), deps(), http, mall, push, run() (+3 more)

### Community 179 - "README.md"
Cohesion: 0.10
Nodes (15): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification (+7 more)

### Community 180 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 182 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 183 - "Restaurant (OGF) and the OGF sales push"
Cohesion: 0.25
Nodes (7): Limits, OGF's Postman guide (what it adds), Restaurant (OGF) and the OGF sales push, Setting a business up, Things the documents leave open (to confirm with OGF), What is sent, Where it lives

### Community 184 - "OGF POS-02 UAT in Postman"
Cohesion: 0.33
Nodes (5): OGF POS-02 UAT in Postman, Points the Postman guide shows (to confirm with OGF), Rebuild, Run it, What each request is

### Community 185 - "adminInsightsParity.test.js"
Cohesion: 0.29
Nodes (7): ago(), end, payload, sale(), server, src, start

### Community 186 - "SettingsHome.jsx"
Cohesion: 0.12
Nodes (28): PublishBar(), SaveBar(), SettingsShell(), TopRow(), useSystemOptionsDraft(), blankForm(), formFrom(), formProblems() (+20 more)

### Community 187 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 188 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 189 - "3. Target architecture"
Cohesion: 0.50
Nodes (4): 3.1 Frontend and backend, kept separate, 3.2 Why PostgreSQL and not MongoDB, 3.3 What changes compared with a straight copy of the functions, 3. Target architecture

### Community 190 - "collect"
Cohesion: 0.67
Nodes (4): collect(), keyOf(), pickRegister(), previewFor()

### Community 191 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 193 - "2. What exists today (inventory)"
Cohesion: 0.67
Nodes (3): 2.1 What Netlify does for us, 2.2 What Appwrite does for us, 2. What exists today (inventory)

### Community 194 - "gm-routing.test.js"
Cohesion: 0.29
Nodes (6): assert, chain, fake, lib, Module, test

## Knowledge Gaps
- **978 isolated node(s):** `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}`, `log`, `OPERATIONAL_COLLECTIONS` (+973 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1284 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `SystemOptionsPages.jsx`, `react-dom`, `KdsApp.jsx`, `DevicePages.jsx`, `ref_node_fs`, `MenuTab.jsx`, `net.js`, `presets.js`, `PosProvider.jsx`, `logger.js`, `businessTypeLocked`, `kitchenPrinters.js`, `documents.js`, `labelPrinter.js`, `adminAnalytics.js`, `scanner.js`, `systemOptions.js`, `useData`, `adminInsights.js`, `printBridge.js`, `domain/inventory.js`, `appwriteCompat.test.js`, `payroll.test.js`, `subscription.js`, `Detailing.jsx`, `AdminApp.jsx`, `pos/publicMenu.js`, `pos/sales.js`, `features.js`, `Tables.jsx`, `salesSplit.test.js`, `adminInsightsParity.test.js`, `domain/catalog.js`, `SettingsHome.jsx`, `reports.test.js`, `plans.js`, `pos-react/package.json`, `MenuAdminPages.jsx`, `access.js`, `assist.js`, `pos/staff.js`, `diagnostics.service.js`, `EndOfDay.jsx`, `settings.js`, `salesLog.js`, `SessionProvider.jsx`, `createLogger`, `PortalShell.jsx`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `usePos`, `SystemOptionsPages.jsx`, `react-dom`, `KdsApp.jsx`, `DevicePages.jsx`, `App.jsx`, `MenuTab.jsx`, `presets.js`, `PosProvider.jsx`, `businessTypeLocked`, `useFeature`, `systemOptions.js`, `useData`, `adminInsights.js`, `printBridge.js`, `subscription.js`, `Detailing.jsx`, `AdminApp.jsx`, `features.js`, `Tables.jsx`, `SettingsHome.jsx`, `reports.test.js`, `Inventory.jsx`, `plans.js`, `pos-react/package.json`, `MenuAdminPages.jsx`, `panels.jsx`, `ReportPage.jsx`, `assist.js`, `pos/staff.js`, `diagnosticsShared.js`, `EndOfDay.jsx`, `SessionProvider.jsx`, `createLogger`, `PortalShell.jsx`, `serviceWorker.test.js`, `useInstall.js`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `r()` connect `b` to `c`, `d`, `ceylonry-site-runtime.js`, `adminInsightsParity.test.js`, `pos-routing.test.js`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
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
  _978 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `usePos` be split into smaller, more focused modules?**
  _Cohesion score 0.09526592635885447 - nodes in this community are weakly interconnected._
- **Should `SystemOptionsPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10947368421052632 - nodes in this community are weakly interconnected._
- **Should `account-danger-zone.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._