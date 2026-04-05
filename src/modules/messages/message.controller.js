import { Router } from "express";
import * as MS from "./message.service.js";
import { schema } from "../../common/middleware/schema.js";
import { messageSchema } from "../../common/middleware/schema/message.schema.js";
import { authentication } from "../../common/middleware/auth.js";

const messageRouter = Router({caseSensitive:true,strict:true});

messageRouter.post("/", schema(messageSchema), MS.sendMessage);
messageRouter.get("/:messageId",authentication, MS.getMessage);
messageRouter.get("/",authentication, MS.getAllMessages);

export default messageRouter;
