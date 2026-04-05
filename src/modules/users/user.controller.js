import { Router } from "express";
import * as US from "./user.service.js";
import {RoleEnum} from "../../common/enum/user.enum.js";
import { authentication,authenticationVisitor,authorization } from "../../common/middleware/auth.js";
import { schema } from "../../common/middleware/schema.js";
import { confirmEmailSchema, emailSchema, resetPasswordSchema, signInSchema, signUpSchema, updatePasswordSchema, updateProfileSchema } from "../../common/middleware/schema/auth.schema.js";
import { cloudMulter } from "../../common/middleware/multer.js";
import { multerTypeEnum } from "../../common/enum/multer.enum.js";

const userRouter = Router({caseSensitive:true,strict:true});

userRouter.post("/signup",cloudMulter({fileExt:multerTypeEnum.image}).single("image"),schema(signUpSchema),US.signUp);
userRouter.post("/signup/gmail", US.signUpWithGmail);
userRouter.patch("/signup/confirm-email",schema(confirmEmailSchema),US.confirmEmail);
userRouter.post("/signup/resend_otp",schema(emailSchema),US.resendOtp);
userRouter.post("/signin",schema(signInSchema),US.signIn);
userRouter.post("/logout",authentication,US.logOut);
userRouter.get("/refreshToken",US.refreshToken);
userRouter.get("/profile",authentication,US.getProfile);
userRouter.patch("/updateProfile",authentication,schema(updateProfileSchema),US.updateProfile);
userRouter.patch("/updatePassword",authentication,schema(updatePasswordSchema),US.updatePassword);
userRouter.patch("/forgetPassword",schema(emailSchema),US.forgetPassword);
userRouter.post("/confirmPassword",schema(confirmEmailSchema),US.confirmPassword);
userRouter.patch("/resetPassword",schema(resetPasswordSchema),US.resetPassword);
userRouter.patch("/updateProfilePicture",authentication,cloudMulter({ fileExt: multerTypeEnum.image }).single("image"),US.updateProfilePicture);
//^it's The Same Of ShareProfile
userRouter.get("/:id", authenticationVisitor, US.getUserProfileById);

export default userRouter;