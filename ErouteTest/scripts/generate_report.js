const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateExcelReport(webResults, mobileResults) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('eRoute Test Analysis');

    sheet.columns = [
        { header: 'Test Case ID', key: 'id', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Test Case Name', key: 'name', width: 50 },
        { header: 'Platform', key: 'platform', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Accuracy (%)', key: 'accuracy', width: 15 },
        { header: 'Timestamp', key: 'time', width: 25 }
    ];

    // Style headers
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
    };

    const timestamp = new Date().toLocaleString();

    // Add Web Results
    webResults.forEach(res => {
        sheet.addRow({ ...res, category: 'Functional/Web', platform: 'Selenium', time: timestamp });
    });

    // Add Mobile Results
    mobileResults.forEach(res => {
        sheet.addRow({ ...res, category: 'Functional/Mobile', platform: 'Appium', time: timestamp });
    });

    // Apply conditional formatting for PASS/FAIL and Accuracy
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const statusCell = row.getCell('status');
            const accuracyCell = row.getCell('accuracy');

            if (statusCell.value === 'PASS') {
                statusCell.font = { color: { argb: 'FF008000' }, bold: true };
            } else {
                statusCell.font = { color: { argb: 'FFFF0000' }, bold: true };
            }

            // Accuracy color coding
            const accVal = parseFloat(accuracyCell.value);
            if (accVal >= 90) {
                accuracyCell.font = { color: { argb: 'FF008000' }, bold: true };
            } else if (accVal >= 70) {
                accuracyCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
            } else {
                accuracyCell.font = { color: { argb: 'FFFF0000' }, bold: true };
            }
        }
    });

    const reportPath = path.join(__dirname, '../reports/Test_Analysis_Report.xlsx');
    await workbook.xlsx.writeFile(reportPath);
    console.log(`Excel report generated successfully at: ${reportPath}`);
}

// Mock data for demonstration if running directly
const mockWeb = [
    { id: 1, name: "Web Login Page Load", status: "PASS", accuracy: "100%" },
    { id: 2, name: "Admin Web Authentication", status: "PASS", accuracy: "98.5%" },
    { id: 3, name: "SQL Ledger Export Simulation", status: "PASS", accuracy: "100%" }
];

const mockMobile = [
    { id: 26, name: "Mobile Splash to Intro Transition", status: "PASS", accuracy: "95%" },
    { id: 27, name: "Mobile Role Selection Visibility", status: "PASS", accuracy: "100%" },
    { id: 29, name: "Student Login Authentication", status: "PASS", accuracy: "99.2%" }
];

generateExcelReport(mockWeb, mockMobile);
