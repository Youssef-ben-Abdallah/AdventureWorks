from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ApiClient:
    session: Any
    base_url: str
    default_headers: dict | None = None

    def _headers(self, headers: dict | None = None) -> dict:
        merged = dict(self.default_headers or {})
        if headers:
            merged.update(headers)
        return merged

    def get(self, path: str, **kwargs):
        return self.session.get(f'{self.base_url}{path}', headers=self._headers(kwargs.pop('headers', None)), **kwargs)

    def post(self, path: str, **kwargs):
        return self.session.post(f'{self.base_url}{path}', headers=self._headers(kwargs.pop('headers', None)), **kwargs)

    def put(self, path: str, **kwargs):
        return self.session.put(f'{self.base_url}{path}', headers=self._headers(kwargs.pop('headers', None)), **kwargs)

    def patch(self, path: str, **kwargs):
        return self.session.patch(f'{self.base_url}{path}', headers=self._headers(kwargs.pop('headers', None)), **kwargs)

    def delete(self, path: str, **kwargs):
        return self.session.delete(f'{self.base_url}{path}', headers=self._headers(kwargs.pop('headers', None)), **kwargs)
