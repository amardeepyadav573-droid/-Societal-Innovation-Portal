import University from "../models/University.js";
import Industry from "../models/Industry.js";

const STOP_WORDS = new Set([
  "about", "after", "also", "area", "areas", "based", "being", "build", "can",
  "could", "from", "have", "into", "more", "need", "needs", "problem", "provide",
  "required", "should", "that", "their", "there", "these", "this", "through",
  "using", "with", "would", "work", "works", "technology", "technologies",
  "solution", "solutions", "development", "research", "university", "institute",
]);

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (value) =>
  normalize(value)
    .split(" ")
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

const unique = (values) => [...new Set(values.flatMap(tokens))];

const scoreField = (requiredValues, availableValues) => {
  const required = unique(requiredValues);
  const available = unique(availableValues);
  if (!required.length || !available.length) {
    return { score: 0, matches: [] };
  }

  const matches = [];
  for (const requiredToken of required) {
    const hit = available.find(
      (availableToken) =>
        availableToken === requiredToken ||
        (requiredToken.length >= 5 &&
          (availableToken.includes(requiredToken) ||
            requiredToken.includes(availableToken))),
    );
    if (hit) matches.push({ required: requiredToken, available: hit });
  }

  return {
    score: Math.round((matches.length / required.length) * 100),
    matches,
  };
};

const buildProblemSignals = (problem) => ({
  title: problem.title,
  description: problem.description,
  domain: problem.category,
  customDomain: problem.customDomain,
  subCategory: problem.subCategory,
  expectedSolution: problem.expectedSolution,
  location: [
    problem.location?.state,
    problem.location?.district,
    problem.location?.block,
  ],
  keywords: problem.aiAnalysis?.keywords || [],
  requiredExpertise: problem.aiAnalysis?.requiredExpertise || [],
});

const buildUniversitySignals = (university) => ({
  researchAreas: university.researchAreas || [],
  departments: [...(university.departments || []), ...(university.disciplines || [])],
  institutionalExpertise: [
    ...(university.expertise || []),
    ...(university.innovationFacilities || []),
    ...(university.ongoingProjects || []),
    ...(university.previousProjects || []),
    ...(university.collaborationInterests || []),
  ],
  facultyResearchers: university.facultyResearchers || [],
  courses: university.courses || [],
  facilities: [
    ...(university.facilities || []),
    ...(university.innovationFacilities || []),
    ...(university.incubationFacilities || []),
    ...(university.availableResources || []),
  ],
});

export const analyzeUniversityProblemMatch = (problem, university) => {
  const p = buildProblemSignals(problem);
  const u = buildUniversitySignals(university);
  const expertise = [...p.requiredExpertise, ...p.keywords, p.category, p.customDomain, p.subCategory];

  const factors = [
    { key: "researchAreas", label: "Research Area", weight: 25, required: expertise, available: u.researchAreas },
    { key: "departments", label: "Department Expertise", weight: 20, required: [...p.requiredExpertise, p.category, p.customDomain], available: u.departments },
    { key: "institutionalExpertise", label: "Institutional Expertise", weight: 20, required: [p.title, p.description, p.expectedSolution, ...p.keywords, ...p.requiredExpertise], available: u.institutionalExpertise },
    { key: "facultyResearchers", label: "Faculty/Researchers", weight: 15, required: [...p.requiredExpertise, ...p.keywords], available: u.facultyResearchers },
    { key: "courses", label: "Courses/Programs", weight: 10, required: [...p.requiredExpertise, p.category, ...p.keywords], available: u.courses },
    { key: "facilities", label: "Facilities/Labs", weight: 10, required: [...p.requiredExpertise, ...p.keywords, p.expectedSolution], available: u.facilities },
  ];

  const results = factors.map((factor) => {
    const result = scoreField(factor.required, factor.available);
    return { ...factor, score: result.score, matches: result.matches };
  });

  const score = Math.round(
    results.reduce((total, factor) => total + (factor.score * factor.weight) / 100, 0),
  );

  const reasons = results
    .flatMap((factor) =>
      factor.matches.slice(0, 5).map(
        (match) =>
          `${factor.label}: problem signal "${match.required}" matches university information "${match.available}".`,
      ),
    )
    .slice(0, 12);

  const unmatched = results
    .filter((factor) => factor.score < 100)
    .map((factor) => `${factor.label} has ${factor.score}% signal coverage.`);

  return {
    score,
    factors: results.map(({ key, label, weight, score: factorScore, matches }) => ({
      key,
      label,
      weight,
      score: factorScore,
      matches: matches.map((match) => ({
        required: match.required,
        available: match.available,
      })),
    })),
    reasons,
    unmatched,
    problem: {
      _id: problem._id,
      title: problem.title,
      category: problem.category,
    },
    university: {
      _id: university._id,
      name: university.name,
    },
  };
};

export const matchUniversityToProblem = analyzeUniversityProblemMatch;

export const recommendUniversities = async (requiredExpertise = []) => {
  const universities = await University.find({ isActive: true })
    .select("name shortName expertise disciplines researchAreas")
    .limit(100)
    .lean();

  return universities
    .map((university) => {
      const expertise = [
        ...(university.expertise || []),
        ...(university.disciplines || []),
        ...(university.researchAreas || []),
      ];
      const score = calculateSimpleScore(requiredExpertise, expertise);
      return {
        university: university._id,
        score,
        reason: score > 0 ? `${score}% expertise match` : "General innovation capability",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

const calculateSimpleScore = (required, available) => {
  const result = scoreField(required, available);
  return result.score;
};

export const recommendIndustries = async (requiredExpertise = []) => {
  const industries = await Industry.find({ isActive: true })
    .select("name type capabilities domains")
    .limit(100)
    .lean();

  return industries
    .map((industry) => {
      const capabilities = [...(industry.capabilities || []), ...(industry.domains || [])];
      const score = calculateSimpleScore(requiredExpertise, capabilities);
      return {
        industry: industry._id,
        score,
        reason: score > 0 ? `${score}% capability match` : "General innovation support",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};


export const rankUniversitiesForProblem = async (problem, { limit = 10 } = {}) => {
  const universities = await University.find({ isActive: true })
    .select(
      "name shortName type location departments disciplines courses researchAreas expertise facilities facultyResearchers innovationFacilities incubationFacilities ongoingProjects previousProjects availableResources collaborationInterests",
    )
    .sort({ name: 1 })
    .lean();

  const ranked = universities
    .map((university) => analyzeUniversityProblemMatch(problem, university))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.university.name).localeCompare(String(b.university.name));
    });

  return {
    totalUniversities: ranked.length,
    matches: ranked.slice(0, Math.max(1, Math.min(Number(limit) || 10, 50))),
    allMatches: ranked,
  };
};
