from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class ProductsPage(BasePage):
    def add_first_product_to_cart(self):
        buttons = self.wait.until(EC.presence_of_all_elements_located(self.by_testid('product-add-to-cart')))
        for btn in buttons:
            if btn.is_enabled():
                try:
                    btn.click()
                except Exception:
                    self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                    import time
                    time.sleep(0.1)
                    self.driver.execute_script("arguments[0].click();", btn)
                self.pause('add first enabled product to cart')
                return
        raise Exception("No enabled Add to Cart buttons found")

    def open_first_product_details(self):
        links = self.wait.until(EC.presence_of_all_elements_located(self.by_testid('product-details-link')))
        links[0].click()
        self.pause('open first product details')

    def next_page(self):
        self.click_testid('products-next-page')

    def prev_page(self):
        self.click_testid('products-prev-page')

    def card_count(self) -> int:
        # React cards use data-testid="product-card" on aw-product-card divs
        return len(self.driver.find_elements(*self.by_testid('product-card')))

    def wait_for_cards(self, min_count: int = 1):
        self.wait.until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, '[data-testid="product-card"]')) >= min_count
        )

    def search(self, query: str):
        field = self.wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '.search-input')
        ))
        field.clear()
        field.send_keys(query)
        self.pause(f'search: {query}')
