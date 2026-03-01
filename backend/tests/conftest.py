"""
Pytest configuration for NurtureNote backend tests
"""
import pytest
import os

# Set environment variable for tests
@pytest.fixture(scope="session", autouse=True)
def set_env_vars():
    """Set required environment variables"""
    if not os.environ.get('REACT_APP_BACKEND_URL'):
        # Read from frontend/.env if not set
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        url = line.split('=', 1)[1].strip()
                        os.environ['REACT_APP_BACKEND_URL'] = url
                        break
        except FileNotFoundError:
            pass
    yield
