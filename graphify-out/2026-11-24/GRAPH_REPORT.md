# Graph Report - clscashflow  (2026-11-24)

## Corpus Check
- 566 files · ~1,410,437 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .css 15, (none) 4, .webmanifest 2)

## Summary
- 5255 nodes · 16315 edges · 215 communities (191 shown, 24 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 627 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8dca8e6b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ai-keys.js
- react
- menuAdmin.js
- esc
- harness.js
- appwrite.js
- pos/staff.js
- __awaiter
- lib/invoice-share.js
- adminAnalytics.js
- settings.js
- DataProvider.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- cloud.service.js
- Timesheets.jsx
- ceylonry-site-runtime.js
- useUi
- b
- store.mjs
- pos.mjs
- app.mjs
- clean
- pos-routing.test.js
- useData
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- OnlineOrders.jsx
- pos/onlineOrders.js
- functions/menu-share.js
- domain.test.js
- invoiceEscape
- reportBuilders.js
- pos-admin-accounts.test.js
- invoiceEscape
- ReportPage.jsx
- pagePath
- subscription.js
- d
- AdminApp.jsx
- package.json
- pos/sales.js
- shopify-store.js
- vitest
- render
- Tables.jsx
- ref_node_assert
- appwrite-sdk.js
- Teams
- salesSplit.test.js
- render
- tables/index.js
- boot
- EndOfDay.jsx
- panels.jsx
- plans.js
- logic.mjs
- pos-react/package.json
- boot
- useFeature
- getAuthUser
- adminInsights.js
- c
- submit-subscription-receipt.js
- Client
- Z
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- Functions
- LocalAuthProvider
- SystemOptionsPages.jsx
- m
- xk
- health-check.mjs
- pos-diagnostics.test.js
- mountBillingWidget
- POS database and sync changes: team update
- Plan: move from Netlify + Appwrite Cloud to a VPS
- UsersPages.jsx
- security.js
- security-endpoints.test.js
- assist.js
- appwrite-compat-session.test.js
- receiptPrinter
- labelPrinter
- usePos
- normalizePlan
- nowIso
- MenuAdminPages.jsx
- printing.js
- Root test-suite audit (169 failing tests)
- pos/inventory.js
- User guide
- pos-admin-support-role.test.js
- payroll.test.js
- dateStr
- ni
- Administrator guide
- appwriteAdmin
- serviceWorker.test.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- documents.js
- createLogger
- send-contact.js
- SettingsHome.jsx
- supportLive.js
- functions/support-session.js
- Ce
- Settings Section Build Spec: what is still pending
- isAppwrite
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- 5. Phases
- businessTypeLocked
- KdsHealthPages.jsx
- useInstall.js
- B
- lib/ogf-push.js
- Development guide
- AssignmentTree
- KdsApp.jsx
- link.js
- hardware-order.js
- LiveSupportPanel.jsx
- Ceylonry POS — React + WatermelonDB
- SupportViewer.jsx
- net.js
- config-merge.js
- pos/catalog.js
- presets.js
- diagnostics-store.js
- Detailing.jsx
- Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)
- appwrite-files.js
- kitchenPrinters.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- diagnostics.service.js
- ref_node_fs
- pos-admin-rollup.test.js
- POS variants (verticals)
- landing-motion.js
- ogf-push-function.test.js
- imageTools.js
- ready.js
- receiptPrinter.js
- dependencies
- Ceylo.jsx
- Settings section: build status and plan
- build.py
- printBridge.js
- Ceylonry POS: New Feature Roll-out Notes
- Architecture
- salesLog.js
- quote-email-ui.test.js
- supportControl.js
- Features
- account-purge.test.js
- Ceylonry POS: release notes, 2026-11-23
- devDependencies
- scripts
- Features
- ogf-push.test.js
- diagnosticsShared.js
- supportProtocol.test.js
- ErrorBoundary.jsx
- Role
- PosProvider.jsx
- public/sw.js
- OGF POS-02 UAT in Postman
- Live support session: relay server and testing
- lib/support-session.js
- IMPORTANT: This is NOT a rebuild of the POS system.
- thirdPartyPayments.js
- onboarding-terms-acceptance.test.js
- Restaurant (OGF) and the OGF sales push
- adminInsightsParity.test.js
- FakePc
- supportViewerState.js
- pos-address.test.js
- Ceylonry POS: Release Notes, 2026-11-18
- normalizePlan
- LocationChecks
- README.md
- vite.config.js
- admin-auth.js
- pos-reported-bugs.test.js
- imageStorage.test.js
- taxes.test.js
- appwriteCompat.test.js
- shopify-admin.js
- supportProtocol.js
- bug-report-20260811-email-modal-template.test.js
- Databases
- insightsRollup
- POS administration portal
- Deployment & operations
- step
- Graphql
- Messaging

## God Nodes (most connected - your core abstractions)
1. `useData()` - 210 edges
2. `usePos()` - 204 edges
3. `react` - 142 edges
4. `useFeature()` - 99 edges
5. `__awaiter()` - 93 edges
6. `money()` - 93 edges
7. `vitest` - 83 edges
8. `AppwriteException` - 74 edges
9. `Modal()` - 67 edges
10. `nowIso()` - 66 edges

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

## Communities (215 total, 24 thin omitted)

### Community 0 - "ai-keys.js"
Cohesion: 0.09
Nodes (33): admin, { _encrypt: encrypt }, { getDocument, upsertDocument, clean }, handler(), oauth, page(), publicBase(), { shopKey } (+25 more)

### Community 1 - "react"
Cohesion: 0.09
Nodes (52): CloudBanner(), Shell(), Modal(), ModalBody(), NumberInput(), STOCK_UNITS, equalSplit(), groupedValue() (+44 more)

### Community 2 - "menuAdmin.js"
Cohesion: 0.09
Nodes (34): catalogDraftChanges(), allowedCategoryKeys(), APPLY_KEYS, assignItems(), brief(), DEFAULT_PREFIXES, draftChanges(), FIELD_LABELS (+26 more)

### Community 3 - "esc"
Cohesion: 0.17
Nodes (34): bindTables(), bookingDialog(), cfg(), dateBar(), dialog(), dlg(), esc(), floorName() (+26 more)

### Community 4 - "harness.js"
Cohesion: 0.13
Nodes (19): log, sendAdminRequest(), adminSession, DEV_ADMIN, getStore(), invoices(), localAdminApi(), localAdminSession (+11 more)

### Community 5 - "appwrite.js"
Cohesion: 0.08
Nodes (71): 2.3 The seams that make this manageable, Phase 3: Data layer (5 to 8 days), crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler() (+63 more)

### Community 6 - "pos/staff.js"
Cohesion: 0.13
Nodes (23): findApprover(), AUDIT_ACTION, auditDetails(), diffEntry(), deleteModifier(), deleteProduct(), deleteSubcategory(), audit() (+15 more)

### Community 7 - "__awaiter"
Cohesion: 0.10
Nodes (3): Account, AppwriteException, __awaiter()

### Community 8 - "lib/invoice-share.js"
Cohesion: 0.11
Nodes (46): {
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
}, publicBase(), response() (+38 more)

### Community 9 - "adminAnalytics.js"
Cohesion: 0.18
Nodes (20): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), dailySeries(), day(), fmt, group() (+12 more)

### Community 10 - "settings.js"
Cohesion: 0.08
Nodes (66): asStation(), connection(), connectionLabel(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf() (+58 more)

### Community 11 - "DataProvider.jsx"
Cohesion: 0.09
Nodes (35): App(), Gate(), Loading(), PublicMenuSync(), Ready(), Root(), SupportBridge(), AssistMissing() (+27 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.05
Nodes (39): Data model, 5. Data layer (WatermelonDB), camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED (+31 more)

### Community 14 - "logger.js"
Cohesion: 0.12
Nodes (30): el(), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS (+22 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin, ADMIN_EMAIL }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.14
Nodes (20): PosStore, decode(), encode(), attachLines(), categoryId(), EMPTY_SNAPSHOT(), hintSeq(), LEGACY_ARRAY_TABLES (+12 more)

### Community 17 - "cloud.service.js"
Cohesion: 0.10
Nodes (30): DEFAULT_OWNER_PIN, STORAGE, exactly(), profileHasPosAccess(), alwaysLive(), clone(), CloudSyncService, log (+22 more)

### Community 18 - "Timesheets.jsx"
Cohesion: 0.20
Nodes (18): dayOf(), entryError(), entryLocked(), fromLocalInput(), LOCK_MONTHS, lockDate(), MAX_SHIFT_MS, ms() (+10 more)

### Community 19 - "ceylonry-site-runtime.js"
Cohesion: 0.04
Nodes (71): $a(), Ab(), Bd(), bh(), bj(), ch(), Ck(), cn() (+63 more)

### Community 20 - "useUi"
Cohesion: 0.07
Nodes (57): ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), PrintHelperPicker(), productSizeGroup(), PRINTER_KINDS (+49 more)

### Community 21 - "b"
Cohesion: 0.08
Nodes (58): ac(), an(), e(), n(), c(), Bt(), dd(), dh() (+50 more)

### Community 22 - "store.mjs"
Cohesion: 0.13
Nodes (32): mergeRows(), base(), boot(), bucketOf(), BUCKETS, call(), dirty, docFor() (+24 more)

### Community 23 - "pos.mjs"
Cohesion: 0.30
Nodes (13): layoutDialog(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf(), fromPos() (+5 more)

### Community 24 - "app.mjs"
Cohesion: 0.10
Nodes (41): ACTIONS, billsOf(), bindGuestFill(), business(), cancelDialog(), canSend(), detailDialog(), ensureGuest() (+33 more)

### Community 25 - "clean"
Cohesion: 0.06
Nodes (56): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+48 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (36): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+28 more)

### Community 27 - "useData"
Cohesion: 0.07
Nodes (54): Kpi(), today(), batchStatus(), commissionRows(), customerName(), userName(), orderTotal(), ACTIVE_STATUSES (+46 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.08
Nodes (43): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, billingPatchForStatus(), clampNum(), clean() (+35 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.09
Nodes (16): auth(), CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef() (+8 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 34 - "OnlineOrders.jsx"
Cohesion: 0.15
Nodes (30): ONLINE_CHANNELS, canAccept(), canDecline(), canFulfill(), canPack(), canTrack(), CARRIERS, customerMessage() (+22 more)

### Community 35 - "pos/onlineOrders.js"
Cohesion: 0.14
Nodes (31): cleanTracking(), trackingError(), inboxToOpenOrder(), matchSku(), onlineLines(), openOrderIdOf(), POS_CURRENCY, rateFor() (+23 more)

### Community 36 - "functions/menu-share.js"
Cohesion: 0.16
Nodes (21): {
  clean,
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument
}, { generatePublicToken, isValidPublicToken }, handler(), { locationKey, sanitizeMenu }, publicBase(), response(), uniqueToken(), { clean, headers, getDocument } (+13 more)

### Community 37 - "domain.test.js"
Cohesion: 0.08
Nodes (37): addConfiguredLine(), changeQty(), modifierSignature(), ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), firstShortIngredient() (+29 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (38): payCost(), activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day() (+30 more)

### Community 40 - "pos-admin-accounts.test.js"
Cohesion: 0.07
Nodes (27): handler(), assert, auth, call(), col(), docs, form, fs (+19 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "ReportPage.jsx"
Cohesion: 0.12
Nodes (29): downloadCsv(), localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows() (+21 more)

### Community 43 - "pagePath"
Cohesion: 0.06
Nodes (36): assert, fs, { pagePath }, path, read(), root, test, assert (+28 more)

### Community 44 - "subscription.js"
Cohesion: 0.18
Nodes (20): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+12 more)

### Community 45 - "d"
Cohesion: 0.09
Nodes (44): ae(), at(), bc(), be(), C(), dt(), Ee(), Fe() (+36 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.10
Nodes (36): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), emailInvoice(), AdminApp(), log (+28 more)

### Community 47 - "package.json"
Cohesion: 0.06
Nodes (26): realDeps(), dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe (+18 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.12
Nodes (37): Delivered (slice 6): Taxes, cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), serviceChargeAmount(), serviceChargeAuto() (+29 more)

### Community 49 - "shopify-store.js"
Cohesion: 0.06
Nodes (59): base(), esc(), { getDocument, clean }, handler(), oauth, page(), { shopKey }, admin (+51 more)

### Community 50 - "vitest"
Cohesion: 0.11
Nodes (26): FeaturesTab(), NO_OVERRIDE, Switch(), FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, ONLINE (+18 more)

### Community 51 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.14
Nodes (37): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, allFloorTables() (+29 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.07
Nodes (23): assert, keys, lib, rows, test, assert, keys, test (+15 more)

### Community 54 - "appwrite-sdk.js"
Cohesion: 0.13
Nodes (5): Avatars, Permission, Query, Service, Storage

### Community 56 - "salesSplit.test.js"
Cohesion: 0.18
Nodes (9): combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef, ctxFor() (+1 more)

### Community 57 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 58 - "tables/index.js"
Cohesion: 0.09
Nodes (23): log, migrations, tableColumns(), TYPE, CashShift, Customer, InventoryItem, Location (+15 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 60 - "EndOfDay.jsx"
Cohesion: 0.14
Nodes (30): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+22 more)

### Community 62 - "panels.jsx"
Cohesion: 0.07
Nodes (55): CeyloMascot(), Customers, how(), KitchenStations(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel() (+47 more)

### Community 63 - "plans.js"
Cohesion: 0.21
Nodes (11): buildInvoiceLines(), r2(), fmt(), PlansGrid(), ADDITIONAL_FEATURES, PLAN_CONDITIONS, PLAN_CONTACT, PLAN_FEATURE_OFF (+3 more)

### Community 64 - "logic.mjs"
Cohesion: 0.10
Nodes (36): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+28 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.12
Nodes (15): description, engines, node, appwrite, name, private, type, version (+7 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 67 - "useFeature"
Cohesion: 0.12
Nodes (40): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+32 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "adminInsights.js"
Cohesion: 0.11
Nodes (49): BarChart(), HourlyPanel(), Kpi(), lkr(), METRICS, one(), RankedBars(), AnalyticsTab() (+41 more)

### Community 70 - "c"
Cohesion: 0.12
Nodes (26): ai(), a(), bi(), ci(), Dg(), ef(), Eh(), hb() (+18 more)

### Community 71 - "submit-subscription-receipt.js"
Cohesion: 0.14
Nodes (19): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+11 more)

### Community 72 - "Client"
Cohesion: 0.15
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
Cohesion: 0.27
Nodes (16): { ADMIN_DATABASE_ID }, bad(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 77 - "mountBillingWidget"
Cohesion: 0.13
Nodes (19): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+11 more)

### Community 79 - "LocalAuthProvider"
Cohesion: 0.11
Nodes (7): 4. Principles, 6. Services (abstractions), AppwriteAuthProvider, LocalAuthProvider, passwordHash(), useServices(), ctx()

### Community 80 - "SystemOptionsPages.jsx"
Cohesion: 0.11
Nodes (60): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), ConditionalGroup() (+52 more)

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

### Community 88 - "UsersPages.jsx"
Cohesion: 0.19
Nodes (21): ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError(), jobsOf() (+13 more)

### Community 89 - "security.js"
Cohesion: 0.05
Nodes (64): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+56 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.13
Nodes (32): AssistBar(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+24 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 95 - "usePos"
Cohesion: 0.10
Nodes (33): NavIcon(), PATHS, PATHS, PortalIcon(), PortalHome(), PortalSettingsPage, PortalShell(), Reports (+25 more)

### Community 96 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 97 - "nowIso"
Cohesion: 0.17
Nodes (27): isEmail(), nowIso(), phoneKey(), whatsappPhone(), addSubcategory(), saveModifier(), newId(), supportAuditEntry() (+19 more)

### Community 98 - "MenuAdminPages.jsx"
Cohesion: 0.06
Nodes (78): categoryKey(), stalePresetCategory(), visibleProductCategories(), ARRAY_FIELDS, assignGroupEdits(), categoryEditError(), cleanCategoryEdit(), cleanGroupEdit() (+70 more)

### Community 99 - "printing.js"
Cohesion: 0.15
Nodes (19): routeKitchenLines(), kitchenPrinterHook(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log, openKotWindow() (+11 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "pos/inventory.js"
Cohesion: 0.19
Nodes (18): parseStockCountRows(), adjustmentChange(), stockMovement(), applyReversal(), calculateRefundAmount(), refundRate(), applyStockChange(), movementRow() (+10 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "pos-admin-support-role.test.js"
Cohesion: 0.18
Nodes (11): assert, auth, call(), data, diagnostics, lib, record, storePath (+3 more)

### Community 104 - "payroll.test.js"
Cohesion: 0.23
Nodes (15): bucketHours(), entryHours(), key(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS, split() (+7 more)

### Community 105 - "dateStr"
Cohesion: 0.18
Nodes (17): go(), queueSeating(), refreshPos(), signInView(), start(), syncGuests(), syncSoon(), viewMessages() (+9 more)

### Community 106 - "ni"
Cohesion: 0.13
Nodes (21): Bf(), e(), k(), eb(), ff(), gd(), hc(), kb() (+13 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "appwriteAdmin"
Cohesion: 0.10
Nodes (25): { appwriteAdmin }, { guard, siteOrigin, siteUrl }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+17 more)

### Community 109 - "serviceWorker.test.js"
Cohesion: 0.14
Nodes (8): calls, fake, code, handlers, pick(), req(), worker, react-dom

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.13
Nodes (27): databaseNameFor(), KdsGate(), assistActive(), assistSignedIn(), friendlyAuthError(), getAuthService(), log, accessAllowed() (+19 more)

### Community 113 - "documents.js"
Cohesion: 0.27
Nodes (15): esc(), modifierLabel(), receiptDate(), kotBody(), kotEscPos(), kotHtml(), kotTicketsHtml(), padLeft() (+7 more)

### Community 114 - "createLogger"
Cohesion: 0.08
Nodes (37): log, MenuImport(), NUMBERS, log, MenuTab(), env, catalogueNumber(), cell() (+29 more)

### Community 115 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 116 - "SettingsHome.jsx"
Cohesion: 0.09
Nodes (37): PublishBar(), SaveBar(), SettingsShell(), TopRow(), Ctx, SystemOptionsProvider(), useSystemOptionsDraft(), applyPatch() (+29 more)

### Community 117 - "supportLive.js"
Cohesion: 0.20
Nodes (16): spaced(), SupportBanner(), annotationSubs, answerRequest(), ask(), flash(), handleCommand(), IDLE (+8 more)

### Community 118 - "functions/support-session.js"
Cohesion: 0.10
Nodes (35): verifyAdmin(), { getAdmin, audit }, { guard, reply }, handler(), { isAdminEmail, verifyToken, canUsePortal }, log, store, verifyAdmin() (+27 more)

### Community 119 - "Ce"
Cohesion: 0.20
Nodes (15): Ce(), ed(), fc(), gh(), Ij(), Lb(), mj(), oh() (+7 more)

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "isAppwrite"
Cohesion: 0.28
Nodes (14): isAppwrite(), buildMenuSnapshot(), enabledKeys(), httpsImage(), linkKey(), linkOf(), call(), disablePublicMenu() (+6 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 123 - "5. Phases"
Cohesion: 0.15
Nodes (13): 5. Phases, 5a. Files, 5b. E-mail (replaces EmailJS), Phase 0: Confirm before buying (1 to 2 days), Phase 10: Cutover (1 to 2 days of work, plus preparation), Phase 11: Decommission and clean-up (2 days), Phase 1: Server and tooling (2 to 3 days), Phase 2: Repository structure and backend modules (8 to 12 days) (+5 more)

### Community 124 - "businessTypeLocked"
Cohesion: 0.22
Nodes (11): Delivered (slice 11): moves, business type, admin portal, businessTypeLocked(), addressForType(), addressOfPage(), POS_BASE_HOST, POS_URLS, posRedirect(), servesPosAtRoot() (+3 more)

### Community 125 - "KdsHealthPages.jsx"
Cohesion: 0.38
Nodes (10): formatBytes(), healthIssues(), rateLatency(), cleanKds(), KDS_DEFAULTS, kdsError(), kdsSettingsOf(), whole() (+2 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "B"
Cohesion: 0.22
Nodes (11): B(), fn(), Lt(), M(), N(), oa(), Ot(), pn() (+3 more)

### Community 128 - "lib/ogf-push.js"
Cohesion: 0.09
Nodes (47): batchCode(), cleanConfig(), collect(), configProblems(), crypto, deleteSecret(), emptyState(), getToken() (+39 more)

### Community 129 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 130 - "AssignmentTree"
Cohesion: 0.39
Nodes (5): AssignmentTree(), byTerm(), GroupBox(), groups, html()

### Community 131 - "KdsApp.jsx"
Cohesion: 0.21
Nodes (22): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+14 more)

### Community 132 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), linkFor(), links, listeners, notify(), pairs() (+4 more)

### Community 133 - "hardware-order.js"
Cohesion: 0.25
Nodes (10): clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), HEADERS, log, money(), nodemailer (+2 more)

### Community 134 - "LiveSupportPanel.jsx"
Cohesion: 0.31
Nodes (12): LiveSupportPanel(), spaced(), useCountdown(), linkLabel(), call(), connect(), endSupport(), finish() (+4 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 136 - "SupportViewer.jsx"
Cohesion: 0.15
Nodes (19): DESTINATIONS, newId(), Stage(), TEXT_TYPES, TOOLS, clearNotice(), onPageEvent(), resetViewer() (+11 more)

### Community 137 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "pos/catalog.js"
Cohesion: 0.25
Nodes (16): commonModifierPresets(), productCategories(), carryCategoryRename(), activeLocationIds(), addCategory(), addCommonModifiers(), applyCatalogDrafts(), deleteCategory() (+8 more)

### Community 140 - "presets.js"
Cohesion: 0.29
Nodes (9): CAPABILITIES, typesWith(), BUSINESS_TYPE_OPTIONS, INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS, RETIRED_MODIFIER_NAMES, SERVICE_CHARGE_TYPES (+1 more)

### Community 141 - "diagnostics-store.js"
Cohesion: 0.25
Nodes (17): serverClient(), { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired() (+9 more)

### Community 142 - "Detailing.jsx"
Cohesion: 0.08
Nodes (53): downloadBlob(), advanceJob(), clash(), createInvoice(), find(), finishJob(), guard(), JOB_FLOW (+45 more)

### Community 143 - "Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)"
Cohesion: 0.11
Nodes (17): 10. Rough timeline, 11. Open questions, 1. Goal and decisions already made, 2.1 What Netlify does for us, 2.2 What Appwrite does for us, 2. What exists today (inventory), 3.1 Frontend and backend, kept separate, 3.2 Why PostgreSQL and not MongoDB (+9 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.20
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "kitchenPrinters.js"
Cohesion: 0.20
Nodes (14): chooseKitchenPrinter(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket(), usbSupported() (+6 more)

### Community 152 - "diagnostics.service.js"
Cohesion: 0.13
Nodes (21): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+13 more)

### Community 153 - "ref_node_fs"
Cohesion: 0.08
Nodes (20): walk(), assert, compat, fs, path, test, admin, assert (+12 more)

### Community 154 - "pos-admin-rollup.test.js"
Cohesion: 0.22
Nodes (9): assert, end, fs, iso(), sale(), salesRollup, source, start (+1 more)

### Community 155 - "POS variants (verticals)"
Cohesion: 0.40
Nodes (4): Add a new business type, Add a new module (for example vehicles and job cards for Automotive), POS variants (verticals), Rules

### Community 157 - "ogf-push-function.test.js"
Cohesion: 0.11
Nodes (15): handler(), lib, log, push, assert, caller, docs, { handler } (+7 more)

### Community 158 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 159 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 160 - "receiptPrinter.js"
Cohesion: 0.32
Nodes (8): batch, localPrintPreview(), showLabelPreview(), showPrintPreview(), tsplBytesToDataUrl(), printHtmlInFrame(), printHtmlInWindow(), log

### Community 161 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+3 more)

### Community 162 - "Ceylo.jsx"
Cohesion: 0.09
Nodes (33): AskCeylo(), CeyloButton(), CeyloPanel(), DOT, EYES, Item(), MOVES, reducedMotion() (+25 more)

### Community 163 - "Settings section: build status and plan"
Cohesion: 0.17
Nodes (11): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts, Next slices, in the spec's order (+3 more)

### Community 165 - "printBridge.js"
Cohesion: 0.35
Nodes (8): connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), log, sendRaw(), toBase64()

### Community 166 - "Ceylonry POS: New Feature Roll-out Notes"
Cohesion: 0.22
Nodes (8): 1. Item stock counts and ingredients, 2. Branch-specific menus, 3. Demo and Test accounts no longer ask for payment, 4. Trial length and plan prices are consistent, 5. Modifier groups: assign to items by tree, 6. Fixes, Ceylonry POS: New Feature Roll-out Notes, Notes

### Community 167 - "Architecture"
Cohesion: 0.22
Nodes (9): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack (+1 more)

### Community 168 - "salesLog.js"
Cohesion: 0.44
Nodes (7): day(), DELETED_ACTION, inLocation(), parseDeletedDetails(), refundRows(), voidRows(), users

### Community 169 - "quote-email-ui.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 170 - "supportControl.js"
Cohesion: 0.43
Nodes (7): denyReason(), NEVER_TYPES, place(), runAction(), scrollable(), sensitiveName(), setValue()

### Community 171 - "Features"
Cohesion: 0.22
Nodes (8): Ceylonry POS: Release Notes, 2026-11-17, Features, Fixes, New landing page, Other, Plan finder: devices per location, QR menu (digital menu for restaurants and cafés), Visual refresh

### Community 172 - "account-purge.test.js"
Cohesion: 0.26
Nodes (10): businessLabel(), confirmWord(), createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert (+2 more)

### Community 173 - "Ceylonry POS: release notes, 2026-11-23"
Cohesion: 0.29
Nodes (6): 1. Live support session (#179), 2. Support-only admin accounts, Ceylonry POS: release notes, 2026-11-23, Features, Fixes, Other

### Community 174 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/plugin-proposal-decorators, @babel/plugin-transform-class-properties, fake-indexeddb, vite, @vitejs/plugin-react, vitest

### Community 175 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint:syntax, preview, test

### Community 176 - "Features"
Cohesion: 0.17
Nodes (11): 1. Online orders from Shopify, 2. Shopify customers in the CRM, 3. Online Orders report, 4. Items with short ingredients are blocked when selected, 5. Manager override for low stock, 6. Ceylo AI: pick the model from a list, with a key guide, 7. QR menu: admin switch, Ceylonry POS: Release Notes, 2026-11-19 (+3 more)

### Community 177 - "ogf-push.test.js"
Cohesion: 0.18
Nodes (11): assert, CLIENT, config(), deps(), http, mall, push, run() (+3 more)

### Community 178 - "diagnosticsShared.js"
Cohesion: 0.13
Nodes (25): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+17 more)

### Community 179 - "supportProtocol.test.js"
Cohesion: 0.33
Nodes (7): droppable(), keepTrying(), MOVEMENT, RECONNECT_MS, reconnectDelay(), startRecording(), rrweb

### Community 182 - "PosProvider.jsx"
Cohesion: 0.10
Nodes (38): Staff, AppearancePanel(), FULL_SETTINGS_ROLES, isOwnerRole(), OWNER_ROLES, REPORTING_ROLES, SETTINGS_PAGE_OF_VIEW, VIEW_TITLES (+30 more)

### Community 183 - "public/sw.js"
Cohesion: 0.32
Nodes (5): isHashed(), isPosPage(), SHELL, strategyFor(), res()

### Community 184 - "OGF POS-02 UAT in Postman"
Cohesion: 0.33
Nodes (5): OGF POS-02 UAT in Postman, Points the Postman guide shows (to confirm with OGF), Rebuild, Run it, What each request is

### Community 185 - "Live support session: relay server and testing"
Cohesion: 0.18
Nodes (10): 1. Install coturn on the server, 2. Tell the functions about it, 3. Check it works, How the connection works, Live support session: relay server and testing, Reconnecting, Relay server (coturn), Slow networks (+2 more)

### Community 186 - "lib/support-session.js"
Cohesion: 0.12
Nodes (9): agentView(), crypto, iceServers(), join(), newSession(), newSessionId(), offerKey(), text() (+1 more)

### Community 187 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 188 - "thirdPartyPayments.js"
Cohesion: 0.27
Nodes (11): PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), reorder() (+3 more)

### Community 189 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 190 - "Restaurant (OGF) and the OGF sales push"
Cohesion: 0.25
Nodes (7): Limits, OGF's Postman guide (what it adds), Restaurant (OGF) and the OGF sales push, Setting a business up, Things the documents leave open (to confirm with OGF), What is sent, Where it lives

### Community 191 - "adminInsightsParity.test.js"
Cohesion: 0.29
Nodes (7): ago(), end, payload, sale(), server, src, start

### Community 193 - "supportViewerState.js"
Cohesion: 0.18
Nodes (18): SupportViewer(), buffer, call(), endViewer(), eventSubs, finish(), IDLE, joinSupport() (+10 more)

### Community 194 - "pos-address.test.js"
Cohesion: 0.18
Nodes (7): assert, fs, path, redirects, root, test, toml

### Community 195 - "Ceylonry POS: Release Notes, 2026-11-18"
Cohesion: 0.33
Nodes (5): Ceylonry POS: Release Notes, 2026-11-18, Features, Fixes, Ingredient check when an item is selected, Other

### Community 196 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 197 - "LocationChecks"
Cohesion: 0.47
Nodes (3): LocationChecks(), html(), locations

### Community 198 - "README.md"
Cohesion: 0.08
Nodes (16): How they were recorded, Product walkthroughs, Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served) (+8 more)

### Community 199 - "vite.config.js"
Cohesion: 0.47
Nodes (5): adminRoute(), configurePreviewServer(), configureServer(), vite, @vitejs/plugin-react

### Community 200 - "admin-auth.js"
Cohesion: 0.11
Nodes (21): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, ADMIN_ROLES, b64url() (+13 more)

### Community 201 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 203 - "taxes.test.js"
Cohesion: 0.18
Nodes (14): calculateTaxes(), cleanTax(), MAX_RATE, partsOf(), taxIdFor(), taxUses(), text(), deleteMenuEntity() (+6 more)

### Community 205 - "shopify-admin.js"
Cohesion: 0.08
Nodes (38): Connecting a store: two options, How it would work, Mapping Shopify to the POS, Questions for you, Risks and open decisions, Shopify facts that shape the design, Shopify orders into the POS: feasibility, Status: phase 1 (receive) built (+30 more)

### Community 206 - "supportProtocol.js"
Cohesion: 0.25
Nodes (11): clamp(), cleanAnnotation(), cleanCommand(), FRAME, frameReader(), num(), toFrames(), TOOLS (+3 more)

### Community 208 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 212 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 213 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 215 - "step"
Cohesion: 0.50
Nodes (4): adopt(), fulfilled(), rejected(), step()

## Knowledge Gaps
- **1117 isolated node(s):** `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}`, `log`, `OPERATIONAL_COLLECTIONS` (+1112 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1450 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `ai-keys.js`, `AssignmentTree`, `KdsApp.jsx`, `harness.js`, `menuAdmin.js`, `adminAnalytics.js`, `settings.js`, `net.js`, `presets.js`, `Detailing.jsx`, `logger.js`, `cloud.service.js`, `Timesheets.jsx`, `kitchenPrinters.js`, `useUi`, `diagnostics.service.js`, `ref_node_fs`, `useData`, `pos-admin-data.js`, `receiptPrinter.js`, `OnlineOrders.jsx`, `domain.test.js`, `salesLog.js`, `ReportPage.jsx`, `subscription.js`, `AdminApp.jsx`, `supportProtocol.test.js`, `Tables.jsx`, `PosProvider.jsx`, `salesSplit.test.js`, `tables/index.js`, `EndOfDay.jsx`, `thirdPartyPayments.js`, `adminInsightsParity.test.js`, `plans.js`, `pos-react/package.json`, `adminInsights.js`, `LocationChecks`, `imageStorage.test.js`, `taxes.test.js`, `appwriteCompat.test.js`, `SystemOptionsPages.jsx`, `UsersPages.jsx`, `assist.js`, `usePos`, `MenuAdminPages.jsx`, `payroll.test.js`, `serviceWorker.test.js`, `SessionProvider.jsx`, `documents.js`, `createLogger`, `SettingsHome.jsx`, `businessTypeLocked`, `KdsHealthPages.jsx`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `AssignmentTree`, `menuAdmin.js`, `harness.js`, `KdsApp.jsx`, `LiveSupportPanel.jsx`, `SupportViewer.jsx`, `settings.js`, `DataProvider.jsx`, `Detailing.jsx`, `Timesheets.jsx`, `useUi`, `useData`, `Ceylo.jsx`, `OnlineOrders.jsx`, `printBridge.js`, `ReportPage.jsx`, `subscription.js`, `AdminApp.jsx`, `diagnosticsShared.js`, `vitest`, `ErrorBoundary.jsx`, `Tables.jsx`, `PosProvider.jsx`, `EndOfDay.jsx`, `panels.jsx`, `pos-react/package.json`, `supportViewerState.js`, `useFeature`, `adminInsights.js`, `LocationChecks`, `SystemOptionsPages.jsx`, `UsersPages.jsx`, `assist.js`, `usePos`, `MenuAdminPages.jsx`, `serviceWorker.test.js`, `SessionProvider.jsx`, `createLogger`, `SettingsHome.jsx`, `supportLive.js`, `KdsHealthPages.jsx`, `useInstall.js`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `r()` connect `b` to `c`, `d`, `ceylonry-site-runtime.js`, `pos-routing.test.js`, `adminInsightsParity.test.js`?**
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
  _1117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai-keys.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08636977058029689 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.091324200913242 - nodes in this community are weakly interconnected._
- **Should `menuAdmin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09176788124156546 - nodes in this community are weakly interconnected._