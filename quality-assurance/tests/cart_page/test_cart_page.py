from pathlib import Path

import pytest

from helpers.static_audit import find_known_file, looks_like_cart_stock_cap

try:
    from pages.cart_page import CartPage
    CART_PAGE_AVAILABLE = True
except Exception:
    CartPage = None
    CART_PAGE_AVAILABLE = False


def _require_file(path: Path):
    if not path.exists():
        pytest.skip(f'Required source file not found: {path}')
    return path


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.negative
@pytest.mark.skipif(not CART_PAGE_AVAILABLE, reason='Selenium/page dependencies are not available for cart UI tests.')
def test_guest_is_redirected_to_login_when_opening_cart(driver, ui_base_url):
    driver.get(f'{ui_base_url}/cart')
    driver.wait.until(lambda d: 'Access Denied' in d.page_source)
    driver.ui_pause('redirect guest cart to access denied')
    assert 'Access Denied' in driver.page_source


@pytest.mark.static
def test_cart_setqty_is_capped_to_stock(source_root: Path):
    # React migration: cart_service key now points to CartContext.tsx (was cart.service.ts)
    cart_service = find_known_file(source_root, 'cart_service')
    text = _require_file(cart_service or (source_root / 'CartContext.tsx')).read_text(encoding='utf-8')
    assert looks_like_cart_stock_cap(text)


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.skipif(not CART_PAGE_AVAILABLE, reason='Selenium/page dependencies not available.')
def test_cart_clear_empties_cart(driver, ui_base_url):
    """Add a product to cart then clear it — cart must become empty."""
    from selenium.webdriver.support import expected_conditions as EC
    from pages.login_page import LoginPage
    from pages.products_page import ProductsPage
    from pages.navbar_page import NavbarPage
    import time

    stamp = str(int(time.time()))
    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.register(f'cartclr_{stamp}', f'cartclr_{stamp}@t.test', 'User123!')
    driver.wait.until(EC.url_to_be(f'{ui_base_url}/'))
    driver.ui_pause('registered for cart clear test')

    driver.get(f'{ui_base_url}/products')
    products = ProductsPage(driver)
    products.wait_for_cards(1)
    products.add_first_product_to_cart()
    time.sleep(1) # wait for React state to update before navigating away
    driver.ui_pause('added product to cart')

    driver.get(f'{ui_base_url}/cart')
    cart = CartPage(driver)
    driver.ui_pause('cart page loaded')
    assert cart.item_count() >= 1, 'Cart must contain at least one item before clearing.'

    cart.clear()
    driver.ui_pause('cart cleared')
    # After clearing, cart should show empty state
    assert cart.item_count() == 0 or 'empty' in driver.page_source.lower() or 'no item' in driver.page_source.lower()
