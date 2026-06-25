from __future__ import annotations

from .base_page import BasePage


class NavbarPage(BasePage):
    def open_products(self):
        self.click_testid('nav-products')

    def open_cart(self):
        self.click_testid('nav-cart')

    def open_orders(self):
        self.click_testid('nav-orders')

    def open_admin(self):
        self.click_testid('nav-admin')

    def open_dashboard(self):
        self.click_testid('nav-dashboard')

    def open_cube_insights(self):
        self.click_testid('nav-cube-insights')

    def logout(self):
        self.click_testid('nav-account-menu')
        self.click_testid('nav-logout')
        self.pause('logout')

    def toggle_theme(self):
        self.click_testid('nav-theme-btn')
        self.pause('theme toggled')
