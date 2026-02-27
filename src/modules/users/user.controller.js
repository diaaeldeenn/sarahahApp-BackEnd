import { Router } from "express";
import * as US from "./user.service.js";
import {RoleEnum} from "../../common/enum/user.enum.js";
import { authentication,authenticationVisitor,authorization } from "../../common/middleware/auth.js";
import { schema } from "../../common/middleware/schema.js";
import { signInSchema, signUpSchema } from "../../common/middleware/schema/auth.schema.js";
import { localMulter } from "../../common/middleware/multer.js";
import { multerTypeEnum } from "../../common/enum/multer.enum.js";

const userRouter = Router();

userRouter.post("/signup",localMulter({filePath:"users",fileExt:[...multerTypeEnum.image,...multerTypeEnum.video]}).single("image"),US.signUp);
userRouter.post("/signup/gmail", US.signUpWithGmail);
userRouter.post("/signin", US.signIn);
userRouter.get("/profile",authentication,authorization([RoleEnum.user]),US.getProfile);
userRouter.get("/:id", authenticationVisitor, US.getUserProfileById);

export default userRouter;




//schema(signUpSchema)
//schema(signInSchema)