import jwt from "jsonwebtoken";
import env from "../config/env.js";

const authMiddleware = (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    let token = null;

    if (
      authHeader &&
      authHeader.startsWith(
        "Bearer "
      )
    ) {
      token =
        authHeader.substring(7);
    }

    if (!token && req.cookies) {
      token =
        req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const decoded =
      jwt.verify(
        token,
        env.jwtSecret
      );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token.",
    });
  }
};

export default authMiddleware;