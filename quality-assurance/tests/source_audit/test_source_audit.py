import pytest

from helpers.static_audit import (
    find_html_files,
    find_known_file,
    img_tag_is_accessible,
    missing_accessible_images,
    run_static_audit,
    selector_attr_present,
)


def _require_path(path):
    if path is None or not path.exists():
        pytest.skip(f'Required source path not found: {path}')
    return path


@pytest.mark.static
@pytest.mark.regression
def test_static_audit_detects_key_improvements(source_root):
    _require_path(find_known_file(source_root, 'program'))
    _require_path(find_known_file(source_root, 'orders_controller'))
    # React migration: cart_service key now points to CartContext.tsx
    _require_path(find_known_file(source_root, 'cart_service'))
    report = run_static_audit(source_root)
    assert 'Stock is decremented when an order is created.' in report['fixed']
    assert 'Cart manual quantity updates are capped by stock quantity.' in report['fixed']
    assert 'Stable data-testid selectors were added to key pages for Selenium automation.' in report['fixed']


@pytest.mark.static
def test_key_pages_have_stable_test_ids(source_root):
    # React migration: pages are .tsx files, not .component.html templates
    pages = [
        find_known_file(source_root, 'login_html'),    # Login.tsx
        find_known_file(source_root, 'navbar_html'),   # Navbar.tsx
        find_known_file(source_root, 'products_html'), # Products.tsx
        find_known_file(source_root, 'cart_html'),     # Cart.tsx
    ]
    for page in pages:
        assert selector_attr_present(_require_path(page).read_text(encoding='utf-8'))


@pytest.mark.static
def test_scanned_images_have_alt_attributes(source_root):
    # React migration: scans .tsx files (find_html_files returns .tsx after update)
    tsx_files = find_html_files(source_root)
    if not tsx_files:
        pytest.skip('React TSX component files were not found for the accessibility scan.')
    missing = missing_accessible_images(tsx_files, source_root)
    assert not missing, f'Image tags without alt in: {missing}'


@pytest.mark.static
def test_cart_context_caps_quantity_to_stock(source_root):
    """CartContext.tsx must cap setQty and add() to product.stockQty via Math.min."""
    from helpers.static_audit import looks_like_cart_stock_cap
    cart = find_known_file(source_root, 'cart_service')
    text = _require_path(cart).read_text(encoding='utf-8')
    assert looks_like_cart_stock_cap(text), (
        'CartContext.tsx does not appear to cap quantity updates to available stock.'
    )


@pytest.mark.static
def test_react_app_entry_point_exists(source_root):
    """Confirm the React entry point (App.tsx) is present — verifies migration from Angular."""
    from helpers.static_audit import find_known_file as _find
    from pathlib import Path
    app_tsx = None
    for p in source_root.rglob('App.tsx'):
        if p.is_file():
            app_tsx = p
            break
    assert app_tsx is not None and app_tsx.exists(), (
        'App.tsx not found — React migration entry point is missing.'
    )
