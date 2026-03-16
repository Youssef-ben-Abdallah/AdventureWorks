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
    driver.wait.until(lambda d: '/login' in d.current_url)
    driver.ui_pause('redirect guest cart to login')
    assert '/login' in driver.current_url


@pytest.mark.static
def test_cart_setqty_is_capped_to_stock(source_root: Path):
    cart_service = find_known_file(source_root, 'cart_service')
    text = _require_file(cart_service or (source_root / 'cart.service.ts')).read_text(encoding='utf-8')
    assert looks_like_cart_stock_cap(text)
