import { useEffect, useState } from "react";
import { Bell, CheckCheck, ExternalLink, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/common/Loader";
import { useNotifications } from "../context/NotificationContext";
import "./Notifications.css";

export default function Notifications() {
  const { items, unread, markRead, markAllRead, remove, refresh } = useNotifications();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const open = async (n) => {
    if (!n.isRead) await markRead(n._id);
    if (n.link) navigate(n.link);
  };
  return (
    <DashboardLayout>
      <div className="page-container notifications-page">
        <div className="page-header">
          <div>
            <span className="section-kicker">UPDATES</span>
            <h1>Notifications</h1>
            <p>
              Stay informed about challenges, projects, validation and
              collaborations.
            </p>
          </div>
          {unread > 0 && (
            <button className="btn btn-secondary" onClick={markAllRead}>
              <CheckCheck size={17} /> Mark all read
            </button>
          )}
        </div>
        {loading ? (
          <Loader />
        ) : (
          <div className="notification-list">
            {items.length ? (
              items.map((n) => (
                <div
                  className={`notification-row ${n.isRead ? "read" : "unread"}`}
                  key={n._id}
                >
                  <button
                    type="button"
                    className="notification-row-main"
                    onClick={() => open(n)}
                    aria-label={`Open notification: ${n.title}`}
                  >
                    <div className="notification-row-icon">
                      <Bell size={18} />
                    </div>
                    <div className="notification-row-content">
                      <strong>{n.title}</strong>
                      <span>{n.message}</span>
                      <small>
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString("en-IN")
                          : ""}
                      </small>
                    </div>
                    {n.link && <ExternalLink size={16} />}
                  </button>
                  <button
                    type="button"
                    className="notification-delete"
                    onClick={() => remove(n._id)}
                    aria-label={`Delete notification: ${n.title}`}
                    title="Delete notification"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <Bell size={28} />
                <h3>No notifications yet</h3>
                <p>Important platform updates will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
