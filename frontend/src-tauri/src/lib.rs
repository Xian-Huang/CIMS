use std::{
    env,
    fs,
    net::{SocketAddr, TcpStream},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    time::Duration,
};
use tauri::Manager;

struct BackendProcess(Mutex<Option<Child>>);

fn api_is_running() -> bool {
    let address: SocketAddr = "127.0.0.1:8000"
        .parse()
        .expect("valid local backend address");
    TcpStream::connect_timeout(&address, Duration::from_millis(300)).is_ok()
}

fn backend_dir() -> Option<PathBuf> {
    if let Ok(path) = env::var("CIMS_BACKEND_DIR") {
        let dir = PathBuf::from(path);
        if dir.join("manage.py").exists() {
            return Some(dir);
        }
    }

    let current = env::current_dir().ok()?;
    let candidates = [
        current.join("../backend"),
        current.join("../../backend"),
        current.join("backend"),
        current.join("../../../../backend"),
    ];

    candidates
        .into_iter()
        .find(|dir| dir.join("manage.py").exists())
}

fn bundled_backend(resource_dir: &Path) -> Option<PathBuf> {
    if let Ok(path) = env::var("CIMS_BACKEND_EXE") {
        let exe = PathBuf::from(path);
        if exe.exists() {
            return Some(exe);
        }
    }

    let candidates = [
        resource_dir.join("backend").join("dist").join("cims-backend.exe"),
        resource_dir.join("cims-backend.exe"),
    ];

    candidates.into_iter().find(|exe| exe.exists())
}

fn python_command() -> &'static str {
    if cfg!(target_os = "windows") {
        "python"
    } else {
        "python3"
    }
}

fn command_with_backend_env(command: &mut Command, data_dir: &Path, db_path: &Path) {
    command
        .env("CIMS_DATA_DIR", data_dir)
        .env("CIMS_DB_PATH", db_path)
        .env("CIMS_DEBUG", "0")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
}

fn start_backend(resource_dir: &Path, data_dir: &Path, db_path: &Path) -> Option<Child> {
    if api_is_running() {
        return None;
    }

    if let Some(exe) = bundled_backend(resource_dir) {
        let mut command = Command::new(exe);
        command_with_backend_env(&mut command, data_dir, db_path);
        return command.spawn().ok();
    }

    let backend = backend_dir()?;
    let mut command = Command::new(python_command());
    command.args(["desktop_server.py"]).current_dir(backend);
    command_with_backend_env(&mut command, data_dir, db_path);
    command.spawn().ok()
}

fn stop_backend(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("cims.sqlite3");
            let resource_dir = app.path().resource_dir()?;

            if let Some(child) = start_backend(&resource_dir, &data_dir, &db_path) {
                let state = app.state::<BackendProcess>();
                *state.0.lock().expect("backend process state") = Some(child);
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
                let state = window.state::<BackendProcess>();
                let child = state.0.lock().expect("backend process state").take();
                if let Some(mut child) = child {
                    stop_backend(&mut child);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
