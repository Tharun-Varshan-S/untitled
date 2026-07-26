const fs = require('fs');
const path = require('path');

const ARCH_DIR = __dirname;
const DIAGRAMS_JSON_PATH = path.join(ARCH_DIR, 'diagrams.json');

// Color Palette for Dark-Theme Diagrams
const PALETTE = {
  bg: '#0b0f19',
  cardBg: '#111827',
  cardBorder: '#1f2937',
  headerBg: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#6366f1',    // Indigo
  secondary: '#06b6d4',  // Cyan
  accent: '#10b981',     // Emerald
  warning: '#f59e0b',    // Amber
  danger: '#ef4444',     // Red
  purple: '#8b5cf6',     // Violet
  lineColor: '#475569',
  arrowColor: '#38bdf8'
};

// Helper SVG Builder Utils
function createSvgHeader(width, height, title, subtitle) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: ${PALETTE.bg}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <linearGradient id="primaryGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.8"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="queueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="${PALETTE.arrowColor}" />
    </marker>
    <marker id="arrow-emerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="${PALETTE.accent}" />
    </marker>
    <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="${PALETTE.warning}" />
    </marker>
  </defs>

  <!-- Title Banner -->
  <rect x="0" y="0" width="${width}" height="70" fill="#0f172a" />
  <line x1="0" y1="70" x2="${width}" y2="70" stroke="${PALETTE.primary}" stroke-width="2" />
  <text x="30" y="38" fill="${PALETTE.textPrimary}" font-size="22" font-weight="700" letter-spacing="0.5">${title}</text>
  <text x="30" y="58" fill="${PALETTE.textSecondary}" font-size="13">${subtitle}</text>
  <rect x="${width - 160}" y="20" width="130" height="30" rx="6" fill="#1e1b4b" stroke="${PALETTE.primary}" stroke-width="1"/>
  <text x="${width - 95}" y="40" fill="#a5b4fc" font-size="12" font-weight="600" text-anchor="middle">LOGLENS ARCH</text>
`;
}

function drawBox({ x, y, w, h, title, subtitle, icon, color = PALETTE.primary, fill = PALETTE.cardBg, rx = 10 }) {
  return `
    <g filter="url(#dropShadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${color}" stroke-width="1.5" />
      ${title ? `<rect x="${x}" y="${y}" width="${w}" height="34" rx="${rx}" fill="#1e293b" />` : ''}
      ${title ? `<rect x="${x}" y="${y + 30}" width="${w}" height="4" fill="${color}" />` : ''}
      ${title ? `<text x="${x + 15}" y="${y + 22}" fill="${PALETTE.textPrimary}" font-size="14" font-weight="600">${title}</text>` : ''}
      ${subtitle ? `<text x="${x + 15}" y="${y + 50}" fill="${PALETTE.textSecondary}" font-size="12">${subtitle}</text>` : ''}
    </g>
  `;
}

function drawConnection(x1, y1, x2, y2, label = '', marker = 'arrow', strokeColor = PALETTE.lineColor, dash = false) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dashAttr = dash ? 'stroke-dasharray="4,4"' : '';
  
  let pathD = '';
  if (x1 === x2 || y1 === y2) {
    pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
  } else {
    pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }

  return `
    <g>
      <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2" ${dashAttr} marker-end="url(#${marker})" />
      ${label ? `
        <rect x="${midX - (label.length * 3.5 + 8)}" y="${midY - 11}" width="${label.length * 7 + 16}" height="20" rx="4" fill="#0f172a" stroke="${PALETTE.cardBorder}" stroke-width="1"/>
        <text x="${midX}" y="${midY + 3}" fill="${PALETTE.textSecondary}" font-size="11" font-weight="500" text-anchor="middle">${label}</text>
      ` : ''}
    </g>
  `;
}

// -----------------------------------------------------------------------------
// 1. CONCEPTUAL ARCHITECTURE DIAGRAM
// -----------------------------------------------------------------------------
function generateConceptualDiagram() {
  const w = 1200, h = 800;
  let svg = createSvgHeader(w, h, 'LogLens – Conceptual Architecture Diagram', 'High-level overview of system boundaries, ingest pipelines, processing modules, and external actors');

  // Subsystem Containers
  // External Layer
  svg += `<rect x="40" y="100" width="220" height="660" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" stroke-dasharray="6,6" />`;
  svg += `<text x="55" y="125" fill="#94a3b8" font-size="13" font-weight="700" letter-spacing="1">EXTERNAL ENTITIES</text>`;

  svg += drawBox({ x: 60, y: 150, w: 180, h: 90, title: 'Log Producers', subtitle: 'Express/Node Apps (SDK)', color: '#38bdf8' });
  svg += drawBox({ x: 60, y: 330, w: 180, h: 90, title: 'Dashboard Users', subtitle: 'Web Browsers / Admins', color: '#38bdf8' });
  svg += drawBox({ x: 60, y: 510, w: 180, h: 90, title: 'Alert Webhooks', subtitle: 'Slack / Email / SMS', color: '#f43f5e' });

  // API Gateway Layer
  svg += `<rect x="300" y="100" width="240" height="660" rx="12" fill="#0f172a" stroke="#6366f1" stroke-width="1.5" />`;
  svg += `<text x="315" y="125" fill="#a5b4fc" font-size="13" font-weight="700" letter-spacing="1">INGESTION & API GATEWAY</text>`;
  
  svg += drawBox({ x: 320, y: 150, w: 200, h: 80, title: 'Express API Server', subtitle: 'Node.js + TypeScript', color: '#6366f1' });
  svg += drawBox({ x: 320, y: 260, w: 200, h: 80, title: 'Auth & Rate Limiter', subtitle: 'JWT & API Key Verification', color: '#6366f1' });
  svg += drawBox({ x: 320, y: 370, w: 200, h: 80, title: 'Queue Enqueuer', subtitle: '< 5ms Fast HTTP 202 Ingest', color: '#6366f1' });
  svg += drawBox({ x: 320, y: 480, w: 200, h: 80, title: 'Rest API Controllers', subtitle: 'Logs, Projects, Auth, Search', color: '#6366f1' });
  svg += drawBox({ x: 320, y: 590, w: 200, h: 80, title: 'Bull Board UI', subtitle: 'Admin Queue Monitoring', color: '#f59e0b' });

  // Phase P Queue & Worker Pipeline
  svg += `<rect x="580" y="100" width="280" height="660" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />`;
  svg += `<text x="595" y="125" fill="#fde047" font-size="13" font-weight="700" letter-spacing="1">ASYNC QUEUE & WORKERS</text>`;

  svg += drawBox({ x: 600, y: 150, w: 240, h: 90, title: 'BullMQ Queue System', subtitle: 'Log-Ingestion & Scheduling', color: '#f59e0b' });
  svg += drawBox({ x: 600, y: 270, w: 240, h: 100, title: 'BullMQ Worker Pool', subtitle: 'Clustered Background Process', color: '#10b981' });
  svg += drawBox({ x: 600, y: 390, w: 240, h: 80, title: 'AI Root Cause Engine', subtitle: 'Debounced Anomaly Analyzer', color: '#8b5cf6' });
  svg += drawBox({ x: 600, y: 490, w: 240, h: 80, title: 'Analytics Aggregator', subtitle: 'Pre-computed Metrics Engine', color: '#10b981' });
  svg += drawBox({ x: 600, y: 590, w: 240, h: 80, title: 'Notification Dispatcher', subtitle: 'Alerting Subsystem', color: '#f43f5e' });

  // Data & Storage Layer
  svg += `<rect x="900" y="100" width="260" height="660" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />`;
  svg += `<text x="915" y="125" fill="#6ee7b7" font-size="13" font-weight="700" letter-spacing="1">DATA & REALTIME LAYER</text>`;

  svg += drawBox({ x: 920, y: 150, w: 220, h: 100, title: 'Redis 7+ Store', subtitle: 'BullMQ State & Pub/Sub', color: '#ef4444' });
  svg += drawBox({ x: 920, y: 280, w: 220, h: 110, title: 'MongoDB Database', subtitle: 'Logs, Workspaces, Projects', color: '#10b981' });
  svg += drawBox({ x: 920, y: 420, w: 220, h: 100, title: 'Socket.IO Server', subtitle: 'WebSockets & Room Broadcaster', color: '#06b6d4' });
  svg += drawBox({ x: 920, y: 550, w: 220, h: 90, title: 'Live Dashboard UI', subtitle: 'Next.js 16 + TanStack Query', color: '#38bdf8' });

  // Connections
  svg += drawConnection(240, 195, 320, 195, 'POST /logs (SDK)', 'arrow', '#38bdf8');
  svg += drawConnection(240, 375, 320, 520, 'REST API & WebSockets', 'arrow', '#06b6d4');
  svg += drawConnection(520, 395, 600, 195, 'Enqueue Job', 'arrow-amber', '#f59e0b');
  svg += drawConnection(720, 240, 720, 270, 'Dequeue', 'arrow-emerald', '#10b981');
  svg += drawConnection(840, 320, 920, 335, 'Persist Log', 'arrow-emerald', '#10b981');
  svg += drawConnection(600, 215, 920, 200, 'Queue State', 'arrow-amber', '#f59e0b');
  svg += drawConnection(840, 340, 920, 460, 'Broadcast Event', 'arrow-emerald', '#06b6d4');
  svg += drawConnection(920, 470, 240, 390, 'Realtime Stream', 'arrow', '#06b6d4');

  svg += `</svg>`;
  return svg;
}

// -----------------------------------------------------------------------------
// 2. COMPONENT ARCHITECTURE DIAGRAM
// -----------------------------------------------------------------------------
function generateComponentDiagram() {
  const w = 1300, h = 950;
  let svg = createSvgHeader(w, h, 'LogLens – Component Architecture Diagram', 'Internal software modules, component dependencies, and interaction boundaries');

  // Client SDK Box
  svg += drawBox({ x: 40, y: 100, w: 220, h: 260, title: 'loglens-sdk Module', subtitle: 'npm Client Package', color: '#06b6d4' });
  svg += `<text x="60" y="180" fill="#e2e8f0" font-size="12">• Facade API (info, warn, error)</text>`;
  svg += `<text x="60" y="210" fill="#e2e8f0" font-size="12">• Non-Blocking setImmediate</text>`;
  svg += `<text x="60" y="240" fill="#e2e8f0" font-size="12">• Axios Transport & Retries</text>`;
  svg += `<text x="60" y="270" fill="#e2e8f0" font-size="12">• Silent Crash-Proof Guard</text>`;

  // Express API Components
  svg += `<rect x="300" y="100" width="460" height="390" rx="12" fill="#0f172a" stroke="#6366f1" stroke-width="1.5" />`;
  svg += `<text x="315" y="125" fill="#a5b4fc" font-size="13" font-weight="700">EXPRESS BACKEND CORE (backend/src)</text>`;

  svg += drawBox({ x: 320, y: 145, w: 200, h: 90, title: 'Middleware Pipeline', subtitle: 'Auth, Helmet, CORS, Limits', color: '#6366f1' });
  svg += drawBox({ x: 540, y: 145, w: 200, h: 90, title: 'Controllers Layer', subtitle: 'Auth, Project, Log, Search', color: '#6366f1' });
  svg += drawBox({ x: 320, y: 250, w: 200, h: 90, title: 'Repositories Layer', subtitle: 'MongoDB Data Access Abstraction', color: '#6366f1' });
  svg += drawBox({ x: 540, y: 250, w: 200, h: 90, title: 'Services Layer', subtitle: 'Analytics, Auth, Token Utils', color: '#6366f1' });
  svg += drawBox({ x: 320, y: 355, w: 420, h: 110, title: 'Phase P Producer Subsystem', subtitle: 'log.producer.ts & log.scheduler.ts', color: '#f59e0b' });
  svg += `<text x="340" y="420" fill="#cbd5e1" font-size="12">• enqueueSingleLogJob() & enqueueDelayedAiJob()</text>`;
  svg += `<text x="340" y="445" fill="#cbd5e1" font-size="12">• Pass-by-Reference Payload DTO Validators</text>`;

  // Worker Components
  svg += `<rect x="800" y="100" width="460" height="390" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />`;
  svg += `<text x="815" y="125" fill="#6ee7b7" font-size="13" font-weight="700">BULLMQ WORKER SUBSYSTEM (worker.ts)</text>`;

  svg += drawBox({ x: 820, y: 145, w: 420, h: 100, title: 'Worker Router & Cluster', subtitle: 'log.worker.ts Dispatcher', color: '#10b981' });
  svg += `<text x="840" y="210" fill="#cbd5e1" font-size="12">• Route by Job Name: LOG_SINGLE, AI_ANALYSIS, REPEATABLE</text>`;
  
  svg += drawBox({ x: 820, y: 260, w: 200, h: 100, title: 'Log Ingestion Handler', subtitle: 'Persist Log & Emit Event', color: '#10b981' });
  svg += drawBox({ x: 1040, y: 260, w: 200, h: 100, title: 'AI Anomaly Handler', subtitle: 'Debounced Root Cause AI', color: '#8b5cf6' });
  svg += drawBox({ x: 820, y: 375, w: 420, h: 100, title: 'Scheduled Jobs Handler', subtitle: 'Health Check, Aggregation, Purge', color: '#f59e0b' });

  // Socket Components
  svg += `<rect x="40" y="530" width="420" height="380" rx="12" fill="#0f172a" stroke="#06b6d4" stroke-width="1.5" />`;
  svg += `<text x="55" y="555" fill="#67e8f9" font-size="13" font-weight="700">REALTIME SOCKET SUBSYSTEM (socket/)</text>`;

  svg += drawBox({ x: 60, y: 575, w: 180, h: 90, title: 'Socket Server', subtitle: 'Socket.IO + Auth Guard', color: '#06b6d4' });
  svg += drawBox({ x: 260, y: 575, w: 180, h: 90, title: 'Room Manager', subtitle: 'project:${id} Isolation', color: '#06b6d4' });
  svg += drawBox({ x: 60, y: 680, w: 380, h: 100, title: 'Broadcasters Module', subtitle: 'broadcast.ts & analytics.ts', color: '#06b6d4' });
  svg += `<text x="80" y="745" fill="#cbd5e1" font-size="12">• broadcastNewLog() & broadcastAnalyticsUpdate()</text>`;
  svg += drawBox({ x: 60, y: 795, w: 380, h: 90, title: 'Redis Adapter', subtitle: 'Horizontal Socket Scaling', color: '#ef4444' });

  // Storage Components
  svg += `<rect x="500" y="530" width="760" height="380" rx="12" fill="#0f172a" stroke="#e2e8f0" stroke-width="1.5" />`;
  svg += `<text x="515" y="555" fill="#f8fafc" font-size="13" font-weight="700">PERSISTENCE & FRONTEND DASHBOARD MODULES</text>`;

  svg += drawBox({ x: 520, y: 575, w: 220, h: 150, title: 'MongoDB Schemas', subtitle: 'Mongoose ORM Models', color: '#10b981' });
  svg += `<text x="535" y="640" fill="#cbd5e1" font-size="12">• Log Model (TTL Indexes)</text>`;
  svg += `<text x="535" y="665" fill="#cbd5e1" font-size="12">• Workspace & Project Models</text>`;
  svg += `<text x="535" y="690" fill="#cbd5e1" font-size="12">• ApiKey Model (Hashed Keys)</text>`;

  svg += drawBox({ x: 760, y: 575, w: 220, h: 150, title: 'Redis Cache & Queue', subtitle: 'ioredis Client', color: '#ef4444' });
  svg += `<text x="775" y="640" fill="#cbd5e1" font-size="12">• BullMQ Queue Streams</text>`;
  svg += `<text x="775" y="665" fill="#cbd5e1" font-size="12">• Delayed Job ZSETs</text>`;
  svg += `<text x="775" y="690" fill="#cbd5e1" font-size="12">• Pub/Sub Channels</text>`;

  svg += drawBox({ x: 1000, y: 575, w: 240, h: 310, title: 'Next.js 16 Web Dashboard', subtitle: 'frontend/src', color: '#38bdf8' });
  svg += `<text x="1015" y="640" fill="#cbd5e1" font-size="12">• Zustand Global State</text>`;
  svg += `<text x="1015" y="670" fill="#cbd5e1" font-size="12">• TanStack Query Hooks</text>`;
  svg += `<text x="1015" y="700" fill="#cbd5e1" font-size="12">• Socket.IO Realtime Hook</text>`;
  svg += `<text x="1015" y="730" fill="#cbd5e1" font-size="12">• Recharts Metrics Panel</text>`;
  svg += `<text x="1015" y="760" fill="#cbd5e1" font-size="12">• Tailwind CSS & Lucide</text>`;

  // Connections
  svg += drawConnection(260, 195, 320, 190, 'Ingest Payload', 'arrow', '#06b6d4');
  svg += drawConnection(740, 410, 820, 195, 'BullMQ Job', 'arrow-amber', '#f59e0b');
  svg += drawConnection(920, 360, 630, 575, 'Save Log', 'arrow-emerald', '#10b981');
  svg += drawConnection(920, 360, 250, 680, 'Trigger Broadcast', 'arrow-emerald', '#06b6d4');
  svg += drawConnection(440, 730, 1000, 730, 'WebSocket Push', 'arrow', '#06b6d4');

  svg += `</svg>`;
  return svg;
}

// -----------------------------------------------------------------------------
// 3. DEPLOYMENT ARCHITECTURE DIAGRAM
// -----------------------------------------------------------------------------
function generateDeploymentDiagram() {
  const w = 1200, h = 850;
  let svg = createSvgHeader(w, h, 'LogLens – Deployment Architecture Diagram', 'Physical infrastructure, Docker container topologies, cloud databases, and network ports');

  // Client Realm
  svg += `<rect x="40" y="100" width="220" height="700" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4,4" />`;
  svg += `<text x="55" y="125" fill="#38bdf8" font-size="13" font-weight="700">CLIENT ENVIRONMENT</text>`;

  svg += drawBox({ x: 60, y: 150, w: 180, h: 120, title: 'External App Server', subtitle: 'Runs SDK Client Package', color: '#38bdf8' });
  svg += `<text x="75" y="220" fill="#cbd5e1" font-size="11">• Node.js / Express Host</text>`;
  svg += `<text x="75" y="240" fill="#cbd5e1" font-size="11">• Outbound Port 5000</text>`;

  svg += drawBox({ x: 60, y: 320, w: 180, h: 140, title: 'Web Dashboard', subtitle: 'Browser Client (Port 3000)', color: '#38bdf8' });
  svg += `<text x="75" y="390" fill="#cbd5e1" font-size="11">• Next.js 16 App Router</text>`;
  svg += `<text x="75" y="410" fill="#cbd5e1" font-size="11">• React 19 SPA</text>`;
  svg += `<text x="75" y="430" fill="#cbd5e1" font-size="11">• Socket.IO Client</text>`;

  // Server Host / Docker Compose Realm
  svg += `<rect x="300" y="100" width="560" height="700" rx="12" fill="#0f172a" stroke="#6366f1" stroke-width="1.5" />`;
  svg += `<text x="315" y="125" fill="#a5b4fc" font-size="13" font-weight="700">APPLICATION SERVER HOST (Docker / Node Cluster)</text>`;

  // Container 1: API Server
  svg += `<rect x="320" y="150" width="520" height="230" rx="10" fill="#1e293b" stroke="#6366f1" stroke-width="1.5" />`;
  svg += `<text x="335" y="175" fill="#f8fafc" font-size="14" font-weight="600">Container 1: LogLens Express API (Port 5000)</text>`;
  svg += drawBox({ x: 340, y: 190, w: 230, h: 170, title: 'API Gateway Process', subtitle: 'index.ts / app.ts', color: '#6366f1' });
  svg += `<text x="355" y="260" fill="#cbd5e1" font-size="11">• Express HTTP Ingestion</text>`;
  svg += `<text x="355" y="280" fill="#cbd5e1" font-size="11">• JWT & API Key Auth</text>`;
  svg += `<text x="355" y="300" fill="#cbd5e1" font-size="11">• Rate Limiting Guard</text>`;
  svg += `<text x="355" y="320" fill="#cbd5e1" font-size="11">• Bull Board UI (/admin/queues)</text>`;

  svg += drawBox({ x: 590, y: 190, w: 230, h: 170, title: 'Socket.IO Server', subtitle: 'WebSocket Endpoint', color: '#06b6d4' });
  svg += `<text x="605" y="260" fill="#cbd5e1" font-size="11">• WebSockets (ws://...)</text>`;
  svg += `<text x="605" y="280" fill="#cbd5e1" font-size="11">• Room Isolation</text>`;
  svg += `<text x="605" y="300" fill="#cbd5e1" font-size="11">• CORS Origin Guard</text>`;

  // Container 2: Worker Process
  svg += `<rect x="320" y="410" width="520" height="230" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5" />`;
  svg += `<text x="335" y="435" fill="#f8fafc" font-size="14" font-weight="600">Container 2: Standalone BullMQ Worker (worker.ts)</text>`;
  svg += drawBox({ x: 340, y: 450, w: 230, h: 170, title: 'Log Worker Process', subtitle: 'Clustered Node Workers', color: '#10b981' });
  svg += `<text x="355" y="520" fill="#cbd5e1" font-size="11">• BullMQ Queue Listener</text>`;
  svg += `<text x="355" y="540" fill="#cbd5e1" font-size="11">• Concurrency: 5 Jobs</text>`;
  svg += `<text x="355" y="560" fill="#cbd5e1" font-size="11">• MongoDB Writer</text>`;

  svg += drawBox({ x: 590, y: 450, w: 230, h: 170, title: 'AI & Schedulers', subtitle: 'Background Tasks', color: '#8b5cf6' });
  svg += `<text x="605" y="520" fill="#cbd5e1" font-size="11">• Debounced AI Anomaly</text>`;
  svg += `<text x="605" y="540" fill="#cbd5e1" font-size="11">• Health Check Cron</text>`;
  svg += `<text x="605" y="560" fill="#cbd5e1" font-size="11">• Daily Retention Purge</text>`;

  // Databases & Infrastructure Realm
  svg += `<rect x="900" y="100" width="260" height="700" rx="12" fill="#0f172a" stroke="#ef4444" stroke-width="1.5" />`;
  svg += `<text x="915" y="125" fill="#fca5a5" font-size="13" font-weight="700">DATA INFRASTRUCTURE</text>`;

  svg += drawBox({ x: 920, y: 150, w: 220, h: 220, title: 'Redis 7 Container', subtitle: 'Port 6379 (docker-compose)', color: '#ef4444' });
  svg += `<text x="935" y="225" fill="#cbd5e1" font-size="12">• Queue Streams & ZSETs</text>`;
  svg += `<text x="935" y="250" fill="#cbd5e1" font-size="12">• AOF Persistence</text>`;
  svg += `<text x="935" y="275" fill="#cbd5e1" font-size="12">• Pub/Sub Broadcast Adapter</text>`;
  svg += `<text x="935" y="300" fill="#cbd5e1" font-size="12">• Memory Limit: 512MB</text>`;

  svg += drawBox({ x: 920, y: 410, w: 220, h: 250, title: 'MongoDB Atlas / Local', subtitle: 'Port 27017 (Mongo 6+)', color: '#10b981' });
  svg += `<text x="935" y="485" fill="#cbd5e1" font-size="12">• Log Collection (Indexed)</text>`;
  svg += `<text x="935" y="510" fill="#cbd5e1" font-size="12">• Workspaces & Projects</text>`;
  svg += `<text x="935" y="535" fill="#cbd5e1" font-size="12">• User Credentials & Keys</text>`;
  svg += `<text x="935" y="560" fill="#cbd5e1" font-size="12">• Compound Indexing</text>`;
  svg += `<text x="935" y="585" fill="#cbd5e1" font-size="12">• Automated TTL Purge</text>`;

  // Network Connections
  svg += drawConnection(240, 210, 340, 240, 'HTTP POST :5000', 'arrow', '#38bdf8');
  svg += drawConnection(240, 390, 590, 240, 'WebSockets :5000', 'arrow', '#06b6d4');
  svg += drawConnection(570, 270, 920, 240, 'Enqueue Job', 'arrow-amber', '#f59e0b');
  svg += drawConnection(920, 270, 570, 500, 'Dequeue Job', 'arrow-amber', '#10b981');
  svg += drawConnection(570, 540, 920, 500, 'Write Log Doc', 'arrow-emerald', '#10b981');
  svg += drawConnection(570, 510, 705, 360, 'Emit Socket Event', 'arrow', '#06b6d4');

  svg += `</svg>`;
  return svg;
}

// -----------------------------------------------------------------------------
// 4. SEQUENCE DIAGRAM
// -----------------------------------------------------------------------------
function generateSequenceDiagram() {
  const w = 1200, h = 900;
  let svg = createSvgHeader(w, h, 'LogLens – Sequence Diagram', 'End-to-end message flow for asynchronous log ingestion, queue processing, and real-time broadcast');

  const lifelines = [
    { id: 'sdk', name: 'LogLens SDK', subtitle: 'External App', x: 100, color: '#38bdf8' },
    { id: 'api', name: 'Express API', subtitle: 'Ingestion Gateway', x: 280, color: '#6366f1' },
    { id: 'queue', name: 'BullMQ / Redis', subtitle: 'Job Queue', x: 460, color: '#f59e0b' },
    { id: 'worker', name: 'Log Worker', subtitle: 'Background Process', x: 640, color: '#10b981' },
    { id: 'mongo', name: 'MongoDB', subtitle: 'Database', x: 820, color: '#10b981' },
    { id: 'socket', name: 'Socket.IO', subtitle: 'Realtime Server', x: 1000, color: '#06b6d4' },
  ];

  // Draw Lifelines
  lifelines.forEach(l => {
    svg += drawBox({ x: l.x - 70, y: 100, w: 140, h: 50, title: l.name, subtitle: l.subtitle, color: l.color });
    svg += `<line x1="${l.x}" y1="150" x2="${l.x}" y2="820" stroke="${l.color}" stroke-width="1.5" stroke-dasharray="4,4" />`;
    svg += drawBox({ x: l.x - 70, y: 820, w: 140, h: 40, title: l.name, color: l.color });
  });

  function drawSeqMsg(fromIdx, toIdx, y, label, color = '#38bdf8', dash = false) {
    const x1 = lifelines[fromIdx].x;
    const x2 = lifelines[toIdx].x;
    const dashAttr = dash ? 'stroke-dasharray="4,4"' : '';
    const midX = (x1 + x2) / 2;
    
    return `
      <g>
        <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="2" ${dashAttr} marker-end="url(#arrow)" />
        <rect x="${midX - (label.length * 3.5 + 6)}" y="${y - 12}" width="${label.length * 7 + 12}" height="20" rx="4" fill="#0f172a" stroke="${PALETTE.cardBorder}" stroke-width="1"/>
        <text x="${midX}" y="${y + 2}" fill="${PALETTE.textPrimary}" font-size="11" font-weight="500" text-anchor="middle">${label}</text>
      </g>
    `;
  }

  let currY = 190;
  svg += drawSeqMsg(0, 1, currY, '1. POST /api/v1/logs (X-API-Key)', '#38bdf8');
  currY += 45;
  svg += drawSeqMsg(1, 1, currY, '2. validateApiKey() Middleware', '#a5b4fc');
  currY += 45;
  svg += drawSeqMsg(1, 2, currY, '3. enqueueSingleLogJob(payload)', '#f59e0b');
  currY += 45;
  svg += drawSeqMsg(2, 1, currY, '4. Job ID Registered (<5ms)', '#f59e0b', true);
  currY += 45;
  svg += drawSeqMsg(1, 0, currY, '5. HTTP 202 Accepted { success: true }', '#10b981', true);
  
  currY += 60;
  // Execution Box
  svg += `<rect x="420" y="${currY - 15}" width="600" height="280" rx="8" fill="#1e293b" fill-opacity="0.4" stroke="#10b981" stroke-width="1" stroke-dasharray="6,6" />`;
  svg += `<text x="435" y="${currY}" fill="#6ee7b7" font-size="12" font-weight="700">Async Background Processing (Phase P Pipeline)</text>`;
  
  currY += 30;
  svg += drawSeqMsg(3, 2, currY, '6. Dequeue Next Job Payload', '#10b981');
  currY += 45;
  svg += drawSeqMsg(3, 3, currY, '7. validateLogJobPayload()', '#6ee7b7');
  currY += 45;
  svg += drawSeqMsg(3, 4, currY, '8. findById(projectId) & createLog()', '#10b981');
  currY += 45;
  svg += drawSeqMsg(4, 3, currY, '9. Created Log Document', '#10b981', true);
  currY += 45;
  svg += drawSeqMsg(3, 5, currY, '10. broadcastNewLog(projectId, log)', '#06b6d4');

  currY += 75;
  svg += drawSeqMsg(5, 5, currY, '11. Socket.IO Room Push ("log:new")', '#06b6d4');
  currY += 45;
  svg += drawSeqMsg(3, 2, currY, '12. updateProgress(100) -> Completed', '#10b981');

  svg += `</svg>`;
  return svg;
}

// -----------------------------------------------------------------------------
// 5. DATA FLOW DIAGRAM (DFD)
// -----------------------------------------------------------------------------
function generateDataFlowDiagram() {
  const w = 1250, h = 900;
  let svg = createSvgHeader(w, h, 'LogLens – Level 1 Data Flow Diagram (DFD)', 'Data sources, processing transformations, data stores, and data sinks');

  // External Entities
  svg += drawBox({ x: 40, y: 200, w: 180, h: 100, title: 'External App (SDK)', subtitle: 'Log Data Producer', color: '#38bdf8' });
  svg += drawBox({ x: 40, y: 550, w: 180, h: 100, title: 'Web Dashboard User', subtitle: 'Log Viewer / Admin', color: '#38bdf8' });

  // DFD Processes (Circles / Rounded Rects)
  function drawProcess(x, y, id, name, sub) {
    return `
      <g filter="url(#dropShadow)">
        <rect x="${x}" y="${y}" width="190" height="90" rx="20" fill="#1e293b" stroke="${PALETTE.primary}" stroke-width="2" />
        <rect x="${x + 10}" y="${y + 10}" width="35" height="24" rx="6" fill="#312e81" />
        <text x="${x + 27}" y="${y + 26}" fill="#a5b4fc" font-size="12" font-weight="700" text-anchor="middle">${id}</text>
        <text x="${x + 55}" y="${y + 27}" fill="${PALETTE.textPrimary}" font-size="13" font-weight="600">${name}</text>
        <text x="${x + 15}" y="${y + 60}" fill="${PALETTE.textSecondary}" font-size="11">${sub}</text>
      </g>
    `;
  }

  svg += drawProcess(300, 150, '1.0', 'Authenticate API', 'Verify Key & Project');
  svg += drawProcess(300, 320, '2.0', 'Enqueue Job', 'Fast HTTP 202 Ingest');
  svg += drawProcess(600, 320, '3.0', 'Process Queue Job', 'Validation & Storage');
  svg += drawProcess(600, 550, '4.0', 'Aggregate Analytics', 'Pre-compute Metrics');
  svg += drawProcess(900, 320, '5.0', 'Broadcast Realtime', 'Socket.IO Room Stream');
  svg += drawProcess(900, 550, '6.0', 'Search & Query', 'Filter Logs & Metrics');

  // Data Stores (Open Ended Rectangles)
  function drawDataStore(x, y, id, name) {
    return `
      <g filter="url(#dropShadow)">
        <rect x="${x}" y="${y}" width="220" height="60" rx="4" fill="#0f172a" stroke="#10b981" stroke-width="2" />
        <line x1="${x + 45}" y1="${y}" x2="${x + 45}" y2="${y + 60}" stroke="#10b981" stroke-width="2" />
        <text x="${x + 22}" y="${y + 36}" fill="#6ee7b7" font-size="13" font-weight="700" text-anchor="middle">${id}</text>
        <text x="${x + 60}" y="${y + 36}" fill="${PALETTE.textPrimary}" font-size="13" font-weight="600">${name}</text>
      </g>
    `;
  }

  svg += drawDataStore(585, 165, 'D1', 'Redis Queue & Pub/Sub Store');
  svg += drawDataStore(585, 730, 'D2', 'MongoDB Logs & Workspace Store');

  // Data Flow Arrows
  svg += drawConnection(220, 250, 300, 195, 'Log Request Payload', 'arrow', '#38bdf8');
  svg += drawConnection(395, 240, 395, 320, 'Validated Log Context', 'arrow', '#6366f1');
  svg += drawConnection(490, 365, 585, 195, 'Enqueue Job Payload', 'arrow-amber', '#f59e0b');
  svg += drawConnection(695, 225, 695, 320, 'Pop Job Payload', 'arrow-amber', '#10b981');
  svg += drawConnection(695, 410, 695, 730, 'Write Log Record', 'arrow-emerald', '#10b981');
  svg += drawConnection(790, 365, 900, 365, 'Emit Event Payload', 'arrow', '#06b6d4');
  svg += drawConnection(995, 410, 220, 580, 'Push Live Stream', 'arrow', '#06b6d4');

  svg += drawConnection(220, 600, 900, 595, 'Query Request (Filters)', 'arrow', '#38bdf8');
  svg += drawConnection(995, 640, 695, 730, 'Read Logs & Aggregates', 'arrow-emerald', '#10b981');

  svg += `</svg>`;
  return svg;
}

// -----------------------------------------------------------------------------
// HTML INTERACTIVE DIAGRAM VIEWER GENERATOR
// -----------------------------------------------------------------------------
function generateHtmlViewer() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LogLens Architecture Diagrams Suite</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --border: #1f2937;
      --primary: #6366f1;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    header {
      background-color: #0f172a;
      border-bottom: 1px solid var(--border);
      padding: 16px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      color: #fff;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 14px;
    }
    h1 { font-size: 20px; font-weight: 700; }
    .subtitle { font-size: 13px; color: var(--text-muted); }
    
    .nav-tabs {
      display: flex;
      gap: 8px;
      background-color: #0f172a;
      padding: 12px 32px;
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 10px 18px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background-color: #1e293b;
      color: var(--text);
    }
    .tab-btn.active {
      background-color: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    
    main {
      flex: 1;
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .diagram-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .diagram-header {
      padding: 16px 24px;
      background-color: #1e293b;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .diagram-title { font-size: 16px; font-weight: 700; color: #f8fafc; }
    .diagram-desc { font-size: 13px; color: var(--text-muted); }
    
    .actions { display: flex; gap: 10px; }
    .action-btn {
      background-color: #334155;
      color: #fff;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    }
    .action-btn:hover { background-color: #475569; }

    .diagram-container {
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: auto;
      background-color: #0b0f19;
      min-height: 600px;
    }
    .diagram-container svg {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    
    footer {
      padding: 16px 32px;
      background-color: #0f172a;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <header>
    <div class="logo-group">
      <span class="logo-badge">LOGLENS</span>
      <div>
        <h1>Architecture Diagrams Suite</h1>
        <p class="subtitle">Interactive visual reference for LogLens log monitoring & distributed queue platform</p>
      </div>
    </div>
    <div>
      <span class="subtitle">Auto-updated via <code>npm run update-diagrams</code></span>
    </div>
  </header>

  <div class="nav-tabs">
    <button class="tab-btn active" onclick="showDiagram('conceptual')">1. Conceptual Architecture</button>
    <button class="tab-btn" onclick="showDiagram('component')">2. Component Architecture</button>
    <button class="tab-btn" onclick="showDiagram('deployment')">3. Deployment Architecture</button>
    <button class="tab-btn" onclick="showDiagram('sequence')">4. Sequence Flow</button>
    <button class="tab-btn" onclick="showDiagram('dfd')">5. Data Flow Diagram (DFD)</button>
  </div>

  <main>
    <div class="diagram-card">
      <div class="diagram-header">
        <div>
          <h2 id="diagTitle" class="diagram-title">Conceptual Architecture Diagram</h2>
          <p id="diagDesc" class="diagram-desc">High-level overview of system boundaries, ingest pipelines, and external entities</p>
        </div>
        <div class="actions">
          <a id="downloadBtn" href="conceptual-architecture.svg" download class="action-btn">Download SVG</a>
          <a id="rawBtn" href="conceptual-architecture.svg" target="_blank" class="action-btn">Open Fullscreen</a>
        </div>
      </div>
      <div class="diagram-container" id="svgContainer">
        <!-- SVG content dynamically loaded -->
      </div>
    </div>
  </main>

  <footer>
    LogLens Systems Architecture • Production Observability Platform • Built with Node.js, Express, BullMQ, Redis, MongoDB & Next.js 16
  </footer>

  <script>
    const diagrams = {
      conceptual: {
        title: "Conceptual Architecture Diagram",
        desc: "High-level overview of system boundaries, ingest pipelines, processing modules, and external actors",
        file: "conceptual-architecture.svg"
      },
      component: {
        title: "Component Architecture Diagram",
        desc: "Internal software modules, component dependencies, and interaction boundaries",
        file: "component-architecture.svg"
      },
      deployment: {
        title: "Deployment Architecture Diagram",
        desc: "Physical infrastructure, Docker container topologies, cloud databases, and network ports",
        file: "deployment-architecture.svg"
      },
      sequence: {
        title: "Sequence Diagram",
        desc: "End-to-end message flow for asynchronous log ingestion, queue processing, and real-time broadcast",
        file: "sequence-diagram.svg"
      },
      dfd: {
        title: "Data Flow Diagram (Level 1 DFD)",
        desc: "Data sources, processing transformations, data stores, and data sinks",
        file: "data-flow-diagram.svg"
      }
    };

    async function showDiagram(key) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');

      const info = diagrams[key];
      document.getElementById('diagTitle').textContent = info.title;
      document.getElementById('diagDesc').textContent = info.desc;
      document.getElementById('downloadBtn').href = info.file;
      document.getElementById('rawBtn').href = info.file;

      try {
        const resp = await fetch(info.file);
        const svgText = await resp.text();
        document.getElementById('svgContainer').innerHTML = svgText;
      } catch (err) {
        document.getElementById('svgContainer').innerHTML = '<p style="color: #ef4444;">Failed to load diagram SVG.</p>';
      }
    }

    // Load initial diagram
    window.addEventListener('DOMContentLoaded', () => {
      showDiagram('conceptual');
    });
  </script>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// MAIN BUILD SCRIPT EXECUTOR
// -----------------------------------------------------------------------------
function buildDiagramsSuite() {
  console.log('⚡ Generating LogLens Architecture Diagrams Suite...');

  if (!fs.existsSync(ARCH_DIR)) {
    fs.mkdirSync(ARCH_DIR, { recursive: true });
  }

  const conceptualSvg = generateConceptualDiagram();
  const componentSvg = generateComponentDiagram();
  const deploymentSvg = generateDeploymentDiagram();
  const sequenceSvg = generateSequenceDiagram();
  const dfdSvg = generateDataFlowDiagram();
  const viewerHtml = generateHtmlViewer();

  fs.writeFileSync(path.join(ARCH_DIR, 'conceptual-architecture.svg'), conceptualSvg, 'utf-8');
  fs.writeFileSync(path.join(ARCH_DIR, 'component-architecture.svg'), componentSvg, 'utf-8');
  fs.writeFileSync(path.join(ARCH_DIR, 'deployment-architecture.svg'), deploymentSvg, 'utf-8');
  fs.writeFileSync(path.join(ARCH_DIR, 'sequence-diagram.svg'), sequenceSvg, 'utf-8');
  fs.writeFileSync(path.join(ARCH_DIR, 'data-flow-diagram.svg'), dfdSvg, 'utf-8');
  fs.writeFileSync(path.join(ARCH_DIR, 'index.html'), viewerHtml, 'utf-8');

  // Create diagrams.json metadata model
  const diagramsMeta = {
    updatedAt: new Date().toISOString(),
    version: "1.0.0",
    diagrams: [
      { name: "Conceptual Architecture", file: "conceptual-architecture.svg" },
      { name: "Component Architecture", file: "component-architecture.svg" },
      { name: "Deployment Architecture", file: "deployment-architecture.svg" },
      { name: "Sequence Diagram", file: "sequence-diagram.svg" },
      { name: "Data Flow Diagram", file: "data-flow-diagram.svg" }
    ]
  };
  fs.writeFileSync(DIAGRAMS_JSON_PATH, JSON.stringify(diagramsMeta, null, 2), 'utf-8');

  console.log('✅ Successfully generated all 5 SVG diagrams, index.html viewer, and diagrams.json model in docs/architecture/!');
}

if (require.main === module) {
  buildDiagramsSuite();
}

module.exports = { buildDiagramsSuite };
