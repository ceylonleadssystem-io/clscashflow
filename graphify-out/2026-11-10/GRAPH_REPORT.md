# Graph Report - clscashflow  (2026-11-09)

## Corpus Check
- 500 files · ~1,297,768 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 4435 nodes · 13414 edges · 180 communities (164 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 328 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `82e7c551`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ceylo.jsx
- SystemOptionsPages.jsx
- account-danger-zone.js
- app.mjs
- money
- appwrite.js
- App.jsx
- __awaiter
- clean
- createLogger
- security.js
- pos/inventory.js
- assets/catalog.js
- tables/index.js
- logger.js
- admin-data.js
- PosStore.js
- settings.js
- printing.js
- appwriteAdmin
- labelPrinter.js
- send-contact.js
- store.mjs
- pos.mjs
- detailDialog
- labelPrinter
- pos-routing.test.js
- cloud.service.js
- scanner.js
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- plans.js
- useData
- adminInsights.js
- vitest
- invoiceEscape
- reportBuilders.js
- admin-auth.js
- invoiceEscape
- appwriteCompat.js
- pagePath
- admin-data.cjs
- UsersPages.jsx
- AdminApp.jsx
- common.js
- pos/sales.js
- ai-keys.js
- payload.js
- render
- Tables.jsx
- ref_node_assert
- .toString
- AppwriteException
- salesSplit.test.js
- render
- pos/catalog.js
- boot
- usePos
- ref_node_module
- useUi
- locations.js
- logic.mjs
- pos-react/package.json
- boot
- pos-address.test.js
- getAuthUser
- payable-webhook.cjs
- diagnostics-store.js
- package.json
- Client
- link.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- LocalAuthProvider
- useFeature
- EndOfDay.jsx
- hardware-order.js
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
- pos-reported-bugs.test.js
- planFromPath
- planFromPath
- pos/staff.js
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- guard
- User guide
- admin-visits-conversion.test.js
- diagnosticsPeer.js
- domain/format.js
- account-purge.test.js
- Administrator guide
- patchSettings
- salesLog.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- track-visit.cjs
- thirdPartyPayments.js
- Architecture
- imageTools.js
- react
- PosProvider.jsx
- gm-routing.test.js
- Settings Section Build Spec: what is still pending
- serviceWorker.test.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- database.js
- useInstall.js
- onboarding-terms-acceptance.test.js
- lib/ogf-push.js
- getAdmin
- KdsApp.jsx
- Storage
- BaseRepository
- pos-admin-catalog.test.js
- Ceylonry POS — React + WatermelonDB
- ref_node_fs
- ogf-sales.js
- config-merge.js
- net.js
- portal.test.js
- Settings section: build status and plan
- kitchenPrinters.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- submit-ticket.cjs
- growth-partner-commissions.test.js
- pos-admin-rollup.test.js
- POS variants (verticals)
- cloud.test.js
- ogf-push-function.test.js
- nowIso
- pos-admin-accounts.test.js
- insightsRollup
- admin-store.js
- KdsHealthPages.jsx
- pos/detailing.js
- printBridge.js
- README.md
- payroll.test.js
- Project structure
- docs/README.md
- appwrite-files.js
- domain/inventory.js
- bug-report-20260811-email-modal-template.test.js
- submit-subscription-receipt.js
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
- AssignmentTree.jsx

## God Nodes (most connected - your core abstractions)
1. `useData()` - 190 edges
2. `usePos()` - 182 edges
3. `react` - 124 edges
4. `__awaiter()` - 93 edges
5. `useFeature()` - 93 edges
6. `money()` - 83 edges
7. `AppwriteException` - 74 edges
8. `vitest` - 65 edges
9. `useUi()` - 61 edges
10. `Modal()` - 58 edges

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

## Communities (180 total, 16 thin omitted)

### Community 0 - "Ceylo.jsx"
Cohesion: 0.12
Nodes (28): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+20 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.14
Nodes (60): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), ConditionalGroup() (+52 more)

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

### Community 3 - "app.mjs"
Cohesion: 0.11
Nodes (61): ACTIONS, bindGuestFill(), bindTables(), bookingDialog(), business(), cancelDialog(), canSend(), cfg() (+53 more)

### Community 4 - "money"
Cohesion: 0.08
Nodes (52): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+44 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (52): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+44 more)

### Community 6 - "App.jsx"
Cohesion: 0.08
Nodes (38): App(), Gate(), Loading(), Ready(), Root(), AssistMissing(), AutomobileShell(), BusinessSettings() (+30 more)

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
Cohesion: 0.15
Nodes (23): log, MenuImport(), NUMBERS, log, MenuTab(), STALE_PRESET_CATEGORIES, catalogueNumber(), cell() (+15 more)

### Community 10 - "security.js"
Cohesion: 0.06
Nodes (54): corsHeaders, { guard, siteOrigin, siteUrl }, handler(), json(), esc(), { guard, siteOrigin }, handler(), nodemailer (+46 more)

### Community 11 - "pos/inventory.js"
Cohesion: 0.32
Nodes (12): parseStockCountRows(), adjustmentChange(), stockMovement(), applyStockChange(), movementRow(), activeLocationId(), adjustStock(), importStockCountFile() (+4 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "tables/index.js"
Cohesion: 0.06
Nodes (37): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+29 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (31): capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString(), FIELD_TAGS, interactiveTarget() (+23 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin, ADMIN_EMAIL }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.14
Nodes (18): decode(), encode(), attachLines(), EMPTY_SNAPSHOT(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq() (+10 more)

### Community 17 - "settings.js"
Cohesion: 0.06
Nodes (97): categoryKey(), stalePresetCategory(), ARRAY_FIELDS, catalogDraftChanges(), categoryEditError(), cleanCategoryEdit(), cleanGroupEdit(), draftList() (+89 more)

### Community 18 - "printing.js"
Cohesion: 0.14
Nodes (22): routeKitchenLines(), docCtx(), downloadReceipt(), kdsNotice(), locationFor(), log, openKotWindow(), printReceipt() (+14 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.09
Nodes (29): esc(), handler(), nodemailer, { appwriteAdmin }, { guard, siteOrigin, siteUrl }, handler(), reply(), responseHeaders (+21 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.12
Nodes (32): cleanBarcode(), CODE128, code128Units(), code128Values(), drawCode128(), sizedBarcode(), sizeSlug(), alignmentAdjust() (+24 more)

### Community 21 - "send-contact.js"
Cohesion: 0.29
Nodes (9): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin, siteUrl }, handler(), JSON_HEADERS, nodemailer, response() (+1 more)

### Community 22 - "store.mjs"
Cohesion: 0.11
Nodes (41): go(), refreshPos(), viewMessages(), addDays(), dateStr(), mergeRows(), monthOf(), readPos() (+33 more)

### Community 23 - "pos.mjs"
Cohesion: 0.17
Nodes (20): layoutDialog(), queueSeating(), syncGuests(), bookingsMap(), layoutError(), ownLayout(), effectiveLocation(), emptyPos (+12 more)

### Community 24 - "detailDialog"
Cohesion: 0.23
Nodes (12): billsOf(), detailDialog(), guestOf(), guestSpend(), money(), nums(), revenueOf(), statsOf() (+4 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (33): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+25 more)

### Community 27 - "cloud.service.js"
Cohesion: 0.12
Nodes (23): STORAGE, exactly(), profileHasPosAccess(), ALWAYS_LIVE_KEY, alwaysLive(), clone(), CloudSyncService, log (+15 more)

### Community 28 - "scanner.js"
Cohesion: 0.14
Nodes (8): barcodeScanner, findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants(), createEmitter()

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.10
Nodes (35): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+27 more)

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
Cohesion: 0.18
Nodes (13): buildInvoiceLines(), r2(), WelcomeTab(), fmt(), PlansGrid(), ADDITIONAL_FEATURES, PLAN_CONDITIONS, PLAN_CONTACT (+5 more)

### Community 35 - "useData"
Cohesion: 0.12
Nodes (40): FieldError(), Modal(), ModalBody(), NumberInput(), BUSINESS_TYPE_OPTIONS, parseNumber(), locationStock(), cleanPhoneInput() (+32 more)

### Community 36 - "adminInsights.js"
Cohesion: 0.06
Nodes (76): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), BarChart(), HourlyPanel(), Kpi(), lkr() (+68 more)

### Community 37 - "vitest"
Cohesion: 0.11
Nodes (27): makeCtx(), bind(), bindServices(), receiptText(), cash(), addProduct(), createHarness(), line() (+19 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.08
Nodes (39): payCost(), activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day() (+31 more)

### Community 40 - "admin-auth.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "appwriteCompat.js"
Cohesion: 0.07
Nodes (17): ErrorBoundary, log, KdsGate(), forgetUser(), getAppwriteCompat(), installGlobalClsBackend(), log, rememberedUser() (+9 more)

### Community 43 - "pagePath"
Cohesion: 0.07
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "UsersPages.jsx"
Cohesion: 0.16
Nodes (24): FULL_SETTINGS_ROLES, ROLE_VIEWS, ROLES, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError() (+16 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.10
Nodes (36): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), emailInvoice(), log, sendAdminRequest() (+28 more)

### Community 47 - "common.js"
Cohesion: 0.26
Nodes (10): CAPABILITIES, typesWith(), commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS, RETIRED_MODIFIER_NAMES, SERVICE_CHARGE_TYPES (+2 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.08
Nodes (56): Delivered (slice 6): Taxes, addConfiguredLine(), cartTotals(), changeQty(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, equalSplit() (+48 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 50 - "payload.js"
Cohesion: 0.21
Nodes (14): TABLE_LIST, DELETED_KEYS, itemTime(), keyOf(), mergeInventoryList(), mergeList(), mergePayload(), payloadCovers() (+6 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.15
Nodes (38): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS, orderTotal() (+30 more)

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
Cohesion: 0.20
Nodes (20): productCategories(), carryCategoryRename(), addCategory(), addCommonModifiers(), applyCatalogDrafts(), deleteCategory(), deleteModifier(), deleteProduct() (+12 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "usePos"
Cohesion: 0.15
Nodes (25): NavIcon(), PATHS, PATHS, PortalIcon(), PortalHome(), PortalSettingsPage, PortalShell(), Reports (+17 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "useUi"
Cohesion: 0.16
Nodes (22): ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES, LabelStockPicker(), PrintHelperPicker(), productMargin(), productSizeGroup() (+14 more)

### Community 63 - "locations.js"
Cohesion: 0.09
Nodes (41): FeatureChecklist(), offLabels(), FeaturesTab(), NO_OVERRIDE, blankFounders(), FoundersEditor(), limitText(), StandardPlans() (+33 more)

### Community 64 - "logic.mjs"
Cohesion: 0.09
Nodes (40): esc(), mountEditor(), patch(), render(), pct(), rid(), buildReport(), clamp() (+32 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (41): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+33 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 67 - "pos-address.test.js"
Cohesion: 0.18
Nodes (7): assert, fs, path, redirects, root, test, toml

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
Nodes (22): dependencies, @anthropic-ai/sdk, appwrite, node-appwrite, node-fetch-native-with-agent, nodemailer, stripe, description (+14 more)

### Community 72 - "Client"
Cohesion: 0.13
Nodes (3): __classPrivateFieldGet(), Client, ID

### Community 73 - "link.js"
Cohesion: 0.30
Nodes (13): adoptLegacy(), aggregate(), createLink(), kdsLink, linkFor(), links, listeners, notify() (+5 more)

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
Cohesion: 0.11
Nodes (7): Changing or removing an administrator, 6. Services (abstractions), AppwriteAuthProvider, LocalAuthProvider, passwordHash(), useServices(), ctx()

### Community 80 - "useFeature"
Cohesion: 0.11
Nodes (42): how(), KitchenStations(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel(), FeedbackPanel(), LiveScreenPanel() (+34 more)

### Community 81 - "EndOfDay.jsx"
Cohesion: 0.17
Nodes (28): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+20 more)

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
Nodes (35): AssistBar(), log, DEFAULT_RECEIPT_FOOTER, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES (+27 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 94 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "pos/staff.js"
Cohesion: 0.12
Nodes (31): activeTimeEntry(), currentCashShift(), expectedCash(), AUDIT_ACTION, auditDetails(), dayOf(), diffEntry(), entryError() (+23 more)

### Community 98 - "documents.js"
Cohesion: 0.24
Nodes (16): esc(), receiptName(), receiptDate(), kotBody(), kotHtml(), kotTicketsHtml(), padLeft(), padRight() (+8 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.11
Nodes (28): adminSignals(), buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS (+20 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.18
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "guard"
Cohesion: 0.06
Nodes (42): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+34 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "admin-visits-conversion.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 104 - "diagnosticsPeer.js"
Cohesion: 0.20
Nodes (16): discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog(), saveLog() (+8 more)

### Community 105 - "domain/format.js"
Cohesion: 0.10
Nodes (38): Kpi(), csvEscape(), groupedValue(), toCsv(), today(), batchStatus(), commissionRows(), customerName() (+30 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.26
Nodes (10): businessLabel(), confirmWord(), createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert (+2 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "patchSettings"
Cohesion: 0.08
Nodes (46): asStation(), connection(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf(), KITCHEN_CONNECTIONS (+38 more)

### Community 109 - "salesLog.js"
Cohesion: 0.40
Nodes (8): day(), DELETED_ACTION, findApprover(), inLocation(), parseDeletedDetails(), refundRows(), voidRows(), users

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.14
Nodes (24): getStore(), createDatabase(), databaseNameFor(), accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), handOff() (+16 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "thirdPartyPayments.js"
Cohesion: 0.25
Nodes (13): PAYMENT_METHODS, activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices(), reorder(), splitChoices() (+5 more)

### Community 115 - "Architecture"
Cohesion: 0.17
Nodes (11): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, PosStore, Responsive layout (+3 more)

### Community 116 - "imageTools.js"
Cohesion: 0.21
Nodes (16): isDataImage(), storeImage(), moveImagesToCloud(), publishMenu(), uploadBusinessLogo(), uploadSocialQr(), binarize(), cleanReceiptQrImage() (+8 more)

### Community 117 - "react"
Cohesion: 0.09
Nodes (32): saleItemCount(), applyReportFilters(), useReportContext(), useScopedData(), CustomerMessageModal(), collectionOf, defaults, IndustryModals() (+24 more)

### Community 118 - "PosProvider.jsx"
Cohesion: 0.08
Nodes (35): Staff, NAV_ITEMS, OWNER_ROLES, REPORTING_ROLES, SETTINGS_PAGE_OF_VIEW, VIEW_TITLES, readyBeep(), isOnBreak() (+27 more)

### Community 119 - "gm-routing.test.js"
Cohesion: 0.29
Nodes (6): assert, chain, fake, lib, Module, test

### Community 120 - "Settings Section Build Spec: what is still pending"
Cohesion: 0.18
Nodes (10): 1. Navigation and structure (spec 1, 2.2), 2. System Options (spec 5), 3. Users (spec 6), 4. Menu Admin (spec 7), 5. Permissions (spec 8), 6. Device Manager (spec 9), 7. Cross-cutting (spec 4, 10, 11, 12), 8. Open questions from the spec (section 13) (+2 more)

### Community 121 - "serviceWorker.test.js"
Cohesion: 0.16
Nodes (10): isHashed(), isPosPage(), SHELL, strategyFor(), code, handlers, pick(), req() (+2 more)

### Community 122 - "Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager"
Cohesion: 0.11
Nodes (19): 10. Troubleshooting, 11. Documentation index, 12. Contact, 1. The products, 2. Product videos, 3. Repository structure, 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing (+11 more)

### Community 124 - "send-invoice.cjs"
Cohesion: 0.36
Nodes (6): esc(), handler(), money(), nodemailer, { handler }, require

### Community 125 - "database.js"
Cohesion: 0.12
Nodes (18): log, migrations, tableColumns(), TYPE, CashShift, Customer, InventoryItem, Location (+10 more)

### Community 126 - "useInstall.js"
Cohesion: 0.39
Nodes (7): isAppleTouch, isInstalled(), listeners, notify(), snapshot(), subscribe(), useInstall()

### Community 127 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 128 - "lib/ogf-push.js"
Cohesion: 0.19
Nodes (24): cleanConfig(), configProblems(), crypto, deleteSecret(), emptyState(), getToken(), idOf(), loadSecrets() (+16 more)

### Community 130 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 131 - "KdsApp.jsx"
Cohesion: 0.22
Nodes (22): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+14 more)

### Community 133 - "BaseRepository"
Cohesion: 0.04
Nodes (19): 5. Data layer (WatermelonDB), categoryId(), BaseRepository, CashShiftRepository, CategoryRepository, createRepositories(), CustomerRepository, generic() (+11 more)

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.14
Nodes (12): handler(), call(), assert, auth, call(), col(), docs, { handler } (+4 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.15
Nodes (13): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing, Ceylonry POS — React + WatermelonDB (+5 more)

### Community 136 - "ref_node_fs"
Cohesion: 0.09
Nodes (18): walk(), assert, compat, fs, path, test, assert, fs (+10 more)

### Community 137 - "ogf-sales.js"
Cohesion: 0.17
Nodes (19): batchCode(), breakdown(), dateTimeOf(), DEFAULT_PAYMENT_NAMES, describe(), header(), itemRows(), num() (+11 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 140 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 141 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

### Community 142 - "Settings section: build status and plan"
Cohesion: 0.08
Nodes (27): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts (+19 more)

### Community 145 - "kitchenPrinters.js"
Cohesion: 0.19
Nodes (15): kotEscPos(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket() (+7 more)

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

### Community 157 - "ogf-push-function.test.js"
Cohesion: 0.11
Nodes (15): handler(), lib, log, push, assert, caller, docs, { handler } (+7 more)

### Community 158 - "nowIso"
Cohesion: 0.15
Nodes (28): isEmail(), nowIso(), phoneKey(), whatsappPhone(), prepName(), addSubcategory(), saveModifier(), newId() (+20 more)

### Community 159 - "pos-admin-accounts.test.js"
Cohesion: 0.11
Nodes (19): BUSINESS_TYPES, cleanNewAccount(), generatePassword(), text(), assert, auth, col(), docs (+11 more)

### Community 162 - "admin-store.js"
Cohesion: 0.16
Nodes (19): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+11 more)

### Community 163 - "KdsHealthPages.jsx"
Cohesion: 0.21
Nodes (18): formatBytes(), healthIssues(), rateLatency(), cleanKds(), KDS_DEFAULTS, kdsError(), kdsSettingsOf(), whole() (+10 more)

### Community 164 - "pos/detailing.js"
Cohesion: 0.31
Nodes (17): advanceJob(), clash(), createInvoice(), find(), finishJob(), guard(), JOB_FLOW, MANAGERS (+9 more)

### Community 165 - "printBridge.js"
Cohesion: 0.16
Nodes (12): connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), loadQz(), log, sendRaw() (+4 more)

### Community 166 - "README.md"
Cohesion: 0.13
Nodes (9): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction, How they were recorded, Product walkthroughs, Direct Email, Netlify Forms Notification (+1 more)

### Community 168 - "payroll.test.js"
Cohesion: 0.23
Nodes (15): bucketHours(), entryHours(), key(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS, split() (+7 more)

### Community 169 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 170 - "docs/README.md"
Cohesion: 0.13
Nodes (10): Conventions, Debugging, Development guide, Recipes, Setup, Ceylonry POS — Documentation, Automated coverage, Harness (+2 more)

### Community 171 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 173 - "domain/inventory.js"
Cohesion: 0.31
Nodes (13): ADJUST_RULES, availableProductStock(), cartQtyForProduct(), ensureProductInventory(), hasSizedStock(), isService(), lineSize(), productSizeItem() (+5 more)

### Community 174 - "bug-report-20260811-email-modal-template.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 175 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 177 - "ogf-push.test.js"
Cohesion: 0.18
Nodes (11): assert, CLIENT, config(), deps(), http, mall, push, run() (+3 more)

### Community 179 - "POS administration portal"
Cohesion: 0.33
Nodes (5): Admin screens, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

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
Cohesion: 0.11
Nodes (22): PublishBar(), SaveBar(), SettingsShell(), TopRow(), blankForm(), formFrom(), formProblems(), https() (+14 more)

### Community 188 - "collect"
Cohesion: 0.67
Nodes (4): collect(), keyOf(), pickRegister(), previewFor()

### Community 189 - "node-appwrite"
Cohesion: 0.29
Nodes (3): node-appwrite, db, db

## Knowledge Gaps
- **956 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+951 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1253 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `KdsApp.jsx`, `money`, `BaseRepository`, `ref_node_fs`, `createLogger`, `net.js`, `portal.test.js`, `logger.js`, `Settings section: build status and plan`, `settings.js`, `kitchenPrinters.js`, `labelPrinter.js`, `scanner.js`, `cloud.test.js`, `plans.js`, `KdsHealthPages.jsx`, `adminInsights.js`, `printBridge.js`, `payroll.test.js`, `appwriteCompat.js`, `UsersPages.jsx`, `AdminApp.jsx`, `common.js`, `pos/sales.js`, `Tables.jsx`, `salesSplit.test.js`, `SettingsHome.jsx`, `locations.js`, `pos-react/package.json`, `EndOfDay.jsx`, `ReportPage.jsx`, `assist.js`, `pos/staff.js`, `diagnosticsShared.js`, `patchSettings`, `salesLog.js`, `thirdPartyPayments.js`, `react`, `PosProvider.jsx`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Ceylo.jsx`, `SystemOptionsPages.jsx`, `KdsApp.jsx`, `money`, `App.jsx`, `createLogger`, `Settings section: build status and plan`, `settings.js`, `plans.js`, `useData`, `adminInsights.js`, `printBridge.js`, `KdsHealthPages.jsx`, `appwriteCompat.js`, `UsersPages.jsx`, `AdminApp.jsx`, `Tables.jsx`, `SettingsHome.jsx`, `usePos`, `AssignmentTree.jsx`, `useUi`, `locations.js`, `pos-react/package.json`, `useFeature`, `EndOfDay.jsx`, `ReportPage.jsx`, `assist.js`, `diagnosticsPeer.js`, `domain/format.js`, `SessionProvider.jsx`, `PosProvider.jsx`, `serviceWorker.test.js`, `useInstall.js`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `5. Data layer (WatermelonDB)` connect `BaseRepository` to `Ceylonry POS — React + WatermelonDB`, `assets/catalog.js`, `tables/index.js`, `PosStore.js`, `PosProvider.jsx`, `store.mjs`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _956 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Ceylo.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1226890756302521 - nodes in this community are weakly interconnected._
- **Should `SystemOptionsPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13613053613053613 - nodes in this community are weakly interconnected._
- **Should `account-danger-zone.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._