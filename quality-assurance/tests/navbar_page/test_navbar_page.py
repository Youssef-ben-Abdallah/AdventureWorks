import pytest

try:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from pages.login_page import LoginPage
    from pages.navbar_page import NavbarPage
    NAVBAR_PAGE_AVAILABLE = True
except Exception:
    By = None
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


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.skipif(not NAVBAR_PAGE_AVAILABLE, reason='Selenium/page dependencies not available.')
def test_theme_toggle_changes_body_class(driver, ui_base_url):
    """React ThemeContext applies a class/attribute on <html> or <body> when theme is toggled."""
    driver.get(f'{ui_base_url}/')
    driver.ui_pause('home page loaded')

    html_elem = driver.find_element(By.TAG_NAME, 'html')
    body_elem = driver.find_element(By.TAG_NAME, 'body')

    initial_html_theme = html_elem.get_attribute('data-theme') or ''

    nav = NavbarPage(driver)
    nav.toggle_theme()

    after_html_theme = html_elem.get_attribute('data-theme') or ''

    assert (
        initial_html_theme != after_html_theme
    ), 'Theme toggle must change the data-theme attribute on <html>.'


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.skipif(not NAVBAR_PAGE_AVAILABLE, reason='Selenium/page dependencies not available.')
def test_admin_nav_links_visible_after_login(driver, ui_base_url, admin_credentials):
    """After admin login, navbar must show Admin, Dashboard, and Reseller Insights links."""
    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.login(admin_credentials['username'], admin_credentials['password'])

    nav = NavbarPage(driver)
    driver.wait.until(EC.visibility_of_element_located(nav.by_testid('nav-admin')))
    driver.wait.until(EC.visibility_of_element_located(nav.by_testid('nav-dashboard')))
    driver.wait.until(EC.visibility_of_element_located(nav.by_testid('nav-cube-insights')))

    assert driver.find_elements(*nav.by_testid('nav-admin'))
    assert driver.find_elements(*nav.by_testid('nav-dashboard'))
    assert driver.find_elements(*nav.by_testid('nav-cube-insights'))


@pytest.mark.ui
@pytest.mark.system
@pytest.mark.negative
@pytest.mark.skipif(not NAVBAR_PAGE_AVAILABLE, reason='Selenium/page dependencies not available.')
def test_regular_user_does_not_see_admin_nav(driver, ui_base_url):
    """A regular (non-admin) user must not see Admin, Dashboard, or Reseller Insights nav links."""
    import time
    stamp = str(int(time.time()))
    login = LoginPage(driver)
    login.open(f'{ui_base_url}/login')
    login.register(f'u_{stamp}', f'u_{stamp}@t.test', 'User123!')

    driver.wait.until(EC.url_to_be(f'{ui_base_url}/'))
    driver.ui_pause('regular user registered and redirected')

    nav = NavbarPage(driver)
    assert not driver.find_elements(*nav.by_testid('nav-admin')), 'nav-admin must not be visible for regular users.'
    assert not driver.find_elements(*nav.by_testid('nav-dashboard')), 'nav-dashboard must not be visible for regular users.'
    assert not driver.find_elements(*nav.by_testid('nav-cube-insights')), 'nav-cube-insights must not be visible for regular users.'
