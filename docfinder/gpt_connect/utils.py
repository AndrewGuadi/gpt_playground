# gpt_connect/utils.py
import time

def retry(func, retries=3, delay=1):
    """
    Retry a function on exception, up to `retries` times, waiting `delay` seconds between attempts.
    """
    for attempt in range(1, retries + 1):
        try:
            return func()
        except Exception:
            if attempt == retries:
                raise
            time.sleep(delay)