from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ServiceResult:
    data: Any
    status_code: int = 200