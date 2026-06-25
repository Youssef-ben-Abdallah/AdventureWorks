from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class DashboardPage(BasePage):
    def ready(self):
        self.wait.until(EC.url_contains('/dashboard'))
        # React: KpiCards renders <div data-testid="dashboard-kpis" class="kpi-grid">
        self.wait.until(EC.visibility_of_element_located(self.by_testid('dashboard-kpis')))
        self.wait.until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, '[data-testid="dashboard-kpis"] .kpi')) > 0
        )

    def tab_count(self) -> int:
        return len(self.driver.find_elements(By.CSS_SELECTOR, '.dashboard-tab, .tab-btn'))

    def kpi_count(self) -> int:
        return len(self.driver.find_elements(By.CSS_SELECTOR, '[data-testid="dashboard-kpis"] .kpi'))
