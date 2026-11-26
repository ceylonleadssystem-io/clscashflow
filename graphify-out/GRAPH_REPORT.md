# Graph Report - clscashflow  (2026-11-26)

## Corpus Check
- 582 files · ~1,417,757 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .css 16, (none) 4, .webmanifest 2)

## Summary
- 5337 nodes · 16588 edges · 216 communities (196 shown, 20 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 631 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6160baee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ai-keys.js
- CloudSyncService
- settings.js
- esc
- PosProvider.jsx
- appwrite.js
- admin-signin.js
- __awaiter
- clean
- KanbanApp.jsx
- DevicePages.jsx
- App.jsx
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- cloud.service.js
- pos/staff.js
- ceylonry-site-runtime.js
- labelPrinter.js
- b
- store.mjs
- pos.mjs
- app.mjs
- shopify-webhook.js
- pos-routing.test.js
- useFeature
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- pos/onlineOrders.js
- dateStr
- guard
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-accounts.test.js
- invoiceEscape
- createLogger
- pagePath
- subscription.js
- d
- supportProtocol.test.js
- package.json
- pos/sales.js
- qrBrand.js
- features.js
- render
- Tables.jsx
- ref_node_assert
- appwrite-sdk.js
- Teams
- salesSplit.test.js
- render
- tables/index.js
- boot
- KdsHealthPages.jsx
- ceylo-ask.js
- plans.js
- logic.mjs
- pos-react/package.json
- boot
- useData
- getAuthUser
- adminInsights.js
- c
- appwriteCompat.js
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
- AdminApp.jsx
- labelPrinter
- ReportPage.jsx
- normalizePlan
- nowIso
- MenuAdminPages.jsx
- printing.js
- Root test-suite audit (169 failing tests)
- ceylo.js
- User guide
- pos-admin-support-role.test.js
- localAdmin.js
- admin-auth.js
- ni
- Administrator guide
- appwriteAdmin
- kanban-board.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- onboarding-terms-acceptance.test.js
- Databases
- ogf-sales.js
- analytics.js
- supportLive.js
- functions/support-session.js
- Ce
- Settings Section Build Spec: what is still pending
- isAppwrite
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- POS administration portal
- react-dom
- adminAnalytics.js
- useInstall.js
- B
- lib/ogf-push.js
- panels.jsx
- AssignmentTree
- KdsApp.jsx
- devDependencies
- link.js
- shopify-launch.js
- Ceylonry POS — React + WatermelonDB
- SupportViewer.jsx
- net.js
- config-merge.js
- pos/catalog.js
- admin-visits-conversion.test.js
- diagnostics-store.js
- Detailing.jsx
- Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)
- appwrite-files.js
- kitchenPrinters.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- diagnosticsShared.js
- growth-partner-commissions.test.js
- pos-admin-rollup.test.js
- POS variants (verticals)
- landing-motion.js
- ogf-push-function.test.js
- imageTools.js
- ready.js
- receiptPrinter
- dependencies
- Ceylo.jsx
- scripts
- build.py
- printBridge.js
- Ceylonry POS: New Feature Roll-out Notes
- vite.config.js
- step
- quote-email-ui.test.js
- supportControl.js
- Features
- bug-report-20260812.test.js
- Ceylonry POS: release notes, 2026-11-23
- Graphql
- Architecture
- Features
- ogf-push.test.js
- diagnosticsPeer.js
- Messaging
- PortalShell.jsx
- Role
- Modal
- serviceWorker.test.js
- OGF POS-02 UAT in Postman
- Live support session: relay server and testing
- lib/support-session.js
- pos-address.test.js
- usePos
- Restaurant (OGF) and the OGF sales push
- FakePc
- supportViewerState.js
- ref_node_fs
- Ceylonry POS: Release Notes, 2026-11-18
- normalizePlan
- scanner.js
- README.md
- Shopify orders into the POS: feasibility
- pos-reported-bugs.test.js
- submit-subscription-receipt.js
- send-contact.js
- supportProtocol.js
- node-appwrite
- 5. Phases
- pos-handoff.test.js
- Settings section: build status and plan
- IMPORTANT: This is NOT a rebuild of the POS system.
- Deployment & operations
- adminFeedback.js
- presets.js
- Project structure
- thirdPartyPayments.js
- collect
- adminInsightsParity.test.js
- lib/shopify-oauth.js
- apps-used.test.js

## God Nodes (most connected - your core abstractions)
1. `useData()` - 214 edges
2. `usePos()` - 206 edges
3. `react` - 147 edges
4. `useFeature()` - 99 edges
5. `__awaiter()` - 93 edges
6. `money()` - 93 edges
7. `vitest` - 86 edges
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
- `7. Troubleshooting` --references--> `cancelOrder()`  [INFERRED]
  docs/integrations/shopify-setup-guide.md → netlify/lib/shopify-admin.js
- `Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts` --references--> `applyCatalogDrafts()`  [INFERRED]
  docs/settings-build-plan.md → pos-react/src/services/pos/catalog.js

## Import Cycles
- None detected.

## Communities (216 total, 20 thin omitted)

### Community 0 - "ai-keys.js"
Cohesion: 0.09
Nodes (33): admin, { _encrypt: encrypt }, { getDocument, upsertDocument, clean }, handler(), oauth, page(), publicBase(), { shopKey } (+25 more)

### Community 1 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 2 - "settings.js"
Cohesion: 0.06
Nodes (74): catalogDraftChanges(), allowedCategoryKeys(), APPLY_KEYS, assignItems(), brief(), cleanGlobalModifier(), cleanItemSetting(), cleanLimit() (+66 more)

### Community 3 - "esc"
Cohesion: 0.19
Nodes (28): bindTables(), bookingDialog(), business(), cancelDialog(), cfg(), dateBar(), esc(), floorName() (+20 more)

### Community 4 - "PosProvider.jsx"
Cohesion: 0.09
Nodes (42): CeyloAiKeyPanel(), PROVIDERS, ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), PrintHelperPicker() (+34 more)

### Community 5 - "appwrite.js"
Cohesion: 0.08
Nodes (71): 2.3 The seams that make this manageable, Phase 3: Data layer (5 to 8 days), crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler() (+63 more)

### Community 6 - "admin-signin.js"
Cohesion: 0.21
Nodes (10): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+2 more)

### Community 7 - "__awaiter"
Cohesion: 0.10
Nodes (3): Account, AppwriteException, __awaiter()

### Community 8 - "clean"
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

### Community 9 - "KanbanApp.jsx"
Cohesion: 0.22
Nodes (11): restoreAdmin(), signInAdmin(), signOutAdmin(), KanbanApp(), log, board(), Card(), COLUMNS (+3 more)

### Community 10 - "DevicePages.jsx"
Cohesion: 0.11
Nodes (39): asStation(), connection(), connectionLabel(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf() (+31 more)

### Community 11 - "App.jsx"
Cohesion: 0.16
Nodes (22): Gate(), Loading(), PublicMenuSync(), Ready(), Root(), SupportBridge(), AssistMissing(), isAutomobilePath() (+14 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (36): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+28 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (34): buildLogText(), el(), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString() (+26 more)

### Community 15 - "admin-data.js"
Cohesion: 0.12
Nodes (36): { appwriteAdmin, ADMIN_EMAIL }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+28 more)

### Community 16 - "PosStore.js"
Cohesion: 0.13
Nodes (20): PosStore, 5. Data layer (WatermelonDB), decode(), encode(), attachLines(), categoryId(), hintSeq(), LEGACY_ARRAY_TABLES (+12 more)

### Community 17 - "cloud.service.js"
Cohesion: 0.15
Nodes (25): STORAGE, ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted() (+17 more)

### Community 18 - "pos/staff.js"
Cohesion: 0.16
Nodes (23): AUDIT_ACTION, auditDetails(), dayOf(), diffEntry(), entryError(), entryLocked(), fromLocalInput(), LOCK_MONTHS (+15 more)

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

### Community 25 - "shopify-webhook.js"
Cohesion: 0.17
Nodes (16): { appWebhookSecret }, { _decrypt: decrypt }, { getDocument, upsertDocument, clean }, handler(), hits, limited(), { normalizeShop, shopKey, verifySignature, sanitizeOrder }, { posAway, sendNewOrderEmail } (+8 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (36): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+28 more)

### Community 27 - "useFeature"
Cohesion: 0.15
Nodes (33): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+25 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.07
Nodes (50): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, billingPatchForStatus(), clampNum(), clean() (+42 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.09
Nodes (16): auth(), CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef() (+8 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (10): amount(), balance(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables(), nextAnnualDueDate(), nextBillingDueDate() (+2 more)

### Community 34 - "pos/onlineOrders.js"
Cohesion: 0.08
Nodes (61): canAccept(), canDecline(), canFulfill(), canPack(), canTrack(), CARRIERS, cleanTracking(), customerMessage() (+53 more)

### Community 35 - "dateStr"
Cohesion: 0.19
Nodes (23): dialog(), pillFor(), resRow(), seatDialog(), setStatus(), tableDialog(), toast(), viewBookings() (+15 more)

### Community 36 - "guard"
Cohesion: 0.06
Nodes (63): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, handler(), { guard, reply }, handler() (+55 more)

### Community 37 - "vitest"
Cohesion: 0.09
Nodes (29): makeCtx(), bind(), bindServices(), kotEscPos(), cash(), addProduct(), createHarness(), line() (+21 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.06
Nodes (61): userName(), bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart() (+53 more)

### Community 40 - "pos-admin-accounts.test.js"
Cohesion: 0.07
Nodes (27): handler(), assert, auth, call(), col(), docs, form, fs (+19 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "createLogger"
Cohesion: 0.16
Nodes (20): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), cell(), firstColumn() (+12 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (29): assert, fs, { pagePath }, path, read(), root, test, assert (+21 more)

### Community 44 - "subscription.js"
Cohesion: 0.18
Nodes (19): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+11 more)

### Community 45 - "d"
Cohesion: 0.09
Nodes (44): ae(), at(), bc(), be(), C(), dt(), Ee(), Fe() (+36 more)

### Community 46 - "supportProtocol.test.js"
Cohesion: 0.28
Nodes (10): LiveSupportPanel(), spaced(), useCountdown(), droppable(), keepTrying(), linkLabel(), MOVEMENT, RECONNECT_MS (+2 more)

### Community 47 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+14 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.07
Nodes (65): addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature() (+57 more)

### Community 49 - "qrBrand.js"
Cohesion: 0.31
Nodes (6): BRAND_WORD, brandedQr(), framePoint(), load(), qrLayout(), qrcode

### Community 50 - "features.js"
Cohesion: 0.14
Nodes (21): FeaturesTab(), NO_OVERRIDE, FEATURE_PRESET_MAP, FEATURE_PRESETS, GM, KITCHEN, ONLINE, presetFlags() (+13 more)

### Community 51 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.19
Nodes (32): orderTotal(), allFloorTables(), clamp(), findFreeSpot(), floorLayout(), floorLayoutKey(), floorsFor(), floorsKey() (+24 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.08
Nodes (20): assert, keys, lib, rows, test, assert, keys, test (+12 more)

### Community 54 - "appwrite-sdk.js"
Cohesion: 0.13
Nodes (5): Avatars, Permission, Query, Service, Storage

### Community 56 - "salesSplit.test.js"
Cohesion: 0.16
Nodes (11): createDatabase(), combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef (+3 more)

### Community 57 - "render"
Cohesion: 0.12
Nodes (23): chatMessageTime(), chatWhen(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+15 more)

### Community 58 - "tables/index.js"
Cohesion: 0.08
Nodes (29): log, migrations, tableColumns(), TYPE, CashShift, Customer, InventoryItem, Location (+21 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 60 - "KdsHealthPages.jsx"
Cohesion: 0.37
Nodes (11): formatBytes(), healthIssues(), rateLatency(), cleanKds(), KDS_DEFAULTS, kdsError(), kdsSettingsOf(), whole() (+3 more)

### Community 62 - "ceylo-ask.js"
Cohesion: 0.20
Nodes (10): Anthropic, contextText(), { getUserFromEvent, getDocument, clean }, { guard, reply }, keys, line(), log, assert (+2 more)

### Community 63 - "plans.js"
Cohesion: 0.18
Nodes (14): buildInvoiceLines(), r2(), DEV_ADMIN, localAdminSession, fmt(), PlansGrid(), ADDITIONAL_FEATURES, PLAN_CONDITIONS (+6 more)

### Community 64 - "logic.mjs"
Cohesion: 0.11
Nodes (29): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+21 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.13
Nodes (14): description, engines, node, appwrite, name, private, type, version (+6 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (21): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+13 more)

### Community 67 - "useData"
Cohesion: 0.09
Nodes (38): Kpi(), today(), batchStatus(), commissionRows(), customerName(), collectionOf, defaults, IndustryModals() (+30 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "adminInsights.js"
Cohesion: 0.11
Nodes (50): BarChart(), HourlyPanel(), Kpi(), lkr(), METRICS, one(), RankedBars(), AnalyticsTab() (+42 more)

### Community 70 - "c"
Cohesion: 0.12
Nodes (26): ai(), a(), bi(), ci(), Dg(), ef(), Eh(), hb() (+18 more)

### Community 71 - "appwriteCompat.js"
Cohesion: 0.13
Nodes (7): forgetUser(), getAppwriteCompat(), installGlobalClsBackend(), log, rememberedUser(), rememberUser(), calls

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
Cohesion: 0.28
Nodes (17): serverClient(), { ADMIN_DATABASE_ID }, bad(), checkSdp(), { Databases }, db(), docId(), expired() (+9 more)

### Community 77 - "mountBillingWidget"
Cohesion: 0.13
Nodes (19): bankDetailsHtml(), billingCycleFor(), billingCyclePickerHtml(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount() (+11 more)

### Community 79 - "LocalAuthProvider"
Cohesion: 0.10
Nodes (8): 4. Principles, Changing or removing an administrator, 6. Services (abstractions), AppwriteAuthProvider, LocalAuthProvider, passwordHash(), useServices(), ctx()

### Community 80 - "SystemOptionsPages.jsx"
Cohesion: 0.08
Nodes (61): Delivered (slice 1), PublishBar(), ConditionalGroup(), DAYS, DayTimeRow(), DurationRow(), PageHeader(), SectionCard() (+53 more)

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
Cohesion: 0.13
Nodes (38): Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), TextRow(), FULL_SETTINGS_ROLES (+30 more)

### Community 89 - "security.js"
Cohesion: 0.05
Nodes (65): headers(), corsHeaders, { guard, siteOrigin, siteUrl }, handler(), json(), clean(), escapeHtml(), { guard, siteOrigin, siteUrl } (+57 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (33): AssistBar(), log, BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig(), diffConfig() (+25 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "AdminApp.jsx"
Cohesion: 0.11
Nodes (33): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), emailInvoice(), log, sendAdminRequest() (+25 more)

### Community 95 - "ReportPage.jsx"
Cohesion: 0.14
Nodes (30): localDateValue(), buildReport(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows() (+22 more)

### Community 96 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 97 - "nowIso"
Cohesion: 0.08
Nodes (66): parseStockCountRows(), isEmail(), nowIso(), phoneKey(), whatsappPhone(), adjustmentChange(), stockMovement(), applyReversal() (+58 more)

### Community 98 - "MenuAdminPages.jsx"
Cohesion: 0.07
Nodes (65): LocationChecks(), NumberRow(), SelectRow(), SettingRow(), TextAreaRow(), categoryKey(), stalePresetCategory(), visibleProductCategories() (+57 more)

### Community 99 - "printing.js"
Cohesion: 0.10
Nodes (40): DEFAULT_RECEIPT_FOOTER, esc(), modifierLabel(), prepName(), receiptName(), receiptDate(), kitchenPrinterHook(), kitchenMode() (+32 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "ceylo.js"
Cohesion: 0.26
Nodes (10): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, routeKitchenLines() (+2 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "pos-admin-support-role.test.js"
Cohesion: 0.18
Nodes (11): assert, auth, call(), data, diagnostics, lib, record, storePath (+3 more)

### Community 104 - "localAdmin.js"
Cohesion: 0.42
Nodes (7): getStore(), invoices(), localAdminApi(), flagsWithPlan(), databaseNameFor(), applyConfig(), localKanban()

### Community 105 - "admin-auth.js"
Cohesion: 0.08
Nodes (28): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, ADMIN_ROLES, b64url() (+20 more)

### Community 106 - "ni"
Cohesion: 0.13
Nodes (21): Bf(), e(), k(), eb(), ff(), gd(), hc(), kb() (+13 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "appwriteAdmin"
Cohesion: 0.10
Nodes (26): getAdmin(), { appwriteAdmin }, { guard, siteOrigin, siteUrl }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean() (+18 more)

### Community 109 - "kanban-board.js"
Cohesion: 0.19
Nodes (18): database(), { Databases, Query, ID }, deps, existingCard(), fail(), featureIssues(), { guard, reply }, importFeatures() (+10 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.12
Nodes (26): env, KdsGate(), friendlyAuthError(), getAuthService(), log, accessAllowed(), billingWarning(), isTestAccount() (+18 more)

### Community 113 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 115 - "ogf-sales.js"
Cohesion: 0.17
Nodes (19): batchCode(), breakdown(), dateTimeOf(), DEFAULT_PAYMENT_NAMES, describe(), header(), itemRows(), num() (+11 more)

### Community 116 - "analytics.js"
Cohesion: 0.08
Nodes (57): Ctx, SystemOptionsProvider(), birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment() (+49 more)

### Community 117 - "supportLive.js"
Cohesion: 0.16
Nodes (25): spaced(), SupportBanner(), annotationSubs, answerRequest(), ask(), call(), connect(), endSupport() (+17 more)

### Community 118 - "functions/support-session.js"
Cohesion: 0.09
Nodes (36): handler(), verifyAdmin(), verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken, canUsePortal }, log, store (+28 more)

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

### Community 123 - "POS administration portal"
Cohesion: 0.33
Nodes (5): Admin screens, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 124 - "react-dom"
Cohesion: 0.13
Nodes (15): App(), ErrorBoundary, log, addressForType(), addressOfPage(), POS_BASE_HOST, POS_URLS, posRedirect() (+7 more)

### Community 125 - "adminAnalytics.js"
Cohesion: 0.19
Nodes (19): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), dailySeries(), day(), fmt, group() (+11 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "B"
Cohesion: 0.22
Nodes (11): B(), fn(), Lt(), M(), N(), oa(), Ot(), pn() (+3 more)

### Community 128 - "lib/ogf-push.js"
Cohesion: 0.19
Nodes (24): cleanConfig(), configProblems(), crypto, deleteSecret(), emptyState(), getToken(), idOf(), loadSecrets() (+16 more)

### Community 129 - "panels.jsx"
Cohesion: 0.05
Nodes (75): AutomobileShell(), BusinessSettings(), Customers, Detailing, Icon(), ICONS, Inventory, ITEMS (+67 more)

### Community 130 - "AssignmentTree"
Cohesion: 0.39
Nodes (5): AssignmentTree(), byTerm(), GroupBox(), groups, html()

### Community 131 - "KdsApp.jsx"
Cohesion: 0.24
Nodes (21): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+13 more)

### Community 132 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/plugin-proposal-decorators, @babel/plugin-transform-class-properties, fake-indexeddb, vite, @vitejs/plugin-react, vitest

### Community 133 - "link.js"
Cohesion: 0.30
Nodes (13): adoptLegacy(), aggregate(), createLink(), kdsLink, linkFor(), links, listeners, notify() (+5 more)

### Community 134 - "shopify-launch.js"
Cohesion: 0.39
Nodes (7): base(), esc(), { getDocument, clean }, handler(), oauth, page(), { shopKey }

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
Cohesion: 0.15
Nodes (26): productCategories(), carryCategoryRename(), ensureProductInventory(), activeLocationIds(), allows(), branchOf(), categoryAllowedAt(), cleanLocationIds() (+18 more)

### Community 140 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 141 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 142 - "Detailing.jsx"
Cohesion: 0.10
Nodes (40): downloadBlob(), JOB_FLOW, jobPaid(), jobTechs(), jobTotal(), buildInvoicePdf(), downloadInvoicePdf(), fileName() (+32 more)

### Community 143 - "Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)"
Cohesion: 0.11
Nodes (17): 10. Rough timeline, 11. Open questions, 1. Goal and decisions already made, 2.1 What Netlify does for us, 2.2 What Appwrite does for us, 2. What exists today (inventory), 3.1 Frontend and backend, kept separate, 3.2 Why PostgreSQL and not MongoDB (+9 more)

### Community 144 - "appwrite-files.js"
Cohesion: 0.20
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 145 - "kitchenPrinters.js"
Cohesion: 0.14
Nodes (22): openKotWindow(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket() (+14 more)

### Community 152 - "diagnosticsShared.js"
Cohesion: 0.11
Nodes (27): adminSignals(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+19 more)

### Community 153 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

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

### Community 161 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+3 more)

### Community 162 - "Ceylo.jsx"
Cohesion: 0.13
Nodes (26): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+18 more)

### Community 163 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint:syntax, preview, test

### Community 165 - "printBridge.js"
Cohesion: 0.21
Nodes (10): connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), log, sendRaw(), toBase64() (+2 more)

### Community 166 - "Ceylonry POS: New Feature Roll-out Notes"
Cohesion: 0.22
Nodes (8): 1. Item stock counts and ingredients, 2. Branch-specific menus, 3. Demo and Test accounts no longer ask for payment, 4. Trial length and plan prices are consistent, 5. Modifier groups: assign to items by tree, 6. Fixes, Ceylonry POS: New Feature Roll-out Notes, Notes

### Community 167 - "vite.config.js"
Cohesion: 0.47
Nodes (5): adminRoute(), configurePreviewServer(), configureServer(), vite, @vitejs/plugin-react

### Community 168 - "step"
Cohesion: 0.50
Nodes (4): adopt(), fulfilled(), rejected(), step()

### Community 169 - "quote-email-ui.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 170 - "supportControl.js"
Cohesion: 0.43
Nodes (7): denyReason(), NEVER_TYPES, place(), runAction(), scrollable(), sensitiveName(), setValue()

### Community 171 - "Features"
Cohesion: 0.22
Nodes (8): Ceylonry POS: Release Notes, 2026-11-17, Features, Fixes, New landing page, Other, Plan finder: devices per location, QR menu (digital menu for restaurants and cafés), Visual refresh

### Community 172 - "bug-report-20260812.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 173 - "Ceylonry POS: release notes, 2026-11-23"
Cohesion: 0.29
Nodes (6): 1. Live support session (#179), 2. Support-only admin accounts, Ceylonry POS: release notes, 2026-11-23, Features, Fixes, Other

### Community 175 - "Architecture"
Cohesion: 0.18
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 176 - "Features"
Cohesion: 0.17
Nodes (11): 1. Online orders from Shopify, 2. Shopify customers in the CRM, 3. Online Orders report, 4. Items with short ingredients are blocked when selected, 5. Manager override for low stock, 6. Ceylo AI: pick the model from a list, with a key guide, 7. QR menu: admin switch, Ceylonry POS: Release Notes, 2026-11-19 (+3 more)

### Community 177 - "ogf-push.test.js"
Cohesion: 0.18
Nodes (11): assert, CLIENT, config(), deps(), http, mall, push, run() (+3 more)

### Community 178 - "diagnosticsPeer.js"
Cohesion: 0.22
Nodes (15): discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog(), saveLog() (+7 more)

### Community 180 - "PortalShell.jsx"
Cohesion: 0.11
Nodes (26): NavIcon(), PATHS, PATHS, PortalIcon(), PortalHome(), PortalSettingsPage, PortalShell(), Reports (+18 more)

### Community 182 - "Modal"
Cohesion: 0.06
Nodes (79): CloudBanner(), Shell(), Modal(), ModalBody(), NumberInput(), STOCK_UNITS, isOwnerRole(), NAV_ITEMS (+71 more)

### Community 183 - "serviceWorker.test.js"
Cohesion: 0.16
Nodes (9): isHashed(), isPosPage(), SHELL, strategyFor(), code, handlers, pick(), req() (+1 more)

### Community 184 - "OGF POS-02 UAT in Postman"
Cohesion: 0.33
Nodes (5): OGF POS-02 UAT in Postman, Points the Postman guide shows (to confirm with OGF), Rebuild, Run it, What each request is

### Community 185 - "Live support session: relay server and testing"
Cohesion: 0.18
Nodes (10): 1. Install coturn on the server, 2. Tell the functions about it, 3. Check it works, How the connection works, Live support session: relay server and testing, Reconnecting, Relay server (coturn), Slow networks (+2 more)

### Community 186 - "lib/support-session.js"
Cohesion: 0.12
Nodes (9): agentView(), crypto, iceServers(), join(), newSession(), newSessionId(), offerKey(), text() (+1 more)

### Community 187 - "pos-address.test.js"
Cohesion: 0.18
Nodes (7): assert, fs, path, redirects, root, test, toml

### Community 188 - "usePos"
Cohesion: 0.20
Nodes (18): Timesheets, downloadCsv(), ACTIVE_STATUSES, realLines(), saleItemCount(), statusOf(), day(), timesheetRows() (+10 more)

### Community 190 - "Restaurant (OGF) and the OGF sales push"
Cohesion: 0.25
Nodes (7): Limits, OGF's Postman guide (what it adds), Restaurant (OGF) and the OGF sales push, Setting a business up, Things the documents leave open (to confirm with OGF), What is sent, Where it lives

### Community 193 - "supportViewerState.js"
Cohesion: 0.18
Nodes (18): SupportViewer(), buffer, call(), endViewer(), eventSubs, finish(), IDLE, joinSupport() (+10 more)

### Community 194 - "ref_node_fs"
Cohesion: 0.11
Nodes (12): walk(), page, assert, compat, fs, path, test, assert (+4 more)

### Community 195 - "Ceylonry POS: Release Notes, 2026-11-18"
Cohesion: 0.33
Nodes (5): Ceylonry POS: Release Notes, 2026-11-18, Features, Fixes, Ingredient check when an item is selected, Other

### Community 196 - "normalizePlan"
Cohesion: 0.29
Nodes (10): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paymentLinkFor(), planPaymentLink(), planRank() (+2 more)

### Community 197 - "scanner.js"
Cohesion: 0.39
Nodes (7): sizeSlug(), findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants()

### Community 198 - "README.md"
Cohesion: 0.09
Nodes (15): How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup, Conventions, Debugging, Development guide (+7 more)

### Community 199 - "Shopify orders into the POS: feasibility"
Cohesion: 0.08
Nodes (23): Connecting a store: two options, How it would work, Mapping Shopify to the POS, Questions for you, Risks and open decisions, Shopify facts that shape the design, Shopify orders into the POS: feasibility, Status: phase 1 (receive) built (+15 more)

### Community 201 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 203 - "submit-subscription-receipt.js"
Cohesion: 0.14
Nodes (19): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+11 more)

### Community 205 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 206 - "supportProtocol.js"
Cohesion: 0.25
Nodes (11): clamp(), cleanAnnotation(), cleanCommand(), FRAME, frameReader(), num(), toFrames(), TOOLS (+3 more)

### Community 207 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 208 - "5. Phases"
Cohesion: 0.15
Nodes (13): 5. Phases, 5a. Files, 5b. E-mail (replaces EmailJS), Phase 0: Confirm before buying (1 to 2 days), Phase 10: Cutover (1 to 2 days of work, plus preparation), Phase 11: Decommission and clean-up (2 days), Phase 1: Server and tooling (2 to 3 days), Phase 2: Repository structure and backend modules (8 to 12 days) (+5 more)

### Community 209 - "pos-handoff.test.js"
Cohesion: 0.20
Nodes (10): { guard, reply }, handler(), lib, log, assert, call(), { handler }, issued (+2 more)

### Community 210 - "Settings section: build status and plan"
Cohesion: 0.14
Nodes (13): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 6): Taxes, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers) (+5 more)

### Community 212 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 213 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 214 - "adminFeedback.js"
Cohesion: 0.27
Nodes (8): adminFeedback, listeners, READ_ACTIONS, state, subscribe(), successText(), useAdminFeedback(), AdminFeedbackBar()

### Community 217 - "presets.js"
Cohesion: 0.27
Nodes (10): CAPABILITIES, typesWith(), BUSINESS_TYPE_OPTIONS, commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS, RETIRED_MODIFIER_NAMES (+2 more)

### Community 220 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 221 - "thirdPartyPayments.js"
Cohesion: 0.24
Nodes (13): PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), splitChoices() (+5 more)

### Community 222 - "collect"
Cohesion: 0.67
Nodes (4): collect(), keyOf(), pickRegister(), previewFor()

### Community 224 - "adminInsightsParity.test.js"
Cohesion: 0.29
Nodes (7): ago(), end, payload, sale(), server, src, start

### Community 225 - "lib/shopify-oauth.js"
Cohesion: 0.14
Nodes (27): acceptOrder(), amount(), cancelOrder(), checkErrors(), fail(), fulfillOrder(), gid(), graphql() (+19 more)

### Community 227 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

## Knowledge Gaps
- **1139 isolated node(s):** `Permission`, `crypto`, `{
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean,
  ADMIN_EMAIL
}`, `log`, `OPERATIONAL_COLLECTIONS` (+1134 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1478 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `ai-keys.js`, `panels.jsx`, `AssignmentTree`, `KdsApp.jsx`, `settings.js`, `KanbanApp.jsx`, `DevicePages.jsx`, `net.js`, `pos/catalog.js`, `Detailing.jsx`, `logger.js`, `cloud.service.js`, `pos/staff.js`, `kitchenPrinters.js`, `labelPrinter.js`, `diagnosticsShared.js`, `receiptPrinter`, `pos/onlineOrders.js`, `printBridge.js`, `reportBuilders.js`, `createLogger`, `subscription.js`, `supportProtocol.test.js`, `pos/sales.js`, `qrBrand.js`, `features.js`, `PortalShell.jsx`, `Tables.jsx`, `serviceWorker.test.js`, `salesSplit.test.js`, `tables/index.js`, `KdsHealthPages.jsx`, `plans.js`, `pos-react/package.json`, `ref_node_fs`, `useData`, `adminInsights.js`, `appwriteCompat.js`, `SystemOptionsPages.jsx`, `adminFeedback.js`, `UsersPages.jsx`, `presets.js`, `assist.js`, `AdminApp.jsx`, `thirdPartyPayments.js`, `ReportPage.jsx`, `adminInsightsParity.test.js`, `lib/shopify-oauth.js`, `MenuAdminPages.jsx`, `ceylo.js`, `SessionProvider.jsx`, `analytics.js`, `react-dom`, `adminAnalytics.js`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Why does `react` connect `PosProvider.jsx` to `panels.jsx`, `AssignmentTree`, `settings.js`, `KdsApp.jsx`, `SupportViewer.jsx`, `KanbanApp.jsx`, `DevicePages.jsx`, `App.jsx`, `Detailing.jsx`, `useFeature`, `Ceylo.jsx`, `pos/onlineOrders.js`, `printBridge.js`, `createLogger`, `subscription.js`, `supportProtocol.test.js`, `diagnosticsPeer.js`, `features.js`, `PortalShell.jsx`, `Tables.jsx`, `Modal`, `serviceWorker.test.js`, `usePos`, `KdsHealthPages.jsx`, `pos-react/package.json`, `supportViewerState.js`, `useData`, `adminInsights.js`, `SystemOptionsPages.jsx`, `adminFeedback.js`, `UsersPages.jsx`, `assist.js`, `AdminApp.jsx`, `ReportPage.jsx`, `MenuAdminPages.jsx`, `SessionProvider.jsx`, `analytics.js`, `supportLive.js`, `react-dom`, `useInstall.js`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `r()` connect `b` to `adminInsightsParity.test.js`, `c`, `d`, `ceylonry-site-runtime.js`, `pos-routing.test.js`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
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
  _1139 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai-keys.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08636977058029689 - nodes in this community are weakly interconnected._
- **Should `settings.js` be split into smaller, more focused modules?**
  _Cohesion score 0.058416139716952725 - nodes in this community are weakly interconnected._
- **Should `PosProvider.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08557692307692308 - nodes in this community are weakly interconnected._