import os
import sys
from pathlib import Path

import django
from django.core.management import call_command, execute_from_command_line


def default_data_dir():
    if sys.platform == "win32":
        root = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
        return Path(root) / "CIMS"
    return Path.home() / ".cims"


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cims.settings")
    os.environ.setdefault("CIMS_DEBUG", "0")

    data_dir = Path(os.environ.get("CIMS_DATA_DIR", default_data_dir()))
    data_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("CIMS_DB_PATH", str(data_dir / "cims.sqlite3"))

    django.setup()
    call_command("migrate", interactive=False, verbosity=0)
    execute_from_command_line(
        [
            sys.argv[0],
            "runserver",
            "127.0.0.1:8000",
            "--noreload",
        ]
    )


if __name__ == "__main__":
    main()
