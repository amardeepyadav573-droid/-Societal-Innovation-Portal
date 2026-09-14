import { Bell, X } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationToast.css";
export default function NotificationToast({ notification, onClose }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [notification, onClose]);
  if (!notification) return null;
  const open = () => {
    if (notification.link) navigate(notification.link);
    onClose();
  };
  return (
    <div className="notification-toast" role="status" onClick={open}>
      <div className="notification-toast-icon">
        <Bell size={18} />
      </div>
      <div className="notification-toast-body">
        <strong>{notification.title || "New notification"}</strong>
        <span>{notification.message}</span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}
