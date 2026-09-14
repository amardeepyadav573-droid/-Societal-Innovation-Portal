import { useEffect, useMemo, useState } from "react";
import { Check, Edit3, Plus, RefreshCw, Trash2, Users, X } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import teamService from "../../services/teamService";
import projectService from "../../services/projectService";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import "./Teams.css";

const emptyForm = {
  name: "",
  description: "",
  projectId: "",
  status: "PLANNING",
  facultyMentors: [],
  studentMembers: [],
  manualFacultyMentors: [],
  manualStudentMembers: [],
};
const ids = (items = []) =>
  items
    .map((x) => x?._id || x)
    .filter(Boolean)
    .map(String);

export default function Teams() {
  const [teams, setTeams] = useState([]),
    [projects, setProjects] = useState([]),
    [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyForm),
    [editing, setEditing] = useState(null),
    [show, setShow] = useState(false);
  const [choices, setChoices] = useState({}),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState("");
  const [error, setError] = useState(""),
    [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [t, p, m] = await Promise.all([
        teamService.getTeams(),
        projectService.getProjects(),
        teamService.getMembers(),
      ]);
      setTeams(t.teams || []);
      setProjects(p.projects || []);
      setMembers(m.members || []);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load research teams.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const faculty = useMemo(
    () =>
      members.filter((m) =>
        ["FACULTY", "MENTOR", "UNIVERSITY"].includes(m.role),
      ),
    [members],
  );
  const students = useMemo(
    () => members.filter((m) => m.role === "STUDENT"),
    [members],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShow(true);
    setError("");
  };
  const openEdit = (team) => {
    setEditing(team);
    const mentorIds = [
      ...ids(team.facultyMentors),
      ...ids(team.facultyMentor ? [team.facultyMentor] : []),
    ].filter((v, i, a) => a.indexOf(v) === i);
    setForm({
      name: team.name || "",
      description: team.description || "",
      projectId: team.project?._id || "",
      status: team.status || "PLANNING",
      facultyMentors: mentorIds,
      studentMembers: ids(
        (team.members || []).filter((m) => m.role === "STUDENT"),
      ),
      manualFacultyMentors: Array.isArray(team.manualFacultyMentors)
        ? team.manualFacultyMentors
        : [],
      manualStudentMembers: Array.isArray(team.manualStudentMembers)
        ? team.manualStudentMembers
        : [],
    });
    setShow(true);
    setError("");
  };
  const toggle = (field, id) =>
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(String(id))
        ? f[field].filter((x) => x !== String(id))
        : [...f[field], String(id)],
    }));
  const addManual = (field, value) => {
    const name = String(value || "").trim();
    if (!name) return;
    setForm((f) =>
      f[field].includes(name) ? f : { ...f, [field]: [...f[field], name] },
    );
  };
  const removeManual = (field, name) =>
    setForm((f) => ({ ...f, [field]: f[field].filter((x) => x !== name) }));

  const save = async (e) => {
    e.preventDefault();
    try {
      setBusy("save");
      setError("");
      if (!form.name.trim()) throw new Error("Team name is required.");
      if (editing) await teamService.updateTeam(editing._id, form);
      else await teamService.createTeam(form);
      setShow(false);
      setSuccess(editing ? "Research team updated." : "Research team created.");
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Unable to save team.",
      );
    } finally {
      setBusy("");
    }
  };

  const addMember = async (team, kind) => {
    const key = `${team._id}:${kind}`;
    const userId = choices[key];
    if (!userId) return;
    try {
      setBusy(`add:${key}`);
      setError("");
      await teamService.addMember(team._id, userId);
      setChoices((c) => ({ ...c, [key]: "" }));
      setSuccess(
        kind === "faculty"
          ? "Faculty / mentor added."
          : "Student member added.",
      );
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to add member.");
    } finally {
      setBusy("");
    }
  };

  const removeMember = async (teamId, userId) => {
    if (!window.confirm("Remove this member from the team?")) return;
    try {
      setBusy(`remove:${userId}`);
      await teamService.removeMember(teamId, userId);
      setSuccess("Member removed.");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to remove member.");
    } finally {
      setBusy("");
    }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this research team?")) return;
    try {
      setBusy(`delete:${id}`);
      await teamService.deleteTeam(id);
      setSuccess("Research team deleted.");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to delete team.");
    } finally {
      setBusy("");
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container teams-page">
        <div className="page-header">
          <div>
            <span className="section-kicker">UNIVERSITY · RESEARCH</span>
            <h1>Research Teams</h1>
            <p>
              Create multidisciplinary teams and add multiple faculty mentors
              and student members.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="dashboard-refresh"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={17} /> Create Team
            </button>
          </div>
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        {success && (
          <div className="success-inline">
            <Check size={17} /> {success}
          </div>
        )}
        {loading ? (
          <Loader />
        ) : teams.length ? (
          <div className="team-grid">
            {teams.map((t) => {
              const facultyIds = ids(t.facultyMentors)
                .concat(ids(t.facultyMentor ? [t.facultyMentor] : []))
                .filter((v, i, a) => a.indexOf(v) === i);
              const studentIds = ids(
                (t.members || []).filter((m) => m.role === "STUDENT"),
              );
              const manualFaculty = Array.isArray(t.manualFacultyMentors)
                ? t.manualFacultyMentors
                : [];
              const manualStudents = Array.isArray(t.manualStudentMembers)
                ? t.manualStudentMembers
                : [];
              const selectedIds = ids(t.members).concat(facultyIds);
              const availableFaculty = faculty.filter(
                (m) => !selectedIds.includes(String(m._id)),
              );
              const availableStudents = students.filter(
                (m) => !selectedIds.includes(String(m._id)),
              );
              return (
                <article className="team-card" key={t._id}>
                  <div className="team-card-head">
                    <div className="team-icon">
                      <Users size={22} />
                    </div>
                    <span className="domain-tag">{t.status}</span>
                  </div>
                  <h3>{t.name}</h3>
                  <p>{t.description || "Multidisciplinary innovation team"}</p>
                  <div className="team-details">
                    <span>
                      <strong>
                        {studentIds.length + manualStudents.length}
                      </strong>{" "}
                      students
                    </span>
                    <span>
                      <strong>
                        {facultyIds.length + manualFaculty.length}
                      </strong>{" "}
                      faculty
                    </span>
                    <span className="team-project-text">
                      {t.project?.title || "No project linked"}
                    </span>
                  </div>
                  <div className="member-group">
                    <strong>Faculty / Mentors</strong>
                    <div className="team-members">
                      {facultyIds.map((id) => {
                        const m =
                          (t.facultyMentors || []).find(
                            (x) => String(x._id || x) === id,
                          ) ||
                          (String(t.facultyMentor?._id) === id
                            ? t.facultyMentor
                            : null);
                        return (
                          <button
                            type="button"
                            className="member-avatar"
                            key={id}
                            title={`Remove ${m?.name || "member"}`}
                            onClick={() => removeMember(t._id, id)}
                            disabled={busy === `remove:${id}`}
                          >
                            {m?.name?.charAt(0).toUpperCase() || "F"}
                          </button>
                        );
                      })}
                      {manualFaculty.map((name) => (
                        <span
                          className="manual-member-chip"
                          key={name}
                          title={name}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="member-group">
                    <strong>Student Members</strong>
                    <div className="team-members">
                      {(t.members || [])
                        .filter((m) => m.role === "STUDENT")
                        .map((m) => (
                          <button
                            type="button"
                            className="member-avatar"
                            key={m._id}
                            title={`Remove ${m.name}`}
                            onClick={() => removeMember(t._id, m._id)}
                            disabled={busy === `remove:${m._id}`}
                          >
                            {m.name?.charAt(0).toUpperCase() || "S"}
                          </button>
                        ))}
                      {manualStudents.map((name) => (
                        <span
                          className="manual-member-chip"
                          key={name}
                          title={name}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="team-member-add">
                    <select
                      value={choices[`${t._id}:faculty`] || ""}
                      onChange={(e) =>
                        setChoices((c) => ({
                          ...c,
                          [`${t._id}:faculty`]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select faculty / mentor...</option>
                      {availableFaculty.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} · {m.department || m.role || "Faculty"}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      disabled={
                        !choices[`${t._id}:faculty`] ||
                        busy === `add:${t._id}:faculty`
                      }
                      onClick={() => addMember(t, "faculty")}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div className="team-member-add">
                    <select
                      value={choices[`${t._id}:student`] || ""}
                      onChange={(e) =>
                        setChoices((c) => ({
                          ...c,
                          [`${t._id}:student`]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select student member...</option>
                      {availableStudents.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} · {m.department || "Student"}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      disabled={
                        !choices[`${t._id}:student`] ||
                        busy === `add:${t._id}:student`
                      }
                      onClick={() => addMember(t, "student")}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div className="team-footer">
                    <span>
                      {studentIds.length +
                        manualStudents.length +
                        facultyIds.length +
                        manualFaculty.length}{" "}
                      selected members
                    </span>
                    <div>
                      <button
                        className="icon-button"
                        onClick={() => openEdit(t)}
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => remove(t._id)}
                        disabled={busy === `delete:${t._id}`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No research teams"
            description="Create a team and select as many faculty mentors and students as needed."
          />
        )}

        {show && (
          <div
            className="modal-backdrop"
            onMouseDown={(e) => e.target === e.currentTarget && setShow(false)}
          >
            <form className="modal-card team-modal" onSubmit={save}>
              <div className="modal-heading">
                <div>
                  <span className="section-kicker">
                    {editing ? "EDIT" : "NEW"}
                  </span>
                  <h2>
                    {editing ? "Edit research team" : "Create research team"}
                  </h2>
                </div>
                <button type="button" onClick={() => setShow(false)}>
                  <X />
                </button>
              </div>
              <label>
                Team name
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Purpose / description
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <label>
                Linked project
                <select
                  className="form-input"
                  value={form.projectId}
                  onChange={(e) =>
                    setForm({ ...form, projectId: e.target.value })
                  }
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <ManualMemberInput
                title="Faculty / Mentors"
                values={form.manualFacultyMentors}
                onAdd={(value) => addManual("manualFacultyMentors", value)}
                onRemove={(value) =>
                  removeManual("manualFacultyMentors", value)
                }
                placeholder="Enter faculty / mentor name"
              />
              <ManualMemberInput
                title="Student Members"
                values={form.manualStudentMembers}
                onAdd={(value) => addManual("manualStudentMembers", value)}
                onRemove={(value) =>
                  removeManual("manualStudentMembers", value)
                }
                placeholder="Enter student member name"
              />
              <label>
                Status
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>PLANNING</option>
                  <option>ACTIVE</option>
                  <option>COMPLETED</option>
                </select>
              </label>
              <button className="btn btn-primary" disabled={busy === "save"}>
                {busy === "save"
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Create Team"}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ManualMemberInput({ title, values, onAdd, onRemove, placeholder }) {
  const [value, setValue] = useState("");
  const add = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue("");
  };
  return (
    <div className="team-picker manual-picker">
      <strong>
        {title} <span className="picker-count">{values.length} added</span>
      </strong>
      <div className="manual-add-row">
        <input
          className="form-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={add}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {values.length ? (
        <div className="manual-chip-list">
          {values.map((name) => (
            <span className="manual-member-chip" key={name}>
              {name}
              <button
                type="button"
                onClick={() => onRemove(name)}
                aria-label={`Remove ${name}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="picker-empty">
          Type a name and press Add. No account selection is required.
        </p>
      )}
    </div>
  );
}
