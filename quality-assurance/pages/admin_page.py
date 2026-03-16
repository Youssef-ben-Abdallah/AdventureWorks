from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class AdminPage(BasePage):
    def ready(self):
        self.wait.until(EC.url_contains('/admin'))
        self.wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(normalize-space(.), 'Admin Dashboard')]")))
        self.wait.until(EC.visibility_of_element_located(self.by_testid('admin-categories-title')))
        self.wait.until(EC.visibility_of_element_located(self.by_testid('admin-subcategories-title')))
        self.wait.until(EC.visibility_of_element_located(self.by_testid('admin-products-title')))
