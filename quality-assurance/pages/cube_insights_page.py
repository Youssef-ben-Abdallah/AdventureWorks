from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class CubeInsightsPage(BasePage):
    def ready(self):
        self.wait.until(EC.url_contains('/cube-insights'))
        self.wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//h1[contains(normalize-space(.), 'Reseller') or contains(normalize-space(.), 'Cube')]")
        ))

    def tab_count(self) -> int:
        return len(self.driver.find_elements(By.CSS_SELECTOR, '.tab-btn, .cube-tab, [role="tab"]'))
