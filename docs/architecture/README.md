# LogLens Architecture Diagrams Suite

This directory contains the **5 Core Visual Architecture Diagrams** for the LogLens Platform, rendered in standalone vector SVG format alongside an interactive web-based diagram viewer.

---

## 🎨 Included Diagrams

1. **Conceptual Architecture Diagram** (`conceptual-architecture.svg`)
   - High-level overview of system boundaries, ingestion pipelines, processing modules, and external entities.
2. **Component Architecture Diagram** (`component-architecture.svg`)
   - Internal software modules, Express controllers, repositories, BullMQ producer/worker modules, Socket.IO rooms, and Mongoose schemas.
3. **Deployment Architecture Diagram** (`deployment-architecture.svg`)
   - Physical infrastructure layout depicting Web Browsers, Express API Container (Port 5000), Standalone BullMQ Worker process, Redis 7 Container (Port 6379), and MongoDB Database.
4. **Sequence Diagram** (`sequence-diagram.svg`)
   - End-to-end message flow for asynchronous log ingestion (HTTP 202 Accepted), BullMQ Redis queue processing, MongoDB persistence, and Socket.IO real-time broadcasting.
5. **Data Flow Diagram (Level 1 DFD)** (`data-flow-diagram.svg`)
   - Level 1 DFD depicting Data Sources, Processes (1.0 - 6.0), Data Stores (D1: Redis, D2: MongoDB), and Data Destinations.

---

## 🖥️ Viewing the Diagrams

### Option 1: Interactive HTML Viewer (Recommended)
Open `index.html` in any web browser:
```bash
# On Linux
xdg-open docs/architecture/index.html

# On macOS
open docs/architecture/index.html
```
The viewer provides tabbed switching, high-resolution rendering, fullscreen mode, and instant SVG downloading.

### Option 2: Standalone SVG Files
You can open any `.svg` file directly in any image viewer, browser, or IDE previewer:
- [conceptual-architecture.svg](file:///media/tharun-varshan-s/passport/SRI%20ESHWAR%20COLLEGE%20%20OF%20ENGINEERING/SECE%203RD%20YEAR/5TH%20SEM/PROJECT/loglens/docs/architecture/conceptual-architecture.svg)
- [component-architecture.svg](file:///media/tharun-varshan-s/passport/SRI%20ESHWAR%20COLLEGE%20%20OF%20ENGINEERING/SECE%203RD%20YEAR/5TH%20SEM/PROJECT/loglens/docs/architecture/component-architecture.svg)
- [deployment-architecture.svg](file:///media/tharun-varshan-s/passport/SRI%20ESHWAR%20COLLEGE%20%20OF%20ENGINEERING/SECE%203RD%20YEAR/5TH%20SEM/PROJECT/loglens/docs/architecture/deployment-architecture.svg)
- [sequence-diagram.svg](file:///media/tharun-varshan-s/passport/SRI%20ESHWAR%20COLLEGE%20%20OF%20ENGINEERING/SECE%203RD%20YEAR/5TH%20SEM/PROJECT/loglens/docs/architecture/sequence-diagram.svg)
- [data-flow-diagram.svg](file:///media/tharun-varshan-s/passport/SRI%20ESHWAR%20COLLEGE%20%20OF%20ENGINEERING/SECE%203RD%20YEAR/5TH%20SEM/PROJECT/loglens/docs/architecture/data-flow-diagram.svg)

---

## 🔄 Updating Diagrams When Project Changes

Whenever project architecture, components, or routes are updated, run the automated upgrade command from the project root:

```bash
npm run update-diagrams
```
Or run the Node.js generator directly:
```bash
node docs/architecture/update-diagrams.js
```
This regenerates all 5 SVG vector files and updates `index.html` instantly.
