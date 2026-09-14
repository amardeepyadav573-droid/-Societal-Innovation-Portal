import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import LocationSelector from "../../components/profile/LocationSelector";
import ProfileImage from "../../components/profile/ProfileImage";

import profileService from "../../services/profileService";
import "./CitizenProfile.css";
const initialForm = {
  name: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  occupation: "",
  education: "",
  skills: [],
  areasOfInterest: [],
  about: "",
  avatar: "",
  location: {
    state: "",
    district: "",
    city: "",
    town: "",
    village: "",
    block: "",
    panchayat: "",
    pincode: "",
    address: ""
  }
};

export default function CitizenProfile() {
  const { updateUser } = useAuth();
  const [form, setForm] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editMode, setEditMode] = useState(false);

  const [photo, setPhoto] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await profileService.getCitizenProfile();

      const user =
        response?.data ||
        response?.user ||
        {};

      setForm({
        name:
          user.name || "",

        email:
          user.email || "",

        phone:
          user.phone || "",

        dob: user.dob
          ? String(
              user.dob
            ).slice(0, 10)
          : "",

        gender:
          user.gender || "",

        occupation:
          user.occupation || "",

        education:
          user.education || "",

        skills:
          Array.isArray(
            user.skills
          )
            ? user.skills
            : [],

        areasOfInterest:
          Array.isArray(
            user.areasOfInterest
          )
            ? user.areasOfInterest
            : [],

        about:
          user.about || "",

        avatar:
          user.avatar || "",

        location: {
          state:
            user.location?.state ||
            "",

          district:
            user.location?.district ||
            "",

          city:
            user.location?.city ||
            "",

          town:
            user.location?.town ||
            "",

          village:
            user.location?.village ||
            "",

          block:
            user.location?.block ||
            "",

          panchayat:
            user.location?.panchayat ||
            "",

          pincode:
            user.location?.pincode ||
            "",

          address:
            user.location?.address ||
            ""
        }
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const updateArray = (
    field,
    value
  ) => {
    const items =
      value
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean);

    setForm((previous) => ({
      ...previous,
      [field]: items
    }));
  };

  const updateLocation = (
    location
  ) => {
    setForm((previous) => ({
      ...previous,
      location
    }));
  };

  const saveProfile =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setMessage("");
        setError("");

        if (
          !form.name.trim()
        ) {
          throw new Error(
            "Full name is required."
          );
        }

        if (
          !form.location.state
        ) {
          throw new Error(
            "Please select state."
          );
        }

        if (
          !form.location.district
        ) {
          throw new Error(
            "Please select district."
          );
        }

        const data =
          new FormData();

        data.append(
          "name",
          form.name
        );

        data.append(
          "phone",
          form.phone
        );

        data.append(
          "dob",
          form.dob
        );

        data.append(
          "gender",
          form.gender
        );

        data.append(
          "occupation",
          form.occupation
        );

        data.append(
          "education",
          form.education
        );

        data.append(
          "skills",
          JSON.stringify(
            form.skills
          )
        );

        data.append(
          "areasOfInterest",
          JSON.stringify(
            form.areasOfInterest
          )
        );

        data.append(
          "about",
          form.about
        );

        data.append(
          "location",
          JSON.stringify(
            form.location
          )
        );

        if (photo) {
          data.append(
            "photo",
            photo
          );
        }

        const response =
          await profileService.updateCitizenProfile(
            data
          );

        const updated =
          response?.data || {};

        const user =
          updated?.user ||
          updated;

        setForm((previous) => ({
          ...previous,
          avatar: user.avatar || previous.avatar
        }));
        updateUser(user);

        setPhoto(null);

        setMessage(
          response?.message ||
            "Profile saved successfully."
        );
        setEditMode(false);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to save profile."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="profile-loading">
          <Loader2
            className="spin"
            size={28}
          />

          <span>
            Loading your profile...
          </span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="profile-page">
        <div className="profile-page-header">
          <div>
            <Link
              to="/citizen"
              className="profile-back-link"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>

            <span className="section-kicker">
              CITIZEN PROFILE
            </span>

            <h1>
              Your citizen profile
            </h1>

            <p>
              Keep your information updated
              so the platform can connect
              your interests with relevant
              societal challenges.
            </p>
          </div>

          <ProfileImage
            src={form.avatar}
            onChange={({
              file,
              error
            }) => {
              if (error) {
                setError(error);
                return;
              }

              setError("");
              setPhoto(file);
            }}
            editable={editMode}size="large"
          />
        </div>

        {message && (
          <div className="profile-success">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        <form
          className="profile-form"
          onSubmit={saveProfile}
        >
          <section className="profile-card">
            <div className="profile-card-header">
              <span className="section-kicker">
                BASIC INFORMATION
              </span>

              <h2>
                Personal details
              </h2>
            </div>

            <div className="profile-grid">
              <Field
                label="Full Name"
                value={form.name}
                onChange={(value) =>
                  updateField(
                    "name",
                    value
                  )
                }
                required
              
                disabled={!editMode}/>

              <Field
                label="Email"
                value={form.email}
                disabled
              
                disabled={!editMode}/>

              <Field
                label="Mobile Number"
                value={form.phone}
                onChange={(value) =>
                  updateField(
                    "phone",
                    value
                  )
                }
              
                disabled={!editMode}/>

              <Field
                label="Date of Birth"
                type="date"
                value={form.dob}
                onChange={(value) =>
                  updateField(
                    "dob",
                    value
                  )
                }
              
                disabled={!editMode}/>

              <div className="profile-field">
                <label>
                  Gender
                </label>

                <select
                  value={
                    form.gender
                  }
                  onChange={(event) =>
                    updateField(
                      "gender",
                      event.target.value
                    )
                  }
                  disabled={!editMode}
                >
                  <option value="">
                    Select gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                  <option value="Prefer not to say">
                    Prefer not to say
                  </option>
                </select>
              </div>

              <Field
                label="Occupation"
                value={
                  form.occupation
                }
                onChange={(value) =>
                  updateField(
                    "occupation",
                    value
                  )
                }
              
                disabled={!editMode}/>

              <Field
                label="Education"
                value={
                  form.education
                }
                onChange={(value) =>
                  updateField(
                    "education",
                    value
                  )
                }
              
                disabled={!editMode}/>

              <Field
                label="Skills"
                value={
                  form.skills.join(
                    ", "
                  )
                }
                onChange={(value) =>
                  updateArray(
                    "skills",
                    value
                  )
                }
                placeholder="e.g. GIS, Python, Survey, Research"
                full
              
                disabled={!editMode}/>

              <Field
                label="Areas of Interest"
                value={form.areasOfInterest.join(
                  ", "
                )}
                onChange={(value) =>
                  updateArray(
                    "areasOfInterest",
                    value
                  )
                }
                placeholder="e.g. Education, Healthcare, Environment"
                full
              
                disabled={!editMode}/>

              <div className="profile-field profile-field-full">
                <label>
                  About / Bio
                </label>

                <textarea
                  rows={5}
                  value={
                    form.about
                  }
                  disabled={!editMode}
                  onChange={(event) =>
                    updateField(
                      "about",
                      event.target.value
                    )
                  }
                  placeholder="Tell us briefly about yourself..."
                />
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card-header">
              <span className="section-kicker">
                LOCATION
              </span>

              <h2>
                Where are you based?
              </h2>
            </div>

            <LocationSelector
              value={form.location}
              onChange={updateLocation}
              disabled={!editMode}
            />
          </section>

          <div className="profile-save-bar">
            {!editMode ? (
              <button type="button" className="btn btn-primary" onClick={() => { setMessage(""); setError(""); setEditMode(true); }}>
                Edit Profile
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={async () => { setEditMode(false); setMessage(""); setError(""); await loadProfile(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  required = false,
  full = false
}) {
  return (
    <div
      className={`profile-field ${
        full
          ? "profile-field-full"
          : ""
      }`}
    >
      <label>
        {label}

        {required && (
          <span>
            {" "}
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value || ""}
        onChange={(event) =>
          onChange?.(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        disabled={disabled}
        required={required}
      />
    </div>
  );
}