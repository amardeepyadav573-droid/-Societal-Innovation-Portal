import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";
import "./Support.css";
export default function Support() {
  const [subject, setSubject] = useState(""),
    [message, setMessage] = useState(""),
    [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/support", { subject, message });
      setSent(true);
      setSubject("");
      setMessage("");
    } catch {
      setSent(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="page-container narrow-container">
        <div className="page-header">
          <div>
            <span className="section-kicker">HELP DESK</span>
            <h1>Support</h1>
            <p>Report an issue or ask for help with a challenge or project.</p>
          </div>
        </div>
        {sent && (
          <div className="success-inline">
            Support ticket submitted successfully.
          </div>
        )}
        <form className="dashboard-card settings-form" onSubmit={submit}>
          <input
            className="form-input"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <textarea
            className="form-textarea"
            rows="7"
            placeholder="Describe the issue"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit">
            Create support ticket
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
