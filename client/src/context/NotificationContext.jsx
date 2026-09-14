import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useAuth from "../hooks/useAuth";
import notificationService from "../services/notificationService";
import NotificationToast from "../components/notifications/NotificationToast";
import "./NotificationContext.css";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setUnread(0);
      return;
    }
    try {
      const data = await notificationService.list();
      setItems(data.notifications || []);
      setUnread(Number(data.unread || 0));
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;
    const controller = new AbortController();
    let buffer = "";

    const base = String(import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
    const connect = async () => {
      try {
        const response = await fetch(`${base}/notifications/stream`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";
          for (const chunk of chunks) {
            const dataLine = chunk
              .split("\n")
              .find((line) => line.startsWith("data:"));
            const eventLine = chunk
              .split("\n")
              .find((line) => line.startsWith("event:"));
            if (eventLine?.slice(6).trim() === "notification:new" && dataLine) {
              try {
                const notification = JSON.parse(dataLine.slice(5).trim());
                setItems((current) =>
                  [
                    notification,
                    ...current.filter((n) => n._id !== notification._id),
                  ].slice(0, 50),
                );
                setUnread((count) => count + (notification.isRead ? 0 : 1));
                setToast(notification);
              } catch {}
            }
          }
        }
      } catch {}
    };
    connect();
    return () => controller.abort();
  }, [isAuthenticated, user]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((current) =>
        current.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnread((count) => Math.max(0, count - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setItems((current) => current.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  }, []);

  const remove = useCallback(async (id) => {
    const target = items.find((n) => n._id === id);
    try {
      await notificationService.remove(id);
      setItems((current) => current.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnread((count) => Math.max(0, count - 1));
      }
    } catch {}
  }, [items]);

  const value = useMemo(
    () => ({ items, unread, refresh, markRead, markAllRead, remove }),
    [items, unread, refresh, markRead, markAllRead, remove],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast notification={toast} onClose={() => setToast(null)} />
    </NotificationContext.Provider>
  );
}
export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value)
    throw new Error(
      "useNotifications must be used inside NotificationProvider.",
    );
  return value;
}
export default NotificationContext;
