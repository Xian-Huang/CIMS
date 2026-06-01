import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

import django
from django.core.management import call_command, execute_from_command_line


def default_data_dir():
    if sys.platform == "win32":
        root = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
        return Path(root) / "CIMS"
    return Path.home() / ".cims"


def backup_database(db_path):
    if not db_path.exists():
        return

    backup_dir = db_path.parent / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = backup_dir / f"cims-{timestamp}.sqlite3"
    shutil.copy2(db_path, backup_path)

    backups = sorted(backup_dir.glob("cims-*.sqlite3"), key=lambda path: path.stat().st_mtime, reverse=True)
    for old_backup in backups[20:]:
        old_backup.unlink(missing_ok=True)


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cims.settings")
    os.environ.setdefault("CIMS_DEBUG", "0")

    data_dir = Path(os.environ.get("CIMS_DATA_DIR", default_data_dir()))
    data_dir.mkdir(parents=True, exist_ok=True)
    db_path = Path(os.environ.get("CIMS_DB_PATH", data_dir / "cims.sqlite3"))
    os.environ.setdefault("CIMS_DB_PATH", str(db_path))

    django.setup()
    backup_database(db_path)
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
