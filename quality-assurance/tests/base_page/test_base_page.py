import pytest

try:
    from pages.base_page import BasePage
    BASE_PAGE_AVAILABLE = True
except Exception:
    BasePage = None
    BASE_PAGE_AVAILABLE = False


@pytest.mark.ui
@pytest.mark.unit_level
@pytest.mark.skipif(not BASE_PAGE_AVAILABLE, reason='Base page dependencies are not available in this environment.')
def test_by_testid_returns_css_selector_tuple():
    class DummyDriver:
        wait = object()

    page = BasePage(DummyDriver())
    by = page.by_testid('sample-id')
    assert by == ('css selector', '[data-testid="sample-id"]')


@pytest.mark.ui
@pytest.mark.unit_level
@pytest.mark.skipif(not BASE_PAGE_AVAILABLE, reason='Base page dependencies are not available in this environment.')
def test_open_delegates_to_driver_get():
    calls = []

    class DummyDriver:
        wait = object()

        def get(self, url):
            calls.append(url)

    page = BasePage(DummyDriver())
    page.open('http://localhost:4200/products')
    assert calls == ['http://localhost:4200/products']
