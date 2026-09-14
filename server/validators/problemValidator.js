import { body } from "express-validator";

export const problemValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage(
      "Problem title is required."
    ),

  body("description")
    .trim()
    .isLength({
      min: 20
    })
    .withMessage(
      "Problem description must contain at least 20 characters."
    ),

  body("category")
    .optional()
    .isString()
    .withMessage(
      "Invalid category."
    ),

  body("priority")
    .optional()
    .isIn([
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL"
    ])
    .withMessage(
      "Invalid priority."
    ),

  body("affectedPeople")
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage(
      "Affected people must be a non-negative whole number."
    ),

  body("location")
    .notEmpty()
    .withMessage(
      "Location is required."
    )
    .custom((value) => {
      let location = value;

      if (
        typeof value === "string"
      ) {
        try {
          location =
            JSON.parse(value);
        } catch {
          throw new Error(
            "Invalid location format."
          );
        }
      }

      if (
        !location ||
        !location.district ||
        !String(
          location.district
        ).trim()
      ) {
        throw new Error(
          "District is required."
        );
      }

      return true;
    })
];