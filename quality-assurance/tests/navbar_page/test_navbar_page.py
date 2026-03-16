import pytest

try:
    from selenium.webdriver.support import expected_conditions as EC
    from pages.login_page import LoginPage
    from pages.navbar_page import NavbarPage
    NAVBAR_PAGE_AVAILABLE = True
except Exception:
    EC = None
    LoginPage = None
    NavbarPage = None
    NAVBAR_PAGE_AVAILABLE = False


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.skipif(not NAVBAR_PAGE_AVAILABLE, reason='Selenium/page dependencies are not available for navbar UI tests.')
def test_logout_hides_admin_navigation(driver, ui_base_url, admin_credentials):
    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.login(admin_credentials['username'], admin_credentials['password'])
    nav = NavbarPage(driver)
    driver.wait.until(EC.visibility_of_element_located(nav.by_testid('nav-admin')))
    nav.logout()
    driver.ui_pause('logout clicked')
    driver.wait.until(EC.visibility_of_element_located(nav.by_testid('nav-login')))
    assert not driver.find_elements(*nav.by_testid('nav-admin'))
