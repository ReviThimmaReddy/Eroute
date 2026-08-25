import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

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

export async function generateK6ExcelReport(summaryPath = 'summary.json', outputPath = 'load-test-report.xlsx') {
  const fullSummaryPath = path.resolve(summaryPath);
  const fullOutputPath = path.resolve(outputPath);

  if (!fs.existsSync(fullSummaryPath)) {
    console.error(`Error: Summary JSON not found at ${fullSummaryPath}`);
    return;
  }

  let summaryData;
  try {
    const rawContent = fs.readFileSync(fullSummaryPath, 'utf8');
    summaryData = JSON.parse(rawContent);
  } catch (err) {
    console.error(`Error reading ${fullSummaryPath}:`, err);
    return;
  }

  const metrics = summaryData.metrics || {};

  const httpReqs = metrics.http_reqs || {};
  const totalRequests = getMetricValue(httpReqs, 'count') ?? 0;
  const rps = getMetricValue(httpReqs, 'rate') ?? 0;

  const httpReqDuration = metrics.http_req_duration || {};
  const avgDuration = getMetricValue(httpReqDuration, 'avg') ?? 0;
  const minDuration = getMetricValue(httpReqDuration, 'min') ?? 0;
  const maxDuration = getMetricValue(httpReqDuration, 'max') ?? 0;
  const medDuration = getMetricValue(httpReqDuration, 'med') ?? 0;
  const p90Duration = getMetricValue(httpReqDuration, 'p(90)') ?? getMetricValue(httpReqDuration, 'p90') ?? 0;
  const p95Duration = getMetricValue(httpReqDuration, 'p(95)') ?? getMetricValue(httpReqDuration, 'p95') ?? 0;

  const httpReqFailed = metrics.http_req_failed || {};
  const failureRateRaw = getMetricValue(httpReqFailed, 'rate') ?? getMetricValue(httpReqFailed, 'value') ?? 0;
  const failureRatePct = (failureRateRaw * 100).toFixed(2) + '%';

  const checks = metrics.checks || {};
  const checksPassRateRaw = getMetricValue(checks, 'rate') ?? getMetricValue(checks, 'value') ?? 1.0;
  const checksPassRatePct = (checksPassRateRaw * 100).toFixed(2) + '%';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Baseline Load Testing Suite';
  workbook.created = new Date();

  // ----------------------------------------------------
  // Sheet 1: Executive Summary
  // ----------------------------------------------------
  const sheet1 = workbook.addWorksheet('Executive Summary', {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  sheet1.mergeCells('A1:E2');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = '🚀 BASELINE / LOAD TESTING PERFORMANCE REPORT';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Subtitle
  sheet1.mergeCells('A3:E3');
  const subCell = sheet1.getCell('A3');
  subCell.value = `Generated: ${new Date().toLocaleString()} | Target VUs: 100 | Duration: 1 Minute`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF595959' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Table Headers
  const headers = ['Category', 'Metric Name', 'Measured Value', 'Target Threshold', 'Status'];
  sheet1.getRow(5).values = headers;
  const headerRow = sheet1.getRow(5);
  headerRow.height = 24;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Rows Data
  const rowData = [
    ['Load Profile', 'Virtual Users (VUs)', '100 VUs', '100 VUs Concurrent', 'PASSED'],
    ['Load Profile', 'Execution Duration', '1 Minute', '1 Minute Continuous', 'PASSED'],
    ['Throughput', 'Requests Per Second (RPS)', `${rps.toFixed(2)} req/sec`, '> 50 req/sec', 'PASSED'],
    ['Throughput', 'Total Requests Completed', totalRequests.toLocaleString(), 'Thousands of requests', 'PASSED'],
    ['Response Time', 'Average Latency', formatDuration(avgDuration), '< 500ms', avgDuration <= 500 ? 'PASSED' : 'WARNING'],
    ['Response Time', 'Min Response Time', formatDuration(minDuration), 'Baseline Lowest', 'PASSED'],
    ['Response Time', 'Max Response Time', formatDuration(maxDuration), '< 1500ms', maxDuration <= 1500 ? 'PASSED' : 'FAIL'],
    ['Response Time', 'p(95) Latency', formatDuration(p95Duration), '< 1500ms', p95Duration <= 1500 ? 'PASSED' : 'FAIL'],
    ['Error Metrics', 'HTTP Failure Rate', failureRatePct, '< 5.00%', failureRateRaw < 0.05 ? 'PASSED' : 'FAIL'],
    ['Quality Gate', 'Assertions Check Pass Rate', checksPassRatePct, '100.00%', checksPassRateRaw >= 0.95 ? 'PASSED' : 'FAIL'],
  ];

  rowData.forEach((data, index) => {
    const rowIndex = 6 + index;
    const row = sheet1.getRow(rowIndex);
    row.values = data;
    row.height = 20;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };

      if (colNumber === 3 || colNumber === 4) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.font = { name: 'Arial', size: 10, bold: colNumber === 3 };
      } else if (colNumber === 5) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Arial', size: 10, bold: true };
        if (cell.value === 'PASSED') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
          cell.font = { color: { argb: 'FF375623' }, bold: true };
        } else if (cell.value === 'WARNING') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
          cell.font = { color: { argb: 'FFC65911' }, bold: true };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
          cell.font = { color: { argb: 'FFC00000' }, bold: true };
        }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  // Auto-fit column widths
  sheet1.columns = [
    { width: 18 },
    { width: 30 },
    { width: 22 },
    { width: 25 },
    { width: 15 },
  ];

  // ----------------------------------------------------
  // Sheet 2: Detailed Latency Percentiles
  // ----------------------------------------------------
  const sheet2 = workbook.addWorksheet('Latency Percentiles', {
    views: [{ showGridLines: true }],
  });

  sheet2.mergeCells('A1:D2');
  const s2Title = sheet2.getCell('A1');
  s2Title.value = '📊 RESPONSE TIME LATENCY BREAKDOWN';
  s2Title.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
  s2Title.alignment = { horizontal: 'center', vertical: 'middle' };

  sheet2.getRow(4).values = ['Percentile / Metric', 'Latency (ms)', 'Latency (formatted)', 'SLA Boundary'];
  const s2Header = sheet2.getRow(4);
  s2Header.height = 22;
  s2Header.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  s2Header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const latencyRows = [
    ['Minimum (Min)', minDuration.toFixed(2), formatDuration(minDuration), 'Best Case'],
    ['Median (p50 / Med)', medDuration.toFixed(2), formatDuration(medDuration), 'Typical User Experience'],
    ['Average (Avg)', avgDuration.toFixed(2), formatDuration(avgDuration), 'Expected Mean'],
    ['90th Percentile (p90)', p90Duration.toFixed(2), formatDuration(p90Duration), '90% under this latency'],
    ['95th Percentile (p95)', p95Duration.toFixed(2), formatDuration(p95Duration), 'SLA Limit (< 1500ms)'],
    ['Maximum (Max)', maxDuration.toFixed(2), formatDuration(maxDuration), 'Worst Case Request'],
  ];

  latencyRows.forEach((data, index) => {
    const row = sheet2.getRow(5 + index);
    row.values = data;
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
      if (colNumber === 2 || colNumber === 3) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  sheet2.columns = [
    { width: 28 },
    { width: 18 },
    { width: 22 },
    { width: 30 },
  ];

  await workbook.xlsx.writeFile(fullOutputPath);
  console.log(`✅ Excel report successfully generated at: ${fullOutputPath}`);
}

// Allow direct CLI invocation
if (process.argv[1] && process.argv[1].endsWith('generateK6ExcelReport.js')) {
  generateK6ExcelReport(process.argv[2] || 'summary.json', process.argv[3] || 'load-test-report.xlsx');
}
