export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed hello",
      errors: result.error.message,
    });
  }

  Object.assign(req, result.data);
  next();
};
