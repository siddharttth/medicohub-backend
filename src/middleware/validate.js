const ApiError = require('../helpers/apiError');

const validate = (schema, property = 'body') => (req, _res, next) => {
  const { error } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (!error) return next();

  console.error('[Validation] failed', {
    route: req.originalUrl,
    method: req.method,
    property,
    payload: req[property],
    errors: error.details.map(d => d.message),
  });

  const errors = error.details.map(d => d.message);
  throw ApiError.badRequest('Validation failed', errors);
};

module.exports = validate;
