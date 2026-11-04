import { useEffect, useRef, useState } from "react";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    const dismiss = (id) => {
      window.clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      setNotifications((current) => current.filter((item) => item.id !== id));
    };

    const handleNotification = (event) => {
      const notification = event.detail;
      setNotifications((current) => [...current, notification].slice(-4));
      timers.current.set(
        notification.id,
        window.setTimeout(() => dismiss(notification.id), notification.duration)
      );
    };

    window.addEventListener("app:notification", handleNotification);
    return () => {
      window.removeEventListener("app:notification", handleNotification);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  return (
    <div className="toast-region" aria-live="polite" aria-relevant="additions">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`toast toast-${notification.type}`}
          role={notification.type === "error" ? "alert" : "status"}
          style={{ "--toast-duration": `${notification.duration}ms` }}
        >
          <div className="toast-copy">{notification.message}</div>
          <button
            type="button"
            className="toast-close"
            aria-label="Cerrar notificación"
            onClick={() => {
              window.clearTimeout(timers.current.get(notification.id));
              timers.current.delete(notification.id);
              setNotifications((current) =>
                current.filter((item) => item.id !== notification.id)
              );
            }}
          >
            ×
          </button>
          <span className="toast-progress" />
        </article>
      ))}
    </div>
  );
}