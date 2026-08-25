import fs from 'fs';
import path from 'path';

/**
 * Helper function to safely extract metric values whether k6 JSON format is nested or flat.
 */
function getMetricValue(metricObj, key) {
  if (!metricObj) return undefined;
  if (metricObj.values && metricObj.values[key] !== undefined) {
    return metricObj.values[key];
  }
  if (metricObj[key] !== undefined) {
    return metricObj[key];
  }
  return undefined;
}

function formatDuration(ms) {
  if (ms === undefined || ms === null || isNaN(ms)) return 'N/A';
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms.toFixed(2)}ms`;
}

function parseK6Summary(summaryPath = 'summary.json') {
  const fullPath = path.resolve(summaryPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Summary file not found at ${fullPath}`);
    process.exit(1);
  }

  let summaryData;
  try {
    const rawContent = fs.readFileSync(fullPath, 'utf8');
    summaryData = JSON.parse(rawContent);
  } catch (err) {
    console.error(`Error parsing ${fullPath}:`, err);
    process.exit(1);
  }

  const metrics = summaryData.metrics || {};

  // 1. Throughput & Requests
  const httpReqs = metrics.http_reqs || {};
  const totalRequests = getMetricValue(httpReqs, 'count') ?? 0;
  const rps = getMetricValue(httpReqs, 'rate') ?? 0;

  // 2. Response Time / Latency
  const httpReqDuration = metrics.http_req_duration || {};
  const avgDuration = getMetricValue(httpReqDuration, 'avg');
  const minDuration = getMetricValue(httpReqDuration, 'min');
  const maxDuration = getMetricValue(httpReqDuration, 'max');
  const p95Duration = getMetricValue(httpReqDuration, 'p(95)') ?? getMetricValue(httpReqDuration, 'p95');

  // 3. Error Rates
  const httpReqFailed = metrics.http_req_failed || {};
  const failureRateRaw = getMetricValue(httpReqFailed, 'rate') ?? getMetricValue(httpReqFailed, 'value');
  const failureRatePct = failureRateRaw !== undefined ? (failureRateRaw * 100).toFixed(2) + '%' : '0.00%';

  // 4. Checks Pass Rate
  const checks = metrics.checks || {};
  const checksPassRateRaw = getMetricValue(checks, 'rate') ?? getMetricValue(checks, 'value');
  const checksPassRatePct = checksPassRateRaw !== undefined ? (checksPassRateRaw * 100).toFixed(2) + '%' : '100.00%';

  // Format Markdown Summary Table
  const markdownTable = `
## 🚀 Baseline / Load Testing Execution Summary

| Metric | Value | Meaning / Status |
| :--- | :--- | :--- |
| **Virtual Users (VUs)** | 100 VUs | Target concurrent user load |
| **Duration** | 1 Minute | Continuous execution window |
| **Throughput (RPS)** | **${rps.toFixed(2)} req/sec** | API requests handled per second |
| **Total Requests** | **${totalRequests.toLocaleString()}** | Total HTTP requests completed |
| **Avg Response Time** | **${formatDuration(avgDuration)}** | Average latency across all requests |
| **Min Response Time** | **${formatDuration(minDuration)}** | Fastest single request response time |
| **Max Response Time** | **${formatDuration(maxDuration)}** | Slowest single request response time |
| **p(95) Latency** | **${formatDuration(p95Duration)}** | 95% of requests completed below this |
| **Failure Rate** | **${failureRatePct}** | Target: < 5% error rate |
| **Assertions Check Rate** | **${checksPassRatePct}** | Status 200 & latency check pass rate |

> **Baseline Assessment**: ${failureRateRaw < 0.05 && (p95Duration === undefined || p95Duration < 1500) ? '✅ PASSED — System responded fast with zero critical bottlenecks under 100 VUs load.' : '⚠️ REVIEW — High latency or error rates observed during baseline run.'}
`.trim();

  console.log('\n--- Load Test Summary Output ---\n');
  console.log(markdownTable);
  console.log('\n---------------------------------\n');

  // Append to GITHUB_STEP_SUMMARY if present
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdownTable + '\n');
      console.log(`Successfully appended report to GITHUB_STEP_SUMMARY: ${process.env.GITHUB_STEP_SUMMARY}`);
    } catch (err) {
      console.error('Failed writing to GITHUB_STEP_SUMMARY:', err);
    }
  }
}

async function run() {
  const summaryFile = process.argv[2] || 'summary.json';
  parseK6Summary(summaryFile);
  try {
    const { generateK6ExcelReport } = await import('./generateK6ExcelReport.js');
    await generateK6ExcelReport(summaryFile, process.argv[3] || 'load-test-report.xlsx');
  } catch (err) {
    console.error('Error generating Excel report:', err);
  }
}

run();

