use tauri::AppHandle;
use tauri::Emitter; // Add the Emitter trait to use emit
use std::thread;
use std::time::Duration;

// Function to emit events on a separate thread
fn emit_event(handle: AppHandle) {
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_secs(3)); // Simulate delay
            
            // Now we can use the emit method from the Emitter trait
            if let Err(e) = handle.emit("backend-event", "Hello from Rust!") {
                eprintln!("Failed to emit event: {}", e);
            }
        }
    });
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone(); // Clone AppHandle to move into `emit_event`
            emit_event(handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])  // Add invoke handler even if empty
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}