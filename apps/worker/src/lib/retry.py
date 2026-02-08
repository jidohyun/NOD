from collections.abc import Callable
from typing import ParamSpec, TypeVar

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

P = ParamSpec("P")
R = TypeVar("R")


def with_retry(
    max_attempts: int = 3,
    min_wait: int = 2,
    max_wait: int = 10,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
