from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class ProductsPage(BasePage):
    def add_first_product_to_cart(self):
        buttons = self.wait.until(EC.presence_of_all_elements_located(self.by_testid('product-add-to-cart')))
        buttons[0].click()
        self.pause('add first product to cart')

    def open_first_product_details(self):
        links = self.wait.until(EC.presence_of_all_elements_located(self.by_testid('product-details-link')))
        links[0].click()
        self.pause('open first product details')

    def next_page(self):
        self.click_testid('products-next-page')

    def prev_page(self):
        self.click_testid('products-prev-page')

    def card_count(self) -> int:
        return len(self.driver.find_elements(By.CSS_SELECTOR, '.product-card'))
