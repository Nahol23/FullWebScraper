use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let resource_dir = app.path().resource_dir().expect("Failed to get resource dir");
            let bundle_js    = resource_dir.join("bundle.js");
            let node_modules = resource_dir.join("node_modules");

            // Diagnostic
            let debug_info = format!(
                "resource_dir: {:?}\nbundle_js exists: {}\nnode_modules exists: {}\nmigrations exists: {}\n",
                resource_dir,
                bundle_js.exists(),
                node_modules.exists(),
                resource_dir.join("migrations").exists()
            );
            let _ = std::fs::write(resource_dir.join("tauri_debug.txt"), &debug_info);

            let sidecar_command = app.shell()
                .sidecar("data-manager-backend")
                .expect("Sidecar non trovato!")
                .args([bundle_js.to_string_lossy().to_string()])
                .env("NODE_ENV", "production")
                .env("TAURI_RESOURCE_DIR", resource_dir.to_string_lossy().to_string())
                .env("NODE_PATH", node_modules.to_string_lossy().to_string());

            let (mut rx, child) = sidecar_command
                .spawn()
                .expect("Impossibile avviare il backend");

            println!("Backend avviato, PID: {}", child.pid());
            app.manage(std::sync::Mutex::new(Some(child)));

            // Clone per il log file
            let log_dir = resource_dir.clone();

            tauri::async_runtime::spawn(async move {
                let log_path = log_dir.join("backend.log");
                let mut log_content = String::new();

                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            let msg = format!("STDOUT: {}\n", String::from_utf8_lossy(&line));
                            print!("{}", msg);
                            log_content.push_str(&msg);
                        }
                        CommandEvent::Stderr(line) => {
                            let msg = format!("STDERR: {}\n", String::from_utf8_lossy(&line));
                            print!("{}", msg);
                            log_content.push_str(&msg);
                        }
                        CommandEvent::Terminated(p) => {
                            let msg = format!("TERMINATED code: {:?}\n", p.code);
                            print!("{}", msg);
                            log_content.push_str(&msg);
                        }
                        CommandEvent::Error(e) => {
                            let msg = format!("ERROR: {}\n", e);
                            print!("{}", msg);
                            log_content.push_str(&msg);
                        }
                        _ => {}
                    }
                    let _ = std::fs::write(&log_path, &log_content);
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = window.app_handle()
                    .try_state::<std::sync::Mutex<Option<tauri_plugin_shell::process::CommandChild>>>()
                {
                    if let Ok(mut guard) = state.lock() {
                        if let Some(child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}