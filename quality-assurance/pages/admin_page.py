from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class AdminPage(BasePage):
    def ready(self):
        self.wait.until(EC.url_contains('/admin'))
        self.wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(normalize-space(.), 'Admin Dashboard')]")))
        # React: admin tabs rendered with data-testid; categories tab is always visible on load
        self.wait.until(EC.visibility_of_element_located(self.by_testid('admin-tab-categories')))
        self.wait.until(EC.visibility_of_element_located(self.by_testid('admin-tab-products')))

    def click_tab(self, name: str):
        """Click an admin tab by its slug: categories, subcategories, products, orders."""
        self.click_testid(f'admin-tab-{name}')

    def categories_section_visible(self) -> bool:
        elems = self.driver.find_elements(*self.by_testid('admin-categories-title'))
        return len(elems) > 0

    def row_count(self, table_selector: str = '.admin-table tbody tr') -> int:
        return len(self.driver.find_elements(By.CSS_SELECTOR, table_selector))
