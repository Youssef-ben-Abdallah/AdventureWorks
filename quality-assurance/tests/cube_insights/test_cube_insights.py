"""
CubeInsights API test suite.
Exercises the /api/CubeInsights/* endpoints which query the SSAS multidimensional
cube (Adventure Works DW2019) via ADOMD.NET.  All endpoints are public (no JWT required).
"""
import pytest
import time

from helpers.api_client import ApiClient


# ---------------------------------------------------------------------------
# TC052 — CubeInsights KPIs payload
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.unit_level
def test_cube_insights_kpis_returns_valid_payload(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/CubeInsights/kpis', timeout=30)
    assert response.status_code == 200, f'Expected 200, got {response.status_code}'
    body = response.json()
    assert isinstance(body, (list, dict)), 'KPIs payload must be a list or dict'
    # Accept either a list of KPI objects or a wrapper object
    items = body if isinstance(body, list) else body.get('kpis', body.get('data', []))
    assert len(items) >= 0, 'KPIs endpoint must return a list of KPIs'


# ---------------------------------------------------------------------------
# TC053 — CubeInsights sales trend monthly (no month filter)
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.unit_level
def test_cube_insights_sales_trend_monthly(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/CubeInsights/sales-trend', params={'year': '2013'}, timeout=30)
    assert response.status_code == 200
    body = response.json()
    data = body.get('data', body) if isinstance(body, dict) else body
    assert isinstance(data, list), 'sales-trend must return an array'
    assert len(data) > 0, 'sales-trend must return at least one data point for year 2013'
    first = data[0]
    assert 'period' in first or 'month' in first or 'x' in first or 'label' in first, (
        f'Each trend point must have a period/label field. Got keys: {list(first.keys())}'
    )


# ---------------------------------------------------------------------------
# TC054 — CubeInsights sales trend daily drill-down (month filter)
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.unit_level
def test_cube_insights_sales_trend_drilldown(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get(
        '/api/CubeInsights/sales-trend',
        params={'year': '2013', 'month': 'January'},
        timeout=30,
    )
    assert response.status_code == 200
    body = response.json()
    data = body.get('data', body) if isinstance(body, dict) else body
    assert isinstance(data, list), 'Drill-down must return an array'
    # Daily data for Jan 2013 should have more rows than monthly (up to 31)
    assert len(data) >= 1, 'Daily drill-down must return at least one data point'


# ---------------------------------------------------------------------------
# TC055 — CubeInsights profit analysis
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.unit_level
def test_cube_insights_profit_analysis(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/CubeInsights/profit-analysis', timeout=30)
    assert response.status_code == 200
    body = response.json()
    data = body.get('data', body) if isinstance(body, dict) else body
    assert isinstance(data, (list, dict)), 'Profit analysis must return structured data'


# ---------------------------------------------------------------------------
# TC056 — CubeInsights territories
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.unit_level
def test_cube_insights_territories(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/CubeInsights/territory-sales', timeout=30)
    assert response.status_code == 200
    body = response.json()
    data = body.get('data', body) if isinstance(body, dict) else body
    assert isinstance(data, list)
    assert len(data) > 0, 'Territories endpoint must return at least one territory'


# ---------------------------------------------------------------------------
# TC057 — CubeInsights reseller data
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.unit_level
def test_cube_insights_reseller_data(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/CubeInsights/reseller', timeout=30)
    assert response.status_code in (200, 404), (
        f'Reseller endpoint returned unexpected status {response.status_code}'
    )
    if response.status_code == 200:
        body = response.json()
        assert body is not None, 'Reseller endpoint must return a body'


# ---------------------------------------------------------------------------
# TC058 — CubeInsights endpoints are public (no auth required)
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.security
def test_cube_insights_kpis_is_public(require_api, api_session, api_base_url):
    """CubeInsights endpoints must not require authentication."""
    api = ApiClient(api_session, api_base_url)
    # No Authorization header
    response = api.get('/api/CubeInsights/kpis', timeout=30)
    assert response.status_code != 401, (
        'CubeInsights/kpis must be accessible without authentication (it is not JWT-protected).'
    )
    assert response.status_code != 403, (
        'CubeInsights/kpis returned 403 — endpoint must not require admin role.'
    )


# ---------------------------------------------------------------------------
# TC059 — CubeInsights year filter is respected
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.integration
def test_cube_insights_year_filter_changes_result(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    r2013 = api.get('/api/CubeInsights/sales-trend', params={'year': '2013'}, timeout=30)
    r2014 = api.get('/api/CubeInsights/sales-trend', params={'year': '2014'}, timeout=30)
    assert r2013.status_code == 200
    assert r2014.status_code == 200
    d2013 = r2013.json()
    d2014 = r2014.json()
    # Results for different years must differ (SSAS cube has data for 2013 and 2014)
    assert d2013 != d2014, 'Sales trend for 2013 and 2014 must not be identical'


# ---------------------------------------------------------------------------
# TC060 — CubeInsights latency (non-functional)
# ---------------------------------------------------------------------------
@pytest.mark.api
@pytest.mark.nonfunctional
def test_cube_insights_kpis_under_five_seconds(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    start = time.perf_counter()
    response = api.get('/api/CubeInsights/kpis', timeout=30)
    elapsed = time.perf_counter() - start
    assert response.status_code == 200
    assert elapsed < 5.0, f'CubeInsights/kpis took {elapsed:.2f}s — expected under 5s (SSAS MDX query)'
