# Graph Report - clscashflow  (2026-11-09)

## Corpus Check
- 501 files · ~1,298,614 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 15, (none) 3, .webmanifest 2)

## Summary
- 4441 nodes · 13405 edges · 192 communities (174 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 327 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9f6f5abe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- menuAdmin.js
- SystemOptionsPages.jsx
- account-danger-zone.js
- esc
- useFeature
- appwrite.js
- AutomobileShell.jsx
- __awaiter
- invoice-share.test.js
- MenuImport.jsx
- security.js
- pos/inventory.js
- assets/catalog.js
- defineTable.js
- logger.js
- admin-data.js
- PosStore
- MenuAdminPages.jsx
- printing.js
- appwriteAdmin
- labelPrinter.js
- send-contact.js
- store.mjs
- pos.mjs
- app.mjs
- labelPrinter
- pos-routing.test.js
- CloudSyncService
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
- access.js
- AdminApp.jsx
- presets.js
- pos/sales.js
- ai-keys.js
- cloud.service.js
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
- adminAnalytics.js
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
- link.js
- getAuthUser
- Working rules: do not break existing functionality
- kds-store.js
- mountBillingWidget
- appwrite-sdk.js
- LocalAuthProvider
- panels.jsx
- EndOfDay.jsx
- track-visit.js
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
- timesheetEdit.test.js
- documents.js
- diagnosticsShared.js
- Root test-suite audit (169 failing tests)
- guard
- User guide
- bug-report-20260810.test.js
- DiagnosticsTab.jsx
- Detailing.jsx
- account-purge.test.js
- Administrator guide
- devices.js
- salesLog.js
- kds-pair.test.js
- Locale
- SessionProvider.jsx
- track-visit.cjs
- constants.js
- Architecture
- imageTools.js
- systemOptions.js
- PosProvider.jsx
- localAdmin.js
- Settings Section Build Spec: what is still pending
- serviceWorker.test.js
- Ceylonry — CashFlow, POS, Kitchen Display and Guest Manager
- Role
- send-invoice.cjs
- database.js
- useInstall.js
- onboarding-terms-acceptance.test.js
- lib/ogf-push.js
- adminInsightsParity.test.js
- getAdmin
- KdsApp.jsx
- Storage
- tables/index.js
- pos-admin-catalog.test.js
- Ceylonry POS — React + WatermelonDB
- seo.test.js
- ogf-sales.js
- config-merge.js
- tolerant-match.cjs
- net.js
- portal.test.js
- Settings section: build status and plan
- appwriteCompat.test.js
- BaseRepository
- kitchenPrinters.js
- setup.js
- payable-create-checkout.js
- payable-status.js
- payable-webhook.js
- submit-ticket.cjs
- growth-partner-commissions.test.js
- pos-admin-rollup.test.js
- POS variants (verticals)
- createLogger
- ogf-push-function.test.js
- nowIso
- pos-admin-accounts.test.js
- reports.test.js
- insightsRollup
- admin-store.js
- settings.js
- pos/detailing.js
- printBridge.js
- IMPORTANT: This is NOT a rebuild of the POS system.
- SaleRepository
- payroll.test.js
- Project structure
- README.md
- appwrite-files.js
- apps-used.test.js
- domain/inventory.js
- bug-report-20260811-email-modal-template.test.js
- submit-subscription-receipt.js
- FakePc
- ogf-push.test.js
- rowMapper.js
- POS administration portal
- taxes.js
- Deployment & operations
- ready.js
- reportPdf.js
- ceylo.js
- priority-support-chat.test.js
- Restaurant (OGF) and the OGF sales push
- settingsGroups.test.js
- collect
- node-appwrite
- AssignmentTree.jsx
- Development guide

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

## Communities (192 total, 18 thin omitted)

### Community 0 - "menuAdmin.js"
Cohesion: 0.10
Nodes (28): catalogDraftChanges(), allowedCategoryKeys(), APPLY_KEYS, assignItems(), brief(), DEFAULT_PREFIXES, draftChanges(), FIELD_LABELS (+20 more)

### Community 1 - "SystemOptionsPages.jsx"
Cohesion: 0.08
Nodes (83): Delivered (slice 1), Delivered (slice 2): Payroll, 3rd Party Payments, Zones, AuditTrailDrawer(), DetailDrawer(), EmptyState(), SortableList(), StatusBadge(), PublishBar() (+75 more)

### Community 2 - "account-danger-zone.js"
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

### Community 3 - "esc"
Cohesion: 0.14
Nodes (42): bindGuestFill(), bindTables(), bookingDialog(), business(), cancelDialog(), cfg(), dateBar(), dialog() (+34 more)

### Community 4 - "useFeature"
Cohesion: 0.10
Nodes (45): CartLines(), CategoryRail(), CheckoutFields(), CustomerSection(), DiscountSection(), PaymentSection(), ReceiptOptions(), ReferenceSection() (+37 more)

### Community 5 - "appwrite.js"
Cohesion: 0.11
Nodes (54): bodyOf(), handle(), handler(), {headers,getUserFromEvent,getDocument,getDocumentStamp,listStamps,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite,sanitizeProfileWrite}, itemTime(), log, logAdminSettingChanges(), logStripped() (+46 more)

### Community 6 - "AutomobileShell.jsx"
Cohesion: 0.15
Nodes (20): AutomobileShell(), BusinessSettings(), Detailing, Icon(), ICONS, Inventory, ITEMS, ROLE_ITEMS (+12 more)

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

### Community 9 - "MenuImport.jsx"
Cohesion: 0.15
Nodes (22): log, MenuImport(), NUMBERS, log, MenuTab(), catalogueNumber(), cell(), firstColumn() (+14 more)

### Community 10 - "security.js"
Cohesion: 0.06
Nodes (56): ADMIN_PASSWORD_SHA256, correctAdminCredential(), crypto, handler(), isTransient(), log, { originAllowed, rateLimited, clientIp }, response() (+48 more)

### Community 11 - "pos/inventory.js"
Cohesion: 0.17
Nodes (19): parseStockCountRows(), adjustmentChange(), stockMovement(), deleteModifier(), deleteProduct(), deleteSubcategory(), applyStockChange(), markDeleted() (+11 more)

### Community 12 - "assets/catalog.js"
Cohesion: 0.15
Nodes (42): act(), analytics(), bind(), bindCategoryField(), bindMoneyInputs(), button(), categories(), categoryField() (+34 more)

### Community 13 - "defineTable.js"
Cohesion: 0.06
Nodes (36): camelToSnake(), columnName(), defineModel(), defineTable(), pascal(), RESERVED, appMeta, locationAudit (+28 more)

### Community 14 - "logger.js"
Cohesion: 0.10
Nodes (35): auth(), POS app (browser), buildLogText(), capJson(), createRateLimiter(), createTapTracker(), cut(), describeTarget() (+27 more)

### Community 15 - "admin-data.js"
Cohesion: 0.11
Nodes (38): { appwriteAdmin }, buildRevenueStats(), add(), buildStats(), countQuery(), createPartnerCommission(), crypto, ensureExpiredTrialPaymentRequests() (+30 more)

### Community 16 - "PosStore"
Cohesion: 0.21
Nodes (7): PosStore, attachLines(), hintSeq(), nextSeq(), nowIso(), PosStore, rowPlainToLine()

### Community 17 - "MenuAdminPages.jsx"
Cohesion: 0.11
Nodes (49): TextAreaRow(), ARRAY_FIELDS, categoryEditError(), cleanCategoryEdit(), cleanGroupEdit(), draftList(), draftNewItems(), effectiveCategory() (+41 more)

### Community 18 - "printing.js"
Cohesion: 0.13
Nodes (24): routeKitchenLines(), prepName(), kitchenPrinterHook(), docCtx(), downloadReceipt(), kdsNotice(), kitchenDestination(), locationFor() (+16 more)

### Community 19 - "appwriteAdmin"
Cohesion: 0.07
Nodes (36): esc(), handler(), nodemailer, { appwriteAdmin }, { guard, siteOrigin }, handler(), reply(), responseHeaders (+28 more)

### Community 20 - "labelPrinter.js"
Cohesion: 0.12
Nodes (32): cleanBarcode(), CODE128, code128Units(), code128Values(), drawCode128(), sizedBarcode(), sizeSlug(), alignmentAdjust() (+24 more)

### Community 21 - "send-contact.js"
Cohesion: 0.18
Nodes (12): ALLOWED_TOPICS, clean(), escapeHtml(), { guard, siteOrigin }, handler(), JSON_HEADERS, nodemailer, response() (+4 more)

### Community 22 - "store.mjs"
Cohesion: 0.10
Nodes (43): Data model, go(), refreshPos(), viewMessages(), addDays(), dateStr(), DEFAULT_SETTINGS, mergeRows() (+35 more)

### Community 23 - "pos.mjs"
Cohesion: 0.30
Nodes (13): layoutDialog(), ownLayout(), effectiveLocation(), emptyPos, floorKey(), floorsKey(), floorsOf(), fromPos() (+5 more)

### Community 24 - "app.mjs"
Cohesion: 0.10
Nodes (41): ACTIONS, billsOf(), canSend(), detailDialog(), dlg(), guestDialog(), guestOf(), guestSpend() (+33 more)

### Community 26 - "pos-routing.test.js"
Cohesion: 0.06
Nodes (33): ask(), askHidden(), db, email, fail(), hash, { hashPassword, verifyPassword }, lines (+25 more)

### Community 27 - "CloudSyncService"
Cohesion: 0.21
Nodes (6): exactly(), profileHasPosAccess(), clone(), CloudSyncService, withTimeout(), safePayload()

### Community 28 - "scanner.js"
Cohesion: 0.14
Nodes (7): barcodeScanner, findScannedItem(), findScannedProduct(), HID_MAP, HID_SHIFT, log, scannerCodeVariants()

### Community 29 - "assets/platform.js"
Cohesion: 0.08
Nodes (12): amount(), balance(), chatMessageTime(), chatWhen(), initMobileDataTables(), invoiceCustomTemplateCss(), invoiceTemplateClass(), mobileizeDataTables() (+4 more)

### Community 30 - "pos-admin-data.js"
Cohesion: 0.10
Nodes (36): ACCOUNT_STATUSES, accountStatus(), addBillingPeriod(), { appsUsed }, { appwriteAdmin }, clampNum(), clean(), cleanFounders() (+28 more)

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
Cohesion: 0.13
Nodes (19): emailInvoice(), buildInvoiceLines(), r2(), fmt(), InvoicesTab(), DEV_ADMIN, localAdminSession, fmt() (+11 more)

### Community 35 - "useData"
Cohesion: 0.06
Nodes (93): Gate(), Loading(), Ready(), Root(), AssistMissing(), CloudBanner(), Shell(), ConnectButton() (+85 more)

### Community 36 - "adminInsights.js"
Cohesion: 0.12
Nodes (47): BarChart(), HourlyPanel(), Kpi(), lkr(), METRICS, one(), RankedBars(), AnalyticsTab() (+39 more)

### Community 37 - "vitest"
Cohesion: 0.15
Nodes (20): makeCtx(), cash(), addProduct(), createHarness(), line(), noDiscount, openShift(), productForm() (+12 more)

### Community 38 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 39 - "reportBuilders.js"
Cohesion: 0.09
Nodes (35): activeSales(), AUDIT, BUILDERS, buildReport(), byLocation(), C, day(), GIFT (+27 more)

### Community 40 - "admin-auth.js"
Cohesion: 0.12
Nodes (20): { createLogger }, { guard, reply }, handler(), { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken }, log, store, b64url(), crypto (+12 more)

### Community 41 - "invoiceEscape"
Cohesion: 0.17
Nodes (26): clampNumber(), clsLegacyInvoiceRendererRemoved(), documentEmailHtml(), emailJsBankDetailsHtml(), humanDate(), invoiceBankEmailHtml(), invoiceBankRows(), invoiceBreaks() (+18 more)

### Community 42 - "appwriteCompat.js"
Cohesion: 0.09
Nodes (17): App(), ErrorBoundary, log, KdsGate(), forgetUser(), getAppwriteCompat(), installGlobalClsBackend(), log (+9 more)

### Community 43 - "pagePath"
Cohesion: 0.08
Nodes (28): assert, fs, { pagePath }, path, read(), root, test, assert (+20 more)

### Community 44 - "admin-data.cjs"
Cohesion: 0.17
Nodes (24): buildStats(), countQuery(), crypto, ensureExpiredTrialPaymentRequests(), { getAdmin }, handler(), headers(), isInternalAdmin() (+16 more)

### Community 45 - "access.js"
Cohesion: 0.20
Nodes (16): FULL_SETTINGS_ROLES, ROLE_VIEWS, accessFromKeys(), accessOf(), can(), effectivePermissions(), jobError(), PERMISSION_KEYS (+8 more)

### Community 46 - "AdminApp.jsx"
Cohesion: 0.13
Nodes (32): Admin portal, AccessTab(), AccountDetail(), TABS, adminApi(), log, sendAdminRequest(), AdminApp() (+24 more)

### Community 47 - "presets.js"
Cohesion: 0.22
Nodes (12): businessTypeLabel(), BLANK, typesWith(), ADMIN_BUSINESS_TYPE_OPTIONS, BUSINESS_TYPE_OPTIONS, commonModifierPresets(), INDUSTRY_TYPES, KITCHEN_TYPES (+4 more)

### Community 48 - "pos/sales.js"
Cohesion: 0.09
Nodes (50): DEFAULT_RECEIPT_FOOTER, addConfiguredLine(), cartTotals(), chargeableSubtotal(), discountAmount(), EMPTY_DISCOUNT, isChargeable(), modifierSignature() (+42 more)

### Community 49 - "ai-keys.js"
Cohesion: 0.20
Nodes (17): Anthropic, ask(), crypto, decrypt(), docId(), encrypt(), { getDocument, upsertDocument, deleteDocument }, keyFor() (+9 more)

### Community 50 - "cloud.service.js"
Cohesion: 0.13
Nodes (30): EMPTY_SNAPSHOT(), ALWAYS_LIVE_KEY, alwaysLive(), log, cacheCatalogue(), catalogueBackupKey(), catalogueIdentityMatches(), emptyDeleted() (+22 more)

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
Cohesion: 0.16
Nodes (23): categoryKey(), productCategories(), stalePresetCategory(), visibleProductCategories(), carryCategoryRename(), categorySettingBlank(), categorySettingsById(), cleanCategorySetting() (+15 more)

### Community 59 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 60 - "PortalShell.jsx"
Cohesion: 0.21
Nodes (14): NavIcon(), PATHS, PATHS, PortalIcon(), PortalHome(), PortalSettingsPage, PortalShell(), Reports (+6 more)

### Community 61 - "ref_node_module"
Cohesion: 0.12
Nodes (13): esc(), handler(), nodemailer, { handler }, require, { handler }, require, { handler } (+5 more)

### Community 62 - "adminAnalytics.js"
Cohesion: 0.17
Nodes (21): EmailJS order e-mail template, Error: "Template: One or more dynamic variables are corrupted", Set it up, Variables the POS sends (all ready-to-show text, money already formatted), dailySeries(), day(), DEFAULT_TZ, fmt (+13 more)

### Community 63 - "subscription.js"
Cohesion: 0.18
Nodes (20): FeatureChecklist(), offLabels(), blankFounders(), FoundersEditor(), limitText(), StandardPlans(), SubscriptionManagement(), limit() (+12 more)

### Community 64 - "logic.mjs"
Cohesion: 0.10
Nodes (36): esc(), mountEditor(), patch(), render(), pct(), rid(), ACTIVE, buildReport() (+28 more)

### Community 65 - "pos-react/package.json"
Cohesion: 0.05
Nodes (43): dependencies, appwrite, jspdf, jspdf-autotable, @nozbe/watermelondb, qrcode, qz-tray, react (+35 more)

### Community 66 - "boot"
Cohesion: 0.13
Nodes (19): afterFirstPaint(), boot(), currentUserPayload(), dismissTrialPrompt(), initDelegatedMobileDrawer(), initExclusiveInvoiceMoreMenus(), initMobileApplicationDrawer(), initMobileInvoiceWizard() (+11 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.10
Nodes (13): walk(), assert, compat, fs, path, test, assert, fs (+5 more)

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
Cohesion: 0.18
Nodes (15): billingCycleFor(), billingDueDate(), bindBillingCyclePicker(), select(), dateMs(), formatAmount(), injectBillingCardStyle(), isProfilePaidRecord() (+7 more)

### Community 78 - "appwrite-sdk.js"
Cohesion: 0.11
Nodes (6): Functions, Graphql, Messaging, Permission, Query, Service

### Community 80 - "panels.jsx"
Cohesion: 0.08
Nodes (54): CeyloAiKeyPanel(), PROVIDERS, how(), KitchenStations(), AppearancePanel(), BillingPanel(), BusinessProfilePanel(), DisplayPanel() (+46 more)

### Community 81 - "EndOfDay.jsx"
Cohesion: 0.17
Nodes (28): birthdayInfo(), closedShiftsInRange(), crmRows(), customerInsights(), customerReport(), customerSegment(), customerStats(), dashboardData() (+20 more)

### Community 82 - "track-visit.js"
Cohesion: 0.31
Nodes (8): { appwriteAdmin }, clean(), getAdmin(), { guard, siteOrigin }, headers(), isLandingPath(), handler(), log

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
Cohesion: 0.25
Nodes (16): localDateValue(), formatCard(), formatCell(), reportCsv(), reportDocument(), sortRows(), tableRows(), totalsLine() (+8 more)

### Community 90 - "security-endpoints.test.js"
Cohesion: 0.13
Nodes (13): adminSigninSource, appwriteCompatSource, assert, ceylonryAdminSource, docsSource, fs, { pagePath }, path (+5 more)

### Community 91 - "assist.js"
Cohesion: 0.12
Nodes (34): AssistBar(), log, applyConfig(), BLOCKED_SETTINGS, countConfig(), DEFAULTS, DELETE_TYPES, describeConfig() (+26 more)

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

### Community 97 - "timesheetEdit.test.js"
Cohesion: 0.22
Nodes (14): AUDIT_ACTION, dayOf(), entryError(), entryLocked(), fromLocalInput(), LOCK_MONTHS, lockDate(), MAX_SHIFT_MS (+6 more)

### Community 98 - "documents.js"
Cohesion: 0.15
Nodes (23): esc(), receiptName(), receiptDate(), openKotWindow(), testStation(), kotBody(), kotHtml(), kotTicketsHtml() (+15 more)

### Community 99 - "diagnosticsShared.js"
Cohesion: 0.09
Nodes (34): adminSignals(), log, memory, checkIn(), cloudSignals(), handled, localPosSignals, log (+26 more)

### Community 100 - "Root test-suite audit (169 failing tests)"
Cohesion: 0.17
Nodes (11): A1. Auto-verified with tolerant matching: 140, A2. Reviewed by hand, formatting only: 12, A. Formatting-only: 152, B. Stale tests: 13, C. Real gaps to verify: 4, Method, Recommendations, Resolution (2026-10-02) (+3 more)

### Community 101 - "guard"
Cohesion: 0.05
Nodes (49): { getUserFromEvent, getDocument, clean }, { guard, reply }, handler(), keys, log, Anthropic, contextText(), { getUserFromEvent, getDocument, clean } (+41 more)

### Community 102 - "User guide"
Cohesion: 0.08
Nodes (24): Account admin portal (/admin), Barcode label window, Checkout, Customers & loyalty, Inventory & stock, Items ready to serve (restaurant with Kitchen Displays), Label printer through the print helper (Windows), Menu Admin (Settings) (+16 more)

### Community 103 - "bug-report-20260810.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 104 - "DiagnosticsTab.jsx"
Cohesion: 0.42
Nodes (8): discardLog(), keyFor(), loadLog(), openCache(), requestLog(), saveLog(), BUSY, DiagnosticsTab()

### Community 105 - "Detailing.jsx"
Cohesion: 0.09
Nodes (40): Timesheets, Kpi(), today(), batchStatus(), customerName(), saleItemCount(), statusOf(), Ctx (+32 more)

### Community 106 - "account-purge.test.js"
Cohesion: 0.26
Nodes (10): businessLabel(), confirmWord(), createPurger(), inventory(), purge(), imageIdsOf(), kindOf(), assert (+2 more)

### Community 107 - "Administrator guide"
Cohesion: 0.14
Nodes (14): Account list, Administrator guide, Enable / disable an account (non-payment), Features and locations, Import items and the client's POS, Invoices, Known gaps, New POS account (+6 more)

### Community 108 - "devices.js"
Cohesion: 0.13
Nodes (27): asStation(), connection(), copyPrinters(), device(), DEVICE_KINDS, deviceNameError(), devicesOf(), KITCHEN_CONNECTIONS (+19 more)

### Community 109 - "salesLog.js"
Cohesion: 0.27
Nodes (12): userName(), staffName(), day(), DELETED_ACTION, deletedDetails(), findApprover(), inLocation(), parseDeletedDetails() (+4 more)

### Community 110 - "kds-pair.test.js"
Cohesion: 0.22
Nodes (5): assert, FakeDatabases, rows, store, test

### Community 112 - "SessionProvider.jsx"
Cohesion: 0.16
Nodes (20): createDatabase(), accessAllowed(), billingWarning(), PAID_STATUSES, posAccessProfile(), handOff(), loadCatalogueImages(), loadPlatformScript() (+12 more)

### Community 113 - "track-visit.cjs"
Cohesion: 0.31
Nodes (7): clean(), { getAdmin }, handler(), headers(), isLandingPath(), { handler }, require

### Community 114 - "constants.js"
Cohesion: 0.11
Nodes (24): ADJUST_REASONS, DEFAULT_BUSINESS_NAME, DEFAULT_OWNER_PIN, PAYMENT_ICONS, PAYMENT_METHODS, PLATFORM_CHANNELS, SPLIT_PAYMENT_METHODS, STOCK_TYPES (+16 more)

### Community 115 - "Architecture"
Cohesion: 0.22
Nodes (9): Architecture, Cloud sync, Feature flags, Layers, Order e-mail, Responsive layout, Sessions and gates, Stack (+1 more)

### Community 116 - "imageTools.js"
Cohesion: 0.36
Nodes (10): binarize(), cleanReceiptQrImage(), compressProductImage(), escPosRaster(), fitBusinessLogo(), loadImage(), readFileAsDataUrl(), remoteBlobs (+2 more)

### Community 117 - "systemOptions.js"
Cohesion: 0.14
Nodes (26): Ctx, SystemOptionsProvider(), missingRequiredGroup(), productModifiers(), globalModifiersOf(), limitsById(), prefixesOf(), publishedOf() (+18 more)

### Community 118 - "PosProvider.jsx"
Cohesion: 0.07
Nodes (48): AskCeylo(), CeyloButton(), CeyloMascot(), CeyloPanel(), DOT, EYES, Item(), MOVES (+40 more)

### Community 119 - "localAdmin.js"
Cohesion: 0.14
Nodes (23): FeaturesTab(), NO_OVERRIDE, getStore(), invoices(), localAdminApi(), FEATURE_PRESET_MAP, FEATURE_PRESETS, GM (+15 more)

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

### Community 129 - "adminInsightsParity.test.js"
Cohesion: 0.29
Nodes (7): ago(), end, payload, sale(), server, src, start

### Community 130 - "getAdmin"
Cohesion: 0.14
Nodes (16): { appwriteAdmin }, getAdmin(), clean(), esc(), { getAdmin }, handler(), nodemailer, storeSubmission() (+8 more)

### Community 131 - "KdsApp.jsx"
Cohesion: 0.24
Nodes (21): kdsTicketsOf(), orderProgress(), readyAlert(), readyToCollect(), ageLabel(), ageMinutes(), BACK, KDS_COLUMNS (+13 more)

### Community 133 - "tables/index.js"
Cohesion: 0.09
Nodes (14): categoryId(), LEGACY_ARRAY_TABLES, log, CategoryRepository, createRepositories(), generic(), InventoryRepository, OpenOrderRepository (+6 more)

### Community 134 - "pos-admin-catalog.test.js"
Cohesion: 0.14
Nodes (12): handler(), call(), assert, auth, call(), col(), docs, { handler } (+4 more)

### Community 135 - "Ceylonry POS — React + WatermelonDB"
Cohesion: 0.12
Nodes (16): 1. Quick start, 2. Project structure, 3. Environment variables, 4. External files and integration points (not reproduced here), 6. Services (abstractions), 7. Administration portal (separate login), 8. Parity checklist, 9. Testing (+8 more)

### Community 136 - "seo.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, path, root, test

### Community 137 - "ogf-sales.js"
Cohesion: 0.17
Nodes (19): batchCode(), breakdown(), dateTimeOf(), DEFAULT_PAYMENT_NAMES, describe(), header(), itemRows(), num() (+11 more)

### Community 138 - "config-merge.js"
Cohesion: 0.23
Nodes (11): applyConfig(), cleanConfig(), DELETE_TYPES, idOf(), plain(), ROW_TYPES, summarize(), text() (+3 more)

### Community 139 - "tolerant-match.cjs"
Cohesion: 0.47
Nodes (5): assert, canon(), canonRegex(), strict, wrap()

### Community 140 - "net.js"
Cohesion: 0.30
Nodes (12): CHANNEL, hex(), LAN_RTC, newCode(), newPairId(), pairApi(), hostKds(), offer() (+4 more)

### Community 141 - "portal.test.js"
Cohesion: 0.22
Nodes (12): isPortalPath(), PORTAL_SECTIONS, sectionOfView(), visiblePortalSections(), quoteLink(), SHOP_CATEGORIES, SHOP_EMAIL, day() (+4 more)

### Community 142 - "Settings section: build status and plan"
Cohesion: 0.10
Nodes (23): Delivered (slice 10): new items, stations and groups on items, subcategories, Require order type, Delivered (slice 11): moves, business type, admin portal, Delivered (slice 3): Users, Jobs and permission keys, Delivered (slice 4): Device Manager > Printers, Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability, Delivered (slice 6): Taxes, Delivered (slice 7): Items (per-item overrides), Delivered (slice 8): Modifiers (limits and global modifiers) (+15 more)

### Community 144 - "BaseRepository"
Cohesion: 0.11
Nodes (5): 5. Data layer (WatermelonDB), BaseRepository, CashShiftRepository, CustomerRepository, ProductRepository

### Community 145 - "kitchenPrinters.js"
Cohesion: 0.17
Nodes (17): kotEscPos(), chooseKitchenPrinter(), claimed, endpointFor(), identity(), log, matches(), printKitchenTicket() (+9 more)

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

### Community 156 - "createLogger"
Cohesion: 0.09
Nodes (16): env, pullDelay(), log, authHeaders(), call(), log, setUploadFailureHandler(), endSupportSession() (+8 more)

### Community 157 - "ogf-push-function.test.js"
Cohesion: 0.11
Nodes (15): handler(), lib, log, push, assert, caller, docs, { handler } (+7 more)

### Community 158 - "nowIso"
Cohesion: 0.11
Nodes (40): isEmail(), nowIso(), phoneKey(), whatsappPhone(), activeTimeEntry(), auditDetails(), diffEntry(), addSubcategory() (+32 more)

### Community 159 - "pos-admin-accounts.test.js"
Cohesion: 0.12
Nodes (15): assert, auth, col(), docs, form, fs, { handler }, lib (+7 more)

### Community 160 - "reports.test.js"
Cohesion: 0.21
Nodes (15): CAPABILITIES, firstSub(), groupOf(), kitchenReportsOn(), MANAGER_ONLY, PAYROLL_ROLES, REPORT_GROUPS, visibleGroups() (+7 more)

### Community 162 - "admin-store.js"
Cohesion: 0.16
Nodes (19): verifyAdmin(), { getAdmin, audit }, { guard, reply }, { isAdminEmail, verifyToken }, log, store, verifyAdmin(), isAdminEmail() (+11 more)

### Community 163 - "settings.js"
Cohesion: 0.11
Nodes (42): jobsOf(), cleanStations(), cleanSalesCategory(), taxUses(), isDataImage(), storeImage(), addStandardSalesCategories(), copyDevicePrinters() (+34 more)

### Community 164 - "pos/detailing.js"
Cohesion: 0.31
Nodes (17): advanceJob(), clash(), createInvoice(), find(), finishJob(), guard(), JOB_FLOW, MANAGERS (+9 more)

### Community 165 - "printBridge.js"
Cohesion: 0.18
Nodes (11): PrintHelperPicker(), connectHelper(), HELPER_NAME, HELPER_URL, helperError(), helperPrinters(), log, sendRaw() (+3 more)

### Community 166 - "IMPORTANT: This is NOT a rebuild of the POS system."
Cohesion: 0.40
Nodes (4): IMPORTANT: This is NOT a rebuild of the POS system., Not the objective, Primary objective, Visual direction

### Community 167 - "SaleRepository"
Cohesion: 0.11
Nodes (3): MetaRepository, SaleRepository, SettingsRepository

### Community 168 - "payroll.test.js"
Cohesion: 0.20
Nodes (18): bucketHours(), entryHours(), key(), payCost(), payrollDays(), payrollHours(), payrollWeekStart(), SEVENTH_DAY_TIER_HOURS (+10 more)

### Community 169 - "Project structure"
Cohesion: 0.29
Nodes (6): Applications, Backend, Project structure, Public pages (repo root and `cashflow/`), Shared, Tooling and docs (not served)

### Community 170 - "README.md"
Cohesion: 0.10
Nodes (12): How they were recorded, Product walkthroughs, Logging, Netlify functions (server), Direct Email, Netlify Forms Notification, Netlify Story Form Email Setup, Ceylonry POS — Documentation (+4 more)

### Community 171 - "appwrite-files.js"
Cohesion: 0.21
Nodes (14): bodyOf(), deps, ensureBucket(), handle(), handler(), { InputFile }, KINDS, lib (+6 more)

### Community 172 - "apps-used.test.js"
Cohesion: 0.40
Nodes (4): appsUsed(), { appsUsed }, assert, test

### Community 173 - "domain/inventory.js"
Cohesion: 0.30
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

### Community 178 - "rowMapper.js"
Cohesion: 0.26
Nodes (9): decode(), encode(), canonical(), comparable(), lineRowId(), lineToRowPlain(), plainToRaw(), rawToPlain() (+1 more)

### Community 179 - "POS administration portal"
Cohesion: 0.29
Nodes (6): Admin screens, Changing or removing an administrator, Diagnostics, How it is separated from clients, One-time setup, POS administration portal

### Community 180 - "taxes.js"
Cohesion: 0.27
Nodes (9): calculateTaxes(), cleanTax(), MAX_RATE, partsOf(), previewTax(), round2(), taxError(), taxIdFor() (+1 more)

### Community 181 - "Deployment & operations"
Cohesion: 0.29
Nodes (7): Backups and data, Build, Caching, Deployment & operations, Environment variables, Releasing, Troubleshooting

### Community 182 - "ready.js"
Cohesion: 0.22
Nodes (3): { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID, POS_DATABASE_ID, POS_COLLECTION_ID, GM_DATABASE_ID, GM_COLLECTION_ID }, handler(), response()

### Community 183 - "reportPdf.js"
Cohesion: 0.29
Nodes (5): buildReportPdf(), downloadReportPdf(), PLAIN, jspdf, jspdf-autotable

### Community 184 - "ceylo.js"
Cohesion: 0.43
Nodes (7): ago(), isEmbedded(), isWebLink(), plural(), repeats(), runSetupChecks(), WEAK_PINS

### Community 185 - "priority-support-chat.test.js"
Cohesion: 0.25
Nodes (7): assert, fs, { pagePath }, path, read(), root, test

### Community 186 - "Restaurant (OGF) and the OGF sales push"
Cohesion: 0.29
Nodes (6): Limits, Restaurant (OGF) and the OGF sales push, Setting a business up, Things the documents leave open (to confirm with OGF), What is sent, Where it lives

### Community 188 - "collect"
Cohesion: 0.67
Nodes (4): collect(), keyOf(), pickRegister(), previewFor()

### Community 189 - "node-appwrite"
Cohesion: 0.25
Nodes (4): realDeps(), node-appwrite, db, db

### Community 191 - "Development guide"
Cohesion: 0.33
Nodes (5): Conventions, Debugging, Development guide, Recipes, Setup

## Knowledge Gaps
- **958 isolated node(s):** `Permission`, `crypto`, `{ getAdmin }`, `PLAN_DETAILS`, `{ appwriteAdmin }` (+953 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1255 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `menuAdmin.js`, `adminInsightsParity.test.js`, `SystemOptionsPages.jsx`, `KdsApp.jsx`, `tables/index.js`, `MenuImport.jsx`, `net.js`, `portal.test.js`, `logger.js`, `appwriteCompat.test.js`, `Settings section: build status and plan`, `MenuAdminPages.jsx`, `kitchenPrinters.js`, `labelPrinter.js`, `scanner.js`, `createLogger`, `reports.test.js`, `plans.js`, `useData`, `adminInsights.js`, `printBridge.js`, `payroll.test.js`, `appwriteCompat.js`, `access.js`, `AdminApp.jsx`, `presets.js`, `pos/sales.js`, `domain/inventory.js`, `Tables.jsx`, `salesSplit.test.js`, `settingsGroups.test.js`, `adminAnalytics.js`, `subscription.js`, `pos-react/package.json`, `ref_node_fs`, `EndOfDay.jsx`, `assist.js`, `timesheetEdit.test.js`, `documents.js`, `diagnosticsShared.js`, `devices.js`, `salesLog.js`, `constants.js`, `systemOptions.js`, `PosProvider.jsx`, `localAdmin.js`, `serviceWorker.test.js`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `react` connect `useData` to `SystemOptionsPages.jsx`, `KdsApp.jsx`, `useFeature`, `AutomobileShell.jsx`, `MenuImport.jsx`, `MenuAdminPages.jsx`, `createLogger`, `plans.js`, `adminInsights.js`, `printBridge.js`, `appwriteCompat.js`, `AdminApp.jsx`, `presets.js`, `Tables.jsx`, `PortalShell.jsx`, `AssignmentTree.jsx`, `subscription.js`, `pos-react/package.json`, `panels.jsx`, `EndOfDay.jsx`, `ReportPage.jsx`, `assist.js`, `DiagnosticsTab.jsx`, `Detailing.jsx`, `SessionProvider.jsx`, `constants.js`, `systemOptions.js`, `PosProvider.jsx`, `localAdmin.js`, `serviceWorker.test.js`, `useInstall.js`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `5. Data layer (WatermelonDB)` connect `BaseRepository` to `Ceylonry POS — React + WatermelonDB`, `assets/catalog.js`, `defineTable.js`, `PosStore`, `PosProvider.jsx`, `store.mjs`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `Permission`, `crypto`, `{ getAdmin }` to the rest of the system?**
  _958 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `menuAdmin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._
- **Should `SystemOptionsPages.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08184304649694929 - nodes in this community are weakly interconnected._
- **Should `esc` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._