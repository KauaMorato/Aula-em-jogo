from pathlib import Path
import importlib.util
import sys

root = Path(__file__).resolve().parent
backend_app_path = root / "app.py"

if not backend_app_path.exists():
	raise FileNotFoundError(f"app.py not found at {backend_app_path}. Ensure the file exists.")

spec = importlib.util.spec_from_file_location("backend_app", str(backend_app_path))
if spec is None or spec.loader is None:
	raise ImportError(f"Could not create import spec for {backend_app_path}")

backend_app = importlib.util.module_from_spec(spec)
sys.modules["backend_app"] = backend_app
try:
	spec.loader.exec_module(backend_app)
except Exception as e:
	raise ImportError(f"Error importing app module from {backend_app_path}: {e}") from e

app = getattr(backend_app, 'app', None)
if app is None:
	raise AttributeError("backend app module does not expose 'app' Flask instance")
