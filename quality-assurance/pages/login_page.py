from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class LoginPage(BasePage):
    def switch_to_register(self):
        self.click_testid('mode-register')

    def switch_to_login(self):
        self.click_testid('mode-login')

    def login(self, username: str, password: str):
        self.switch_to_login()
        self.type_testid('login-username', username)
        self.type_testid('login-password', password)
        self.click_testid('auth-submit')

    def register(self, username: str, email: str, password: str):
        self.switch_to_register()
        self.type_testid('login-username', username)
        self.type_testid('register-email', email)
        self.type_testid('login-password', password)
        self.click_testid('auth-submit')

    def body_contains(self, text: str):
        return self.wait.until(EC.text_to_be_present_in_element((By.TAG_NAME, 'body'), text))
