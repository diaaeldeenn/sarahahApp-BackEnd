export const schema = (schema) => {
  return async (req, res, next) => {
    const result = schema.validate(req.body, { abortEarly: false });
    if (result.error) {
      return res.status(422).json({
        success: false,
        message: "Validation Error",
        errors: result.error.details.map((e) => e.message),
      });
    }
    next();
  };
};
