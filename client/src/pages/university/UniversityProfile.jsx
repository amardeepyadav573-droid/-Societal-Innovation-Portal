import { ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import LocationSelector from "../../components/profile/LocationSelector";
import ProfileImage from "../../components/profile/ProfileImage";
import MultiSelectField from "../../components/profile/MultiSelectField";

import profileService from "../../services/profileService";
import "./UniversityProfile.css";
const initialForm = {
  name: "",
  shortName: "",
  type: "UNIVERSITY",
  email: "",
  phone: "",
  website: "",
  establishedYear: "",
  logo: "",
  about: "",
  location: {},
  departments: [],
  courses: [],
  researchAreas: [],
  expertise: [],
  facilities: [],
  facultyResearchers: [],
};

export default function UniversityProfile() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState(initialForm);

  const [logoFile, setLogoFile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const response = await profileService.getUniversityProfile();

      const university = response?.data?.university || {};

      setForm({
        name: university.name || "",

        shortName: university.shortName || "",

        type: university.type || "UNIVERSITY",

        email: university.email || "",

        phone: university.phone || "",

        website: university.website || "",

        establishedYear: university.establishedYear || "",

        logo: university.logo || "",

        about: university.about || university.description || "",

        location: university.location || {},

        departments: university.departments || [],

        courses: university.courses || [],

        researchAreas: university.researchAreas || [],

        expertise: university.expertise || [],

        facilities: university.facilities || [],

        facultyResearchers: university.facultyResearchers || [],
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load university profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const save = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!form.name.trim()) {
        throw new Error("University name is required.");
      }

      if (!form.location?.state || !form.location?.district) {
        throw new Error("State and district are required.");
      }

      const data = new FormData();

      const scalarFields = [
        "name",
        "shortName",
        "type",
        "email",
        "phone",
        "website",
        "establishedYear",
        "about",
      ];

      scalarFields.forEach((field) => {
        data.append(field, form[field] ?? "");
      });

      const arrayFields = [
        "departments",
        "courses",
        "researchAreas",
        "expertise",
        "facilities",
        "facultyResearchers",
      ];

      arrayFields.forEach((field) => {
        data.append(field, JSON.stringify(form[field] || []));
      });

      data.append("location", JSON.stringify(form.location || {}));

      if (logoFile) {
        data.append("logo", logoFile);
      }

      const response = await profileService.updateUniversityProfile(data);

      const university = response?.data?.university || {};

      setForm((previous) => ({
        ...previous,
        logo: university.logo || previous.logo,
      }));
      updateUser(response?.data?.user);

      setLogoFile(null);

      setMessage(response?.message || "University profile saved successfully.");
      setEditMode(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save university profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="profile-loading">
          <Loader2 size={28} className="spin" />
          Loading university profile...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="profile-page university-profile-page">
        <header className="organization-profile-header">
          <div>
            <Link to="/university" className="profile-back-link">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>

            <span className="section-kicker">UNIVERSITY PROFILE</span>

            <h1>University / HEI profile</h1>

            <p>
              Add institutional capabilities so the portal can match your
              university with relevant societal challenges and industry
              partners.
            </p>
          </div>

          <ProfileImage
            src={form.logo}
            editable={editMode}
            size="large"
            fallbackType="logo"
            onChange={({ file, error }) => {
              if (error) {
                setError(error);
                return;
              }

              setError("");
              setLogoFile(file);
            }}
          />
        </header>

        {message && (
          <div className="profile-success">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {error && <div className="profile-error">{error}</div>}

        <form className="profile-form" onSubmit={save}>
          <section className="profile-card">
            <CardTitle kicker="INSTITUTION" title="Basic information" />

            <div className="profile-grid">
              <Field
                label="University / Institution Name"
                value={form.name}
                required
                onChange={(v) => update("name", v)}
                disabled={!editMode}
              />

              <Field
                label="Short Name"
                value={form.shortName}
                onChange={(v) => update("shortName", v)}
                disabled={!editMode}
              />

              <div className="profile-field">
                <label>Institution Type</label>

                <select
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                  disabled={!editMode}
                >
                  <option value="UNIVERSITY">University</option>

                  <option value="COLLEGE">College</option>

                  <option value="INSTITUTE">Institute</option>

                  <option value="POLYTECHNIC">Polytechnic</option>

                  <option value="RESEARCH_INSTITUTE">Research Institute</option>

                  <option value="OTHER">Other</option>
                </select>
              </div>

              <Field
                label="Official Email"
                value={form.email}
                onChange={(v) => update("email", v)}
                disabled={!editMode}
              />

              <Field
                label="Contact Number"
                value={form.phone}
                onChange={(v) => update("phone", v)}
                disabled={!editMode}
              />

              <Field
                label="Official Website"
                value={form.website}
                onChange={(v) => update("website", v)}
                disabled={!editMode}
              />

              <Field
                label="Established Year"
                type="number"
                value={form.establishedYear}
                onChange={(v) => update("establishedYear", v)}
                disabled={!editMode}
              />
            </div>
          </section>

          <section className="profile-card">
            <CardTitle kicker="LOCATION" title="Institution location" />

            <LocationSelector
              value={form.location}
              onChange={(location) => update("location", location)}
              disabled={!editMode}
            />
          </section>

          <section className="profile-card">
            <CardTitle kicker="ACADEMICS" title="Academic capabilities" />

            <div className="profile-grid">
              <MultiSelectField
                label="Departments"
                value={form.departments}
                onChange={(v) => update("departments", v)}
                disabled={!editMode}
                options={[
                  "Computer Science & Engineering",
                  "Civil Engineering",
                  "Mechanical Engineering",
                  "Electrical Engineering",
                  "Electronics & Communication",
                  "Information Technology",
                  "Management",
                  "Agriculture",
                  "Biotechnology",
                  "Law",
                  "Social Sciences",
                ]}
              />
              <MultiSelectField
                label="Courses / Programs"
                value={form.courses}
                onChange={(v) => update("courses", v)}
                disabled={!editMode}
                options={[
                  "B.Tech",
                  "M.Tech",
                  "B.Sc",
                  "M.Sc",
                  "BCA",
                  "MCA",
                  "MBA",
                  "Ph.D.",
                  "Diploma",
                  "BA",
                  "MA",
                ]}
              />
              <MultiSelectField
                label="Research Areas"
                value={form.researchAreas}
                onChange={(v) => update("researchAreas", v)}
                disabled={!editMode}
                options={[
                  "Artificial Intelligence",
                  "Machine Learning",
                  "Data Science",
                  "Cyber Security",
                  "IoT",
                  "Renewable Energy",
                  "Climate & Environment",
                  "Agriculture Technology",
                  "Healthcare Technology",
                  "Smart Cities",
                  "Water & Sanitation",
                ]}
              />
              <MultiSelectField
                label="Institutional Expertise"
                value={form.expertise}
                onChange={(v) => update("expertise", v)}
                disabled={!editMode}
                options={[
                  "AI & Software",
                  "Engineering Design",
                  "Research & Development",
                  "Policy & Governance",
                  "Product Development",
                  "Field Research",
                  "Data Analytics",
                  "Entrepreneurship",
                  "Community Innovation",
                ]}
              />
              <MultiSelectField
                label="Facilities / Labs"
                value={form.facilities}
                onChange={(v) => update("facilities", v)}
                disabled={!editMode}
                options={[
                  "AI / ML Lab",
                  "IoT Lab",
                  "Robotics Lab",
                  "Innovation Lab",
                  "Incubation Centre",
                  "Fabrication Lab",
                  "GIS / Remote Sensing Lab",
                  "Computer Lab",
                  "Testing & Prototyping Facility",
                ]}
              />
              <MultiSelectField
                label="Faculty / Researchers"
                value={form.facultyResearchers}
                onChange={(v) => update("facultyResearchers", v)}
                disabled={!editMode}
                options={[
                  "Professor",
                  "Associate Professor",
                  "Assistant Professor",
                  "Research Scientist",
                  "Research Scholar",
                  "Technical Expert",
                ]}
              />
            </div>
          </section>

          <div className="profile-save-bar">
            {!editMode ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setMessage("");
                  setError("");
                  setEditMode(true);
                }}
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={async () => {
                    setEditMode(false);
                    setMessage("");
                    setError("");
                    await loadProfile();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Profile
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function CardTitle({ kicker, title }) {
  return (
    <div className="profile-card-header">
      <span className="section-kicker">{kicker}</span>

      <h2>{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}) {
  return (
    <div className="profile-field">
      <label>
        {label}

        {required && <span> *</span>}
      </label>

      <input
        type={type}
        value={value || ""}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
