# eRoute: Intelligent Student Mobility Ecosystem

eRoute is a modern, full-stack Android application designed to streamline student transportation through digital pass issuance, real-time verification, and centralized administrative control.

## 🚀 Features

- **Multi-Role Gateways**: Dedicated dashboards for Students, College Admins, Transport Officers, and Bus Conductors.
- **Digital Pass Lifecycle**: Complete workflow from application submission to QR-based issuance.
- **Real-Time Synchronization**: Hybrid architecture using local Room SQLite for persistence and Firebase Realtime Database for cloud sync.
- **Security Handshake**: Role-based authentication and secure ledger simulation.
- **Modern Startup UI**: High-fidelity dark mode interface with immersive Edge-to-Edge layouts.

## 📊 Project Verification & Reports

This repository includes comprehensive validation reports ensuring 100% functional readiness:

- **Frontend Test Suite**: [View Frontend Reports](./ErouteTest/reports/Frontend_Test_Results.xls) - 100/100 UI/UX Test Cases PASSED.
- **Backend Test Suite**: [View Backend Reports](./ErouteTest/reports/Backend_Test_Results.xls) - 100/100 Logic & Database Test Cases PASSED.
- **Security Audit**: [Executive Summary](./Vulnerability%20Test%20Results/Summary.md) & [Detailed Findings](./Vulnerability%20Test%20Results/Security_Audit_Findings.md) by Senior AppSec Engineer.

## 🛠 Tech Stack

- **Platform**: Android (Native Java)
- **Local Database**: Room Persistence Library
- **Cloud Backend**: Firebase Realtime Database
- **Automation**: GitHub Actions (DevSecOps Pipeline)
- **UI Architecture**: XML with ConstraintLayout and Material Design 3

## 🔒 Security Review

The project has undergone a full SAST (Static Application Security Testing) and DAST (Dynamic Application Security Testing) review. Automated security scans are integrated into the GitHub Actions tab to ensure continuous code health.

---
*Created for SAVETHA SCHOOL OF ENGINEERING (SSE) - Final Year Project Submission.*
