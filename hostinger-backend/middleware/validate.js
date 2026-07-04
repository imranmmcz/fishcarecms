/**
 * Zero-dependency body validator. Each rule is a plain object:
 *   { type: 'string'|'number'|'integer'|'boolean'|'array'|'object',
 *     required?: boolean,
 *     min?: number, max?: number, // length for string/array, value for number
 *     enum?: any[], pattern?: RegExp,
 *     items?: rule, // for array
 *   }
 * Returns 400 with { error: 'Invalid body', details: {...} } on failure.
 */

function validateValue(value, rule, path) {
  const errs = [];
  if (value === undefined || value === null || value === '') {
    if (rule.required) errs.push(`${path} is required`);
    return errs;
  }
  const t = rule.type;
  if (t === 'string' && typeof value !== 'string') errs.push(`${path} must be a string`);
  if (t === 'number' && typeof value !== 'number') errs.push(`${path} must be a number`);
  if (t === 'integer' && !Number.isInteger(value)) errs.push(`${path} must be an integer`);
  if (t === 'boolean' && typeof value !== 'boolean') errs.push(`${path} must be a boolean`);
  if (t === 'array' && !Array.isArray(value)) errs.push(`${path} must be an array`);
  if (t === 'object' && (typeof value !== 'object' || Array.isArray(value))) errs.push(`${path} must be an object`);
  if (errs.length) return errs;

  if (typeof value === 'string' || Array.isArray(value)) {
    if (rule.min !== undefined && value.length < rule.min) errs.push(`${path} min length ${rule.min}`);
    if (rule.max !== undefined && value.length > rule.max) errs.push(`${path} max length ${rule.max}`);
  }
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) errs.push(`${path} must be >= ${rule.min}`);
    if (rule.max !== undefined && value > rule.max) errs.push(`${path} must be <= ${rule.max}`);
  }
  if (rule.enum && !rule.enum.includes(value)) errs.push(`${path} must be one of ${rule.enum.join(',')}`);
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) errs.push(`${path} has invalid format`);
  if (Array.isArray(value) && rule.items) {
    value.forEach((v, i) => errs.push(...validateValue(v, rule.items, `${path}[${i}]`)));
  }
  return errs;
}

function validateBody(schema) {
  return (req, res, next) => {
    const body = req.body || {};
    const details = {};
    for (const [key, rule] of Object.entries(schema)) {
      const errs = validateValue(body[key], rule, key);
      if (errs.length) details[key] = errs;
    }
    if (Object.keys(details).length) {
      return res.status(400).json({ error: 'Invalid request body', details });
    }
    next();
  };
}

module.exports = { validateBody, validateValue };