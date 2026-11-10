import Joi from "joi";
import { BadRequestError } from "./errors.js";

/**
 * Human-readable templates for the most common Joi error types.
 * The {{field}} placeholder is replaced with the dotted property path.
 */
const DEFAULT_MESSAGES: Record<string, string> = {
  "any.required": "{{field}} is required",
  "any.unknown": "{{field}} is not allowed",
  "string.empty": "{{field}} cannot be empty",
  "string.min": "{{field}} must be at least {{limit}} characters",
  "string.max": "{{field}} must be at most {{limit}} characters",
  "string.email": "{{field}} must be a valid email address",
  "string.base": "{{field}} must be a text value",
  "number.base": "{{field}} must be a number",
  "number.positive": "{{field}} must be a positive number",
  "number.min": "{{field}} must be at least {{limit}}",
  "number.max": "{{field}} must be at most {{limit}}",
  "array.min": "{{field}} must have at least {{limit}} items",
  "array.base": "{{field}} must be a list",
  "object.base": "{{field}} must be an object",
  "date.base": "{{field}} must be a valid date",
  "boolean.base": "{{field}} must be true or false",
};

/** Turn a Joi ValidationError into a single, human-readable sentence. */
function formatJoiError(error: Joi.ValidationError): string {
  return error.details
    .map((detail) => {
      const path = detail.path.length > 0 ? detail.path.join(".") : "value";
      const template = DEFAULT_MESSAGES[detail.type] || detail.message;
      let message = template.replace(/{{field}}/g, path);
      message = message.replace(
        /{{limit}}/g,
        String(detail.context?.limit ?? "")
      );
      return message.charAt(0).toUpperCase() + message.slice(1);
    })
    .join("; ");
}

/**
 * Validate a request body against a Joi schema.
 * Throws BadRequestError with all validation messages (not just the first).
 * Returns the validated, typed value.
 */
export function validateRequest<T>(
  schema: Joi.Schema,
  body: unknown
): T {
  const { error, value } = schema.validate(body, { abortEarly: false });
  if (error) {
    throw new BadRequestError(formatJoiError(error));
  }
  return value as T;
}
