import csv
import hashlib
import html
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest
import requests

from helpers.static_audit import discover_source_root

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.common.by import By
    from selenium.webdriver.edge.options import Options as EdgeOptions
    from selenium.webdriver.support.ui import WebDriverWait
    SELENIUM_AVAILABLE = True
    SELENIUM_IMPORT_ERROR = None
except Exception as exc:
    webdriver = None
    ChromeOptions = None
    By = None
    EdgeOptions = None
    WebDriverWait = None
    SELENIUM_AVAILABLE = False
    SELENIUM_IMPORT_ERROR = exc

PROJECT_ROOT = Path(__file__).resolve().parent
DOCS_DIR = PROJECT_ROOT / 'docs'
REPORTS_DIR = PROJECT_ROOT / 'reports'
RUNS_DIR = REPORTS_DIR / 'runs'


def pytest_addoption(parser):
    parser.addoption('--run-api', action='store_true', default=False, help='Run suites that require the backend API.')
    parser.addoption('--run-ui', action='store_true', default=False, help='Run Selenium UI suites.')
    parser.addoption('--browser', action='store', default=None, help='Override browser from pytest.ini (chrome or edge).')
    parser.addoption(
        '--qa-html-report',
        action='store_true',
        default=False,
        help='Generate a styled HTML QA report for the current execution.',
    )

    parser.addini('api_base_url', 'Backend API base URL.', default='https://localhost:57240')
    parser.addini('ui_base_url', 'Frontend UI base URL.', default='http://localhost:4200')
    parser.addini('admin_username', 'Admin username used by automated tests.', default='admin')
    parser.addini('admin_password', 'Admin password used by automated tests.', default='Admin123!')
    parser.addini('browser', 'Default browser for UI suites.', default='chrome')
    parser.addini('source_root', 'Optional source application root to use for static inspection tests.', default='')
    parser.addini('ui_step_delay_seconds', 'Delay after UI actions so the flow is visible.', default='0.6')


def _http_up(url: str, timeout: float = 3.0) -> bool:
    try:
        response = requests.get(url, verify=False, timeout=timeout)
        return response.status_code < 500
    except Exception:
        return False


def _sanitize_filename(value: str) -> str:
    sanitized = re.sub(r'[^A-Za-z0-9._-]+', '_', value)
    return sanitized.strip('._')[:48] or 'artifact'


def _artifact_stem(item) -> str:
    nodeid = getattr(item, 'nodeid', str(item))
    test_name = _sanitize_filename(getattr(item, 'name', 'test'))[:20]
    location = getattr(item, 'location', None) or ('', '', '')
    module_stem = _sanitize_filename(Path(location[0]).stem)[:10] if location and location[0] else 'test'
    digest = hashlib.sha1(nodeid.encode('utf-8')).hexdigest()[:8]
    return f'{module_stem}_{test_name}_{digest}'


def _relative(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT)).replace('\\', '/')
    except Exception:
        return str(path).replace('\\', '/')


def _ensure_runtime_layout(base_dir: Path):
    for folder in ('screenshots', 'logs'):
        (base_dir / folder).mkdir(parents=True, exist_ok=True)


def _ensure_csv_header(path: Path, header: list[str]):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.stat().st_size > 0:
        return
    with path.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.writer(handle)
        writer.writerow(header)


def _append_csv_row(path: Path, row: dict, header: list[str]):
    _ensure_csv_header(path, header)
    with path.open('a', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=header)
        writer.writerow(row)


def _load_case_catalog() -> dict[str, dict]:
    catalog_path = DOCS_DIR / '04_TEST_CASES.csv'
    if not catalog_path.exists():
        return {}

    with catalog_path.open('r', newline='', encoding='utf-8-sig') as handle:
        rows = list(csv.DictReader(handle))

    catalog = {}
    for row in rows:
        script = (row.get('Automated script') or '').strip()
        if not script:
            continue
        catalog[script] = row
        if '[' in script and script.endswith(']'):
            catalog[script.split('[', 1)[0]] = row
    return catalog


def _load_requirement_catalog() -> dict[str, str]:
    traceability_path = DOCS_DIR / '05_TRACEABILITY_MATRIX.csv'
    if not traceability_path.exists():
        return {}

    with traceability_path.open('r', newline='', encoding='utf-8-sig') as handle:
        rows = list(csv.DictReader(handle))
    return {
        row.get('Requirement ID', '').strip(): row.get('Requirement', '').strip()
        for row in rows
        if row.get('Requirement ID')
    }


def _save_text(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')


def _register_teardown_action(node, message: str):
    actions = getattr(node, '_qa_teardown_actions', [])
    actions.append(message)
    node._qa_teardown_actions = actions


def _append_run_log(config, message: str):
    path = getattr(config, '_qa_run_log_file', None)
    if path is None:
        return
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S.%f UTC')
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('a', encoding='utf-8') as handle:
        handle.write(f'[{timestamp}] {message}\n')


def _phase_outcome(report) -> str:
    if report is None:
        return "NOT RUN"
    if report.passed:
        return "PASSED"
    if report.failed:
        return "FAILED"
    if report.skipped:
        return "SKIPPED"
    return str(getattr(report, "outcome", "unknown")).upper()


def _collect_phase_output(item) -> str:
    blocks = []
    for phase in ('setup', 'call', 'teardown'):
        report = getattr(item, f'rep_{phase}', None)
        if report is None:
            continue
        duration = round(float(getattr(report, "duration", 0.0) or 0.0), 3)
        stdout = getattr(report, "capstdout", "") or ""
        stderr = getattr(report, "capstderr", "") or ""
        caplog = getattr(report, "caplog", "") or ""
        blocks.append(
            "\n".join(
                [
                    f"PHASE: {phase.upper()}",
                    f"Outcome: {_phase_outcome(report)}",
                    f"Duration (s): {duration}",
                    "Captured stdout:",
                    stdout if stdout else "[none]",
                    "",
                    "Captured stderr:",
                    stderr if stderr else "[none]",
                    "",
                    "Captured log:",
                    caplog if caplog else "[none]",
                ]
            )
        )
    if not blocks:
        return "No captured pytest output was recorded for this test."
    return ("\n\n" + ("\n" + ("-" * 80) + "\n").join(blocks)).strip()


def _write_testcase_text_log(item, case_data: dict, requirement_text: str, status: str, phase: str, expected_result: str, actual_result: str):
    run_dir = getattr(item.config, "_qa_run_dir", REPORTS_DIR)
    _ensure_runtime_layout(run_dir)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    log_path = run_dir / "logs" / f"{_artifact_stem(item)}__{status.lower()}__{stamp}.txt"

    artifacts = getattr(item, "_qa_artifacts", {"screenshots": [], "logs": []})
    related_logs = [entry for entry in artifacts.get("logs", []) if entry != _relative(log_path)]
    markers = sorted(mark.name for mark in item.iter_markers())
    content = "\n".join(
        [
            "QA TESTCASE EXECUTION LOG",
            "=" * 80,
            f"Executed At (UTC): {datetime.now(timezone.utc).isoformat()}",
            f"Node ID: {item.nodeid}",
            f"TC ID: {case_data.get('TC ID', '')}",
            f"Title: {case_data.get('Title', item.name)}",
            f"Scenario Summary: {case_data.get('Scenario summary', '')}",
            f"Requirement ID: {case_data.get('Requirement', '')}",
            f"Requirement: {requirement_text or '[not mapped]'}",
            f"Test Data: {_derive_test_data(item, case_data)}",
            f"Automated Script: {item.nodeid}",
            f"Markers: {', '.join(markers) if markers else '[none]'}",
            f"Result: {status}",
            f"Status Phase: {phase}",
            f"Duration (s): {_duration_from_reports(item)}",
            f"Negative Scenario: {'Yes' if item.get_closest_marker('negative') else 'No'}",
            "",
            "EXPECTED RESULT",
            "-" * 80,
            expected_result or "[not specified]",
            "",
            "ACTUAL RESULT",
            "-" * 80,
            actual_result or "[not available]",
            "",
            "NOTES",
            "-" * 80,
            _notes_from_reports(item) or "[none]",
            "",
            "TEARDOWN",
            "-" * 80,
            f"Driver Closed: {getattr(item, '_qa_driver_closed', 'No')}",
            f"Browser State Cleared: {getattr(item, '_qa_browser_state_cleared', 'N/A')}",
            getattr(item, "_qa_teardown_summary", "[none]"),
            "",
            "SCREENSHOTS",
            "-" * 80,
            '\n'.join(artifacts.get("screenshots", [])) if artifacts.get("screenshots") else "[none]",
            "",
            "RELATED LOG FILES",
            "-" * 80,
            '\n'.join(related_logs) if related_logs else "[none]",
            "",
            "PYTEST OUTPUT",
            "-" * 80,
            _collect_phase_output(item),
            "",
        ]
    )
    _save_text(log_path, content)

    rel_path = _relative(log_path)
    artifacts.setdefault("logs", [])
    if rel_path not in artifacts["logs"]:
        artifacts["logs"].append(rel_path)
    item._qa_artifacts = artifacts
    _append_run_log(item.config, f"Created testcase text log for {item.nodeid}: {rel_path}")
    return rel_path


def _capture_ui_evidence(item, driver, reason: str, report=None):
    if driver is None:
        return

    run_dir = getattr(item.config, '_qa_run_dir', REPORTS_DIR)
    _ensure_runtime_layout(run_dir)
    captures = getattr(item, '_qa_capture_reasons', set())
    if reason in captures:
        return
    captures.add(reason)
    item._qa_capture_reasons = captures

    artifact_bucket = getattr(item, '_qa_artifacts', {'screenshots': [], 'logs': []})
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')
    base_name = f'{_artifact_stem(item)}_{reason}_{stamp}'

    screenshot_path = run_dir / 'screenshots' / f'{base_name}.png'
    log_path = run_dir / 'logs' / f'{base_name}.log'

    screenshot_saved = False
    try:
        screenshot_saved = bool(driver.save_screenshot(str(screenshot_path)))
    except Exception:
        screenshot_saved = False

    browser_logs_text = 'Browser console logs unavailable.'
    try:
        browser_entries = driver.get_log('browser')
        if browser_entries:
            browser_logs_text = '\n'.join(
                f"[{entry.get('level', 'INFO')}] {entry.get('message', '')}" for entry in browser_entries
            )
        else:
            browser_logs_text = 'Browser console logs are empty.'
    except Exception as exc:
        browser_logs_text = f'Browser console logs unavailable: {exc}'

    try:
        body_text = driver.find_element(By.TAG_NAME, 'body').text[:3000]
    except Exception as exc:
        body_text = f'Unable to read page body: {exc}'

    report_excerpt = ''
    if report is not None:
        report_excerpt = getattr(report, 'longreprtext', '') or str(getattr(report, 'longrepr', ''))
        report_excerpt = report_excerpt[:5000]

    log_content = '\n'.join(
        [
            f'Timestamp (UTC): {datetime.now(timezone.utc).isoformat()}',
            f'Test: {item.nodeid}',
            f'Reason: {reason}',
            f'Current URL: {getattr(driver, "current_url", "")}',
            f'Page title: {getattr(driver, "title", "")}',
            '',
            'Failure / assertion details:',
            report_excerpt or 'No failure detail available.',
            '',
            'Visible body excerpt:',
            body_text,
            '',
            'Browser console:',
            browser_logs_text,
        ]
    )
    _save_text(log_path, log_content)

    if screenshot_saved:
        artifact_bucket['screenshots'].append(_relative(screenshot_path))
    artifact_bucket['logs'].append(_relative(log_path))
    item._qa_artifacts = artifact_bucket
    _append_run_log(item.config, f'Captured UI evidence for {item.nodeid} ({reason}).')


def _status_from_reports(item) -> tuple[str, str]:
    rep_setup = getattr(item, 'rep_setup', None)
    rep_call = getattr(item, 'rep_call', None)
    rep_teardown = getattr(item, 'rep_teardown', None)

    if rep_setup and rep_setup.skipped:
        return 'SKIPPED', 'setup'
    if rep_setup and rep_setup.failed:
        return 'ERROR', 'setup'
    if rep_call and rep_call.skipped:
        return 'SKIPPED', 'call'
    if rep_call and rep_call.failed:
        return 'FAILED', 'call'
    if rep_teardown and rep_teardown.failed:
        return 'ERROR', 'teardown'
    return 'PASSED', 'call'


def _duration_from_reports(item) -> float:
    total = 0.0
    for phase in ('rep_setup', 'rep_call', 'rep_teardown'):
        report = getattr(item, phase, None)
        if report is not None:
            total += float(getattr(report, 'duration', 0.0) or 0.0)
    return round(total, 3)


def _notes_from_reports(item) -> str:
    for phase in ('rep_call', 'rep_setup', 'rep_teardown'):
        report = getattr(item, phase, None)
        if report is not None and report.failed:
            return (getattr(report, 'longreprtext', '') or str(getattr(report, 'longrepr', '')))[:1200]
    return ''


def _derive_test_data(item, case_data: dict) -> str:
    explicit = (case_data.get('Test data') or case_data.get('Data') or '').strip()
    if explicit:
        return explicit
    fixture_names = [name for name in getattr(item, 'fixturenames', []) if name not in {'request', 'tmp_path', 'tmp_path_factory'}]
    if fixture_names:
        return 'Fixture-driven data: ' + ', '.join(sorted(dict.fromkeys(fixture_names)))
    return 'Inline literals only.'


def _derive_expected_result(item, case_data: dict) -> str:
    explicit_expected = (case_data.get('Expected result') or '').strip()
    if explicit_expected:
        return explicit_expected
    if item.get_closest_marker('negative') is not None:
        return 'The application safely rejects the invalid, unauthorized, or inconsistent action.'
    return 'The scenario completes successfully and displays the expected business result.'


def _derive_actual_result(item, status: str) -> str:
    if status == 'PASSED' and item.get_closest_marker('negative') is not None:
        return 'The negative scenario was handled correctly and evidence was captured.'
    if status == 'PASSED':
        return 'The executed scenario matched the expected result.'
    if status == 'SKIPPED':
        return 'The scenario did not run because its prerequisites were not available.'
    notes = _notes_from_reports(item)
    return notes or 'The execution did not match the expected result.'


def _status_counts(rows: list[dict]) -> dict[str, int]:
    counts = {'PASSED': 0, 'FAILED': 0, 'ERROR': 0, 'SKIPPED': 0}
    for row in rows:
        counts[row['Result']] = counts.get(row['Result'], 0) + 1
    return counts


def _link_target_for_html(config, stored_path: str) -> str:
    if not stored_path:
        return ''
    run_dir = getattr(config, '_qa_run_dir', PROJECT_ROOT)
    path = PROJECT_ROOT / stored_path
    try:
        return str(path.relative_to(run_dir)).replace('\\', '/')
    except Exception:
        return stored_path.replace('\\', '/')


def _render_artifact_links(config, stored_paths: str, label: str) -> str:
    if not stored_paths:
        return '-'
    parts = [part.strip() for part in stored_paths.split(' | ') if part.strip()]
    if not parts:
        return '-'
    links = []
    for index, part in enumerate(parts, start=1):
        target = _link_target_for_html(config, part)
        text_label = label if len(parts) == 1 else f'{label} {index}'
        links.append(f'<a href="{html.escape(target)}">{html.escape(text_label)}</a>')
    return '<br>'.join(links)


def _render_html_report(config):
    results_rows = getattr(config, '_qa_results_rows', [])
    if not results_rows:
        return

    counts = _status_counts(results_rows)
    total = len(results_rows)
    run_started = getattr(config, '_qa_run_started', datetime.now(timezone.utc))
    run_finished = datetime.now(timezone.utc)
    duration_seconds = round((run_finished - run_started).total_seconds(), 3)
    html_report_file = config._qa_html_report_file

    badge_class = {
        'PASSED': 'passed',
        'FAILED': 'failed',
        'ERROR': 'error',
        'SKIPPED': 'skipped',
    }

    rows_html = []
    for row in results_rows:
        screenshot_html = _render_artifact_links(config, row.get('Screenshot', ''), 'screenshot')
        log_html = _render_artifact_links(config, row.get('Evidence Log', ''), 'log')
        rows_html.append(
            f"""
            <tr>
                <td>{html.escape(row.get('Executed At (UTC)', ''))}</td>
                <td>{html.escape(row.get('TC ID', ''))}</td>
                <td>{html.escape(row.get('Summary', ''))}</td>
                <td><span class=\"badge {badge_class.get(row.get('Result', ''), '')}\">{html.escape(row.get('Result', ''))}</span></td>
                <td>{html.escape(row.get('Expected', ''))}</td>
                <td>{html.escape(row.get('Actual', ''))}</td>
                <td>{html.escape(str(row.get('Duration (s)', '')))}</td>
                <td>{screenshot_html}</td>
                <td>{log_html}</td>
            </tr>
            """
        )

    html_report = f"""
<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <title>QA Execution Report - {html.escape(config._qa_run_id)}</title>
  <style>
    body {{ font-family: Arial, Helvetica, sans-serif; margin: 24px; background: #f6f8fb; color: #1d2433; }}
    h1 {{ margin-bottom: 8px; }}
    .meta {{ color: #556070; margin-bottom: 20px; }}
    .cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin: 20px 0 26px; }}
    .card {{ background: #ffffff; border-radius: 14px; padding: 16px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); border-left: 6px solid #d0d7e2; }}
    .card h2 {{ margin: 0 0 6px; font-size: 14px; color: #4b5565; font-weight: 600; }}
    .card .value {{ font-size: 30px; font-weight: 700; }}
    .card.total {{ border-left-color: #475569; }}
    .card.passed {{ border-left-color: #16a34a; }}
    .card.failed {{ border-left-color: #dc2626; }}
    .card.error {{ border-left-color: #ea580c; }}
    .card.skipped {{ border-left-color: #64748b; }}
    table {{ width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }}
    th, td {{ padding: 12px 14px; border-bottom: 1px solid #e6ebf2; vertical-align: top; text-align: left; font-size: 13px; }}
    th {{ background: #eaf0f8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }}
    tr:nth-child(even) {{ background: #fbfdff; }}
    .badge {{ display: inline-block; min-width: 74px; text-align: center; padding: 6px 10px; border-radius: 999px; color: #fff; font-weight: 700; font-size: 12px; }}
    .badge.passed {{ background: #16a34a; }}
    .badge.failed {{ background: #dc2626; }}
    .badge.error {{ background: #ea580c; }}
    .badge.skipped {{ background: #64748b; }}
    a {{ color: #2563eb; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <h1>QA Execution Report</h1>
  <div class=\"meta\">Run ID: <strong>{html.escape(config._qa_run_id)}</strong><br>
  Started: {html.escape(run_started.isoformat())}<br>
  Finished: {html.escape(run_finished.isoformat())}<br>
  Duration: {duration_seconds} seconds</div>

  <div class=\"cards\">
    <div class=\"card total\"><h2>Total</h2><div class=\"value\">{total}</div></div>
    <div class=\"card passed\"><h2>Passed</h2><div class=\"value\">{counts['PASSED']}</div></div>
    <div class=\"card failed\"><h2>Failed</h2><div class=\"value\">{counts['FAILED']}</div></div>
    <div class=\"card error\"><h2>Error</h2><div class=\"value\">{counts['ERROR']}</div></div>
    <div class=\"card skipped\"><h2>Skipped</h2><div class=\"value\">{counts['SKIPPED']}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Executed At (UTC)</th>
        <th>TC ID</th>
        <th>Summary</th>
        <th>Result</th>
        <th>Expected</th>
        <th>Actual</th>
        <th>Duration (s)</th>
        <th>Screenshot</th>
        <th>Log</th>
      </tr>
    </thead>
    <tbody>
      {''.join(rows_html)}
    </tbody>
  </table>
</body>
</html>
"""
    _save_text(html_report_file, html_report)


def pytest_configure(config):
    config.addinivalue_line('markers', 'api: backend api coverage')
    config.addinivalue_line('markers', 'ui: browser system coverage')
    config.addinivalue_line('markers', 'negative: negative or expected-rejection scenario with mandatory evidence capture')

    run_started = datetime.now(timezone.utc)
    run_id = run_started.strftime('r%Y%m%d_%H%M%S_%f')
    run_dir = RUNS_DIR / run_id
    _ensure_runtime_layout(run_dir)

    config._qa_run_started = run_started
    config._qa_run_id = run_id
    config._qa_run_dir = run_dir
    config._qa_run_log_file = run_dir / 'execution.log'
    config._qa_run_logs_dir = run_dir / 'logs'
    config._qa_execution_csv = run_dir / 'execution_results.csv'
    config._qa_traceability_csv = run_dir / 'traceability_results.csv'
    config._qa_teardown_csv = run_dir / 'teardown_results.csv'
    config._qa_results_csv = run_dir / 'results_summary.csv'
    config._qa_html_report_file = run_dir / 'qa_execution_report.html'
    config._qa_results_rows = []
    config._qa_collected_count = 0

    config._qa_case_catalog = _load_case_catalog()
    config._qa_requirement_catalog = _load_requirement_catalog()

    latest_run = REPORTS_DIR / 'latest_run.txt'
    latest_run.parent.mkdir(parents=True, exist_ok=True)
    latest_run.write_text(_relative(run_dir), encoding='utf-8')

    _append_run_log(config, f'QA execution started. Run directory: {_relative(run_dir)}')

    _ensure_csv_header(
        config._qa_execution_csv,
        [
            'Executed At (UTC)',
            'Result',
            'Status Phase',
            'TC ID',
            'Test Title',
            'Requirement ID',
            'Scenario Summary',
            'Level',
            'Type',
            'Technique',
            'Test Data',
            'Automated Script',
            'Duration (s)',
            'Negative Scenario',
            'Screenshot',
            'Evidence Log',
            'Driver Closed',
            'Browser State Cleared',
            'Teardown Summary',
            'Notes',
        ],
    )
    _ensure_csv_header(
        config._qa_traceability_csv,
        [
            'Requirement ID',
            'Requirement',
            'Scenario',
            'TC ID',
            'Test Title',
            'Automated Script',
            'Result',
            'Executed At (UTC)',
            'Screenshot',
            'Evidence Log',
        ],
    )
    _ensure_csv_header(
        config._qa_teardown_csv,
        [
            'Executed At (UTC)',
            'Automated Script',
            'TC ID',
            'Test Title',
            'Result',
            'Driver Closed',
            'Browser State Cleared',
            'Teardown Summary',
            'Notes',
        ],
    )
    _ensure_csv_header(
        config._qa_results_csv,
        [
            'Executed At (UTC)',
            'TC ID',
            'Summary',
            'Test Data',
            'Result',
            'Passed',
            'Failed',
            'Expected',
            'Actual',
            'Duration (s)',
            'Screenshot',
            'Evidence Log',
        ],
    )


def pytest_sessionstart(session):
    _append_run_log(session.config, 'Pytest session started.')


def pytest_collection_finish(session):
    session.config._qa_collected_count = len(session.items)
    _append_run_log(session.config, f'Collection finished. {len(session.items)} test(s) collected.')


def pytest_runtest_protocol(item, nextitem):
    del nextitem
    _append_run_log(item.config, f"TEST START | {item.nodeid} | markers={[mark.name for mark in item.iter_markers()]}")
    return None


@pytest.fixture(scope='session')
def project_root() -> Path:
    return PROJECT_ROOT


@pytest.fixture(scope='session')
def source_root(project_root: Path, pytestconfig) -> Path:
    override = (pytestconfig.getini('source_root') or '').strip()
    if override:
        return Path(override).expanduser().resolve()
    env_override = (__import__('os').environ.get('QA_SOURCE_ROOT') or '').strip()
    if env_override:
        return Path(env_override).expanduser().resolve()
    return discover_source_root(project_root)


@pytest.fixture(scope='session')
def qa_settings(pytestconfig) -> dict:
    def _clean(value: str, fallback: str) -> str:
        cleaned = (value or '').strip()
        return cleaned or fallback

    delay_raw = _clean(pytestconfig.getini('ui_step_delay_seconds'), '0.6')
    try:
        ui_step_delay = max(0.0, float(delay_raw))
    except ValueError:
        ui_step_delay = 0.6

    browser_override = pytestconfig.getoption('--browser')
    browser_value = browser_override or pytestconfig.getini('browser')

    return {
        'api_base_url': _clean(pytestconfig.getini('api_base_url'), 'https://localhost:57240').rstrip('/'),
        'ui_base_url': _clean(pytestconfig.getini('ui_base_url'), 'http://localhost:4200').rstrip('/'),
        'admin_username': _clean(pytestconfig.getini('admin_username'), 'admin'),
        'admin_password': _clean(pytestconfig.getini('admin_password'), 'Admin123!'),
        'browser': _clean(browser_value, 'chrome').lower(),
        'ui_step_delay_seconds': ui_step_delay,
    }


@pytest.fixture(scope='session')
def api_base_url(qa_settings) -> str:
    return qa_settings['api_base_url']


@pytest.fixture(scope='session')
def ui_base_url(qa_settings) -> str:
    return qa_settings['ui_base_url']


@pytest.fixture(scope='session')
def admin_credentials(qa_settings) -> dict:
    return {
        'username': qa_settings['admin_username'],
        'password': qa_settings['admin_password'],
    }


@pytest.fixture(scope='session')
def reports_dir(project_root: Path, request) -> Path:
    path = request.config._qa_run_dir
    _ensure_runtime_layout(path)
    return path


@pytest.fixture(scope='session')
def api_available(request, api_base_url):
    if not request.config.getoption('--run-api'):
        return False
    return _http_up(f'{api_base_url}/swagger') or _http_up(f'{api_base_url}/api/products')


@pytest.fixture(scope='session')
def ui_available(request, ui_base_url):
    if not request.config.getoption('--run-ui'):
        return False
    return _http_up(ui_base_url)


@pytest.fixture()
def require_api(api_available):
    if not api_available:
        pytest.skip('Backend API is not reachable. Start the backend and rerun with --run-api.')


@pytest.fixture()
def require_ui(api_available, ui_available):
    if not api_available:
        pytest.skip('Backend API is not reachable. UI scenarios depend on it.')
    if not ui_available:
        pytest.skip('Angular UI is not reachable. Start the frontend and rerun with --run-ui.')


@pytest.fixture()
def api_session(request):
    session = requests.Session()
    session.verify = False
    session.headers.update({'Accept': 'application/json'})
    yield session
    session.close()
    _register_teardown_action(request.node, 'API session closed.')


@pytest.fixture()
def unique_user():
    suffix = uuid.uuid4().hex[:8]
    return {
        'username': f'user_{suffix}',
        'email': f'user_{suffix}@local.test',
        'password': 'User123!',
    }


@pytest.fixture()
def register_user(request, api_session, api_base_url, require_api):
    created = []

    def _create(**overrides):
        payload = {
            'username': f'user_{uuid.uuid4().hex[:8]}',
            'email': f'user_{uuid.uuid4().hex[:8]}@local.test',
            'password': 'User123!',
        }
        payload.update(overrides)
        response = api_session.post(f'{api_base_url}/api/auth/register', json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        created.append((payload, data))
        return payload, data

    yield _create

    if created:
        _register_teardown_action(
            request.node,
            f'Test data kept for {len(created)} registered user(s); backend delete endpoint not available for rollback.'
        )


@pytest.fixture(scope='session')
def admin_auth_header(api_base_url, admin_credentials, api_available):
    if not api_available:
        return None
    session = requests.Session()
    session.verify = False
    response = session.post(f'{api_base_url}/api/auth/login', json=admin_credentials, timeout=20)
    response.raise_for_status()
    token = response.json()['token']
    session.close()
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture()
def user_auth_header(register_user):
    payload, data = register_user()
    return payload, {'Authorization': f'Bearer {data["token"]}'}


@pytest.fixture()
def driver(request, require_ui, reports_dir, qa_settings):
    if not SELENIUM_AVAILABLE:
        pytest.skip(f'Selenium is not installed in this environment: {SELENIUM_IMPORT_ERROR}')

    browser = qa_settings['browser']
    if browser == 'chrome':
        options = ChromeOptions()
        options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        options.add_argument('--ignore-certificate-errors')
        options.add_argument('--allow-insecure-localhost')
        options.add_argument('--start-maximized')
        options.add_argument('--window-size=1600,1000')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        drv = webdriver.Chrome(options=options)
    elif browser == 'edge':
        options = EdgeOptions()
        options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        options.add_argument('--ignore-certificate-errors')
        options.add_argument('--allow-insecure-localhost')
        options.add_argument('--start-maximized')
        options.add_argument('--window-size=1600,1000')
        options.add_argument('--disable-dev-shm-usage')
        drv = webdriver.Edge(options=options)
    else:
        raise ValueError(f'Unsupported browser: {browser}')

    drv.implicitly_wait(2)
    drv.wait = WebDriverWait(drv, 15)
    drv.ui_step_delay_seconds = qa_settings['ui_step_delay_seconds']

    def _ui_pause(label: str | None = None):
        delay = getattr(drv, 'ui_step_delay_seconds', 0.0)
        if delay <= 0:
            return
        if label:
            _append_run_log(request.config, f'UI pause {delay:.2f}s after: {label}')
        time.sleep(delay)

    original_get = drv.get

    def delayed_get(url: str):
        original_get(url)
        _ui_pause(f'navigate to {url}')

    drv.get = delayed_get
    drv.ui_pause = _ui_pause
    yield drv


@pytest.fixture(autouse=True)
def test_case_teardown(request):
    request.node._qa_teardown_actions = []
    request.node._qa_driver_closed = 'No'
    request.node._qa_browser_state_cleared = 'N/A'

    driver_instance = request.getfixturevalue('driver') if 'driver' in request.fixturenames else None

    yield

    if driver_instance is not None:
        browser_state_notes = []
        browser_state_cleared = False

        try:
            driver_instance.delete_all_cookies()
            browser_state_notes.append('cookies cleared')
            browser_state_cleared = True
        except Exception as exc:
            browser_state_notes.append(f'cookie cleanup skipped: {exc}')

        try:
            driver_instance.execute_script('window.localStorage.clear(); window.sessionStorage.clear();')
            browser_state_notes.append('web storage cleared')
            browser_state_cleared = True
        except Exception as exc:
            browser_state_notes.append(f'web storage cleanup skipped: {exc}')

        request.node._qa_browser_state_cleared = 'Yes' if browser_state_cleared else 'Attempted'
        _register_teardown_action(request.node, 'Browser state cleanup: ' + '; '.join(browser_state_notes))

        try:
            driver_instance.quit()
            request.node._qa_driver_closed = 'Yes'
            _register_teardown_action(request.node, 'UI driver closed after test case.')
        except Exception as exc:
            request.node._qa_driver_closed = 'Attempted'
            _register_teardown_action(request.node, f'UI driver close raised: {exc}')

    if not getattr(request.node, '_qa_teardown_actions', None):
        _register_teardown_action(request.node, 'No explicit teardown required for this test case.')

    request.node._qa_teardown_summary = ' | '.join(request.node._qa_teardown_actions)


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, 'rep_' + rep.when, rep)

    if 'driver' in getattr(item, 'fixturenames', []):
        driver = getattr(item, 'funcargs', {}).get('driver')
        is_negative = item.get_closest_marker('negative') is not None

        if rep.when == 'call' and rep.passed and is_negative:
            _capture_ui_evidence(item, driver, 'negative_scenario', rep)
        elif rep.failed:
            reason = 'ui_failure' if rep.when == 'call' else f'ui_error_{rep.when}'
            _capture_ui_evidence(item, driver, reason, rep)

    if rep.when == 'teardown':
        case_catalog = getattr(item.config, '_qa_case_catalog', {})
        requirement_catalog = getattr(item.config, '_qa_requirement_catalog', {})
        case_data = case_catalog.get(item.nodeid, {})
        status, phase = _status_from_reports(item)
        artifacts = getattr(item, '_qa_artifacts', {'screenshots': [], 'logs': []})
        executed_at = datetime.now(timezone.utc).isoformat()
        requirement_id = case_data.get('Requirement', '').strip()
        requirement_text = requirement_catalog.get(requirement_id, '')
        expected_result = _derive_expected_result(item, case_data)
        actual_result = _derive_actual_result(item, status)
        _write_testcase_text_log(item, case_data, requirement_text, status, phase, expected_result, actual_result)
        artifacts = getattr(item, '_qa_artifacts', {'screenshots': [], 'logs': []})

        execution_row = {
            'Executed At (UTC)': executed_at,
            'Result': status,
            'Status Phase': phase,
            'TC ID': case_data.get('TC ID', ''),
            'Test Title': case_data.get('Title', item.name),
            'Requirement ID': requirement_id,
            'Scenario Summary': case_data.get('Scenario summary', ''),
            'Level': case_data.get('Level', ''),
            'Type': case_data.get('Type', ''),
            'Technique': case_data.get('Technique', ''),
            'Test Data': _derive_test_data(item, case_data),
            'Automated Script': item.nodeid,
            'Duration (s)': _duration_from_reports(item),
            'Negative Scenario': 'Yes' if item.get_closest_marker('negative') else 'No',
            'Screenshot': ' | '.join(artifacts.get('screenshots', [])),
            'Evidence Log': ' | '.join(artifacts.get('logs', [])),
            'Driver Closed': getattr(item, '_qa_driver_closed', 'No'),
            'Browser State Cleared': getattr(item, '_qa_browser_state_cleared', 'N/A'),
            'Teardown Summary': getattr(item, '_qa_teardown_summary', ''),
            'Notes': _notes_from_reports(item),
        }
        _append_csv_row(item.config._qa_execution_csv, execution_row, list(execution_row.keys()))

        traceability_row = {
            'Requirement ID': requirement_id,
            'Requirement': requirement_text,
            'Scenario': case_data.get('Scenario summary', ''),
            'TC ID': case_data.get('TC ID', ''),
            'Test Title': case_data.get('Title', item.name),
            'Automated Script': item.nodeid,
            'Result': status,
            'Executed At (UTC)': executed_at,
            'Screenshot': ' | '.join(artifacts.get('screenshots', [])),
            'Evidence Log': ' | '.join(artifacts.get('logs', [])),
        }
        _append_csv_row(item.config._qa_traceability_csv, traceability_row, list(traceability_row.keys()))

        teardown_row = {
            'Executed At (UTC)': executed_at,
            'Automated Script': item.nodeid,
            'TC ID': case_data.get('TC ID', ''),
            'Test Title': case_data.get('Title', item.name),
            'Result': status,
            'Driver Closed': getattr(item, '_qa_driver_closed', 'No'),
            'Browser State Cleared': getattr(item, '_qa_browser_state_cleared', 'N/A'),
            'Teardown Summary': getattr(item, '_qa_teardown_summary', ''),
            'Notes': _notes_from_reports(item),
        }
        _append_csv_row(item.config._qa_teardown_csv, teardown_row, list(teardown_row.keys()))

        result_row = {
            'Executed At (UTC)': executed_at,
            'TC ID': case_data.get('TC ID', ''),
            'Summary': case_data.get('Title', item.name),
            'Test Data': _derive_test_data(item, case_data),
            'Result': status,
            'Passed': '1' if status == 'PASSED' else '0',
            'Failed': '1' if status in {'FAILED', 'ERROR'} else '0',
            'Expected': expected_result,
            'Actual': actual_result,
            'Duration (s)': _duration_from_reports(item),
            'Screenshot': ' | '.join(artifacts.get('screenshots', [])),
            'Evidence Log': ' | '.join(artifacts.get('logs', [])),
        }
        _append_csv_row(item.config._qa_results_csv, result_row, list(result_row.keys()))
        item.config._qa_results_rows.append(result_row)
        _append_run_log(item.config, f'TEST RESULT | {item.nodeid} | {status} | phase={phase} | duration={result_row["Duration (s)"]}s')


def pytest_sessionfinish(session, exitstatus):
    _append_run_log(session.config, f'Pytest session finished with exit status {exitstatus}.')


def pytest_terminal_summary(terminalreporter):
    config = terminalreporter.config
    run_dir = config._qa_run_dir
    if config.getoption('--qa-html-report'):
        _render_html_report(config)
        _append_run_log(config, f'HTML report generated: {_relative(config._qa_html_report_file)}')

    _append_run_log(config, 'QA execution finished.')
    terminalreporter.write_sep('-', 'QA runtime evidence')
    terminalreporter.write_line(f'Run folder: {_relative(run_dir)}')
    terminalreporter.write_line(f'Execution log: {_relative(config._qa_run_log_file)}')
    terminalreporter.write_line(f'Execution CSV: {_relative(config._qa_execution_csv)}')
    terminalreporter.write_line(f'Traceability CSV: {_relative(config._qa_traceability_csv)}')
    terminalreporter.write_line(f'Teardown CSV: {_relative(config._qa_teardown_csv)}')
    terminalreporter.write_line(f'Results summary CSV: {_relative(config._qa_results_csv)}')
    terminalreporter.write_line('UI screenshots: see the run folder screenshots/ subdirectory')
    terminalreporter.write_line('UI logs: see the run folder logs/ subdirectory')
    if config.getoption('--qa-html-report'):
        terminalreporter.write_line(f'HTML report: {_relative(config._qa_html_report_file)}')
