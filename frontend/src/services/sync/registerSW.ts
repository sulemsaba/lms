import { registerSW } from "virtual:pwa-register";

/**
 * Registers the service worker with auto-update behavior.
 */
export function registerServiceWorker(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Keep registration reference active for updates.
        registration.update().catch(() => undefined);
      }
      console.info(`Service worker registered: ${swUrl}`);
    },
    onOfflineReady() {
      console.info("Student Hub is ready for offline use.");
    },
    onRegisterError(error) {
      console.error("Service worker registration failed", error);
    }
  });
}
