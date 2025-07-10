import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { BACKEND_URL } from "../config";

const DOMAIN_SKILL_MAP = {
  "Craft and Structure": [
    "Cross-Text Connections",
    "Text Structure and Purpose",
    "Words in Context",
  ],
  "Expression of Ideas": ["Rhetorical Synthesis", "Transitions"],
  "Information and Ideas": [
    "Central Ideas and Details",
    "Command of Evidence",
    "Inferences",
  ],
  "Standard English Conventions": [
    "Boundaries",
    "Form, Structure, and Sense",
  ],
};
const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Very Hard"];

const initialState = {
  passage: "",
  question: "",
  choice_a: "",
  choice_b: "",
  choice_c: "",
  choice_d: "",
  correct_choice: "A",
  rationale_a: "",
  rationale_b: "",
  rationale_c: "",
  rationale_d: "",
  difficulty: DIFFICULTY_OPTIONS[0],
  domain: Object.keys(DOMAIN_SKILL_MAP)[0],
  skill: DOMAIN_SKILL_MAP[Object.keys(DOMAIN_SKILL_MAP)[0]][0],
};

export function AddQuestion() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "domain") {
        return {
          ...prev,
          domain: value,
          skill: DOMAIN_SKILL_MAP[value][0],
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`${BACKEND_URL}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add question");
      setSuccess(true);
      setForm(initialState);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New SAT Question</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          name="passage"
          value={form.passage}
          onChange={handleChange}
          placeholder="Passage (optional)"
          className="w-full border rounded p-2"
          rows={3}
        />
        <input
          name="question"
          value={form.question}
          onChange={handleChange}
          placeholder="Question"
          className="w-full border rounded p-2"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="choice_a"
            value={form.choice_a}
            onChange={handleChange}
            placeholder="Choice A"
            className="border rounded p-2"
            required
          />
          <input
            name="choice_b"
            value={form.choice_b}
            onChange={handleChange}
            placeholder="Choice B"
            className="border rounded p-2"
            required
          />
          <input
            name="choice_c"
            value={form.choice_c}
            onChange={handleChange}
            placeholder="Choice C"
            className="border rounded p-2"
            required
          />
          <input
            name="choice_d"
            value={form.choice_d}
            onChange={handleChange}
            placeholder="Choice D"
            className="border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Correct Choice</label>
          <select
            name="correct_choice"
            value={form.correct_choice}
            onChange={handleChange}
            className="border rounded p-2"
            required
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            name="rationale_a"
            value={form.rationale_a}
            onChange={handleChange}
            placeholder="Rationale A (optional)"
            className="border rounded p-2"
          />
          <input
            name="rationale_b"
            value={form.rationale_b}
            onChange={handleChange}
            placeholder="Rationale B (optional)"
            className="border rounded p-2"
          />
          <input
            name="rationale_c"
            value={form.rationale_c}
            onChange={handleChange}
            placeholder="Rationale C (optional)"
            className="border rounded p-2"
          />
          <input
            name="rationale_d"
            value={form.rationale_d}
            onChange={handleChange}
            placeholder="Rationale D (optional)"
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block font-medium">Difficulty</label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className="border rounded p-2"
            required
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Domain</label>
          <select
            name="domain"
            value={form.domain}
            onChange={handleChange}
            className="border rounded p-2"
            required
          >
            {Object.keys(DOMAIN_SKILL_MAP).map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Skill</label>
          <select
            name="skill"
            value={form.skill}
            onChange={handleChange}
            className="border rounded p-2"
            required
          >
            {DOMAIN_SKILL_MAP[form.domain].map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Question"}
        </button>
        {success && <div className="text-green-600">Question added!</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
