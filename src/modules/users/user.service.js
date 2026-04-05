import { ProviderEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encrypt.security.js";
import {
  CompareHash,
  Hash,
} from "../../common/utils/security/hash.security.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "../../common/utils/cloudinary.js";
import {
  deleteKey,
  get,
  incr,
  keys,
  set,
  ttl_redis,
} from "../../DB/redis/redis.service.js";
import { randomUUID } from "crypto";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email.js";
import { sendEmailOtp } from "../../common/utils/email/email.otp.js";
import { eventEmitter } from "../../common/utils/email/email.event.js";
import { email_Template } from "../../common/utils/email/email.template.js";

export const signUp = async (req, res, next) => {
  const {
    userName,
    email,
    password,
    rePassword,
    age,
    gender,
    provider,
    phone,
  } = req.body;

  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("User Already Exist", { cause: 409 });
  }

  try {
    let profilePicture;

    if (req.file) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.file.path,
        { folder: "SarahahApp/usersProfile" },
      );

      profilePicture = { secure_url, public_id };
    }

    const user = await db_service.create({
      model: userModel,
      data: {
        userName,
        email,
        password: Hash({ plainText: password }),
        age,
        gender,
        provider,
        phone: phone ? encrypt(phone) : undefined,
        profilePicture,
      },
    });

    const otp = await generateOtp();
    eventEmitter.emit("confirmEmail", async () => {
      await sendEmail({
        to: email,
        subject: "Welcome To SarahahApp",
        html: email_Template(otp),
      });
      await set({
        key: `otp::${email}`,
        value: Hash({ plainText: `${otp}` }),
        ttl: 60 * 2,
      });
      await set({
        key: `max_otp::${email}`,
        value: 1,
        ttl: 60 * 5,
      });
    });
    successResponse({ res, status: 201, data: user });
  } catch (error) {
    next(error);
  }
};

export const confirmEmail = async (req, res, nex) => {
  const { email, otp } = req.body;
  const otpExist = await get(`otp::${email}`);
  if (!otpExist) {
    throw new Error("Otp Expired");
  }
  if (!CompareHash({ plainText: otp, cipherText: otpExist })) {
    throw new Error("Invalid Otp");
  }
  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { email, confirmed: { $exists: false } },
    update: { confirmed: true },
  });
  if (!user) {
    throw new Error("User Not Exist");
  }
  await deleteKey(`otp::${email}`);
  successResponse({ res, message: "Email confirmed Succefully!" });
};

export const resendOtp = async (req, res, nex) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email, confirmed: { $exists: false } },
  });
  if (!user) {
    throw new Error("User Not Exist Or Already Confirmed");
  }
  await sendEmailOtp(email);
  successResponse({ res, message: "Otp Resend Succefully!" });
};

export const signUpWithGmail = async (req, res, next) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience:
      "61130512574-udlci8jhlbo963h2n518i5001qqjils4.apps.googleusercontent.com",
  });
  const payload = ticket.getPayload();
  const { email, email_verified, name, picture } = payload;
  let user = await db_service.findOne({ model: userModel, filter: { email } });
  if (!user) {
    user = await db_service.create({
      model: userModel,
      data: {
        email,
        userName: name,
        profilePicture: picture,
        confirmed: email_verified,
        provider: ProviderEnum.google,
      },
    });
  }
  if (user.provider == ProviderEnum.system) {
    throw new Error("Please Log In In System Only", { cause: 400 });
  }
  const token = jwt.sign({ userId: user._id }, "DiaaDiaa", { expiresIn: "1h" });
  successResponse({ res, message: "LogIn Succefully", data: { token: token } });
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db_service.findOne({
      model: userModel,
      filter: {
        email,
        provider: ProviderEnum.system,
        confirmed: { $exists: true },
      },
    });
    if (!user) {
      throw new Error("User Not Exist", { cause: 409 });
    }
    if (!CompareHash({ plainText: password, cipherText: user.password })) {
      throw new Error("Invalid Password", { cause: 400 });
    }
    const uuid = randomUUID();
    const token = jwt.sign({ userId: user._id }, "DiaaDiaa", {
      expiresIn: "1h",
      jwtid: uuid,
    });
    const refreshToken = jwt.sign({ userId: user._id }, "DiaaDiaaRefresh", {
      expiresIn: "1y",
      jwtid: uuid,
    });
    successResponse({
      res,
      message: "LogIn Succefully",
      data: { token, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await db_service.findOne({
      model: userModel,
      filter: {
        email,
        provider: ProviderEnum.system,
        confirmed: { $exists: true },
      },
    });
    if (!user) {
      throw new Error("User Not Exist", { cause: 409 });
    }
    await sendEmailOtp(email);
    successResponse({ res, message: "Otp Send Succefully" });
  } catch (error) {
    next(error);
  }
};

export const confirmPassword = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const otpValue = await get(`otp::${email}`);
    if (!otpValue) {
      throw new Error("Invalid or Expired OTP");
    }
    if (!CompareHash({ plainText: otp, cipherText: otpValue })) {
      throw new Error("Otp Is Invalid");
    }
    await deleteKey(`otp::${email}`);
    await deleteKey(`max_otp::${email}`);
    await set({ key: `verified_otp::${email}`, value: 1, ttl: 60 * 5 });
    successResponse({ res, message: "Otp Is Valid" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    const isVerified = await get(`verified_otp::${email}`);
    if (!isVerified) {
      throw new Error("Otp not verified");
    }
    const user = await db_service.findOneAndUpdate({
      model: userModel,
      filter: {
        email,
        provider: ProviderEnum.system,
        confirmed: { $exists: true },
      },
      update: {
        password: Hash({ plainText: newPassword }),
        logOut: new Date(),
      },
    });
    if (!user) {
      throw new Error("User Not Exist", { cause: 409 });
    }
    await deleteKey(`verified_otp::${email}`);
    await deleteKey(`confirm_tries::${email}`);
    successResponse({ res, message: "Password Reset Succefully" });
  } catch (error) {
    next(error);
  }
};


export const getProfile = async (req, res, next) => {
  try {
    successResponse({
      res,
      data: { ...req.user._doc, phone: decrypt(req.user.phone) },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const getUserProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isOwner = req.user?._id?.toString() === id;
    let user;
    if (!isOwner) {
      user = await userModel
        .findByIdAndUpdate(id, { $inc: { totalViews: 1 } }, { new: true })
        .select("-password");
    } else {
      user = await userModel.findById(id).select("-password");
    }

    if (!user) {
      throw new Error("User Not Found", { cause: 404 });
    }

    successResponse({ res, data: user });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshtoken } = req.headers;
    if (!refreshtoken) {
      throw new Error("Token Not Provide");
    }
    const decoded = jwt.verify(refreshtoken, "DiaaDiaaRefresh");
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
    const token = jwt.sign({ userId: user._id }, "DiaaDiaa", {
      expiresIn: "1h",
    });
    successResponse({
      res,
      data: token,
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    let { firstName, lastName, gender, phone } = req.body;
    if (phone) {
      phone = encrypt(phone);
    }
    const user = await db_service.findOneAndUpdate({
      model: userModel,
      filter: { _id: req.user._id },
      update: { firstName, lastName, gender, phone },
    });
    if (!user) {
      throw new Error("User Not Exist");
    }
    successResponse({
      res,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    let { oldPassword, newPassword } = req.body;
    if (
      !CompareHash({ plainText: oldPassword, cipherText: req.user.password })
    ) {
      throw new Error("Invalid old Password", { cause: 400 });
    }
    const hashNewPassword = Hash({ plainText: newPassword });
    req.user.password = hashNewPassword;
    req.user.logOutTime = new Date();
    await req.user.save();
    successResponse({ res });
  } catch (error) {
    next(error);
  }
};

export const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error("Image is required", { cause: 400 });
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "SarahahApp/usersProfile" },
    );

    if (req.user.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(req.user.profilePicture.public_id);
    }

    req.user.profilePicture = {
      secure_url,
      public_id,
    };

    await req.user.save();

    successResponse({
      res,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const logOut = async (req, res, next) => {
  const { all } = req.query;
  if (all == "true") {
    req.user.logOutTime = new Date();
    await req.user.save();
    await deleteKey(await keys(`revoke_token::${req.user._id}`));
  } else {
    await set({
      key: `revoke_token::${req.user._id}::${req.decoded.jti}`,
      value: `${req.decoded._id}`,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
    });
  }
  successResponse({ res });
};
