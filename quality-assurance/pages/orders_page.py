from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class OrdersPage(BasePage):
    def has_orders(self) -> bool:
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
        return len(self.driver.find_elements(*self.by_testid('order-card'))) > 0 or 'Order #' in self.driver.page_source
