import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileImage,
  MapPin,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import LocationSelector from "../../components/profile/LocationSelector";

import problemService from "../../services/problemService";
import aiService from "../../services/aiService";

import { DOMAINS } from "../../utils/constants";
import "./SubmitProblem.css";

const initialForm = {
  title: "",
  description: "",
  category: "",
  customDomain: "",
  location: { state: "", district: "", block: "", village: "" },
  affectedPeople: "",
  priority: "MEDIUM",
  expectedSolution: "",
};

export default function SubmitProblem() {
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const change = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateChallengeWithAI = async () => {
    const problem = [form.title.trim(), form.description.trim()].filter(Boolean).join("\n\n");
    if (!problem) {
      setAiError("Pehle apni problem simple words mein describe karein.");
      return;
    }

    try {
      setAiGenerating(true);
      setAiError("");
      const draft = await aiService.generateChallenge(problem);
      setForm((prev) => ({
        ...prev,
        title: draft.title || prev.title,
        description: draft.description || prev.description,
        expectedSolution: draft.expectedSolution || prev.expectedSolution,
      }));
    } catch (err) {
      setAiError(
        err?.response?.data?.message ||
          "AI draft generate nahi ho pa raha. Please try again."
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleFiles = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = "";
  };

  const resetForm = () => {
    setForm(initialForm);
    setFiles([]);
    setError("");
    setSuccess(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const title = form.title.trim();
    const description = form.description.trim();
    if (!title) {
      setError("Please enter a challenge title.");
      return;
    }

    if (!description) {
      setError("Please describe the problem.");
      return;
    }

    if (!form.category) {
      setError("Please select a problem domain.");
      return;
    }

    if (form.category === "OTHER" && !form.customDomain.trim()) {
      setError("Please enter your problem domain.");
      return;
    }

    if (!form.location?.state || !form.location?.district) {
      setError("Please select state and district.");
      return;
    }

    if (!form.location?.block) {
      setError("Please select block.");
      return;
    }

    try {
      setLoading(true);

      /*
       * IMPORTANT:
       * Backend expects location as one JSON field:
       * {
       *   state: "Jharkhand",
       *   district: "...",
       *   block: "...",
       *   village: "..."
       * }
       *
       * Previously district/block/village were sent as
       * separate form fields, so backend received no
       * req.body.location and returned "District is required."
       */
      const payload = {
        title,
        description,
        category: form.category,
        customDomain: form.customDomain.trim(),
        priority: form.priority || "MEDIUM",
        affectedPeople:
          form.affectedPeople === "" ? 0 : Number(form.affectedPeople),
        expectedSolution: form.expectedSolution.trim(),

        location: {
          ...form.location,
          village: form.location.village?.trim() || "",
        },

        evidence: files,
      };

      await problemService.createProblem(payload);

      setSuccess(true);
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message || err?.response?.data?.error;

      setError(
        serverMessage ||
          err?.message ||
          "Unable to submit challenge. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="success-page">
          <div className="success-icon">
            <CheckCircle2 size={42} />
          </div>

          <span className="section-kicker">SUBMISSION SUCCESSFUL</span>

          <h1>Your challenge has been submitted.</h1>

          <p>
            Thank you for contributing to Jharkhand&apos;s innovation ecosystem.
            Your challenge will now go through validation and AI-assisted
            categorization.
          </p>

          <div className="success-actions">
            <Link to="/citizen/problems" className="btn btn-primary">
              Track submission
              <ArrowRight size={17} />
            </Link>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Submit another
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container narrow-container">
        <Link to="/citizen" className="back-link">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="form-page-header">
          <span className="section-kicker">COMMUNITY CHALLENGE</span>

          <h1>Tell us about the problem.</h1>

          <p>
            Give enough detail for experts and institutions to understand the
            challenge and build a practical solution.
          </p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form className="challenge-form" onSubmit={submit}>
          <section className="form-section">
            <div className="form-section-title">
              <span>01</span>

              <div>
                <h2>Problem details</h2>
                <p>Describe the challenge clearly and objectively.</p>
              </div>
            </div>

            <Input
              label="Challenge title"
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g. Irregular drinking water supply in rural villages"
              required
            />

            <div className="form-field">
              <div className="ai-generator-head">
                <label className="form-label">
                  Detailed description
                  <span className="required">*</span>
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-small ai-generate-button"
                  onClick={generateChallengeWithAI}
                  disabled={aiGenerating || (!form.description.trim() && !form.title.trim())}
                >
                  <Sparkles size={15} />
                  {aiGenerating ? "Generating..." : "Generate with AI"}
                </button>
              </div>

              <textarea
                className="form-textarea"
                name="description"
                value={form.description}
                onChange={change}
                placeholder="Describe your problem in simple words. Example: Hamare village mein summer ke time drinking water ki bahut problem hoti hai."
                rows={7}
                required
              />

              <div className="field-hint">
                Simple language is enough. AI can turn your description into a professional title, detailed description and optional solution. You can edit everything before submitting.
              </div>

              {aiError && <div className="ai-generator-error" role="alert">{aiError}</div>}
            </div>

            <div className="two-column">
              <div className="form-field">
                <Select
                  label="Domain"
                  name="category"
                  value={form.category}
                  onChange={change}
                  options={DOMAINS}
                  required
                />
                {form.category === "OTHER" && (
                  <Input
                    label="Enter your problem domain"
                    name="customDomain"
                    value={form.customDomain}
                    onChange={change}
                    placeholder="e.g. Disaster resilience"
                    required
                  />
                )}
              </div>

              <Select
                label="Priority"
                name="priority"
                value={form.priority}
                onChange={change}
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "CRITICAL", label: "Critical" },
                ]}
                required
              />
            </div>

            <div className="form-field">
              <div className="ai-suggested-label"><Sparkles size={14} /> AI Suggested Solution — optional and editable</div>
              <label className="form-label">Expected solution (optional)</label>

              <textarea
                className="form-textarea"
                name="expectedSolution"
                value={form.expectedSolution}
                onChange={change}
                placeholder="If you have an idea for a practical solution, describe it here."
                rows={4}
              />
            </div>

            <Input
              label="Estimated people affected"
              name="affectedPeople"
              type="number"
              min="0"
              step="1"
              value={form.affectedPeople}
              onChange={change}
              placeholder="e.g. 250"
              hint="An approximate number is enough. This helps the portal measure real impact."
            />
          </section>

          <section className="form-section">
            <div className="form-section-title">
              <span>02</span>

              <div>
                <h2>Location</h2>
                <p>Help us understand where the challenge exists.</p>
              </div>
            </div>

            <div className="location-highlight">
              <MapPin size={20} />
              <div>
                <strong>India-wide location</strong>
                <span>
                  Select State → District → Block. The lists are loaded from the
                  central India location master.
                </span>
              </div>
            </div>

            <LocationSelector
              value={form.location}
              onChange={(location) =>
                setForm((prev) => ({ ...prev, location }))
              }
              required
              showExtra={false}
            />

            <Input
              label="Village / Ward / Locality"
              name="village"
              value={form.location.village || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  location: { ...prev.location, village: e.target.value },
                }))
              }
              placeholder="Enter village, ward or locality"
            />
          </section>

          <section className="form-section">
            <div className="form-section-title">
              <span>03</span>

              <div>
                <h2>Evidence & media</h2>
                <p>Photos and documents help validate the challenge.</p>
              </div>
            </div>

            <label className="upload-zone">
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFiles}
              />

              <div className="upload-icon">
                <Upload size={24} />
              </div>

              <strong>Upload supporting evidence</strong>

              <span>Images, videos or documents</span>

              {files.length > 0 && (
                <div className="file-count">
                  <FileImage size={16} />
                  {files.length} file(s) selected
                </div>
              )}
            </label>

            {files.length > 0 && (
              <div className="selected-files">
                {files.map((file, index) => (
                  <div
                    className="selected-file"
                    key={`${file.name}-${file.size}-${index}`}
                  >
                    <FileImage size={16} />

                    <span>{file.name}</span>

                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeFile(index)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="ai-notice">
            <div className="ai-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <strong>AI-assisted processing</strong>

              <p>
                Your submission may be automatically categorized, prioritized,
                checked for duplicates and matched with suitable institutions.
              </p>
            </div>
          </div>

          <div className="form-submit">
            <Button
              type="submit"
              loading={loading}
              icon={<ArrowRight size={18} />}
            >
              {loading ? "Submitting..." : "Submit challenge"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
