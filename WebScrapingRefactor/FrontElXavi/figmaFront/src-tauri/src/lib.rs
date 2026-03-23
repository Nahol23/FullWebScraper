use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!(" 1. INIZIO SETUP TAURI...");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            println!(" 2. CERCO LA CONFIGURAZIONE DEL SIDECAR...");
            
            let sidecar_command = app.shell()
                .sidecar("data-manager-backend")
                .expect(" ERRORE: Sidecar non trovato nella configurazione!");
                
            println!(" 3. COMANDO SIDECAR TROVATO! Provo ad avviarlo...");

            let (mut rx, child) = sidecar_command
                .spawn()
                .expect(" ERRORE: Impossibile avviare il processo backend");

            println!(" 4. PROCESSO AVVIATO CON SUCCESSO! PID: {} - In ascolto dei log...", child.pid());

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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}