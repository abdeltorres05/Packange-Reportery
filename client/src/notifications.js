let nextNotificationId = 0;

export function notify(message, type = "info", duration = 5000) {
  if (!message) return;

  window.dispatchEvent(
    new CustomEvent("app:notification", {
      detail: {
        id: ++nextNotificationId,
        message,
        type,
        duration,
      },
    })
  );
}