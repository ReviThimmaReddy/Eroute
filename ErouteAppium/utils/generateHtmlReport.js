import fs from 'fs';
import path from 'path';

export function generateHtmlReport(testResults, outputPath = 'execution-report.html') {
  const total = testResults.length;
  const passed = testResults.filter((t) => t.status === 'PASSED').length;
  const failed = total - passed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

  const rowsHtml = testResults.map((t, idx) => `
    <tr class="${t.status.toLowerCase()}">
      <td>${idx + 1}</td>
      <td><span class="badge category-badge">${t.category}</span></td>
      <td class="test-desc">${t.testName}</td>
      <td><span class="badge status-badge ${t.status.toLowerCase()}">${t.status}</span></td>
      <td>${t.duration} ms</td>
    </tr>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Appium Mobile E2E Execution Report — Eroute</title>
  <style>
    :root {
      --bg: #0b1329;
      --card-bg: #1c2541;
      --text: #edf2f4;
      --accent: #48cae4;
      --pass: #06d6a0;
      --fail: #ef476f;
      --border: #3a506b;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
    }
    h1 { margin: 0; color: var(--accent); font-size: 24px; }
    .subtitle { color: #8d99ae; font-size: 14px; margin-top: 4px; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      text-align: center;
    }
    .card-num { font-size: 28px; font-weight: bold; margin-top: 6px; }
    .card-label { color: #8d99ae; font-size: 13px; text-transform: uppercase; }
    .pass-num { color: var(--pass); }
    .fail-num { color: var(--fail); }
    .rate-num { color: var(--accent); }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-bg);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    th, td { padding: 12px 16px; text-align: left; font-size: 13px; }
    th { background: #0b091a; color: #8d99ae; font-weight: 600; }
    tr { border-bottom: 1px solid var(--border); }
    tr:hover { background: #2b3a55; }
    .badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .category-badge { background: #3a506b; color: #e0e1dd; }
    .status-badge.passed { background: rgba(6, 214, 160, 0.2); color: var(--pass); }
    .status-badge.failed { background: rgba(239, 71, 111, 0.2); color: var(--fail); }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📱 Eroute Mobile App — Appium E2E Execution Report</h1>
      <div class="subtitle">Android Automation Test Results (Nexus 6 API 29)</div>
    </div>
    <div style="text-align: right; color: #8d99ae; font-size: 13px;">
      Date: ${new Date().toLocaleString()}
    </div>
  </div>

  <div class="metrics-grid">
    <div class="card"><div class="card-label">Total Mobile Tests</div><div class="card-num">${total}</div></div>
    <div class="card"><div class="card-label">Passed</div><div class="card-num pass-num">${passed}</div></div>
    <div class="card"><div class="card-label">Failed</div><div class="card-num fail-num">${failed}</div></div>
    <div class="card"><div class="card-label">Pass Rate</div><div class="card-num rate-num">${passRate}%</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50px;">#</th>
        <th style="width: 200px;">Category</th>
        <th>Mobile Test Case Description</th>
        <th style="width: 100px;">Status</th>
        <th style="width: 110px;">Duration</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

  const targetPath = path.resolve(outputPath);
  fs.writeFileSync(targetPath, htmlContent, 'utf8');
  console.log(`✅ Appium HTML Execution Report generated: ${targetPath}`);
}
