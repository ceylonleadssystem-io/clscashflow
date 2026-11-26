# Graph Report - clscashflow  (2026-11-20)

## Corpus Check
- 530 files · ~1,365,966 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .css 15, (none) 4, .webmanifest 2)

## Summary
- 4921 nodes · 15366 edges · 205 communities (183 shown, 22 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 577 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e1e5fc9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ai-keys.js
- UsersPages.jsx
- panels.jsx
- esc
- Ceylo.jsx
- appwrite.js
- PosProvider.jsx
- __awaiter
- getDocument
- guard
- settings.js
- PortalShell.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- cloud.service.js
- timesheetEdit.test.js
- ceylonry-site-runtime.js
- labelPrinter.js
- b
- store.mjs
- pos.mjs
- app.mjs
- getUserFromEvent
- pos-routing.test.js
- useData
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- domain/format.js
- presets.js
- adminAnalytics.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-accounts.test.js
- invoiceEscape
- analytics.js
- pagePath
- subscription.js
- d
- AdminApp.jsx
- isAppwrite
- pos/sales.js
- shopify-store.js
- features.js
- render
- Tables.jsx
- ref_node_assert
- .toString
- AppwriteException
- salesSplit.test.js
- render
- localAdmin.js
- boot
- ReportPage.jsx
- usePos
- plans.js
- logic.mjs
- pos-react/package.json
- boot
- taxes.test.js
- getAuthUser
- adminInsights.js
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
- SystemOptionsPages.jsx
- m
- xk
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- Plan: move from Netlify + Appwrite Cloud to a VPS
- Dashboard.jsx
- devices.js
- security-endpoints.test.js
- assist.js
- appwrite-compat-session.test.js
- receiptPrinter
- labelPrinter
- normalizePlan
- normalizePlan
- nowIso
- MenuAdminPages.jsx
- shopifyOrders.test.js
- Root test-suite audit (169 failing tests)
- App.jsx
- User guide
- dateStr
- Detailing.jsx
- domain/catalog.js
- ni
- Administrator guide
- thirdPartyPayments.js
- ogf-sales.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- printing.js
- createLogger
- Deployment & operations
- imageTools.js
- portal.test.js
- admin-store.js
- Ce
- Settings Section Build Spec: what is still pending
- domain/inventory.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- submit-subscription-receipt.js
- posRoute.js
- account-danger-zone.js
- useInstall.js
- B
- lib/ogf-push.js
- pos/detailing.js
- AssignmentTree
- KdsApp.jsx
- link.js
- hardware-order.js
- Shopify orders into the POS: feasibility
- Ceylonry POS — React + WatermelonDB
- AnalyticsTab.jsx
- net.js
- config-merge.js
- pos/catalog.js
- 5. Phases
- diagnostics-store.js
- pos-handoff.test.js
- Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)
- appwrite-files.js
- kitchenPrinters.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- diagnosticsShared.js
- AppwriteAuthProvider
- pos-admin-rollup.test.js
- POS variants (verticals)
- landing-motion.js
- ogf-push-function.test.js
- pos-admin-catalog.test.js
- settingsGroups.test.js
- documents.js
- pos-address.test.js
- admin-auth.js
- account-purge.test.js
- build.py
- printBridge.js
- Ceylonry POS: New Feature Roll-out Notes
- appwriteCompat.test.js
- Architecture
- bug-report-20260810.test.js
- health.test.js
- Features
- Settings section: build status and plan
- node-appwrite
- sizes.test.js
- ref_node_fs
- Features
- ogf-push.test.js
- diagnosticsPeer.js
- README.md
- salesLog.js
- Role
- pos-reported-bugs.test.js
- serviceWorker.test.js
- OGF POS-02 UAT in Postman
- onboarding-terms-acceptance.test.js
- Restaurant (OGF) and the OGF sales push
- adminInsightsParity.test.js
- POS app (browser)
- admin-visits-conversion.test.js
- apps-used.test.js
- bug-report-20260811-email-modal-template.test.js
- FakePc
- bug-report-20260812.test.js
- POS administration portal
- Ceylonry POS: Release Notes, 2026-11-18
- Storage
- Project structure
- Development guide
- collect
- insightsRollup
- Test plan
- dependencies
- orders.js
- imageStorage.test.js

## God Nodes (most connected - your core abstractions)
1. `useData()` - 208 edges
2. `usePos()` - 198 edges
3. `react` - 135 edges
4. `useFeature()` - 99 edges
5. `__awaiter()` - 93 edges
6. `money()` - 88 edges
7. `vitest` - 77 edges
8. `AppwriteException` - 74 edges
9. `Modal()` - 64 edges
10. `useUi()` - 63 edges

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

## Communities (205 total, 22 thin omitted)

### Community 0 - "ai-keys.js"
Cohesion: 0.12
Nodes (25): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+17 more)

### Community 1 - "UsersPages.jsx"
Cohesion: 0.11
Nodes (35): OnlineOrdersButton(), ONLINE_CHANNELS, FULL_SETTINGS_ROLES, isOwnerRole(), NAV_ITEMS, OWNER_ROLES, REPORTING_ROLES, ROLE_VIEWS (+27 more)

### Community 2 - "panels.jsx"
Cohesion: 0.14
Nodes (27): AppearancePanel(), BusinessProfilePanel(), LiveScreenPanel(), FieldError(), Switch(), BUSINESS_TYPE_OPTIONS, cleanPhoneInput(), EMAIL_RE (+19 more)

### Community 3 - "esc"
Cohesion: 0.19
Nodes (28): bindTables(), bookingDialog(), business(), cancelDialog(), cfg(), dateBar(), esc(), floorName() (+20 more)

### Community 4 - "Ceylo.jsx"
Cohesion: 0.11
Nodes (31): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+23 more)

### Community 5 - "appwrite.js"
Cohesion: 0.10
Nodes (56): 2.3 The seams that make this manageable, Phase 3: Data layer (5 to 8 days), bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log (+48 more)

### Community 6 - "PosProvider.jsx"
Cohesion: 0.08
Nodes (40): Ctx, SystemOptionsProvider(), ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, DEFAULT_RECEIPT_FOOTER, ORDER_CHANNELS, PAYMENT_ICONS (+32 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "getDocument"
Cohesion: 0.07
Nodes (68): {
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
}, publicBase(), response() (+60 more)

### Community 9 - "guard"
Cohesion: 0.04
Nodes (81): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, corsHeaders, { guard, siteOrigin, siteUrl }, handler() (+73 more)

### Community 10 - "settings.js"
Cohesion: 0.10
Nodes (44): ROLE_JOBS, devicesOf(), cleanStations(), APPLY_KEYS, PAGE_KEYS, SALES_DEFAULTS, isDataImage(), storeImage() (+36 more)

### Community 11 - "PortalShell.jsx"
Cohesion: 0.10
Nodes (28): AutomobileShell(), BusinessSettings(), Detailing, Icon(), ICONS, Inventory, ITEMS, ROLE_ITEMS (+20 more)

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

### Community 17 - "cloud.service.js"
Cohesion: 0.10
Nodes (31): STORAGE, exactly(), profileHasPosAccess(), ALWAYS_LIVE_KEY, alwaysLive(), clone(), CloudSyncService, log (+23 more)

### Community 18 - "timesheetEdit.test.js"
Cohesion: 0.21
Nodes (16): AUDIT_ACTION, dayOf(), entryError(), entryLocked(), fromLocalInput(), LOCK_MONTHS, lockDate(), MAX_SHIFT_MS (+8 more)

### Community 19 - "ceylonry-site-runtime.js"
Cohesion: 0.04
Nodes (71): $a(), Ab(), Bd(), bh(), bj(), ch(), Ck(), cn() (+63 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.12
Nodes (31): cleanBarcode(), CODE128, code128Units(), code128Values(), drawCode128(), sizedBarcode(), alignmentAdjust(), barcodeLabelCopy() (+23 more)

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

### Community 25 - "getUserFromEvent"
Cohesion: 0.10
Nodes (17): Anthropic, contextText(), { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, line(), log (+9 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (35): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+27 more)

### Community 27 - "useData"
Cohesion: 0.06
Nodes (79): CartLines(), CategoryRail(), CheckoutFields(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection(), useDiscountDraft() (+71 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.10
Nodes (38): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, billingPatchForStatus(), clampNum(), clean() (+30 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.11
Nodes (12): CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef(), request() (+4 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 34 - "domain/format.js"
Cohesion: 0.11
Nodes (25): log, MenuTab(), CATALOGUE_HEADERS, catalogueExportMatrix(), exportStock(), menuFileName(), plain(), csvEscape() (+17 more)

### Community 35 - "presets.js"
Cohesion: 0.19
Nodes (13): BusinessTypeTab(), CAPABILITIES, typesWith(), ADMIN_BUSINESS_TYPE_OPTIONS, commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS (+5 more)

### Community 36 - "adminAnalytics.js"
Cohesion: 0.15
Nodes (24): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), dailySeries(), day(), DEFAULT_TZ, fmt (+16 more)

### Community 37 - "vitest"
Cohesion: 0.18
Nodes (14): makeCtx(), cash(), addProduct(), createHarness(), line(), noDiscount, openShift(), productForm() (+6 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.07
Nodes (52): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+44 more)

### Community 40 - "pos-admin-accounts.test.js"
Cohesion: 0.12
Nodes (15): assert, auth, col(), docs, form, fs, { handler }, lib (+7 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "analytics.js"
Cohesion: 0.17
Nodes (28): CustomerSection(), birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), dashboardData() (+20 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (31): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+23 more)

### Community 44 - "subscription.js"
Cohesion: 0.18
Nodes (20): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+12 more)

### Community 45 - "d"
Cohesion: 0.09
Nodes (44): ae(), at(), bc(), be(), C(), dt(), Ee(), Fe() (+36 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.10
Nodes (41): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, sendAdminRequest(), AdminApp() (+33 more)

### Community 47 - "isAppwrite"
Cohesion: 0.16
Nodes (24): isAppwrite(), activeLocationIds(), allows(), branchOf(), categoryAllowedAt(), itemAllowedAt(), itemsAt(), newItemLocationIds() (+16 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.09
Nodes (48): addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature() (+40 more)

### Community 49 - "shopify-store.js"
Cohesion: 0.09
Nodes (37): { getUserFromEvent, getDocument, upsertDocument, queryDocuments, clean }, { guard, reply }, handler(), log, { shopKey, rateFor }, { _encrypt: encrypt }, { getUserFromEvent, getDocument, upsertDocument, deleteDocument, clean }, { guard, reply } (+29 more)

### Community 50 - "features.js"
Cohesion: 0.15
Nodes (20): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, ONLINE, presetFlags() (+12 more)

### Community 51 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.21
Nodes (29): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+21 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.06
Nodes (26): assert, keys, lib, rows, test, assert, keys, test (+18 more)

### Community 55 - "AppwriteException"
Cohesion: 0.14
Nodes (3): AppwriteException, Databases, Teams

### Community 56 - "salesSplit.test.js"
Cohesion: 0.18
Nodes (9): combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef, ctxFor() (+1 more)

### Community 57 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 58 - "localAdmin.js"
Cohesion: 0.09
Nodes (32): getStore(), invoices(), localAdminApi(), flagsWithPlan(), createDatabase(), databaseNameFor(), log, migrations (+24 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 60 - "ReportPage.jsx"
Cohesion: 0.14
Nodes (29): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+21 more)

### Community 62 - "usePos"
Cohesion: 0.07
Nodes (78): Staff, CloudBanner(), NavIcon(), PATHS, Shell(), Sidebar(), LabelAlignWizard(), SIDES (+70 more)

### Community 63 - "plans.js"
Cohesion: 0.15
Nodes (16): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), localAdminSession, fmt(), PlansGrid() (+8 more)

### Community 64 - "logic.mjs"
Cohesion: 0.11
Nodes (29): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+21 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (41): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+33 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 67 - "taxes.test.js"
Cohesion: 0.19
Nodes (13): calculateTaxes(), cleanTax(), MAX_RATE, partsOf(), taxIdFor(), taxUses(), text(), both (+5 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "adminInsights.js"
Cohesion: 0.17
Nodes (23): activationFunnel(), ACTIVE, benchmark(), byBusinessType(), churnRisk(), FUNNEL, heatmap(), kitchenSpeed() (+15 more)

### Community 70 - "c"
Cohesion: 0.12
Nodes (26): ai(), a(), bi(), ci(), Dg(), ef(), Eh(), hb() (+18 more)

### Community 71 - "package.json"
Cohesion: 0.12
Nodes (15): description, engines, node, appwrite, name, private, scripts, audit:prod (+7 more)

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

### Community 80 - "SystemOptionsPages.jsx"
Cohesion: 0.06
Nodes (103): Delivered (slice 1), CeyloAiKeyPanel(), PROVIDERS, ConnectButton(), HardwarePanel(), PublishBar(), ConditionalGroup(), DAYS (+95 more)

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

### Community 88 - "Dashboard.jsx"
Cohesion: 0.21
Nodes (14): Kpi(), today(), batchStatus(), customerName(), data(), render(), Appointments(), MedicineBatches() (+6 more)

### Community 89 - "devices.js"
Cohesion: 0.16
Nodes (22): asStation(), connection(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), KITCHEN_CONNECTIONS, MAX_COPIES (+14 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (34): AssistBar(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+26 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 95 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 96 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 97 - "nowIso"
Cohesion: 0.12
Nodes (38): T, TABLE_BY_NAME, isEmail(), nowIso(), phoneKey(), whatsappPhone(), activeTimeEntry(), auditDetails() (+30 more)

### Community 98 - "MenuAdminPages.jsx"
Cohesion: 0.05
Nodes (111): Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), LocationChecks(), TextRow() (+103 more)

### Community 99 - "shopifyOrders.test.js"
Cohesion: 0.17
Nodes (19): VIEW_FEATURE, onlineOrdersByCustomer(), inboxToOpenOrder(), matchSku(), onlineLines(), openOrderIdOf(), POS_CURRENCY, rateFor() (+11 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "App.jsx"
Cohesion: 0.16
Nodes (18): App(), Gate(), Loading(), PublicMenuSync(), Ready(), Root(), ErrorBoundary, log (+10 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "dateStr"
Cohesion: 0.19
Nodes (23): dialog(), pillFor(), resRow(), seatDialog(), setStatus(), tableDialog(), toast(), viewBookings() (+15 more)

### Community 104 - "Detailing.jsx"
Cohesion: 0.15
Nodes (29): sendOrderEmail(), jobPaid(), jobTechs(), jobTotal(), buildInvoicePdf(), downloadInvoicePdf(), fileName(), invoiceEmailSale() (+21 more)

### Community 105 - "domain/catalog.js"
Cohesion: 0.14
Nodes (24): log, MenuImport(), NUMBERS, catalogueNumber(), cell(), firstColumn(), normalHeader(), parseCatalogueRows() (+16 more)

### Community 106 - "ni"
Cohesion: 0.13
Nodes (21): Bf(), e(), k(), eb(), ff(), gd(), hc(), kb() (+13 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "thirdPartyPayments.js"
Cohesion: 0.25
Nodes (12): PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), splitChoices() (+4 more)

### Community 109 - "ogf-sales.js"
Cohesion: 0.17
Nodes (19): batchCode(), breakdown(), dateTimeOf(), DEFAULT_PAYMENT_NAMES, describe(), header(), itemRows(), num() (+11 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.13
Nodes (24): KdsGate(), friendlyAuthError(), getAuthService(), accessAllowed(), billingWarning(), isTestAccount(), PAID_STATUSES, posAccessProfile() (+16 more)

### Community 113 - "printing.js"
Cohesion: 0.15
Nodes (18): routeKitchenLines(), prepName(), kitchenPrinterHook(), bind(), bindServices(), docCtx(), downloadReceipt(), kdsNotice() (+10 more)

### Community 114 - "createLogger"
Cohesion: 0.08
Nodes (24): DEV_ADMIN, env, forgetUser(), getAppwriteCompat(), installGlobalClsBackend(), log, rememberedUser(), rememberUser() (+16 more)

### Community 115 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

### Community 118 - "admin-store.js"
Cohesion: 0.16
Nodes (18): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+10 more)

### Community 119 - "Ce"
Cohesion: 0.20
Nodes (15): Ce(), ed(), fc(), gh(), Ij(), Lb(), mj(), oh() (+7 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "domain/inventory.js"
Cohesion: 0.25
Nodes (16): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), firstShortIngredient(), hasSizedStock(), isService(), lineSize() (+8 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 123 - "submit-subscription-receipt.js"
Cohesion: 0.07
Nodes (37): { appwriteAdmin }, { guard, siteOrigin, siteUrl }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+29 more)

### Community 124 - "posRoute.js"
Cohesion: 0.23
Nodes (9): addressForType(), addressOfPage(), POS_BASE_HOST, POS_URLS, posRedirect(), servesPosAtRoot(), AUTO, MAIN (+1 more)

### Community 125 - "account-danger-zone.js"
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
Cohesion: 0.30
Nodes (18): stamp(), advanceJob(), clash(), createInvoice(), find(), finishJob(), guard(), JOB_FLOW (+10 more)

### Community 130 - "AssignmentTree"
Cohesion: 0.39
Nodes (5): AssignmentTree(), byTerm(), GroupBox(), groups, html()

### Community 131 - "KdsApp.jsx"
Cohesion: 0.22
Nodes (22): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+14 more)

### Community 132 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+4 more)

### Community 133 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 134 - "Shopify orders into the POS: feasibility"
Cohesion: 0.18
Nodes (11): Connecting a store: two options, How it would work, Mapping Shopify to the POS, Questions for you, Risks and open decisions, Shopify facts that shape the design, Shopify orders into the POS: feasibility, Status: phase 1 (receive) built (+3 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 136 - "AnalyticsTab.jsx"
Cohesion: 0.35
Nodes (15): BarChart(), HourlyPanel(), Kpi(), lkr(), METRICS, one(), RankedBars(), AnalyticsTab() (+7 more)

### Community 137 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "pos/catalog.js"
Cohesion: 0.21
Nodes (19): productCategories(), carryCategoryRename(), addCategory(), addSubcategory(), applyCatalogDrafts(), deleteCategory(), deleteModifier(), deleteProduct() (+11 more)

### Community 140 - "5. Phases"
Cohesion: 0.15
Nodes (13): 5. Phases, 5a. Files, 5b. E-mail (replaces EmailJS), Phase 0: Confirm before buying (1 to 2 days), Phase 10: Cutover (1 to 2 days of work, plus preparation), Phase 11: Decommission and clean-up (2 days), Phase 1: Server and tooling (2 to 3 days), Phase 2: Repository structure and backend modules (8 to 12 days) (+5 more)

### Community 141 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 142 - "pos-handoff.test.js"
Cohesion: 0.20
Nodes (10): { guard, reply }, handler(), lib, log, assert, call(), { handler }, issued (+2 more)

### Community 143 - "Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)"
Cohesion: 0.11
Nodes (17): 10. Rough timeline, 11. Open questions, 1. Goal and decisions already made, 2.1 What Netlify does for us, 2.2 What Appwrite does for us, 2. What exists today (inventory), 3.1 Frontend and backend, kept separate, 3.2 Why PostgreSQL and not MongoDB (+9 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.20
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "kitchenPrinters.js"
Cohesion: 0.11
Nodes (24): openKotWindow(), testStation(), kotEscPos(), kotHtml(), claimed, endpointFor(), identity(), log (+16 more)

### Community 152 - "diagnosticsShared.js"
Cohesion: 0.10
Nodes (31): adminSignals(), buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS (+23 more)

### Community 153 - "AppwriteAuthProvider"
Cohesion: 0.20
Nodes (5): 4. Principles, 6. Services (abstractions), AppwriteAuthProvider, useServices(), ctx()

### Community 154 - "pos-admin-rollup.test.js"
Cohesion: 0.22
Nodes (9): assert, end, fs, iso(), sale(), salesRollup, source, start (+1 more)

### Community 155 - "POS variants (verticals)"
Cohesion: 0.40
Nodes (4): Add a new business type, Add a new module (for example vehicles and job cards for Automotive), POS variants (verticals), Rules

### Community 157 - "ogf-push-function.test.js"
Cohesion: 0.11
Nodes (15): handler(), lib, log, push, assert, caller, docs, { handler } (+7 more)

### Community 158 - "pos-admin-catalog.test.js"
Cohesion: 0.14
Nodes (12): handler(), call(), assert, auth, call(), col(), docs, { handler } (+4 more)

### Community 160 - "documents.js"
Cohesion: 0.27
Nodes (13): receiptName(), receiptDate(), kotBody(), kotTicketsHtml(), padLeft(), padRight(), prepLines(), receiptLayout() (+5 more)

### Community 161 - "pos-address.test.js"
Cohesion: 0.18
Nodes (7): assert, fs, path, redirects, root, test, toml

### Community 162 - "admin-auth.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 163 - "account-purge.test.js"
Cohesion: 0.26
Nodes (10): businessLabel(), confirmWord(), createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert (+2 more)

### Community 165 - "printBridge.js"
Cohesion: 0.18
Nodes (12): connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), loadQz(), log, sendRaw() (+4 more)

### Community 166 - "Ceylonry POS: New Feature Roll-out Notes"
Cohesion: 0.22
Nodes (8): 1. Item stock counts and ingredients, 2. Branch-specific menus, 3. Demo and Test accounts no longer ask for payment, 4. Trial length and plan prices are consistent, 5. Modifier groups: assign to items by tree, 6. Fixes, Ceylonry POS: New Feature Roll-out Notes, Notes

### Community 168 - "Architecture"
Cohesion: 0.20
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 169 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 170 - "health.test.js"
Cohesion: 0.36
Nodes (8): formatBytes(), healthIssues(), rateLatency(), cleanKds(), KDS_DEFAULTS, kdsError(), kdsSettingsOf(), whole()

### Community 171 - "Features"
Cohesion: 0.22
Nodes (8): Ceylonry POS: Release Notes, 2026-11-17, Features, Fixes, New landing page, Other, Plan finder: devices per location, QR menu (digital menu for restaurants and cafés), Visual refresh

### Community 172 - "Settings section: build status and plan"
Cohesion: 0.14
Nodes (13): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 6): Taxes, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers) (+5 more)

### Community 173 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 174 - "sizes.test.js"
Cohesion: 0.33
Nodes (8): sizeSlug(), findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), sizeLine()

### Community 175 - "ref_node_fs"
Cohesion: 0.09
Nodes (17): PLANS, POS_PLANS, walk(), assert, compat, fs, path, test (+9 more)

### Community 176 - "Features"
Cohesion: 0.17
Nodes (11): 1. Online orders from Shopify, 2. Shopify customers in the CRM, 3. Online Orders report, 4. Items with short ingredients are blocked when selected, 5. Manager override for low stock, 6. Ceylo AI: pick the model from a list, with a key guide, 7. QR menu: admin switch, Ceylonry POS: Release Notes, 2026-11-19 (+3 more)

### Community 177 - "ogf-push.test.js"
Cohesion: 0.18
Nodes (11): assert, CLIENT, config(), deps(), http, mall, push, run() (+3 more)

### Community 178 - "diagnosticsPeer.js"
Cohesion: 0.22
Nodes (15): discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog(), saveLog() (+7 more)

### Community 179 - "README.md"
Cohesion: 0.11
Nodes (10): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification (+2 more)

### Community 180 - "salesLog.js"
Cohesion: 0.36
Nodes (9): userName(), staffName(), day(), DELETED_ACTION, inLocation(), parseDeletedDetails(), refundRows(), voidRows() (+1 more)

### Community 182 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 183 - "serviceWorker.test.js"
Cohesion: 0.16
Nodes (9): isHashed(), isPosPage(), SHELL, strategyFor(), code, handlers, pick(), req() (+1 more)

### Community 184 - "OGF POS-02 UAT in Postman"
Cohesion: 0.33
Nodes (5): OGF POS-02 UAT in Postman, Points the Postman guide shows (to confirm with OGF), Rebuild, Run it, What each request is

### Community 185 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 186 - "Restaurant (OGF) and the OGF sales push"
Cohesion: 0.25
Nodes (7): Limits, OGF's Postman guide (what it adds), Restaurant (OGF) and the OGF sales push, Setting a business up, Things the documents leave open (to confirm with OGF), What is sent, Where it lives

### Community 187 - "adminInsightsParity.test.js"
Cohesion: 0.29
Nodes (7): ago(), end, payload, sale(), server, src, start

### Community 188 - "POS app (browser)"
Cohesion: 0.40
Nodes (4): auth(), Logging, Netlify functions (server), POS app (browser)

### Community 189 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 190 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 191 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 193 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 194 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 195 - "Ceylonry POS: Release Notes, 2026-11-18"
Cohesion: 0.33
Nodes (5): Ceylonry POS: Release Notes, 2026-11-18, Features, Fixes, Ingredient check when an item is selected, Other

### Community 197 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 198 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 199 - "collect"
Cohesion: 0.67
Nodes (4): collect(), keyOf(), pickRegister(), previewFor()

### Community 201 - "Test plan"
Cohesion: 0.50
Nodes (4): Automated coverage, Harness, Manual checklist (not automated), Test plan

### Community 202 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe

### Community 203 - "orders.js"
Cohesion: 0.38
Nodes (6): isSequential(), mergeOrders(), migrateOrderNumbers(), orderSequenceFrom(), orderTime(), mergeOpenOrders()

## Knowledge Gaps
- **1022 isolated node(s):** `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}`, `log`, `OPERATIONAL_COLLECTIONS` (+1017 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1334 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `ai-keys.js`, `UsersPages.jsx`, `AssignmentTree`, `KdsApp.jsx`, `panels.jsx`, `PosProvider.jsx`, `net.js`, `logger.js`, `kitchenPrinters.js`, `timesheetEdit.test.js`, `labelPrinter.js`, `diagnosticsShared.js`, `settingsGroups.test.js`, `domain/format.js`, `presets.js`, `adminAnalytics.js`, `printBridge.js`, `appwriteCompat.test.js`, `reportBuilders.js`, `health.test.js`, `analytics.js`, `subscription.js`, `AdminApp.jsx`, `ref_node_fs`, `pos/sales.js`, `isAppwrite`, `features.js`, `sizes.test.js`, `salesLog.js`, `Tables.jsx`, `serviceWorker.test.js`, `salesSplit.test.js`, `localAdmin.js`, `adminInsightsParity.test.js`, `ReportPage.jsx`, `plans.js`, `pos-react/package.json`, `taxes.test.js`, `adminInsights.js`, `imageStorage.test.js`, `SystemOptionsPages.jsx`, `Dashboard.jsx`, `devices.js`, `assist.js`, `receiptPrinter`, `MenuAdminPages.jsx`, `shopifyOrders.test.js`, `Detailing.jsx`, `thirdPartyPayments.js`, `SessionProvider.jsx`, `createLogger`, `portal.test.js`, `posRoute.js`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `r()` connect `b` to `c`, `d`, `ceylonry-site-runtime.js`, `pos-routing.test.js`, `adminInsightsParity.test.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `react` connect `useData` to `UsersPages.jsx`, `AssignmentTree`, `panels.jsx`, `Ceylo.jsx`, `KdsApp.jsx`, `PosProvider.jsx`, `AnalyticsTab.jsx`, `PortalShell.jsx`, `domain/format.js`, `presets.js`, `printBridge.js`, `analytics.js`, `subscription.js`, `AdminApp.jsx`, `isAppwrite`, `diagnosticsPeer.js`, `features.js`, `Tables.jsx`, `serviceWorker.test.js`, `ReportPage.jsx`, `usePos`, `plans.js`, `pos-react/package.json`, `SystemOptionsPages.jsx`, `Dashboard.jsx`, `assist.js`, `MenuAdminPages.jsx`, `App.jsx`, `Detailing.jsx`, `domain/catalog.js`, `SessionProvider.jsx`, `createLogger`, `posRoute.js`, `useInstall.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
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
  _1022 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai-keys.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._
- **Should `UsersPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11212121212121212 - nodes in this community are weakly interconnected._
- **Should `panels.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1411764705882353 - nodes in this community are weakly interconnected._