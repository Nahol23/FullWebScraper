use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!(" 1. INIZIO SETUP TAURI...");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            println!(" 2. CERCO LA CONFIGURAZIONE DEL SIDECAR...");
            
            let resource_dir = app.path().resource_dir().expect("Failed to get resource dir");
            let node_modules_path = resource_dir.join("node_modules");
            
            let sidecar_command = app.shell()
                .sidecar("data-manager-backend")
                .expect(" ERRORE: Sidecar non trovato nella configurazione!")
                .env("NODE_PATH", node_modules_path.to_string_lossy().to_string());
                
            println!(" 3. COMANDO SIDECAR TROVATO! Provo ad avviarlo...");

            let (mut rx, child) = sidecar_command
                .spawn()
                .expect(" ERRORE: Impossibile avviare il processo backend");

            println!(" 4. PROCESSO AVVIATO CON SUCCESSO! PID: {} - In ascolto dei log...", child.pid());

            // Salva il child dentro un Option per poterlo estrarre e killare alla chiusura
            app.manage(std::sync::Mutex::new(Some(child)));

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!(" STDOUT (Normale): {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            println!(" STDERR (Errore): {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Terminated(payload) => {
                            println!(" 5. IL BACKEND SI E' SPENTO ALL'IMPROVVISO! Codice di uscita: {:?}", payload.code);
                        }
                        CommandEvent::Error(err) => {
                            println!(" ERRORE DI SISTEMA TAURI: {}", err);
                        }
                        _ => {}
                    }
                }
                println!(" 6. FINE ASCOLTO LOG (Il canale è stato chiuso)");
            });
                
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Cerchiamo lo stato con Option
                if let Some(child_state) = window.app_handle().try_state::<std::sync::Mutex<Option<tauri_plugin_shell::process::CommandChild>>>() {
                    if let Ok(mut guard) = child_state.lock() {
                        // .take() estrae il valore e lascia None al suo posto!
                        if let Some(child) = guard.take() {
                            let _ = child.kill();
                            println!(" SIDECAR KILLATO ALLA CHIUSURA DELLA FINESTRA");
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}