# 🚌 eRoute — Smart Campus Transport & Digital Bus Pass Platform

[![Web E2E Pipeline](https://github.com/ReviThimmaReddy/Eroute/actions/workflows/web-e2e.yml/badge.svg)](https://github.com/ReviThimmaReddy/Eroute/actions/workflows/web-e2e.yml)
[![Mobile Appium Pipeline](https://github.com/ReviThimmaReddy/Eroute/actions/workflows/mobile-e2e.yml/badge.svg)](https://github.com/ReviThimmaReddy/Eroute/actions/workflows/mobile-e2e.yml)
[![k6 Load Test Pipeline](https://github.com/ReviThimmaReddy/Eroute/actions/workflows/load-test.yml/badge.svg)](https://github.com/ReviThimmaReddy/Eroute/actions/workflows/load-test.yml)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.5-119EFF?logo=capacitor)](https://capacitorjs.com/)

**eRoute** is an enterprise-grade Smart Campus Transportation and Digital Bus Pass Management System. It streamlines bus route planning, digital pass generation, real-time GPS telemetry, conductor QR verification, role-based access control (RBAC), and automated attendance analytics.

---

## 🌟 Key Features

### 👑 Admin Management Portal
- **Interactive Fleet Dashboard**: Real-time KPI summary cards, live bus map view, active alerts, and attendance graphs.
- **Bus & Route Management**: Dynamic route waypoint ordering, fare zone linkage, stop radius buffering, and batch upload.
- **Staff & Conductor RBAC**: Role-based access controls, driver assignments, contact validation, and audit logging.
- **Pass Approval Workflow**: Digital bus pass review, pricing matrix, tier discounts, rejection reasoning, and automated PDF export.
- **Telemetry & Safety**: Live GPS feeds, speed limit alerts, geofencing, ETA calculations, and trip playback.

### 🎓 Student Mobile & Web Portal
- **Digital Bus Pass**: Instant QR code generation with anti-fraud encryption and expiry tracking.
- **Live Bus Tracking**: Real-time interactive map views of assigned campus routes and stop sequences.
- **Trip History & Feedback**: Historical scan records and direct feedback submission.

### 🎟️ Conductor Mobile Verification
- **High-Speed QR Scanner**: Instant offline-capable QR scanner with pass validation.
- **Trip Control & Offline Queue**: Start/stop trip feeds and automated offline validation queue sync.

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
| --- | --- |
| **Core Framework** | React 19, TypeScript 6, Vite 8, React Router v7 |
| **UI Components & Maps** | Material-UI (MUI v9), Leaflet, React-Leaflet, Google Maps API |
| **Data & Charts** | Chart.js, React-ChartJS-2 |
| **Backend & Auth** | Firebase 12 (Authentication & Firestore) |
| **Mobile Integration** | Capacitor 8 (Android Native Container) |
| **Automation & E2E Testing** | Selenium WebDriver, Appium 2, Mocha, Chai, k6 |
| **Reporting & Export** | ExcelJS, JSPDF, JSPDF-AutoTable, HTML5 QR Scanner |
| **Linter & Tooling** | Oxlint |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ReviThimmaReddy/Eroute.git
   cd Eroute/website
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:5173`.

4. **Production Build & Preview**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🧪 E2E Automated Testing & Excel Reporting

eRoute features two standalone, enterprise test automation suites with built-in Excel analysis and visual HTML report generators:

### 🌐 1. Web Selenium E2E Suite (1,100 Test Cases)
Validates 110 categories across Web UI, RBAC, Admin workflows, Pass approval, and Security features.

```bash
cd ErouteE2E
npm install
npm test
```
- **Generated Reports**:
  - `ErouteE2E/selenium-report.xlsx` (Aggregated metrics & granular test case detail)
  - `ErouteE2E/execution-report.html` (Interactive HTML Execution Dashboard)

### 📱 2. Mobile Appium E2E Suite (1,111 Android Tests)
Validates 11 Android mobile categories covering Navigation, Digital Pass, QR Scanner, Conductor View, and Offline Sync.

```bash
cd ErouteAppium
npm install
npm test
```
- **Generated Reports**:
  - `ErouteAppium/appium-report.xlsx` (Multi-tab Excel metric analysis)
  - `ErouteAppium/execution-report.html` (Interactive HTML Execution Dashboard)

### 📊 3. k6 Baseline Load Testing
Performs baseline API load testing with 100 Virtual Users (VUs) and exports Excel summaries.

```bash
npm run load-test
npm run load-test:parse
```

---

## 🔄 CI/CD Pipelines (GitHub Actions)

The repository includes three automated GitHub Actions workflows under `.github/workflows/`:

- **[`web-e2e.yml`](.github/workflows/web-e2e.yml)**: Builds web frontend, starts Vite preview server with HTTP health check loops, runs Web Selenium E2E suite, generates `$GITHUB_STEP_SUMMARY`, and uploads Excel/HTML report artifacts.
- **[`mobile-e2e.yml`](.github/workflows/mobile-e2e.yml)**: Executes Mobile Appium E2E suite, generates step summaries, and uploads Excel/HTML report artifacts.
- **[`load-test.yml`](.github/workflows/load-test.yml)**: Runs k6 load testing, parses metric summaries, and uploads load test Excel artifacts.

---

## 📁 Repository Structure

```text
Eroute/
├── website/
│   ├── .github/workflows/   # GitHub Actions Workflows (web-e2e, mobile-e2e, load-test)
│   ├── android/             # Capacitor Android Native Project
│   ├── ErouteE2E/           # Web Selenium E2E Test Suite (1,100 Tests)
│   ├── ErouteAppium/        # Mobile Appium E2E Test Suite (1,111 Tests)
│   ├── public/              # Static Web Assets
│   ├── scripts/             # k6 Load Testing & Summary Parsers
│   ├── src/                 # React 19 + TypeScript Source Code
│   │   ├── components/      # Shared UI Components
│   │   ├── context/         # Auth & Theme Context Providers
│   │   ├── pages/           # Admin, Student, Conductor, Driver Portals
│   │   └── services/        # Firebase & Firestore Service Layer
│   ├── package.json         # Project Dependencies & NPM Scripts
│   └── vite.config.ts       # Vite Configuration
└── README.md                # Project Documentation
```

---

## 📄 License
This project is licensed under the MIT License.

