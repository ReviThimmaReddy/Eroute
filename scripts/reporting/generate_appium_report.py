import json
import sys
import os
from datetime import datetime
from excel_engine import ExcelReportGenerator

def generate(results_file):
    with open(results_file, 'r') as f:
        data = json.load(f)

    summary = {
        'total': data['summary'].get('total', 0),
        'passed': data['summary'].get('passed', 0),
        'failed': data['summary'].get('failed', 0),
        'skipped': data['summary'].get('skipped', 0),
        'pass_rate': round((data['summary'].get('passed', 0) / data['summary'].get('total', 1)) * 100, 2)
    }

    results = []
    for i, test in enumerate(data['tests'], 1):
        # Flattening for the requested columns: #, Test Name, Test Suite, Feature, Status, Duration, Timestamp, Device, Android Version, App Package, Error Message
        results.append([
            i,
            test['nodeid'].split("::")[-1],
            test['nodeid'].split("/")[1] if "/" in test['nodeid'] else "General",
            "Mobile Module",
            test['outcome'].upper(),
            f"{test['duration']:.2f}s",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Android Emulator",
            "13.0",
            "com.simats.eroute",
            test.get('longrepr', '')
        ])

    columns = ["#", "Test Name", "Test Suite", "Feature", "Status", "Duration", "Timestamp", "Device", "Android Version", "App Package", "Error Message"]

    gen = ExcelReportGenerator("Appium Android Test Report", "eRoute Mobile Application")
    gen.create_summary_sheet(summary)
    gen.create_results_sheet(results, columns)

    # Create empty Failures, Statistics, Recommendations as requested
    gen.wb.create_sheet("Failures")
    gen.wb.create_sheet("Statistics")
    gen.wb.create_sheet("Recommendations")

    output_path = "reports/appium/Appium_Android_Test_Report.xlsx"
    gen.save(output_path)
    print(f"Report generated: {output_path}")

if __name__ == "__main__":
    generate(sys.argv[1])
