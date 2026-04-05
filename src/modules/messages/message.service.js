import * as db_service from "../../DB/db.service.js";
import messageModel from "../../DB/models/message.model.js";
import userModel from "../../DB/models/user.model.js";
import { successResponse } from "../../common/utils/response.success.js";

export const sendMessage = async (req, res, next) => {
  const { content, userId } = req.body;
  const user = await db_service.findById({ model: userModel, id: userId });
  if (!user) {
    throw new Error("User Not Exist", { cause: 409 });
  }
  const message = await db_service.create({model:messageModel,data:{content,userId:user._id}});
  successResponse({ res, status: 201, data: message,message:"Message Sent Succefully" });
};

export const getMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const message = await db_service.findOne({model:messageModel,filter:{_id:messageId,userId:req.user._id}});
  if(!message){
    throw new Error("Message Not Exist Or Not Auth");
  }
  successResponse({ res, status: 200, data: message});
};

export const getAllMessages = async (req, res, next) => {
  const message = await db_service.find({model:messageModel,filter:{userId:req.user._id}});
  successResponse({ res, status: 200, data: message});
};
