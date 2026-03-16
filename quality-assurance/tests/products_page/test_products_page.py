import pytest

from helpers.api_client import ApiClient

try:
    from selenium.webdriver.common.by import By
    from pages.products_page import ProductsPage
    PRODUCTS_PAGE_AVAILABLE = True
except Exception:
    By = None
    ProductsPage = None
    PRODUCTS_PAGE_AVAILABLE = False


@pytest.mark.api
@pytest.mark.unit_level
def test_products_list_is_public_and_non_empty(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/products', timeout=20)
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) > 0


@pytest.mark.api
@pytest.mark.unit_level
def test_product_by_id_returns_shape(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    products = api.get('/api/products', timeout=20)
    products.raise_for_status()
    first = products.json()[0]
    response = api.get(f'/api/products/{first["id"]}', timeout=20)
    assert response.status_code == 200
    body = response.json()
    for field in ['id', 'sku', 'name', 'price', 'stockQty', 'categoryId', 'subCategoryId']:
        assert field in body


@pytest.mark.api
@pytest.mark.unit_level
def test_unknown_product_returns_404(require_api, api_session, api_base_url):
    api = ApiClient(api_session, api_base_url)
    response = api.get('/api/products/99999999', timeout=20)
    assert response.status_code == 404


@pytest.mark.api
@pytest.mark.integration
def test_admin_catalog_changes_are_visible_in_public_products(require_api, api_session, api_base_url, admin_auth_header):
    from helpers.data_factory import category_name, subcategory_name, product_payload
    admin_api = ApiClient(api_session, api_base_url, default_headers=admin_auth_header)
    public_api = ApiClient(api_session, api_base_url)

    cat = admin_api.post('/api/categories', json={'name': category_name()}, timeout=20)
    cat.raise_for_status()
    cat_id = cat.json()['id']
    sub = admin_api.post('/api/subcategories', json={'name': subcategory_name(), 'categoryId': cat_id}, timeout=20)
    sub.raise_for_status()
    sub_id = sub.json()['id']
    payload = product_payload(cat_id, sub_id)
    created = admin_api.post('/api/products', json=payload, timeout=20)
    created.raise_for_status()
    product_id = created.json()['id']

    public_view = public_api.get(f'/api/products/{product_id}', timeout=20)
    assert public_view.status_code == 200
    assert public_view.json()['name'] == payload['name']
    admin_api.delete(f'/api/products/{product_id}', timeout=20)
    admin_api.delete(f'/api/subcategories/{sub_id}', timeout=20)
    admin_api.delete(f'/api/categories/{cat_id}', timeout=20)


@pytest.mark.api
@pytest.mark.nonfunctional
def test_products_response_under_two_seconds(require_api, api_session, api_base_url):
    import time
    api = ApiClient(api_session, api_base_url)
    start = time.perf_counter()
    response = api.get('/api/products', timeout=20)
    elapsed = time.perf_counter() - start
    assert response.status_code == 200
    assert elapsed < 2.0


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.skipif(not PRODUCTS_PAGE_AVAILABLE, reason='Selenium/page dependencies are not available for products UI tests.')
def test_products_pagination_controls_work(driver, ui_base_url):
    def _is_disabled(element):
        disabled_attr = (element.get_attribute('disabled') or '').lower()
        aria_disabled = (element.get_attribute('aria-disabled') or '').lower()
        classes = (element.get_attribute('class') or '').lower()
        return disabled_attr in {'true', 'disabled'} or aria_disabled == 'true' or 'disabled' in classes

    def _snapshot():
        body = driver.find_element(By.TAG_NAME, 'body').text
        cards = driver.find_elements(By.CSS_SELECTOR, '.product-card')
        card_text = ' | '.join(card.text.strip() for card in cards[:3])
        next_buttons = driver.find_elements(*products.by_testid('products-next-page'))
        prev_buttons = driver.find_elements(*products.by_testid('products-prev-page'))
        next_disabled = _is_disabled(next_buttons[0]) if next_buttons else True
        prev_disabled = _is_disabled(prev_buttons[0]) if prev_buttons else True
        return {
            'url': driver.current_url,
            'body': body,
            'card_text': card_text,
            'next_disabled': next_disabled,
            'prev_disabled': prev_disabled,
        }

    driver.get(f'{ui_base_url}/products')
    products = ProductsPage(driver)
    initial = _snapshot()

    next_buttons = driver.find_elements(*products.by_testid('products-next-page'))
    if not next_buttons:
        pytest.skip('Pagination next button is not present on the products page.')
    if initial['next_disabled']:
        pytest.skip('Pagination is not available with the current seeded data set.')

    products.next_page()
    driver.ui_pause('products pagination next page clicked')

    def _page_changed(_driver):
        current = _snapshot()
        return (
            current['url'] != initial['url']
            or current['card_text'] != initial['card_text']
            or ('page 2' in current['body'].lower())
            or (current['prev_disabled'] != initial['prev_disabled'])
            or (current['next_disabled'] != initial['next_disabled'])
        )

    driver.wait.until(_page_changed)
    updated = _snapshot()
    assert (
        updated['url'] != initial['url']
        or updated['card_text'] != initial['card_text']
        or ('page 2' in updated['body'].lower())
        or (updated['prev_disabled'] != initial['prev_disabled'])
        or (updated['next_disabled'] != initial['next_disabled'])
    )
