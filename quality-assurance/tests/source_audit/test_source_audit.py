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
    _require_path(find_known_file(source_root, 'cart_service'))
    report = run_static_audit(source_root)
    assert 'Stock is decremented when an order is created.' in report['fixed']
    assert 'Cart manual quantity updates are capped by stock quantity.' in report['fixed']
    assert 'Stable data-testid selectors were added to key pages for Selenium automation.' in report['fixed']


@pytest.mark.static
def test_key_pages_have_stable_test_ids(source_root):
    pages = [
        find_known_file(source_root, 'login_html'),
        find_known_file(source_root, 'navbar_html'),
        find_known_file(source_root, 'products_html'),
        find_known_file(source_root, 'cart_html'),
    ]
    for page in pages:
        assert selector_attr_present(_require_path(page).read_text(encoding='utf-8'))


@pytest.mark.static
def test_scanned_images_have_alt_attributes(source_root):
    html_files = find_html_files(source_root)
    if not html_files:
        pytest.skip('Angular HTML files were not found for the accessibility scan.')
    missing = missing_accessible_images(html_files, source_root)
    assert not missing
