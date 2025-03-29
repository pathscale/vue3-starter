use tauri::AppHandle;
use tauri::Emitter;
use std::thread;
use std::time::Duration;

fn emit_event(handle: AppHandle) {
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_secs(3));
            
            if let Err(e) = handle.emit("backend-event", "Hello from Rust!") {
                eprintln!("Failed to emit event: {}", e);
            }
        }
    });
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            emit_event(handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}