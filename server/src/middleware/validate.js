const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const data = req[source];
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    req[source] = parsed.data;
    return next();
  };

module.exports = validate;
