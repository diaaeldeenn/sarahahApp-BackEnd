import joi from "joi";

export const messageSchema = joi
  .object({
    content: joi
      .string()
      .min(1)
      .required()
      .messages({
        "string.empty": "Message is empty",
        "string.min": "Message cannot be empty",
        "any.required": "Message is required",
      }),

    userId: joi
      .string()
      .length(24)
      .hex()
      .required()
      .messages({
        "string.length": "Invalid userId",
        "string.hex": "userId must be valid",
        "any.required": "userId is required",
      }),
  })
  .required();