import pytest

from helpers.api_client import ApiClient

try:
    from pages.login_page import LoginPage
    LOGIN_PAGE_AVAILABLE = True
except Exception:
    LoginPage = None
    LOGIN_PAGE_AVAILABLE = False


@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.regression
def test_register_returns_token_and_user_role(require_api, api_session, api_base_url, unique_user):
    api = ApiClient(api_session, api_base_url)
    response = api.post('/api/auth/register', json=unique_user, timeout=20)
    assert response.status_code == 200
    body = response.json()
    assert body['token']
    assert body['username'] == unique_user['username']
    assert 'User' in body['roles']


@pytest.mark.api
@pytest.mark.unit_level
def test_login_with_invalid_password_is_rejected(require_api, api_session, api_base_url, unique_user):
    api = ApiClient(api_session, api_base_url)
    api.post('/api/auth/register', json=unique_user, timeout=20).raise_for_status()
    response = api.post('/api/auth/login', json={'username': unique_user['username'], 'password': 'Wrong123!'}, timeout=20)
    assert response.status_code == 401


@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.security
def test_me_requires_auth(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/auth/me', timeout=20)
    assert response.status_code == 401


@pytest.mark.api
@pytest.mark.unit_level
def test_me_returns_identity_after_login(require_api, api_session, api_base_url, unique_user):
    api = ApiClient(api_session, api_base_url)
    api.post('/api/auth/register', json=unique_user, timeout=20).raise_for_status()
    login = api.post('/api/auth/login', json={'username': unique_user['username'], 'password': unique_user['password']}, timeout=20)
    assert login.status_code == 200
    token = login.json()['token']
    me = api.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'}, timeout=20)
    assert me.status_code == 200
    assert me.json()['userName'] == unique_user['username']


@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.security
@pytest.mark.nonfunctional
def test_sql_injection_style_username_does_not_bypass_auth(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    payload = {'username': "admin' OR '1'='1", 'password': "anything' OR '1'='1"}
    response = api.post('/api/auth/login', json=payload, timeout=20)
    assert response.status_code == 401


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.negative
@pytest.mark.skipif(not LOGIN_PAGE_AVAILABLE, reason='Selenium/page dependencies are not available for login UI tests.')
def test_invalid_login_shows_error(driver, ui_base_url):
    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.login('admin', 'Wrong123!')
    assert login.body_contains('Invalid credentials')
    driver.ui_pause('invalid login error displayed')
