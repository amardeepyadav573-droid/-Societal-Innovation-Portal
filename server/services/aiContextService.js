import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import Project from '../models/Project.js';
import University from '../models/University.js';
import Industry from '../models/Industry.js';
import User from '../models/User.js';

const oid = (value) =>
  value && mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const cleanUser = (user) => ({
  name: user?.name || '',
  role: user?.role || '',
  participationType: user?.participationType || '',
  organizationModel: user?.organizationModel || null,
  designation: user?.designation || '',
  department: user?.department || '',
  expertise: Array.isArray(user?.expertise) ? user.expertise.slice(0, 12) : [],
  skills: Array.isArray(user?.skills) ? user.skills.slice(0, 12) : [],
  areasOfInterest: Array.isArray(user?.areasOfInterest)
    ? user.areasOfInterest.slice(0, 12)
    : [],
  location: user?.location
    ? {
        state: user.location.state || '',
        district: user.location.district || '',
        city: user.location.city || '',
        block: user.location.block || '',
        village: user.location.village || '',
      }
    : null,
});

const publicChallenge = (problem) => {
  if (!problem) return null;
  const p = problem.toObject ? problem.toObject() : problem;
  return {
    id: p._id,
    problemId: p.problemId,
    title: p.title,
    description: p.description,
    expectedSolution: p.expectedSolution || '',
    category: p.customDomain || p.category || 'OTHER',
    priority: p.priority,
    status: p.status,
    progress: Number(p.progress || 0),
    location: {
      state: p.location?.state || '',
      district: p.location?.district || '',
      block: p.location?.block || '',
      village: p.location?.village || '',
      ward: p.location?.ward || '',
    },
    affectedPeople: Number(p.affectedPeople || 0),
    assignedUniversity: p.assignedUniversity
      ? {
          name: p.assignedUniversity.name || '',
          shortName: p.assignedUniversity.shortName || '',
          expertise: Array.isArray(p.assignedUniversity.expertise)
            ? p.assignedUniversity.expertise.slice(0, 12)
            : [],
        }
      : null,
    assignedProject: p.assignedProject
      ? {
          title: p.assignedProject.title || '',
          status: p.assignedProject.status || '',
          progress: Number(p.assignedProject.progress || 0),
          stage: p.assignedProject.stage || '',
        }
      : null,
  };
};

const buildRoleData = async (user) => {
  const role = String(user?.role || '').toUpperCase();
  const userId = oid(user?._id);
  const organizationId = oid(user?.organization);

  if (role === 'CITIZEN' && userId) {
    const [total, underReview, active, resolved, recent] = await Promise.all([
      Problem.countDocuments({ submittedBy: userId }),
      Problem.countDocuments({ submittedBy: userId, status: 'UNDER_REVIEW' }),
      Problem.countDocuments({
        submittedBy: userId,
        status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PROTOTYPE', 'PILOT'] },
      }),
      Problem.countDocuments({
        submittedBy: userId,
        status: { $in: ['IMPLEMENTED', 'COMPLETED'] },
      }),
      Problem.find({ submittedBy: userId })
        .select('problemId title status category priority location.district createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);
    return { roleMetrics: { totalChallenges: total, underReview, active, resolved }, recentChallenges: recent };
  }

  if (['UNIVERSITY', 'FACULTY', 'STUDENT'].includes(role) && organizationId) {
    const [assigned, accepted, activeProjects, completedProjects, recent] = await Promise.all([
      Problem.countDocuments({ assignedUniversity: organizationId }),
      Problem.countDocuments({ assignedUniversity: organizationId, status: 'ACCEPTED' }),
      Project.countDocuments({ university: organizationId, status: 'ACTIVE' }),
      Project.countDocuments({ university: organizationId, status: 'COMPLETED' }),
      Problem.find({ assignedUniversity: organizationId })
        .select('problemId title status category priority location.district assignedProject')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
    ]);
    return { roleMetrics: { assignedChallenges: assigned, acceptedChallenges: accepted, activeProjects, completedProjects }, recentChallenges: recent };
  }

  if (['INDUSTRY', 'MENTOR'].includes(role) && organizationId) {
    const [opportunities, activeProjects, collaborations] = await Promise.all([
      Problem.countDocuments({
        status: { $in: ['VALIDATED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PROTOTYPE', 'PILOT'] },
        'recommendedIndustries.industry': organizationId,
      }),
      Project.countDocuments({ status: 'ACTIVE', industryPartners: organizationId }),
      Project.countDocuments({ industryPartners: organizationId }),
    ]);
    return { roleMetrics: { matchedOpportunities: opportunities, activeProjects, collaborationProjects: collaborations } };
  }

  if (['GOVERNMENT', 'ADMIN'].includes(role)) {
    const [total, submitted, underReview, validated, assigned, inProgress, resolved, activeProjects, universities, industries, districtBreakdown] = await Promise.all([
      Problem.countDocuments(),
      Problem.countDocuments({ status: 'SUBMITTED' }),
      Problem.countDocuments({ status: 'UNDER_REVIEW' }),
      Problem.countDocuments({ status: 'VALIDATED' }),
      Problem.countDocuments({ status: 'ASSIGNED' }),
      Problem.countDocuments({ status: { $in: ['IN_PROGRESS', 'PROTOTYPE', 'PILOT'] } }),
      Problem.countDocuments({ status: { $in: ['IMPLEMENTED', 'COMPLETED'] } }),
      Project.countDocuments({ status: 'ACTIVE' }),
      University.countDocuments({ isActive: true }),
      Industry.countDocuments({ isActive: true }),
      Problem.aggregate([
        { $group: { _id: '$location.district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);
    return {
      roleMetrics: { totalChallenges: total, submitted, underReview, validated, assigned, inProgress, resolved, activeProjects, universities, industries },
      topChallengeDistricts: districtBreakdown,
    };
  }

  return {};
};

export const buildAIContext = async ({ user, currentPage = '', challengeId = '' }) => {
  const context = {
    currentPage: String(currentPage || '').slice(0, 180),
    user: cleanUser(user),
    roleData: {},
    currentChallenge: null,
  };

  if (challengeId && mongoose.Types.ObjectId.isValid(challengeId)) {
    const challenge = await Problem.findById(challengeId)
      .populate('assignedUniversity', 'name shortName expertise')
      .populate('assignedProject', 'title status progress stage')
      .lean();
    context.currentChallenge = publicChallenge(challenge);
  }

  context.roleData = await buildRoleData(user);
  return context;
};
