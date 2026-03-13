import jwt from "jsonwebtoken";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const authentication = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      throw new Error("Token Not Provide");
    }
    const decoded = jwt.verify(token, "DiaaDiaa");
    const userId = decoded.userId;
    if (!decoded || !userId) {
      throw new Error("Invalid Token");
    }
    const user = await db_service.findOne({
      model: userModel,
      filter: { _id: userId },
    });
    if (!user) {
      throw new Error("User Not Found");
    }
    console.log(user);
    
    if (user?.logOutTime?.getTime() > decoded.iat * 1000) {
      throw new Error("invalid Token");
    }
    req.user = user;
    req.decoded = decoded;
    
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }
};

export const authorization = (roles = []) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new Error("UnAuthorized");
    }
    next();
  };
};

export const authenticationVisitor = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, "DiaaDiaa");

    if (!decoded?.userId) {
      return next();
    }

    const user = await db_service.findOne({
      model: userModel,
      filter: { _id: decoded.userId },
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};
