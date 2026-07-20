# Graph Report - .  (2026-06-18)

## Corpus Check
- 145 files · ~266,128 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 804 nodes · 1153 edges · 65 communities (49 shown, 16 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.8)
- Token cost: 127,683 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Shell & Navigation|App Shell & Navigation]]
- [[_COMMUNITY_Confirm Dialog & Print Relay|Confirm Dialog & Print Relay]]
- [[_COMMUNITY_WB Supply Manager (FBS)|WB Supply Manager (FBS)]]
- [[_COMMUNITY_Dashboard Monolith & Tabs|Dashboard Monolith & Tabs]]
- [[_COMMUNITY_Dashboard Helpers & Config|Dashboard Helpers & Config]]
- [[_COMMUNITY_claude-chat Telegram Bot|claude-chat Telegram Bot]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Dashboard Section Components|Dashboard Section Components]]
- [[_COMMUNITY_ScladSTATS Backend API|ScladSTATS Backend API]]
- [[_COMMUNITY_WB Products & Stickers|WB Products & Stickers]]
- [[_COMMUNITY_DB Backup Tooling|DB Backup Tooling]]
- [[_COMMUNITY_Build Config (package.json)|Build Config (package.json)]]
- [[_COMMUNITY_Admin Panel|Admin Panel]]
- [[_COMMUNITY_Sales Map (Russia geo)|Sales Map (Russia geo)]]
- [[_COMMUNITY_ScladSTATS Sync Worker|ScladSTATS Sync Worker]]
- [[_COMMUNITY_Warehouse Offline Server|Warehouse Offline Server]]
- [[_COMMUNITY_tsconfig.node|tsconfig.node]]
- [[_COMMUNITY_Project Context Concepts|Project Context Concepts]]
- [[_COMMUNITY_Warehouse Persistence|Warehouse Persistence]]
- [[_COMMUNITY_Stack & Reserved Dirs|Stack & Reserved Dirs]]
- [[_COMMUNITY_tsconfig.app|tsconfig.app]]
- [[_COMMUNITY_PDF Report Kit|PDF Report Kit]]
- [[_COMMUNITY_launchd Backup Installer|launchd Backup Installer]]
- [[_COMMUNITY_ScladSTATS Backend pkg|ScladSTATS Backend pkg]]
- [[_COMMUNITY_Cloudflare Proxy pkg|Cloudflare Proxy pkg]]
- [[_COMMUNITY_Advertising Insights & Autopilot|Advertising Insights & Autopilot]]
- [[_COMMUNITY_Error Boundary & Bootstrap|Error Boundary & Bootstrap]]
- [[_COMMUNITY_Login & Telegram Service|Login & Telegram Service]]
- [[_COMMUNITY_WB Financial Analytics & Proxy|WB Financial Analytics & Proxy]]
- [[_COMMUNITY_ScladSTATS Context|ScladSTATS Context]]
- [[_COMMUNITY_Excel Export|Excel Export]]
- [[_COMMUNITY_Deploy Ritual & Workflow Rules|Deploy Ritual & Workflow Rules]]
- [[_COMMUNITY_FBO Pallets & Offline Mode|FBO Pallets & Offline Mode]]
- [[_COMMUNITY_Instruction Tab|Instruction Tab]]
- [[_COMMUNITY_Warehouse Offline pkg|Warehouse Offline pkg]]
- [[_COMMUNITY_Proxy Server|Proxy Server]]
- [[_COMMUNITY_Modal Component|Modal Component]]
- [[_COMMUNITY_Cameras Tab|Cameras Tab]]
- [[_COMMUNITY_Mac Agent Script|Mac Agent Script]]
- [[_COMMUNITY_dev-tasks-bot Edge Function|dev-tasks-bot Edge Function]]
- [[_COMMUNITY_Warehouse Money History|Warehouse Money History]]
- [[_COMMUNITY_Database Tab|Database Tab]]
- [[_COMMUNITY_YouWare Background Asset|YouWare Background Asset]]
- [[_COMMUNITY_Password Hashing & Security|Password Hashing & Security]]
- [[_COMMUNITY_Clock Component|Clock Component]]
- [[_COMMUNITY_Warehouse Money Header|Warehouse Money Header]]
- [[_COMMUNITY_Warehouse Tab|Warehouse Tab]]
- [[_COMMUNITY_OpenClaw Watchdog|OpenClaw Watchdog]]
- [[_COMMUNITY_ScladPro Backup Script|ScladPro Backup Script]]
- [[_COMMUNITY_Dashboard Utils|Dashboard Utils]]
- [[_COMMUNITY_Site Icon (Cube Logo)|Site Icon (Cube Logo)]]
- [[_COMMUNITY_WB All-Time Report (Python)|WB All-Time Report (Python)]]
- [[_COMMUNITY_tsconfig root|tsconfig root]]
- [[_COMMUNITY_Russia Geo Coords|Russia Geo Coords]]
- [[_COMMUNITY_Excel Parser Worker|Excel Parser Worker]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]

## God Nodes (most connected - your core abstractions)
1. `ScladPro Project Context (CLAUDE.md)` - 18 edges
2. `fetch()` - 16 edges
3. `compilerOptions` - 16 edges
4. `supabase` - 14 edges
5. `compilerOptions` - 13 edges
6. `AI React Website Template` - 10 edges
7. `Warehouse Management System (YOUWARE.md)` - 9 edges
8. `useAuth()` - 8 edges
9. `withRetry()` - 7 edges
10. `normalizeScanStickerText()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `React 18 + TypeScript + Vite + Tailwind Stack` --semantically_similar_to--> `Warehouse Management System (YOUWARE.md)`  [INFERRED] [semantically similar]
  README.md → YOUWARE.md
- `request()` --calls--> `fetch()`  [INFERRED]
  src/services/telegram.service.ts → cloudflare-supabase-proxy/src/worker.js
- `Two-Machine Git Discipline` --semantically_similar_to--> `Git Source of Truth (cany123rus/scladpro master)`  [INFERRED] [semantically similar]
  mac-agent/README.md → CLAUDE.md
- `WB Public Endpoint 429 Rate Limiting` --semantically_similar_to--> `Cache WB Report in Supabase Recommendation`  [INFERRED] [semantically similar]
  SCLADSTATS_CONTEXT.md → WB_REPORT_ALGORITHM.md
- `СкладПро HTML Entry (index.html)` --implements--> `Warehouse Management System (YOUWARE.md)`  [INFERRED]
  index.html → YOUWARE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Telegram-to-Agent Task Pipeline** — dev_tasks_bot_table, mac_agent_run_script, mac_agent_dev_tasks_queue, dev_tasks_bot_readme [EXTRACTED 1.00]
- **ScladSTATS WB Analytics Stack** — scladstats_module_structure, scladstats_worker_sync, scladstats_market_intelligence, scladstats_frontend_dashboard_api [INFERRED 0.85]
- **Warehouse Offline Snapshot/Sync Loop** — docs_warehouse_offline_server, docs_warehouse_offline_client, docs_warehouse_offline_snapshot, docs_warehouse_offline_api [EXTRACTED 1.00]

## Communities (65 total, 16 thin omitted)

### Community 0 - "App Shell & Navigation"
Cohesion: 0.06
Nodes (35): AppShell(), AppShellProps, AVATAR_COLORS, colorFromName(), EmployeeLike, getInitials(), NightToggle(), PullToRefresh() (+27 more)

### Community 1 - "Confirm Dialog & Print Relay"
Cohesion: 0.05
Nodes (37): confirmDialog(), ConfirmHost(), ConfirmOptions, ConfirmTone, InternalState, TONE_STYLES, PrintJob, ColumnMeta (+29 more)

### Community 2 - "WB Supply Manager (FBS)"
Cohesion: 0.08
Nodes (27): extractAutoStickerScanText(), extractSvgStickerScanText(), FbsSupplyScanOrderRow, FbsSupplyScanSavedItem, FbsSupplyScanSheetMeta, findBlockBySourceName(), formatStickerDigits(), getImageCandidates() (+19 more)

### Community 3 - "Dashboard Monolith & Tabs"
Cohesion: 0.09
Nodes (33): AdminPanel, AdvertisingInsights, CamerasTab, DashboardProps, InstructionTab, SalesMap, Tasks, WarehouseTab (+25 more)

### Community 4 - "Dashboard Helpers & Config"
Cohesion: 0.06
Nodes (36): ASSEMBLY_BUTTONS, BARTER_RATING_OPTIONS, buildFboScanProductCard(), buildWarehouseMoneyStoredComment(), DELIVERY_PAYER_OWNER_RULES, EMP_AVATAR_GRADIENTS, EXTERNAL_ADS_STATUS_CLASSES, EXTERNAL_ADS_STATUS_LABELS (+28 more)

### Community 5 - "claude-chat Telegram Bot"
Cohesion: 0.08
Nodes (26): ALLOWED_CHAT_IDS, askClaude(), clearHistory(), historyKey(), loadHistory(), Msg, saveHistory(), sendTelegram() (+18 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (33): dependencies, bwip-js, cannon-es, clsx, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, exceljs (+25 more)

### Community 7 - "Dashboard Section Components"
Cohesion: 0.10
Nodes (21): DatamatrixCode(), EmployeesSection(), ExcelUploader(), ReportsSection(), SuppliesFBOSection(), TelegramSettingsSection(), WBProductsSection(), ensureBwip() (+13 more)

### Community 8 - "ScladSTATS Backend API"
Cohesion: 0.10
Nodes (19): pool, query(), alertsRouter, dashboardRouter, demoNiches, demoProducts, fetchByNmId(), mapWbProduct() (+11 more)

### Community 9 - "WB Products & Stickers"
Cohesion: 0.11
Nodes (20): ProductVariant, Supplier, useMediaQuery(), WBCharacteristic, wbFontBase64Cache, WBProduct, WBProducts, WBProductsComponent() (+12 more)

### Community 10 - "DB Backup Tooling"
Cohesion: 0.11
Nodes (22): appendBackupLog(), backupDir, backupRoot, DATABASE_BACKUP_TABLES, detailsParts, __dirname, dumpTable(), env (+14 more)

### Community 11 - "Build Config (package.json)"
Cohesion: 0.09
Nodes (22): devDependencies, autoprefixer, postcss, tailwindcss, @types/matter-js, @types/node, @types/react, @types/react-dom (+14 more)

### Community 12 - "Admin Panel"
Cohesion: 0.09
Nodes (19): AdminPanel(), AdminPanelProps, AdminSection, AssemblyGroup, BOT_SLOTS, BotSlot, CAT_COLORS, isAdminEmp() (+11 more)

### Community 13 - "Sales Map (Russia geo)"
Cohesion: 0.12
Nodes (15): ALIAS_FED, COORDS, EXTRA_FEATURES, FED, FED_BY_KEY, fedFromName(), findCoord(), FOREIGN_MARK (+7 more)

### Community 14 - "ScladSTATS Sync Worker"
Cohesion: 0.24
Nodes (13): estimateOrders(), syncMarketQueries(), syncSales(), getSyncCursor(), pool, setSyncCursor(), fetchMarketByQuery(), fetchSales() (+5 more)

### Community 15 - "Warehouse Offline Server"
Cohesion: 0.14
Nodes (13): authToken, dbPath, __dirname, emptyDb(), ensureDb(), HONEST_SIGN_SEEN_CAP, port, readJson() (+5 more)

### Community 16 - "tsconfig.node"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 17 - "Project Context Concepts"
Cohesion: 0.18
Nodes (15): Claude API (claude-opus-4-8), Per-chat Dialog History in app_settings, claude-chat Telegram Bot (Edge Function), CyberClub Supabase Project (ykdvepjzhqufbldudbxq), Dashboard.tsx Monolith, ScladPro Design System (slate + indigo/violet), Git Source of Truth (cany123rus/scladpro master), Lazy Loading / Manual Chunking (+7 more)

### Community 18 - "Warehouse Persistence"
Cohesion: 0.24
Nodes (11): ShowToast, useWarehousePersistence(), loadWarehouseAssignmentsFromDb(), persistWarehouseAssignmentsToDb(), parseWarehouseAssignments(), WarehouseAssignments, WarehouseItem, warehouseItemKey() (+3 more)

### Community 19 - "Stack & Reserved Dirs"
Cohesion: 0.16
Nodes (15): AI React Website Template, React 18 + TypeScript + Vite + Tailwind Stack, Zustand State Management, API Reserved Directory, Components Reserved Directory, Layouts Reserved Directory, Pages Reserved Directory, Store Reserved Directory (+7 more)

### Community 20 - "tsconfig.app"
Cohesion: 0.13
Nodes (14): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+6 more)

### Community 21 - "PDF Report Kit"
Cohesion: 0.14
Nodes (13): BLUE, drawKpiChips(), drawMetaLines(), drawReportHeader(), EMERALD, INDIGO, reportFooter(), reportTableStyles() (+5 more)

### Community 22 - "launchd Backup Installer"
Cohesion: 0.15
Nodes (10): __dirname, env, __filename, home, launchAgentsDir, plistPath, root, scriptPath (+2 more)

### Community 23 - "ScladSTATS Backend pkg"
Cohesion: 0.18
Nodes (10): dependencies, cors, express, express-rate-limit, pg, name, scripts, dev (+2 more)

### Community 24 - "Cloudflare Proxy pkg"
Cohesion: 0.18
Nodes (10): dependencies, http-proxy, engines, node, name, private, scripts, start (+2 more)

### Community 25 - "Advertising Insights & Autopilot"
Cohesion: 0.24
Nodes (7): Row, ADS_AUTOPILOT_CONFIG, AdsDecision, AdsRowInput, AdsRuleConfig, buildTelegramDigest(), evaluateAdsRow()

### Community 26 - "Error Boundary & Bootstrap"
Cohesion: 0.22
Nodes (6): ErrorBoundary, Props, State, App(), handleChunkLoadError(), isChunkError()

### Community 27 - "Login & Telegram Service"
Cohesion: 0.24
Nodes (6): request(), TelegramParseMode, telegramService, sanitizeEmployeeForStorage(), SENSITIVE_KEYS, storeCurrentEmployee()

### Community 28 - "WB Financial Analytics & Proxy"
Cohesion: 0.22
Nodes (10): ScladPro Supabase Project (blygwkxjogmioebutiwn), WB Report Parser (wbReportParser.ts), RF Supabase Blocking Workaround, Cloudflare Supabase Proxy (RF block bypass), Supabase Proxy Worker (worker.js), Worker Sync Jobs (syncSales / syncMarketQueries), WB Financial Analytics Algorithm, wb_financial_all_time_report.py (+2 more)

### Community 29 - "ScladSTATS Context"
Cohesion: 0.31
Nodes (9): ScladSTATS Context, ScladSTATS Dashboard API endpoints, ScladSTATS Dashboard HTML, ScladSTATS Frontend README, Market Intelligence Framework, ScladSTATS Module Structure (backend/worker/frontend/infra), ScladSTATS README, WB Public Endpoint 429 Rate Limiting (+1 more)

### Community 30 - "Excel Export"
Cohesion: 0.36
Nodes (7): createWorkbookBlob(), downloadAoaWorkbook(), downloadWorkbook(), JsonRow, loadExcel(), SheetSpec, triggerDownload()

### Community 31 - "Deploy Ritual & Workflow Rules"
Cohesion: 0.25
Nodes (8): Frontend Deploy Ritual (sw.js bump + build + firebase deploy), Firebase Hosting (sclad-73d4a), СкладПро HTML Entry (index.html), App Watchdog (SW/cache reload), Mandatory Backup Before Task, Local Verify Before Deploy Rule, ScladPro Workflow Rules, Versions Log (backups/VERSIONS_LOG.md)

### Community 32 - "FBO Pallets & Offline Mode"
Cohesion: 0.32
Nodes (8): FBO Pallet Hierarchy (JSON snapshot in app_settings), Warehouse Offline Mode, Warehouse Offline API Contract, Windows Autostart Scheduled Task, Offline Frontend Client (warehouseOffline.ts), Local Offline Server (warehouse-offline-server.mjs), Morning Snapshot, Warehouse DB Schema (suppliers/supplies/boxes/supply_items)

### Community 34 - "Warehouse Offline pkg"
Cohesion: 0.25
Nodes (7): dependencies, pg, name, scripts, dev, type, version

### Community 35 - "Proxy Server"
Cohesion: 0.33
Nodes (4): http, httpProxy, proxy, server

### Community 36 - "Modal Component"
Cohesion: 0.33
Nodes (4): ACCENTS, ModalAccent, ModalProps, SIZES

### Community 37 - "Cameras Tab"
Cohesion: 0.50
Nodes (4): CamerasTab(), CamerasTabProps, CameraStream, normalizeRoleKey()

### Community 38 - "Mac Agent Script"
Cohesion: 0.70
Nodes (4): run-agent.sh script, api(), notify(), set_task()

### Community 41 - "Database Tab"
Cohesion: 0.50
Nodes (3): DashboardDatabaseTab(), DashboardDatabaseTabProps, DatabaseLog

### Community 42 - "YouWare Background Asset"
Cohesion: 0.67
Nodes (3): YouWare Brand Logo Motif, YouWare Background Pattern, Decorative UI Watermark Background

### Community 43 - "Password Hashing & Security"
Cohesion: 1.00
Nodes (3): employee_credentials table (bcrypt), Password Hashing & Security Hardening, verify_employee_login RPC

### Community 49 - "Dashboard Utils"
Cohesion: 0.67
Nodes (3): Dashboard(), getBarterRatingClassName(), getSafeId()

### Community 50 - "Site Icon (Cube Logo)"
Cohesion: 0.67
Nodes (3): Cube Brand Mark (3D Box, Indigo/Violet), ScladPro Site Icon (3D Cube Logo), Warehouse / Storage (Box) Theme

## Knowledge Gaps
- **292 isolated node(s):** `name`, `version`, `private`, `type`, `start` (+287 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fetch()` connect `claude-chat Telegram Bot` to `Confirm Dialog & Print Relay`, `ScladSTATS Backend API`, `WB Products & Stickers`, `DB Backup Tooling`, `ScladSTATS Sync Worker`, `Login & Telegram Service`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `resilientFetch()` connect `Confirm Dialog & Print Relay` to `claude-chat Telegram Bot`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `fetchByNmId()` connect `ScladSTATS Backend API` to `claude-chat Telegram Bot`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `fetch()` (e.g. with `askClaude()` and `sendTelegram()`) actually correct?**
  _`fetch()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Shell & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.061683599419448475 - nodes in this community are weakly interconnected._
- **Should `Confirm Dialog & Print Relay` be split into smaller, more focused modules?**
  _Cohesion score 0.05297532656023222 - nodes in this community are weakly interconnected._