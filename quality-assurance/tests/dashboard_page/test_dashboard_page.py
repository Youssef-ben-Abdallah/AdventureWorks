import pytest

from helpers.api_client import ApiClient


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
