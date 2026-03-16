from pathlib import Path

import pytest

from helpers.api_client import ApiClient
from helpers.static_audit import find_known_file, looks_like_stock_decrement_logic

try:
    from selenium.webdriver.support import expected_conditions as EC
    from pages.login_page import LoginPage
    from pages.products_page import ProductsPage
    from pages.cart_page import CartPage
    from pages.orders_page import OrdersPage
    ORDERS_PAGE_AVAILABLE = True
except Exception:
    EC = None
    LoginPage = None
    ProductsPage = None
    CartPage = None
    OrdersPage = None
    ORDERS_PAGE_AVAILABLE = False


def _require_file(path: Path):
    if not path.exists():
        pytest.skip(f'Required source file not found: {path}')
    return path


@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.security
def test_orders_mine_requires_auth(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/orders/mine', timeout=20)
    assert response.status_code == 401


@pytest.mark.api
@pytest.mark.unit_level
def test_empty_order_rejected(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    api = ApiClient(api_session, api_base_url, default_headers=auth)
    response = api.post('/api/orders', json={'items': []}, timeout=20)
    assert response.status_code == 400


@pytest.mark.api
@pytest.mark.unit_level
def test_negative_qty_rejected(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    api = ApiClient(api_session, api_base_url, default_headers=auth)
    products = api.get('/api/products', timeout=20)
    products.raise_for_status()
    first = products.json()[0]
    response = api.post('/api/orders', json={'items': [{'productId': first['id'], 'qty': -1}]}, timeout=20)
    assert response.status_code == 400


@pytest.mark.api
@pytest.mark.unit_level
def test_invalid_product_rejected(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    api = ApiClient(api_session, api_base_url, default_headers=auth)
    response = api.post('/api/orders', json={'items': [{'productId': 99999999, 'qty': 1}]}, timeout=20)
    assert response.status_code == 400


@pytest.mark.api
@pytest.mark.unit_level
def test_overstock_order_rejected(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    api = ApiClient(api_session, api_base_url, default_headers=auth)
    products = api.get('/api/products', timeout=20)
    products.raise_for_status()
    first = products.json()[0]
    response = api.post('/api/orders', json={'items': [{'productId': first['id'], 'qty': first['stockQty'] + 1000}]}, timeout=20)
    assert response.status_code == 400


@pytest.mark.api
@pytest.mark.unit_level
def test_valid_order_creation_returns_201_and_items(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    api = ApiClient(api_session, api_base_url, default_headers=auth)
    products = api.get('/api/products', timeout=20)
    products.raise_for_status()
    first = next(p for p in products.json() if p['stockQty'] > 0)
    response = api.post('/api/orders', json={'items': [{'productId': first['id'], 'qty': 1}]}, timeout=20)
    assert response.status_code == 201
    body = response.json()
    assert body['items'][0]['productId'] == first['id']
    assert body['status'] == 0 or body['status'] == 'Pending'


@pytest.mark.api
@pytest.mark.unit_level
def test_my_orders_contains_created_order(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    api = ApiClient(api_session, api_base_url, default_headers=auth)
    products = api.get('/api/products', timeout=20)
    products.raise_for_status()
    first = next(p for p in products.json() if p['stockQty'] > 0)
    created = api.post('/api/orders', json={'items': [{'productId': first['id'], 'qty': 1}]}, timeout=20)
    created.raise_for_status()
    order_id = created.json()['id']
    mine = api.get('/api/orders/mine', timeout=20)
    assert mine.status_code == 200
    assert any(o['id'] == order_id for o in mine.json())


@pytest.mark.api
@pytest.mark.unit_level
@pytest.mark.security
def test_non_owner_cannot_read_foreign_order(require_api, api_session, api_base_url, register_user):
    api = ApiClient(api_session, api_base_url)
    _, first = register_user()
    _, second = register_user()
    headers_first = {'Authorization': f'Bearer {first["token"]}'}
    headers_second = {'Authorization': f'Bearer {second["token"]}'}

    products = api.get('/api/products', timeout=20)
    products.raise_for_status()
    first_product = next(p for p in products.json() if p['stockQty'] > 0)
    created = api.post('/api/orders', headers=headers_first, json={'items': [{'productId': first_product['id'], 'qty': 1}]}, timeout=20)
    created.raise_for_status()
    order_id = created.json()['id']

    response = api.get(f'/api/orders/{order_id}', headers=headers_second, timeout=20)
    assert response.status_code == 403


@pytest.mark.api
@pytest.mark.unit_level
def test_admin_can_list_all_orders(require_api, api_session, api_base_url, admin_auth_header):
    api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = api.get('/api/orders', timeout=20)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.api
@pytest.mark.unit_level
def test_admin_can_update_order_status(require_api, api_session, api_base_url, admin_auth_header, user_auth_header):
    _, auth = user_auth_header
    user_api = ApiClient(api_session, api_base_url, default_headers=auth)
    products = user_api.get('/api/products', timeout=20)
    products.raise_for_status()
    first = next(p for p in products.json() if p['stockQty'] > 0)
    created = user_api.post('/api/orders', json={'items': [{'productId': first['id'], 'qty': 1}]}, timeout=20)
    created.raise_for_status()
    order_id = created.json()['id']

    admin_api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    response = admin_api.patch(f'/api/orders/{order_id}/status', json={'status': 2}, timeout=20)
    assert response.status_code == 204


@pytest.mark.api
@pytest.mark.integration
@pytest.mark.confirmation
def test_stock_decreases_after_order_creation(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    public_api = ApiClient(api_session, api_base_url)
    user_api = ApiClient(api_session, api_base_url, default_headers=auth)

    products_before = public_api.get('/api/products', timeout=20)
    products_before.raise_for_status()
    target = next(p for p in products_before.json() if p['stockQty'] >= 2)
    before_qty = target['stockQty']

    created = user_api.post('/api/orders', json={'items': [{'productId': target['id'], 'qty': 1}]}, timeout=20)
    created.raise_for_status()

    products_after = public_api.get(f'/api/products/{target["id"]}', timeout=20)
    products_after.raise_for_status()
    assert products_after.json()['stockQty'] == before_qty - 1


@pytest.mark.api
@pytest.mark.integration
def test_registered_user_can_browse_order_and_see_history(require_api, api_session, api_base_url, user_auth_header):
    _, auth = user_auth_header
    public_api = ApiClient(api_session, api_base_url)
    user_api = ApiClient(api_session, api_base_url, default_headers=auth)

    products = public_api.get('/api/products', timeout=20)
    products.raise_for_status()
    first = next(p for p in products.json() if p['stockQty'] > 0)

    create_order = user_api.post('/api/orders', json={'items': [{'productId': first['id'], 'qty': 1}]}, timeout=20)
    create_order.raise_for_status()
    order_id = create_order.json()['id']

    my_orders = user_api.get('/api/orders/mine', timeout=20)
    my_orders.raise_for_status()
    assert any(order['id'] == order_id for order in my_orders.json())


@pytest.mark.api
@pytest.mark.nonfunctional
@pytest.mark.security
def test_unauthorized_endpoint_returns_401_not_redirect_html(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/orders/mine', timeout=20)
    assert response.status_code == 401
    assert 'text/html' not in response.headers.get('Content-Type', '').lower()


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.regression
@pytest.mark.confirmation
@pytest.mark.skipif(not ORDERS_PAGE_AVAILABLE, reason='Selenium/page dependencies are not available for orders UI tests.')
def test_user_can_register_browse_add_checkout_and_see_orders(driver, ui_base_url):
    import time
    stamp = str(int(time.time()))
    username = f'user_{stamp}'
    email = f'user_{stamp}@local.test'
    password = 'User123!'

    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.register(username, email, password)

    driver.wait.until(EC.url_to_be(f'{ui_base_url}/'))
    driver.ui_pause('registration completed')
    driver.get(f'{ui_base_url}/products')
    products = ProductsPage(driver)
    assert products.card_count() >= 1
    driver.ui_pause('products page loaded')
    products.add_first_product_to_cart()
    driver.get(f'{ui_base_url}/cart')

    cart = CartPage(driver)
    assert cart.item_count() >= 1
    driver.ui_pause('cart page loaded')
    cart.checkout()

    driver.wait.until(EC.url_contains('/orders'))
    driver.ui_pause('checkout completed')
    orders = OrdersPage(driver)
    assert orders.has_orders()
    driver.ui_pause('orders page visible')


@pytest.mark.static
def test_order_creation_decrements_stock_in_source(source_root: Path):
    orders_controller = find_known_file(source_root, 'orders_controller')
    text = _require_file(orders_controller or (source_root / 'OrdersController.cs')).read_text(encoding='utf-8')
    assert looks_like_stock_decrement_logic(text)
