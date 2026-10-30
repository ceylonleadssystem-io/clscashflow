# Graph Report - clscashflow  (2026-10-30)

## Corpus Check
- 450 files · ~1,245,695 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 3988 nodes · 11922 edges · 178 communities (160 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 283 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6d9748c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- account-danger-zone.js
- SystemOptionsPages.jsx
- CheckoutProvider.jsx
- constants.js
- useFeature
- appwrite.js
- PortalShell.jsx
- __awaiter
- invoice-share.test.js
- createLogger
- patchSettings
- auth.service.js
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore.js
- security.js
- app.mjs
- appwriteAdmin
- labelPrinter.js
- guard
- store.mjs
- pos.mjs
- esc
- labelPrinter
- pos-routing.test.js
- settings.js
- barcodeScanner
- assets/platform.js
- pos-admin-data.js
- appwrite-compat.js
- pos-industry-tools.js
- public/assets/platform.js
- features.js
- useData
- pos/sales.js
- vitest
- invoiceEscape
- reportBuilders.js
- pos-admin-login.js
- invoiceEscape
- SessionProvider.jsx
- pagePath
- admin-data.cjs
- UsersPages.jsx
- AdminApp.jsx
- kitchenPrinters.js
- systemOptions.js
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
- diagnostics.service.js
- reports.test.js
- logic.mjs
- pos-react/package.json
- boot
- ref_node_fs
- getAuthUser
- payable-webhook.cjs
- diagnostics-store.js
- appwrite-files.js
- Client
- public/sw.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- env.js
- panels.jsx
- customerName
- link.js
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
- AppwriteAuthProvider
- planFromPath
- planFromPath
- PosStore
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- pos-reported-bugs.test.js
- User guide
- nodemailer
- onboarding-terms-acceptance.test.js
- EndOfDay.jsx
- account-purge.test.js
- Administrator guide
- send-contact.js
- getAdmin
- kds-pair.test.js
- Locale
- react
- track-visit.cjs
- CloudSyncService
- Architecture
- imageTools.js
- admin-store.js
- App.jsx
- net.js
- reportPdf.js
- Ceylonry POS — React + WatermelonDB
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- admin-visits-conversion.test.js
- useInstall.js
- ready.js
- bug-report-20260812.test.js
- SaleRepository
- submit-ticket.cjs
- appwriteCompat.test.js
- Storage
- Development guide
- pos-admin-catalog.test.js
- send-welcome.mjs
- Deployment & operations
- gm-routing.test.js
- config-merge.js
- tolerant-match.cjs
- bug-report-20260811-email-modal-template.test.js
- KdsApp.jsx
- 4. Run it locally for testing
- EmailJS order e-mail template
- Netlify Story Form Email Setup
- BaseRepository
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- Test plan
- growth-partner-commissions.test.js
- portal.test.js
- POS variants (verticals)
- salesLog.js
- taxes.test.js
- nowIso
- bug-report-20260810.test.js
- node-appwrite
- seo.test.js
- printing.js
- DevicePages.jsx
- Project structure
- track-visit.js
- localAdmin.js
- CategoryRepository
- README.md
- bug-report-20260813-mobile.test.js
- payroll.test.js
- priority-support-chat.test.js
- submit-subscription-receipt.js
- tables/industry.js
- Settings section: build status and plan
- IMPORTANT: This is NOT a rebuild of the POS system.
- AssignmentTree.jsx
- POS administration portal

## God Nodes (most connected - your core abstractions)
1. `useData()` - 169 edges
2. `usePos()` - 166 edges
3. `react` - 110 edges
4. `__awaiter()` - 93 edges
5. `useFeature()` - 78 edges
6. `money()` - 77 edges
7. `AppwriteException` - 74 edges
8. `Modal()` - 54 edges
9. `useUi()` - 53 edges
10. `vitest` - 51 edges

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

## Communities (178 total, 18 thin omitted)

### Community 0 - "account-danger-zone.js"
Cohesion: 0.23
Nodes (16): crypto, deleteAuthUser(), deleteOperationalData(), deleteWorkspace(), feedbackId(), handler(), {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  users,
  clean
}, log (+8 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.13
Nodes (51): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), PublishBar() (+43 more)

### Community 2 - "CheckoutProvider.jsx"
Cohesion: 0.14
Nodes (29): addConfiguredLine(), changeQty(), missingRequiredGroup(), productModifiers(), selectionExtra(), availableProductStock(), cartQtyForProduct(), ensureProductInventory() (+21 more)

### Community 3 - "constants.js"
Cohesion: 0.11
Nodes (32): ADJUST_REASONS, DEFAULT_OWNER_PIN, PAYMENT_ICONS, STOCK_TYPES, STOCK_UNITS, STORAGE, VIP_SPEND, ALWAYS_LIVE_KEY (+24 more)

### Community 4 - "useFeature"
Cohesion: 0.13
Nodes (36): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+28 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (53): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+45 more)

### Community 6 - "PortalShell.jsx"
Cohesion: 0.13
Nodes (25): NavIcon(), PATHS, PATHS, PortalIcon(), Modifiers, PortalHome(), PortalShell(), Products (+17 more)

### Community 7 - "__awaiter"
Cohesion: 0.07
Nodes (6): Account, __awaiter(), adopt(), fulfilled(), rejected(), step()

### Community 8 - "invoice-share.test.js"
Cohesion: 0.11
Nodes (47): {
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
}, publicBase(), response() (+39 more)

### Community 9 - "createLogger"
Cohesion: 0.16
Nodes (21): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), firstColumn(), normalHeader() (+13 more)

### Community 10 - "patchSettings"
Cohesion: 0.08
Nodes (38): PAYMENT_METHODS, SPLIT_PAYMENT_METHODS, cleanStations(), activeThirdParty(), MAX_NAME, move(), nameError(), paymentChoices() (+30 more)

### Community 11 - "auth.service.js"
Cohesion: 0.13
Nodes (12): App(), ErrorBoundary, log, KdsGate(), getAppwriteCompat(), installGlobalClsBackend(), friendlyAuthError(), getAuthService() (+4 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.07
Nodes (28): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+20 more)

### Community 14 - "logger.js"
Cohesion: 0.11
Nodes (31): auth(), POS app (browser), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget(), descriptorString() (+23 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore.js"
Cohesion: 0.16
Nodes (15): decode(), encode(), hintSeq(), LEGACY_ARRAY_TABLES, log, nextSeq(), nowIso(), canonical() (+7 more)

### Community 17 - "security.js"
Cohesion: 0.09
Nodes (35): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+27 more)

### Community 18 - "app.mjs"
Cohesion: 0.08
Nodes (49): ACTIONS, billsOf(), bindGuestFill(), business(), canSend(), detailDialog(), dlg(), ensureGuest() (+41 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.10
Nodes (25): { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders, { appwriteAdmin }, clean(), esc() (+17 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.12
Nodes (31): esc(), barcodeSvg(), cleanBarcode(), CODE128, code128Units(), code128Values(), CODE39, drawCode128() (+23 more)

### Community 21 - "guard"
Cohesion: 0.09
Nodes (31): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+23 more)

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

### Community 27 - "settings.js"
Cohesion: 0.08
Nodes (70): SUPPORT_CODE_TTL_MS, categoryKey(), cell(), stalePresetCategory(), visibleProductCategories(), catalogDraftChanges(), categoryEditError(), cleanCategoryEdit() (+62 more)

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.10
Nodes (34): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+26 more)

### Community 31 - "appwrite-compat.js"
Cohesion: 0.11
Nodes (12): CollectionRef(), currentUser(), DocRef(), emit(), firestore(), loadUser(), QueryRef(), request() (+4 more)

### Community 32 - "pos-industry-tools.js"
Cohesion: 0.17
Nodes (27): activeMembership(), applyMembershipDiscount(), batchStatus(), canManage(), commissionSales(), installModals(), installView(), modal() (+19 more)

### Community 33 - "public/assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 34 - "features.js"
Cohesion: 0.05
Nodes (59): emailInvoice(), buildInvoiceLines(), r2(), FeatureChecklist(), offLabels(), FeaturesTab(), NO_OVERRIDE, fmt() (+51 more)

### Community 35 - "useData"
Cohesion: 0.09
Nodes (63): CeyloAiKeyPanel(), PROVIDERS, CloudBanner(), Shell(), ConnectButton(), HardwarePanel(), LabelAlignWizard(), SIDES (+55 more)

### Community 36 - "pos/sales.js"
Cohesion: 0.11
Nodes (35): PLATFORM_CHANNELS, cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature(), serviceChargeAmount() (+27 more)

### Community 37 - "vitest"
Cohesion: 0.14
Nodes (21): inHours(), menusInEffect(), minutes(), overlappingMenus(), makeCtx(), cash(), addProduct(), createHarness() (+13 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.08
Nodes (39): salesCategoryNameOf(), payCost(), activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C (+31 more)

### Community 40 - "pos-admin-login.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "SessionProvider.jsx"
Cohesion: 0.16
Nodes (20): assistActive(), assistSignedIn(), accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), loadCatalogueImages(), loadPlatformScript() (+12 more)

### Community 43 - "pagePath"
Cohesion: 0.08
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "UsersPages.jsx"
Cohesion: 0.16
Nodes (27): FULL_SETTINGS_ROLES, MANAGER_ROLES, ROLE_VIEWS, ROLES, VIEW_TITLES, accessFromKeys(), accessOf(), can() (+19 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.13
Nodes (30): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, sendAdminRequest(), AdminApp() (+22 more)

### Community 47 - "kitchenPrinters.js"
Cohesion: 0.11
Nodes (24): openKotWindow(), kotEscPos(), kotHtml(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log (+16 more)

### Community 48 - "systemOptions.js"
Cohesion: 0.26
Nodes (12): applyPatch(), autoClockOutDue(), FIELDS, isOverridden(), LANDING_VIEWS, landingView(), OPTION_PAGES, presetChanges() (+4 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 51 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 52 - "Tables.jsx"
Cohesion: 0.08
Nodes (61): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+53 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.08
Nodes (20): assert, keys, lib, rows, test, assert, keys, test (+12 more)

### Community 55 - "AppwriteException"
Cohesion: 0.14
Nodes (3): AppwriteException, Databases, Teams

### Community 56 - "salesSplit.test.js"
Cohesion: 0.16
Nodes (11): createDatabase(), combine(), digest(), djb2(), groupByMonth(), hashRows(), salesMonth(), SplitRef (+3 more)

### Community 57 - "render"
Cohesion: 0.13
Nodes (22): bankDetailsHtml(), billingCyclePickerHtml(), cleanString(), clearAccountLocalBackups(), customer(), dangerActionName(), dangerConfirmPhrase(), dangerReasonOptions() (+14 more)

### Community 58 - "pos/catalog.js"
Cohesion: 0.20
Nodes (20): productCategories(), carryCategoryRename(), addCategory(), addCommonModifiers(), addSubcategory(), applyCatalogDrafts(), deleteCategory(), deleteModifier() (+12 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "PosProvider.jsx"
Cohesion: 0.11
Nodes (32): OWNER_ROLES, resolveWelcome(), expectedCash(), isOnBreak(), StaffGate(), unmask(), blank(), UserModal() (+24 more)

### Community 61 - "ref_node_module"
Cohesion: 0.14
Nodes (10): { handler }, require, { handler }, require, { handler }, require, { handler }, require (+2 more)

### Community 62 - "diagnostics.service.js"
Cohesion: 0.16
Nodes (19): buildLogText(), checkIn(), cloudSignals(), handled, localPosSignals, log, POLL_MS, _resetForTests() (+11 more)

### Community 63 - "reports.test.js"
Cohesion: 0.50
Nodes (4): REPORT_GROUPS, line(), range, sale()

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
Nodes (21): assert, compat, fs, path, test, assert, fs, page (+13 more)

### Community 68 - "getAuthUser"
Cohesion: 0.19
Nodes (18): chatThreadId(), closeMyTicket(), ensureChatThread(), fieldTimestamp(), getAuthUser(), getFirestore(), injectSupportCardStyle(), mountSupportWidget() (+10 more)

### Community 69 - "payable-webhook.cjs"
Cohesion: 0.24
Nodes (18): authCandidates(), clean(), crypto, firstValue(), { getAdmin }, handler(), header(), headers() (+10 more)

### Community 70 - "diagnostics-store.js"
Cohesion: 0.24
Nodes (16): { ADMIN_DATABASE_ID }, badRequest(), checkSdp(), { Databases }, db(), docId(), expired(), get() (+8 more)

### Community 71 - "appwrite-files.js"
Cohesion: 0.06
Nodes (35): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+27 more)

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

### Community 79 - "env.js"
Cohesion: 0.10
Nodes (13): env, log, pullDelay(), authHeaders(), call(), log, endSupportSession(), log (+5 more)

### Community 80 - "panels.jsx"
Cohesion: 0.08
Nodes (55): Ctx, SystemOptionsProvider(), how(), KitchenStations(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel() (+47 more)

### Community 81 - "customerName"
Cohesion: 0.19
Nodes (12): batchStatus(), commissionRows(), customerName(), data(), render(), Appointments(), Commissions(), INDUSTRY_MODULES (+4 more)

### Community 82 - "link.js"
Cohesion: 0.33
Nodes (12): adoptLegacy(), aggregate(), createLink(), kdsLink, linkFor(), links, listeners, notify() (+4 more)

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
Cohesion: 0.23
Nodes (13): appendQuery(), clean(), findCheckoutUrl(), { getAdmin }, handler(), headers(), normalizePlan(), payableWebhookUrl() (+5 more)

### Community 89 - "ReportPage.jsx"
Cohesion: 0.21
Nodes (19): formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine(), groupOf() (+11 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.13
Nodes (32): AssistBar(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+24 more)

### Community 92 - "appwrite-compat-session.test.js"
Cohesion: 0.12
Nodes (7): Account, assert, Client, fs, path, test, vm

### Community 93 - "serviceWorker.test.js"
Cohesion: 0.29
Nodes (5): code, handlers, pick(), req(), worker

### Community 95 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 96 - "planFromPath"
Cohesion: 0.22
Nodes (14): bestPlan(), customPaymentLink(), enforceRememberedPlanRoute(), isHttpUrl(), normalizePlan(), paidLockedPlan(), paymentLinkFor(), planFromPath() (+6 more)

### Community 97 - "PosStore"
Cohesion: 0.26
Nodes (3): PosStore, attachLines(), PosStore

### Community 98 - "documents.js"
Cohesion: 0.16
Nodes (21): DEFAULT_BUSINESS_NAME, DEFAULT_RECEIPT_FOOTER, modifierLabel(), receiptName(), receiptDate(), kotBody(), padLeft(), padRight() (+13 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.11
Nodes (27): adminSignals(), discardLog(), keyFor(), loadLog(), log, memory, openCache(), requestLog() (+19 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "pos-reported-bugs.test.js"
Cohesion: 0.20
Nodes (9): assert, config, fs, mailer, path, platform, root, test (+1 more)

### Community 102 - "User guide"
Cohesion: 0.11
Nodes (17): Account admin portal (/admin), Checkout, Customers & loyalty, Inventory & stock, Menu Admin (Settings), Open orders & kitchen (restaurant / café), Printers by device (Settings > Device Manager), Products, categories, modifiers (+9 more)

### Community 103 - "nodemailer"
Cohesion: 0.07
Nodes (34): esc(), handler(), nodemailer, clean(), escapeHtml(), { guard, siteOrigin }, handler(), HEADERS (+26 more)

### Community 104 - "onboarding-terms-acceptance.test.js"
Cohesion: 0.22
Nodes (8): assert, fs, onboarding, { pagePath }, path, root, test, welcome

### Community 105 - "EndOfDay.jsx"
Cohesion: 0.13
Nodes (35): REPORTING_ROLES, birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), dashboardData() (+27 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.29
Nodes (8): createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert, { createPurger, kindOf, imageIdsOf }, test

### Community 107 - "Administrator guide"
Cohesion: 0.17
Nodes (12): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, Related Netlify configuration (+4 more)

### Community 108 - "send-contact.js"
Cohesion: 0.29
Nodes (9): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+1 more)

### Community 109 - "getAdmin"
Cohesion: 0.21
Nodes (12): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+4 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "react"
Cohesion: 0.09
Nodes (34): Panel(), CUSTOMER_TYPES, customerStats(), cap(), csvEscape(), downloadCsv(), groupedValue(), toCsv() (+26 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 115 - "Architecture"
Cohesion: 0.20
Nodes (10): Architecture, Cloud sync, Data model, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates (+2 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "admin-store.js"
Cohesion: 0.16
Nodes (18): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+10 more)

### Community 118 - "App.jsx"
Cohesion: 0.17
Nodes (18): Gate(), Loading(), Ready(), Root(), AssistMissing(), IosInstallGuide(), SyncIndicator(), Topbar() (+10 more)

### Community 119 - "net.js"
Cohesion: 0.36
Nodes (11): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), run() (+3 more)

### Community 120 - "reportPdf.js"
Cohesion: 0.29
Nodes (5): buildReportPdf(), downloadReportPdf(), PLAIN, jspdf, jspdf-autotable

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

### Community 130 - "submit-ticket.cjs"
Cohesion: 0.29
Nodes (8): clean(), esc(), { getAdmin }, handler(), headers(), nodemailer, { handler }, require

### Community 133 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.15
Nodes (11): handler(), assert, auth, call(), col(), docs, { handler }, items (+3 more)

### Community 135 - "send-welcome.mjs"
Cohesion: 0.38
Nodes (5): esc(), handler(), nodemailer, { handler }, require

### Community 136 - "Deployment & operations"
Cohesion: 0.33
Nodes (6): Backups and data, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 137 - "gm-routing.test.js"
Cohesion: 0.29
Nodes (6): assert, chain, fake, lib, Module, test

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
Cohesion: 0.32
Nodes (13): ageLabel(), ageMinutes(), BACK, KDS_COLUMNS, kdsStatus(), kdsTickets(), NEXT, nextStatus() (+5 more)

### Community 142 - "4. Run it locally for testing"
Cohesion: 0.33
Nodes (6): 4.1 POS, offline — no backend, no secrets (easiest), 4.2 Full stack — real sign-in, cloud sync, GM, pairing, 4.3 Guest Manager only (no backend), 4.4 CashFlow pages, 4.5 Tests and checks, 4. Run it locally for testing

### Community 143 - "EmailJS order e-mail template"
Cohesion: 0.40
Nodes (4): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted)

### Community 144 - "Netlify Story Form Email Setup"
Cohesion: 0.50
Nodes (3): Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup

### Community 145 - "BaseRepository"
Cohesion: 0.08
Nodes (13): 5. Data layer (WatermelonDB), BaseRepository, CashShiftRepository, createRepositories(), CustomerRepository, generic(), InventoryRepository, MetaRepository (+5 more)

### Community 152 - "Test plan"
Cohesion: 0.50
Nodes (4): Automated coverage, Harness, Manual checklist (not automated), Test plan

### Community 153 - "growth-partner-commissions.test.js"
Cohesion: 0.20
Nodes (9): admin, assert, endpoint, fs, onboardingApi, { pagePath }, path, root (+1 more)

### Community 154 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

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
Cohesion: 0.07
Nodes (59): CashShift, Customer, InventoryItem, Location, modelClasses, ModifierGroup, Product, Sale (+51 more)

### Community 159 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 160 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 161 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 162 - "printing.js"
Cohesion: 0.14
Nodes (25): markSent(), routeKitchenLines(), prepName(), KDS_DESTINATION, kitchenPrinterHook(), kitchenMode(), docCtx(), downloadReceipt() (+17 more)

### Community 163 - "DevicePages.jsx"
Cohesion: 0.16
Nodes (28): asStation(), connection(), connectionLabel(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf() (+20 more)

### Community 166 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 167 - "track-visit.js"
Cohesion: 0.31
Nodes (8): { appwriteAdmin }, clean(), getAdmin(), { guard, siteOrigin }, headers(), isLandingPath(), handler(), log

### Community 168 - "localAdmin.js"
Cohesion: 0.15
Nodes (19): DEV_ADMIN, getStore(), invoices(), localAdminApi(), localAdminSession, flagsWithPlan(), databaseNameFor(), log (+11 more)

### Community 170 - "README.md"
Cohesion: 0.19
Nodes (5): How they were recorded, Product walkthroughs, Logging, Netlify functions (server), Ceylonry POS — Documentation

### Community 171 - "bug-report-20260813-mobile.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 173 - "payroll.test.js"
Cohesion: 0.23
Nodes (15): bucketHours(), entryHours(), key(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS, split() (+7 more)

### Community 174 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 175 - "submit-subscription-receipt.js"
Cohesion: 0.20
Nodes (15): { appwriteAdmin, getUserFromEvent, getDocument }, clean(), crypto, decodedFile(), esc(), handler(), json(), log (+7 more)

### Community 176 - "tables/industry.js"
Cohesion: 0.33
Nodes (5): appointments, commissionPayments, medicineBatches, memberships, prescriptions

### Community 178 - "Settings section: build status and plan"
Cohesion: 0.17
Nodes (11): Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 6): Taxes, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers), Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts, Next slices, in the spec's order (+3 more)

### Community 180 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 183 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

## Knowledge Gaps
- **851 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+846 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1121 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `CheckoutProvider.jsx`, `appwriteCompat.test.js`, `createLogger`, `patchSettings`, `KdsApp.jsx`, `logger.js`, `labelPrinter.js`, `portal.test.js`, `salesLog.js`, `taxes.test.js`, `features.js`, `DevicePages.jsx`, `localAdmin.js`, `UsersPages.jsx`, `AdminApp.jsx`, `payroll.test.js`, `systemOptions.js`, `Tables.jsx`, `salesSplit.test.js`, `PosProvider.jsx`, `diagnostics.service.js`, `reports.test.js`, `pos-react/package.json`, `env.js`, `customerName`, `assist.js`, `serviceWorker.test.js`, `documents.js`, `EndOfDay.jsx`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Why does `opts()` connect `payroll.test.js` to `public/assets/platform.js`, `assets/platform.js`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `SystemOptionsPages.jsx`, `CheckoutProvider.jsx`, `useFeature`, `PortalShell.jsx`, `createLogger`, `auth.service.js`, `KdsApp.jsx`, `settings.js`, `features.js`, `useData`, `DevicePages.jsx`, `SessionProvider.jsx`, `UsersPages.jsx`, `AdminApp.jsx`, `Tables.jsx`, `AssignmentTree.jsx`, `PosProvider.jsx`, `pos-react/package.json`, `env.js`, `panels.jsx`, `customerName`, `ReportPage.jsx`, `assist.js`, `serviceWorker.test.js`, `diagnosticsShared.js`, `EndOfDay.jsx`, `App.jsx`, `useInstall.js`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _851 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SystemOptionsPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12781954887218044 - nodes in this community are weakly interconnected._
- **Should `CheckoutProvider.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13903743315508021 - nodes in this community are weakly interconnected._
- **Should `constants.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10960960960960961 - nodes in this community are weakly interconnected._