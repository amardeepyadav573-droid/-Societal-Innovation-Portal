import Problem from "../models/Problem.js";
import Project from "../models/Project.js";
import University from "../models/University.js";
import Industry from "../models/Industry.js";
import User from "../models/User.js";

import asyncHandler from "../utils/asyncHandler.js";

export const getDashboardAnalytics =
  asyncHandler(async (req, res) => {
    const [
      totalProblems,
      validatedProblems,
      activeProjects,
      completedProjects,
      universities,
      industries,
      students,
      citizens
    ] = await Promise.all([
      Problem.countDocuments(),

      Problem.countDocuments({
        status: {
          $in: [
            "VALIDATED",
            "ASSIGNED",
            "ACCEPTED",
            "IN_PROGRESS",
            "PROTOTYPE",
            "PILOT",
            "IMPLEMENTED",
            "COMPLETED"
          ]
        }
      }),

      Project.countDocuments({
        status: "ACTIVE"
      }),

      Project.countDocuments({
        status: "COMPLETED"
      }),

      University.countDocuments({
        isActive: true
      }),

      Industry.countDocuments({
        isActive: true
      }),

      User.countDocuments({
        role: "STUDENT",
        isActive: true
      }),

      User.countDocuments({
        role: "CITIZEN",
        isActive: true
      })
    ]);

    const categoryStats =
      await Problem.aggregate([
        {
          $group: {
            _id: "$category",
            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ]);

    const districtStats =
      await Problem.aggregate([
        {
          $group: {
            _id: "$location.district",
            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ]);

    const priorityStats =
      await Problem.aggregate([
        {
          $group: {
            _id: "$priority",
            count: {
              $sum: 1
            }
          }
        }
      ]);

    const projectStageStats =
      await Project.aggregate([
        {
          $group: {
            _id: "$stage",
            count: {
              $sum: 1
            }
          }
        }
      ]);

    const impact =
      await Project.aggregate([
        {
          $group: {
            _id: null,
            peopleImpacted: {
              $sum: "$impact.peopleImpacted"
            },
            villagesCovered: {
              $sum: "$impact.villagesCovered"
            },
            costSaved: {
              $sum: "$impact.costSaved"
            },
            waterSaved: {
              $sum: "$impact.waterSaved"
            },
            energySaved: {
              $sum: "$impact.energySaved"
            },
            employmentGenerated: {
              $sum: "$impact.employmentGenerated"
            }
          }
        }
      ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProblems,
          validatedProblems,
          activeProjects,
          completedProjects,
          universities,
          industries,
          students,
          citizens
        },

        categoryStats,
        districtStats,
        priorityStats,
        projectStageStats,

        impact:
          impact[0] || {
            peopleImpacted: 0,
            villagesCovered: 0,
            costSaved: 0,
            waterSaved: 0,
            energySaved: 0,
            employmentGenerated: 0
          }
      }
    });
  });