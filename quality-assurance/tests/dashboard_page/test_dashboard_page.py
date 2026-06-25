import pytest

from helpers.api_client import ApiClient

try:
    from selenium.webdriver.support import expected_conditions as EC
    from pages.dashboard_page import DashboardPage
    from pages.login_page import LoginPage
    from pages.navbar_page import NavbarPage
    DASHBOARD_UI_AVAILABLE = True
except Exception:
    EC = None
    DashboardPage = None
    LoginPage = None
    NavbarPage = None
    DASHBOARD_UI_AVAILABLE = False


@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.security
def test_dashboard_filters_requires_admin(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    api = ApiClient(api_session, api_base_url, default_headers=auth)
    response = api.get('/api/dashboard/filters', timeout=20)
    assert response.status_code == 403


@pytest.mark.api
@pytest.mark.unit_level
def test_admin_filters_returns_reference_lists(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = api.get('/api/dashboard/filters', timeout=20)
    assert response.status_code == 200
    body = response.json()
    for key in ['territories', 'territoryGroups', 'salesPeople', 'shipMethods', 'productCategories', 'productSubCategories', 'currencies']:
        assert key in body


@pytest.mark.api
@pytest.mark.unit_level
def test_overview_returns_kpis(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = api.get('/api/dashboard/overview', params={'from': '2011-01-01T00:00:00.000Z', 'to': '2014-12-30T00:00:00.000Z'}, timeout=30)
    assert response.status_code == 200
    body = response.json()
    assert 'kpis' in body
    assert 'revenueTrend' in body


@pytest.mark.api
@pytest.mark.unit_level
def test_details_endpoint_is_paginated(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = api.get('/api/dashboard/details', params={'page': 1, 'pageSize': 10}, timeout=30)
    assert response.status_code == 200
    body = response.json()
    assert body['page'] == 1
    assert body['pageSize'] == 10
    assert 'items' in body


@pytest.mark.api
@pytest.mark.nonfunctional
def test_dashboard_filters_under_two_point_five_seconds(require_api, api_session, api_base_url, admin_auth_header):
    import time
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    start = time.perf_counter()
    response = api.get('/api/dashboard/filters', timeout=30)
    elapsed = time.perf_counter() - start
    assert response.status_code == 200
    assert elapsed < 2.5


@pytest.mark.api
@pytest.mark.unit_level
def test_dashboard_products_tab_returns_data(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = api.get(
        '/api/dashboard/products',
        params={'from': '2011-01-01T00:00:00.000Z', 'to': '2014-12-30T00:00:00.000Z'},
        timeout=30,
    )
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, dict), 'Products tab must return a dict'


@pytest.mark.api
@pytest.mark.unit_level
def test_dashboard_customers_tab_returns_data(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = api.get(
        '/api/dashboard/customers',
        params={'from': '2011-01-01T00:00:00.000Z', 'to': '2014-12-30T00:00:00.000Z'},
        timeout=30,
    )
    assert response.status_code == 200


@pytest.mark.api
@pytest.mark.unit_level
def test_dashboard_shipping_tab_returns_data(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = api.get(
        '/api/dashboard/shipping',
        params={'from': '2011-01-01T00:00:00.000Z', 'to': '2014-12-30T00:00:00.000Z'},
        timeout=30,
    )
    assert response.status_code == 200


@pytest.mark.api
@pytest.mark.unit_level
def test_dashboard_sales_team_tab_returns_data(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = api.get(
        '/api/dashboard/sales-team',
        params={'from': '2011-01-01T00:00:00.000Z', 'to': '2014-12-30T00:00:00.000Z'},
        timeout=30,
    )
    assert response.status_code == 200


@pytest.mark.api
@pytest.mark.unit_level
def test_overview_territory_filter_applied(require_api, api_session, api_base_url, admin_auth_header):
    """Verify that applying a territory filter produces different results than no filter."""
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    base = api.get(
        '/api/dashboard/overview',
        params={'from': '2013-01-01T00:00:00.000Z', 'to': '2013-12-31T23:59:59.000Z'},
        timeout=30,
    )
    assert base.status_code == 200

    filters_resp = api.get('/api/dashboard/filters', timeout=20)
    filters_resp.raise_for_status()
    territories = filters_resp.json().get('territories', [])
    if not territories:
        pytest.skip('No territories in filters — cannot test territory filter.')

    territory_id = territories[0].get('id') or territories[0].get('territoryId')
    if territory_id is None:
        pytest.skip('Territory object does not expose an id field.')

    filtered = api.get(
        '/api/dashboard/overview',
        params={'from': '2013-01-01T00:00:00.000Z', 'to': '2013-12-31T23:59:59.000Z', 'territoryId': territory_id},
        timeout=30,
    )
    assert filtered.status_code == 200
    assert filtered.json() != base.json(), 'Applying a territory filter must change the overview response.'


@pytest.mark.api
@pytest.mark.unit_level
def test_details_page_boundary_values(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    r1 = api.get('/api/dashboard/details', params={'page': 1, 'pageSize': 5}, timeout=30)
    r2 = api.get('/api/dashboard/details', params={'page': 2, 'pageSize': 5}, timeout=30)
    assert r1.status_code == 200
    assert r2.status_code == 200
    b1 = r1.json()
    b2 = r2.json()
    assert b1['page'] == 1
    assert b2['page'] == 2
    if b1.get('totalCount', 10) > 5:
        assert b1['items'] != b2['items'], 'Page 1 and page 2 must return different items.'


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.skipif(not DASHBOARD_UI_AVAILABLE, reason='Selenium/page dependencies not available.')
def test_dashboard_kpi_cards_render_in_react(driver, ui_base_url, admin_credentials):
    """Verify React KpiCards component renders in the browser after admin login."""
    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.login(admin_credentials['username'], admin_credentials['password'])

    nav = NavbarPage(driver)
    driver.wait.until(EC.visibility_of_element_located(nav.by_testid('nav-dashboard')))
    nav.open_dashboard()
    driver.ui_pause('navigated to dashboard')

    dashboard = DashboardPage(driver)
    dashboard.ready()
    driver.ui_pause('dashboard kpis loaded')

    assert dashboard.kpi_count() > 0, 'React KpiCards must render at least one KPI card.'
