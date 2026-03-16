from pathlib import Path

import pytest

from helpers.api_client import ApiClient
from helpers.data_factory import category_name, subcategory_name, product_payload
from helpers.static_audit import find_known_file, looks_like_conflict_handling

try:
    from selenium.webdriver.support import expected_conditions as EC
    from pages.admin_page import AdminPage
    from pages.dashboard_page import DashboardPage
    from pages.login_page import LoginPage
    from pages.navbar_page import NavbarPage
    ADMIN_PAGE_AVAILABLE = True
except Exception:
    EC = None
    AdminPage = None
    DashboardPage = None
    LoginPage = None
    NavbarPage = None
    ADMIN_PAGE_AVAILABLE = False


def _require_file(path: Path):
    if not path.exists():
        pytest.skip(f'Required source file not found: {path}')
    return path


@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.security
def test_category_create_requires_admin(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.post('/api/categories', json={'name': category_name()}, timeout=20)
    assert response.status_code == 401


@pytest.mark.api
@pytest.mark.unit_level
def test_admin_can_create_update_delete_category(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    create = api.post('/api/categories', json={'name': category_name()}, timeout=20)
    assert create.status_code == 201
    category_id = create.json()['id']

    update = api.put(f'/api/categories/{category_id}', json={'name': category_name()}, timeout=20)
    assert update.status_code == 204

    delete = api.delete(f'/api/categories/{category_id}', timeout=20)
    assert delete.status_code == 204


@pytest.mark.api
@pytest.mark.unit_level
def test_admin_can_create_update_delete_subcategory(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    create_cat = api.post('/api/categories', json={'name': category_name()}, timeout=20)
    create_cat.raise_for_status()
    cat_id = create_cat.json()['id']

    create_sub = api.post('/api/subcategories', json={'name': subcategory_name(), 'categoryId': cat_id}, timeout=20)
    assert create_sub.status_code == 201
    sub_id = create_sub.json()['id']

    update_sub = api.put(f'/api/subcategories/{sub_id}', json={'name': subcategory_name(), 'categoryId': cat_id}, timeout=20)
    assert update_sub.status_code == 204

    delete_sub = api.delete(f'/api/subcategories/{sub_id}', timeout=20)
    assert delete_sub.status_code == 204
    api.delete(f'/api/categories/{cat_id}', timeout=20)


@pytest.mark.api
@pytest.mark.unit_level
def test_admin_can_create_update_delete_product(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    cat = api.post('/api/categories', json={'name': category_name()}, timeout=20)
    cat.raise_for_status()
    cat_id = cat.json()['id']
    sub = api.post('/api/subcategories', json={'name': subcategory_name(), 'categoryId': cat_id}, timeout=20)
    sub.raise_for_status()
    sub_id = sub.json()['id']

    payload = product_payload(cat_id, sub_id)
    create = api.post('/api/products', json=payload, timeout=20)
    assert create.status_code == 201
    product_id = create.json()['id']

    payload['name'] = payload['name'] + ' Updated'
    update = api.put(f'/api/products/{product_id}', json=payload, timeout=20)
    assert update.status_code == 204

    delete = api.delete(f'/api/products/{product_id}', timeout=20)
    assert delete.status_code == 204
    api.delete(f'/api/subcategories/{sub_id}', timeout=20)
    api.delete(f'/api/categories/{cat_id}', timeout=20)


@pytest.mark.api
@pytest.mark.unit_level
def test_duplicate_sku_rejected(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    cat = api.post('/api/categories', json={'name': category_name()}, timeout=20)
    cat.raise_for_status()
    cat_id = cat.json()['id']
    sub = api.post('/api/subcategories', json={'name': subcategory_name(), 'categoryId': cat_id}, timeout=20)
    sub.raise_for_status()
    sub_id = sub.json()['id']

    payload = product_payload(cat_id, sub_id)
    first = api.post('/api/products', json=payload, timeout=20)
    assert first.status_code == 201
    product_id = first.json()['id']
    second = api.post('/api/products', json=payload, timeout=20)
    assert second.status_code == 400
    api.delete(f'/api/products/{product_id}', timeout=20)
    api.delete(f'/api/subcategories/{sub_id}', timeout=20)
    api.delete(f'/api/categories/{cat_id}', timeout=20)


@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.security
def test_invalid_image_extension_rejected(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url)
    products = api.get('/api/products', timeout=20)
    products.raise_for_status()
    first = products.json()[0]
    response = api.post(
        f'/api/products/{first["id"]}/image',
        headers=admin_auth_header,
        files={'file': ('attack.txt', b'not an image', 'text/plain')},
        timeout=20,
    )
    assert response.status_code == 400


@pytest.mark.api
@pytest.mark.integration
@pytest.mark.confirmation
def test_delete_referenced_product_returns_conflict(require_api, api_session, api_base_url, admin_auth_header, user_auth_header):
    admin_api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    _, auth = user_auth_header
    user_api = ApiClient(api_session, api_base_url, default_headers=auth)

    products = admin_api.get('/api/products', timeout=20)
    products.raise_for_status()
    target = next(p for p in products.json() if p['stockQty'] > 0)
    created = user_api.post('/api/orders', json={'items': [{'productId': target['id'], 'qty': 1}]}, timeout=20)
    created.raise_for_status()

    delete = admin_api.delete(f'/api/products/{target["id"]}', timeout=20)
    assert delete.status_code == 409




@pytest.mark.api
@pytest.mark.nonfunctional
@pytest.mark.security
def test_non_admin_endpoint_returns_403(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    api = ApiClient(api_session, api_base_url, default_headers=auth)
    response = api.get('/api/orders', timeout=20)
    assert response.status_code == 403

@pytest.mark.ui
@pytest.mark.system
@pytest.mark.regression
@pytest.mark.skipif(not ADMIN_PAGE_AVAILABLE, reason='Selenium/page dependencies are not available for admin UI tests.')
def test_admin_can_login_and_open_admin_and_dashboard(driver, ui_base_url, admin_credentials):
    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.login(admin_credentials['username'], admin_credentials['password'])

    nav = NavbarPage(driver)
    driver.wait.until(EC.visibility_of_element_located(nav.by_testid('nav-admin')))
    nav.open_admin()
    driver.ui_pause('admin navigation opened')
    driver.wait.until(EC.url_contains('/admin'))

    admin = AdminPage(driver)
    admin.ready()
    driver.ui_pause('admin page ready')

    nav.open_dashboard()
    driver.ui_pause('dashboard navigation opened')
    dashboard = DashboardPage(driver)
    dashboard.ready()
    driver.ui_pause('dashboard page ready')

    assert '/dashboard' in driver.current_url


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.negative
@pytest.mark.skipif(not ADMIN_PAGE_AVAILABLE, reason='Selenium/page dependencies are not available for admin UI tests.')
def test_non_admin_user_is_redirected_from_admin_route(driver, ui_base_url):
    import time
    stamp = str(int(time.time()))
    username = f'user_{stamp}'
    email = f'user_{stamp}@local.test'
    password = 'User123!'

    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.register(username, email, password)

    driver.wait.until(EC.url_to_be(f'{ui_base_url}/'))
    driver.ui_pause('user login completed')
    driver.get(f'{ui_base_url}/admin')
    driver.wait.until(lambda d: '/admin' not in d.current_url)
    driver.ui_pause('non-admin redirected away from admin')
    assert '/admin' not in driver.current_url


@pytest.mark.static
def test_delete_actions_handle_conflicts_gracefully(source_root: Path):
    files = [
        find_known_file(source_root, 'categories_controller') or (source_root / 'CategoriesController.cs'),
        find_known_file(source_root, 'subcategories_controller') or (source_root / 'SubCategoriesController.cs'),
        find_known_file(source_root, 'products_controller') or (source_root / 'ProductsController.cs'),
    ]
    for path in files:
        text = _require_file(path).read_text(encoding='utf-8')
        assert looks_like_conflict_handling(text)
