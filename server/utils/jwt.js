import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "change-this-secret";

const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "7d";

export const generateToken = (
  payload,
  expiresIn = JWT_EXPIRES_IN
) => {
  if (!payload) {
    throw new Error("Token payload is required.");
  }

  let data = {};

  if (
    payload &&
    typeof payload.toObject === "function"
  ) {
    data = payload.toObject({
      getters: false,
      virtuals: false
    });
  } else if (
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    data = { ...payload };
  } else {
    throw new Error(
      "Token payload must be a plain object."
    );
  }

  const tokenPayload = {
    id: String(data._id || data.id),
    role: data.role
  };

  return jwt.sign(
    tokenPayload,
    JWT_SECRET,
    {
      expiresIn
    }
  );
};

export const verifyToken = (token) => {
  if (!token) {
    throw new Error("Authentication token is required.");
  }

  return jwt.verify(
    token,
    JWT_SECRET
  );
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};