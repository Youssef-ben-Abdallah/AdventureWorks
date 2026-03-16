from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class DashboardPage(BasePage):
    def ready(self):
        self.wait.until(EC.url_contains('/dashboard'))
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, 'app-kpi-cards')))
        self.wait.until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, 'app-kpi-cards .kpi-grid .kpi')) > 0
        )
        self.wait.until(
            EC.visibility_of_element_located(
                (
                    By.XPATH,
                    "//app-kpi-cards//div[contains(@class,'label') and normalize-space()='Revenue']",
                )
            )
        )
