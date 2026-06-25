from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class OrdersPage(BasePage):
    def has_orders(self) -> bool:
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
        return len(self.driver.find_elements(*self.by_testid('order-card'))) > 0 or 'Order #' in self.driver.page_source

    def click_first_order(self):
        cards = self.wait.until(EC.presence_of_all_elements_located(self.by_testid('order-card')))
        btn = cards[0].find_element(By.CSS_SELECTOR, 'button.tbl-btn')
        btn.click()
        self.pause('clicked first order ticket button')

    def is_ticket_modal_visible(self) -> bool:
        try:
            modal = self.driver.find_element(By.CSS_SELECTOR, '.ticket-modal')
            return modal.is_displayed()
        except:
            return False

    def close_ticket_modal(self) -> None:
        close_btn = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '.ticket-modal .btn-secondary-glass')))
        close_btn.click()
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '.ticket-modal')))
