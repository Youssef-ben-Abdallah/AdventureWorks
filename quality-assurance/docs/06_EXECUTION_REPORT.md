# 06 - Execution report

## What was validated inside this container
- Static source inspection suite collection and execution can be validated locally in this container.
- API/UI dynamic execution cannot be fully completed here because the backend runtime is not started in this container.

## Recommended execution commands on the project machine
### Static
```bash
pytest tests/source_audit tests/base_page tests/cart_page tests/navbar_page -v
```

### API
```bash
pytest tests/login_page tests/products_page tests/orders_page tests/admin_page tests/dashboard_page --run-api -v
```

### UI
```bash
pytest tests --run-ui -v
```

### Full QA validation with HTML report
```bash
pytest --run-api --run-ui --qa-html-report -v
```

## Generated deliverables at execution time
Every run creates a new timestamped folder under `reports/runs/`.

Main outputs:
- `execution.log`: general execution log with full UTC timestamps
- `execution_results.csv`: one execution row per test case
- `traceability_results.csv`: requirement traceability result table
- `teardown_results.csv`: teardown status per test case
- `results_summary.csv`: readable result table with **summary, passed, failed, expected, actual, screenshot, and evidence log**
- `screenshots/`: visual evidence for negative UI scenarios and failed/error UI tests
- `logs/`: one execution log text file for every test case, with extra browser/assertion logs when UI evidence is captured
- `qa_execution_report.html`: styled HTML report with colored status cards and a detailed execution table

## Execution evidence expectations
- Negative UI scenarios such as invalid login or blocked admin access are marked with `@pytest.mark.negative`.
- These scenarios always save screenshots and browser logs even if they pass.
- Any UI failure or unexpected error also saves the same artifacts automatically.
- HTML source capture was removed from the reporting flow.
- The traceability CSV provides the grading-friendly chain: **Exigence → Scénario → Cas de test → Résultat**.
- The teardown CSV provides one post-condition record per executed test case, including browser cleanup and driver closure for UI tests.

## Validation completed during packaging
- `pytest tests -q` can still be executed locally in this container; API and UI suites skip unless the required services and flags are supplied.`
- `pytest --collect-only -q` can be used to confirm suite discovery after extraction on the project machine.
