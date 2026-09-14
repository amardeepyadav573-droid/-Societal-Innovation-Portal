import { ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import LocationSelector from "../../components/profile/LocationSelector";
import ProfileImage from "../../components/profile/ProfileImage";
import MultiSelectField from "../../components/profile/MultiSelectField";
import profileService from "../../services/profileService";
import "./IndustryProfile.css";

const initialForm = {
  name: "",
  type: "STARTUP",
  email: "",
  phone: "",
  website: "",
  foundedYear: "",
  founderCEO: "",
  logo: "",
  about: "",
  location: {},
  sector: [],
  productsServices: [],
  technologyAreas: [],
  skillsExpertise: [],
  capabilities: [],
  resources: [],
  fundingInterests: [],
  innovationAreas: [],
  csrInterests: [],
  researchCollaborationInterests: [],
  problemsChallenges: [],
  collaborationPreferences: [],
};

const capabilityOptions = {
  sector: [
    "Agriculture",
    "Education",
    "Healthcare",
    "Energy",
    "Renewable Energy",
    "Manufacturing",
    "IT & Software",
    "FinTech",
    "EdTech",
    "HealthTech",
    "AgriTech",
    "Mobility & Transport",
    "Construction",
    "Water & Sanitation",
    "Environment",
    "Smart City",
    "Social Impact",
  ],
  productsServices: [
    "SaaS",
    "Mobile Applications",
    "Web Platforms",
    "IoT Solutions",
    "AI Solutions",
    "Consulting",
    "Engineering Services",
    "Data Services",
    "Hardware Products",
    "Cloud Services",
    "Digital Services",
    "Training & Skill Development",
    "Testing Services",
    "R&D Services",
  ],
  technologyAreas: [
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Generative AI",
    "Computer Vision",
    "Natural Language Processing",
    "Internet of Things",
    "Cloud Computing",
    "Cyber Security",
    "Blockchain",
    "GIS & Remote Sensing",
    "Robotics",
    "Drones",
    "Embedded Systems",
    "Digital Twins",
    "Automation",
    "AR / VR",
    "Big Data",
  ],
  skillsExpertise: [
    "Product Development",
    "Software Engineering",
    "Hardware Engineering",
    "Research & Development",
    "Data Analytics",
    "AI / ML Engineering",
    "UI / UX",
    "Project Management",
    "System Integration",
    "Manufacturing",
    "Quality Assurance",
    "Field Operations",
    "Business Strategy",
    "Impact Assessment",
  ],
  capabilities: [
    "Research & Development",
    "Rapid Prototyping",
    "Proof of Concept",
    "Pilot Testing",
    "Field Deployment",
    "Technology Transfer",
    "Manufacturing",
    "System Integration",
    "Technical Support",
    "Training",
    "Data Collection",
    "Data Analysis",
    "Testing & Validation",
    "Incubation",
    "Scale-up Support",
  ],
  resources: [
    "R&D Team",
    "Engineering Team",
    "Dedicated Labs",
    "Testing Facility",
    "Manufacturing Facility",
    "Cloud Infrastructure",
    "Computing Resources",
    "IoT Hardware",
    "Data Sets",
    "Field Team",
    "Mentors",
    "Funding Support",
    "Pilot Sites",
    "Industry Network",
  ],
};

export default function IndustryProfile() {
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
      setError("");
      const response = await profileService.getIndustryProfile();
      const industry = response?.data?.industry || {};
      setForm({
        ...initialForm,
        ...industry,
        logo: industry.logo || response?.data?.user?.avatar || "",
        about: industry.about || industry.description || "",
        location: industry.location || {},
        sector: industry.sector || [],
        productsServices: industry.productsServices || [],
        technologyAreas: industry.technologyAreas || [],
        skillsExpertise: industry.skillsExpertise || [],
        capabilities: industry.capabilities || [],
        resources: industry.resources || [],
        fundingInterests: industry.fundingInterests || [],
        innovationAreas: industry.innovationAreas || [],
        csrInterests: industry.csrInterests || [],
        researchCollaborationInterests:
          industry.researchCollaborationInterests || [],
        problemsChallenges: industry.problemsChallenges || [],
        collaborationPreferences: industry.collaborationPreferences || [],
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load industry profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      setError("");
      if (!form.name.trim()) throw new Error("Organization name is required.");
      if (!form.location?.state || !form.location?.district)
        throw new Error("State and district are required.");

      const data = new FormData();
      [
        "name",
        "type",
        "email",
        "phone",
        "website",
        "foundedYear",
        "founderCEO",
        "about",
      ].forEach((field) => data.append(field, form[field] ?? ""));
      [
        "sector",
        "productsServices",
        "technologyAreas",
        "skillsExpertise",
        "capabilities",
        "resources",
      ].forEach((field) =>
        data.append(field, JSON.stringify(form[field] || [])),
      );
      data.append("location", JSON.stringify(form.location || {}));
      if (logoFile)
        data.append("logo", logoFile, logoFile.name || "profile.jpg");

      const response = await profileService.updateIndustryProfile(data);
      const industry = response?.data?.industry || {};
      const savedLogo = industry.logo || form.logo;
      setForm((p) => ({ ...p, logo: savedLogo }));
      setLogoFile(null);
      if (response?.data?.user) updateUser(response.data.user);
      setMessage(response?.message || "Industry profile saved successfully.");
      setEditMode(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save industry profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="profile-loading">
          <Loader2 size={28} className="spin" /> Loading industry profile...
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="profile-page industry-profile-page">
        <header className="organization-profile-header">
          <div>
            <Link to="/industry" className="profile-back-link">
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <span className="section-kicker">INDUSTRY / STARTUP PROFILE</span>
            <h1>Industry / Startup profile</h1>
            <p>
              Describe your business, technology and delivery capabilities so
              the platform can match your organization with universities and
              societal challenges.
            </p>
          </div>
          <ProfileImage
            src={form.logo}
            editable={editMode}
            size="large"
            fallbackType="logo"
            onChange={({ file, error: imageError }) => {
              if (imageError) {
                setError(imageError);
                return;
              }
              setError("");
              setLogoFile(file);
            }}
          />
        </header>

        {message && (
          <div className="profile-success">
            <CheckCircle2 size={18} /> {message}
          </div>
        )}
        {error && <div className="profile-error">{error}</div>}

        <form className="profile-form" onSubmit={save}>
          <section className="profile-card">
            <CardTitle kicker="ORGANIZATION" title="Basic information" />
            <div className="profile-grid">
              <Field
                label="Organization / Startup Name"
                value={form.name}
                required
                onChange={(v) => update("name", v)}
                disabled={!editMode}
              />
              <div className="profile-field">
                <label>Organization Type</label>
                <select
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                  disabled={!editMode}
                >
                  <option value="STARTUP">Startup</option>
                  <option value="MSME">MSME</option>
                  <option value="INDUSTRY">Industry</option>
                  <option value="CSR">CSR Organization</option>
                  <option value="RESEARCH_LAB">Research Lab</option>
                  <option value="INNOVATION_HUB">Innovation Hub</option>
                  <option value="NGO">NGO</option>
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
                label="Website"
                value={form.website}
                onChange={(v) => update("website", v)}
                disabled={!editMode}
              />
              <Field
                label="Founded Year"
                type="number"
                value={form.foundedYear}
                onChange={(v) => update("foundedYear", v)}
                disabled={!editMode}
              />
              <Field
                label="Founder / CEO"
                value={form.founderCEO}
                onChange={(v) => update("founderCEO", v)}
                disabled={!editMode}
              />
            </div>
          </section>

          <section className="profile-card">
            <CardTitle kicker="LOCATION" title="Organization location" />
            <LocationSelector
              value={form.location}
              onChange={(location) => update("location", location)}
              disabled={!editMode}
            />
          </section>

          <section className="profile-card">
            <CardTitle
              kicker="CAPABILITIES"
              title="Business & technology capabilities"
            />
            <div className="profile-grid profile-multiselect-grid">
              {Object.entries({
                sector: "Business Sectors",
                productsServices: "Products / Services",
                technologyAreas: "Technology Areas",
                skillsExpertise: "Skills / Expertise",
                capabilities: "Operational & Technical Capabilities",
                resources: "Resources & Infrastructure",
              }).map(([field, label]) => (
                <MultiSelectField
                  key={field}
                  label={label}
                  value={form[field]}
                  options={capabilityOptions[field]}
                  onChange={(v) => update(field, v)}
                  disabled={!editMode}
                  placeholder={`Select ${label.toLowerCase()}`}
                />
              ))}
            </div>
          </section>

          <section className="profile-card">
            <CardTitle kicker="ABOUT" title="Organization overview" />
            <div className="profile-field profile-field-full">
              <label>About Organization</label>
              <textarea
                rows={7}
                value={form.about}
                disabled={!editMode}
                onChange={(e) => update("about", e.target.value)}
                placeholder="Describe your organization, mission, technology and societal impact..."
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
                    setLogoFile(null);
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
                      <Loader2 size={17} className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} /> Save Profile
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
