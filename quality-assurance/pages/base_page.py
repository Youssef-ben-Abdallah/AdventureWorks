from __future__ import annotations

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC


class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = driver.wait

    def pause(self, label: str | None = None):
        pause_fn = getattr(self.driver, 'ui_pause', None)
        if callable(pause_fn):
            pause_fn(label)

    def open(self, url: str):
        self.driver.get(url)

    def by_testid(self, value: str):
        return (By.CSS_SELECTOR, f'[data-testid="{value}"]')

    def click_testid(self, value: str):
        element = self.wait.until(EC.element_to_be_clickable(self.by_testid(value)))
        try:
            element.click()
        except Exception:
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
            time.sleep(0.1)
            self.driver.execute_script("arguments[0].click();", element)
        self.pause(f'click {value}')

    def type_testid(self, value: str, text: str):
        from selenium.webdriver.common.keys import Keys
        element = self.wait.until(EC.visibility_of_element_located(self.by_testid(value)))
        element.send_keys(Keys.CONTROL, 'a')
        element.send_keys(Keys.BACKSPACE)
        self.pause(f'clear {value}')
        element.send_keys(text)
        self.pause(f'type into {value}')
        return element

    def text_present(self, text: str) -> bool:
        return self.wait.until(EC.text_to_be_present_in_element((By.TAG_NAME, 'body'), text))
