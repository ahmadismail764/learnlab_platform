/**
 * Validation Index
 *
 * Centralized validation schemas and helpers.
 */

export {
  loginSchema,
  forgotPasswordSchema,
  registerSchema,
  profileSchema,
  extractFieldErrors,
  validateForm,
  type LoginFormData,
  type ForgotPasswordFormData,
  type RegisterFormData,
  type ProfileFormData,
} from './authSchemas'

export {
  createTopicSchema,
  questionSchema,
  type TopicFormData,
  type QuestionFormState,
} from './adminSchemas'
