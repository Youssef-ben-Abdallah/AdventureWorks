from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class CartPage(BasePage):
    def item_count(self) -> int:
        return len(self.driver.find_elements(By.CSS_SELECTOR, '.cart-item'))

    def checkout(self):
        self.click_testid('cart-checkout')

    def clear(self):
        self.click_testid('cart-clear')

    def increase_first_qty(self):
        buttons = self.driver.find_elements(*self.by_testid('cart-qty-inc'))
        if buttons:
            buttons[0].click()
            self.pause('increase first cart quantity')
