import { ProviderEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import { decrypt, encrypt } from "../../common/utils/security/encrypt.security.js";
import { CompareHash, Hash } from "../../common/utils/security/hash.security.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import jwt from "jsonwebtoken";
import {OAuth2Client} from 'google-auth-library';



export const signUp = async (req, res, next) => {
  const {userName,email,password,rePassword,age,gender,provider,phone} = req.body;
  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("User Already Exist",{cause:409});
  }
  try {
    const user = await db_service.create({
      model: userModel,
      data: { userName, email, password:Hash({plainText:password}), age, gender, provider, phone:encrypt(phone)},
    });
    successResponse({res,status:201,data:user});
  } catch (error) {
    res.status(500).json({
      message: "Server Error!",
      message: error.message,
      stack: error.stack,
    });
  }
};


export const signUpWithGmail = async (req, res, next) => {
  const {idToken} = req.body;
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
      idToken,
      audience: "61130512574-udlci8jhlbo963h2n518i5001qqjils4.apps.googleusercontent.com", 
  });
  const payload = ticket.getPayload();
  const {email,email_verified,name,picture} = payload;
  let user = await db_service.findOne({model:userModel,filter:{email}});
  if(!user){
    user = await db_service.create({
      model:userModel,
      data:{
        email,
        userName:name,
        profilePicture:picture,
        confirmed:email_verified,
        provider:ProviderEnum.google
      }
    })
  }
  if(user.provider == ProviderEnum.system){
    throw new Error("Please Log In In System Only",{cause:400});
    
  }
  const token = jwt.sign({ userId: user._id },"DiaaDiaa",{ expiresIn: "1h" });
  successResponse({res,message:"LogIn Succefully",data:{token:token}});
};


export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db_service.findOne({
      model: userModel,
      filter: {
        email,
        provider: ProviderEnum.system,
      },
    });
    if (!user) {
      throw new Error("User Not Exist",{cause:409});
    }
    if (!CompareHash({plainText:password,cipherText:user.password})) {
      throw new Error("Invalid Password",{cause:400});
    }
    const token = jwt.sign({ userId: user._id },"DiaaDiaa",{ expiresIn: "1h" });
    successResponse({res,message:"LogIn Succefully",data:{token:token}});
  } catch (error) {
    next(error);
  }
};




export const getProfile = async (req, res, next) => {
  try {
    successResponse({res,data:{...req.user._doc,phone:decrypt(req.user.phone)}});
  } catch (error) {
    next(error);
  }
};



export const getUserProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isOwner = req.user?._id?.toString() === id;
    let user;
    if (!isOwner) {
      user = await userModel.findByIdAndUpdate(
        id,
        { $inc: { totalViews: 1 } },
        { new: true }
      ).select("-password");
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
