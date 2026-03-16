# Quality assurance package (Python only)

This folder contains a **Python-only** test approach for the project, aligned with the guideline:
- static testing
- functional testing
- non-functional testing
- unit-level, integration, and system-level coverage
- Selenium + pytest automation using Page Object Model
- traceability and reporting deliverables

## Structure
- `helpers/` reusable API, data, and static-audit helpers
- `pages/` Selenium Page Object Model classes
- `tests/base_page/` helper and shared page-behavior checks
- `tests/login_page/` login/auth tests across API and UI
- `tests/products_page/` product and catalog tests across API, UI, integration, and performance
- `tests/cart_page/` cart-related UI and source checks
- `tests/orders_page/` order workflow tests across API, integration, UI, performance, and source inspection
- `tests/admin_page/` admin management and admin-route coverage
- `tests/dashboard_page/` dashboard API and performance checks
- `tests/navbar_page/` navbar/logout coverage
- `tests/source_audit/` cross-cutting static audit and accessibility checks
- `docs/` required deliverables and evidence
- `reports/runs/<timestamp>/` runtime outputs for each execution

## Install
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Runtime configuration
Set the execution values directly in `pytest.ini`:

```ini
api_base_url = https://localhost:57240
ui_base_url = http://localhost:4200
admin_username = admin
admin_password = Admin123!
browser = chrome
source_root = C:/path/to/your/app/root  # optional but recommended for static source tests
ui_step_delay_seconds = 1.0
```

`ui_step_delay_seconds` adds a small pause after UI actions so Selenium runs are easier to visualize.
`source_root` can point directly to the application repository root when the QA package is stored separately from the source code. You can also set `QA_SOURCE_ROOT` as an environment variable instead.
You can still override the browser from the CLI with `--browser=edge` when needed.

## Run static checks
```bash
pytest tests/source_audit tests/base_page tests/cart_page tests/navbar_page -v
```

## Run API suites
```bash
pytest tests/login_page tests/products_page tests/orders_page tests/admin_page tests/dashboard_page --run-api -v
```

## Run UI suites
```bash
pytest tests --run-ui -v
```

## Run full validation with styled HTML report
```bash
pytest --run-api --run-ui --qa-html-report -v
```

## Runtime evidence now generated automatically
Each execution gets its own timestamped folder under `reports/runs/`.

Generated files per run:
- `execution.log`: full execution log with precise UTC timestamps
- `execution_results.csv`: detailed execution rows per test case
- `traceability_results.csv`: **Exigence → Scénario → Cas de test → Résultat**
- `teardown_results.csv`: teardown confirmation per test case
- `results_summary.csv`: summary table with result, expected, actual, screenshot, and log paths
- `screenshots/`: screenshots for all negative UI scenarios and for failed/error UI tests
- `logs/`: one text execution log per test case, plus any extra browser/assertion logs for negative or failed UI tests
- `qa_execution_report.html`: styled HTML report when `--qa-html-report` is used

## Notes
- API suites expect the backend to be running locally.
- UI suites expect both backend and Angular frontend to be running locally.
- Self-signed development certificates are tolerated by the test client and browser options.
- The old `.env` runtime configuration approach was removed; shared test settings now live in `pytest.ini`.
- Negative UI scenarios are marked with `@pytest.mark.negative` so evidence is collected even when they pass.
- Every test case has teardown logging; UI tests also clear browser state and close the driver after each test.
- HTML page source capture was removed because screenshots are more useful for this project.


## Authors

- **Youssef Ben Abdallah**
- **Mariem Ben Slim**
