import joi from "joi";
import { GenderEnum } from "../../enum/user.enum.js";

export const signUpSchema = joi
  .object({
    userName: joi
      .string()
      .min(3)
      .max(30)
      .trim()
      .pattern(/^[a-zA-Z0-9\s\-_]+$/)
      .required()
      .messages({
        "string.base": "userName must be a string",
        "string.empty": "userName is required",
        "string.min": "userName must be at least 3 characters",
        "string.max": "userName must be at most 30 characters",
        "string.pattern.base":
          "userName can only contain letters, numbers, spaces, - and _",
        "any.required": "userName is required",
      }),

    email: joi
      .string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net", "org", "eg", "co"] },
      })
      .lowercase()
      .trim()
      .required()
      .messages({
        "string.email": "Please enter a valid email",
        "any.required": "Email is required",
      }),

    password: joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters",
      "any.required": "Password is required",
    }),

    rePassword: joi.string().valid(joi.ref("password")).required().messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),

    age: joi.number().integer().min(18).strict(true).required().messages({
      "number.base": "Age must be a number",
      "number.min": "You must be at least 18 years old",
      "any.required": "Age is required",
    }),

    phone: joi
      .string()
      .pattern(/^01[0125][0-9]{8}$/)
      .allow("")
      .optional()
      .messages({
        "string.pattern.base":
          "Please enter a valid Egyptian mobile number starting with 010, 011, 012 or 015 followed by 8 digits",
      }),

    gender: joi.string().valid(...Object.values(GenderEnum)).messages({
      "any.only": "Gender must be either male or female",
    }),
  })
  .required();

export const signInSchema = joi
  .object({
    email: joi
      .string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net", "org", "eg", "co"] },
      })
      .lowercase()
      .trim()
      .required()
      .messages({
        "string.email": "Please enter a valid email",
        "string.empty": "Email is required",
        "any.required": "Email is required",
      }),

    password: joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  })
  .required();
