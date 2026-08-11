from pathlib import Path
import importlib.util
import sys

root = Path(__file__).resolve().parent
backend_app_path = root / "Back-End" / "app.py"

spec = importlib.util.spec_from_file_location("backend_app", backend_app_path)
backend_app = importlib.util.module_from_spec(spec)
sys.modules["backend_app"] = backend_app
spec.loader.exec_module(backend_app)

app = backend_app.app
