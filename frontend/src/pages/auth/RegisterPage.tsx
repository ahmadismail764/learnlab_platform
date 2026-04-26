import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AtSign,
  GraduationCap,
  ShieldAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Card, Input } from "@/components/ui";
import { authService, AuthRequestError } from "@/services/auth";

/**
 * RegisterPage — UC-01
 *
 * Flow:
 * 1. Learner opens LearnLab → system shows registration form
 * 2. Learner enters unique email and password
 * 3. System validates inputs (client-side: email format, password strength, match, terms)
 * 4. System calls backend register API
 * 5. On success → redirect to /login?registered=true so they can sign in
 *
 * We do NOT auto-login after registration. This gives the user clean feedback
 * and avoids double-request complexity. The login page will show a success banner.
 */

type PasswordStrength = "weak" | "medium" | "strong";

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return "weak";
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
    Boolean,
  ).length;
  if (password.length >= 12 && score >= 3) return "strong";
  if (password.length >= 8 && score >= 2) return "medium";
  return "weak";
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");

  // Live password strength
  const passwordStrength = useMemo<PasswordStrength | null>(
    () => (formData.password ? getPasswordStrength(formData.password) : null),
    [formData.password],
  );

  const strengthConfig: Record<
    PasswordStrength,
    { color: string; barColor: string; width: string; label: string }
  > = {
    weak: {
      color: "text-red-600 dark:text-red-400",
      barColor: "bg-red-500",
      width: "w-1/3",
      label: t("auth:passwordStrengthWeak"),
    },
    medium: {
      color: "text-amber-600 dark:text-amber-400",
      barColor: "bg-amber-500",
      width: "w-2/3",
      label: t("auth:passwordStrengthMedium"),
    },
    strong: {
      color: "text-green-600 dark:text-green-400",
      barColor: "bg-green-500",
      width: "w-full",
      label: t("auth:passwordStrengthStrong"),
    },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));

    // Clear field error on change
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) setGeneralError("");
  };

  // Client-side validation
  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.firstName.trim()) errors.firstName = t("auth:fieldRequired");
    if (!formData.lastName.trim()) errors.lastName = t("auth:fieldRequired");
    if (!formData.username.trim()) {
      errors.username = t("auth:fieldRequired");
    } else if (!/^[\w.@+-]{3,150}$/.test(formData.username)) {
      errors.username = t("auth:invalidUsername");
    }

    if (!formData.email.trim()) {
      errors.email = t("auth:fieldRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("auth:invalidEmail");
    }

    if (!formData.password) {
      errors.password = t("auth:fieldRequired");
    } else if (formData.password.length < 8) {
      errors.password = t("auth:passwordTooShort");
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t("auth:fieldRequired");
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("auth:passwordsDoNotMatch");
    }

    if (!formData.agreedToTerms) {
      errors.agreedToTerms = t("auth:agreeToTermsRequired");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

    setIsLoading(true);

    try {
      await authService.register({
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
      });

      // On success → redirect to login page with success banner
      navigate("/login?registered=true", { replace: true });
    } catch (err: unknown) {
      if (err instanceof AuthRequestError) {
        // Map backend field errors to our form fields
        if (err.fieldErrors) {
          const mapped: FieldErrors = {};
          if (err.fieldErrors.first_name) mapped.firstName = err.fieldErrors.first_name;
          if (err.fieldErrors.last_name) mapped.lastName = err.fieldErrors.last_name;
          if (err.fieldErrors.username) mapped.username = err.fieldErrors.username;
          if (err.fieldErrors.email) mapped.email = err.fieldErrors.email;
          if (err.fieldErrors.password) mapped.password = err.fieldErrors.password;
          setFieldErrors((prev) => ({ ...prev, ...mapped }));

          // Only show general error if it's not just a field-level duplication
          const fieldCount = Object.keys(mapped).length;
          if (fieldCount === 0) {
            setGeneralError(err.message);
          }
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof Error) {
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          setGeneralError(t("auth:serverUnreachable"));
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError(t("auth:registrationFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stagger-in space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-display tracking-tight">
          {t("auth:createAccount")}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t("auth:learnerSignupDescription")}
        </p>
      </div>

      <Card
        className="border-emerald-100 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20"
        padding="sm"
      >
        <div className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-200">
          <GraduationCap className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <p>{t("auth:learnerSignupOnly")}</p>
        </div>
      </Card>

      <Card
        className="border-amber-100 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20"
        padding="sm"
      >
        <div className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p>{t("auth:adminSignupNotice")}</p>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("auth:firstName")}
            name="firstName"
            placeholder={t("auth:firstNamePlaceholder")}
            value={formData.firstName}
            onChange={handleChange}
            leftIcon={<User className="w-4 h-4" />}
            error={fieldErrors.firstName}
            required
            className="glass"
          />
          <Input
            label={t("auth:lastName")}
            name="lastName"
            placeholder={t("auth:lastNamePlaceholder")}
            value={formData.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
            required
            className="glass"
          />
        </div>

        <Input
          label={t("auth:username")}
          name="username"
          placeholder={t("auth:usernamePlaceholder")}
          value={formData.username}
          onChange={handleChange}
          leftIcon={<AtSign className="w-4 h-4" />}
          error={fieldErrors.username}
          helperText={t("auth:usernameHelper")}
          required
          className="glass"
        />

        <Input
          label={t("auth:email")}
          type="email"
          name="email"
          placeholder={t("auth:emailPlaceholder")}
          value={formData.email}
          onChange={handleChange}
          leftIcon={<Mail className="w-4 h-4" />}
          error={fieldErrors.email}
          required
          className="glass"
        />

        <div>
          <Input
            label={t("auth:password")}
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder={t("auth:passwordMinLength")}
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            error={fieldErrors.password}
            required
            className="glass"
          />

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div className="mt-2 px-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-bold">
                  {t("auth:passwordStrength")}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase ${strengthConfig[passwordStrength].color}`}
                >
                  {strengthConfig[passwordStrength].label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 shadow-sm ${strengthConfig[passwordStrength].barColor} ${strengthConfig[passwordStrength].width}`}
                />
              </div>
            </div>
          )}
        </div>

        <Input
          label={t("auth:confirmPassword")}
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          placeholder={t("auth:confirmPasswordPlaceholder")}
          value={formData.confirmPassword}
          onChange={handleChange}
          leftIcon={<Lock className="w-4 h-4" />}
          error={fieldErrors.confirmPassword}
          required
          className="glass"
        />

        {generalError && (
          <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 fade-in duration-300">
            {generalError}
          </div>
        )}

        <div className="space-y-1">
          <label className="flex items-start gap-3 text-sm group cursor-pointer">
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleChange}
              className="mt-1 rounded-lg border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500 dark:bg-neutral-800 transition-colors"
            />
            <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t("auth:agreeToTerms")}{" "}
              <a
                href="#"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                {t("auth:termsOfService")}
              </a>{" "}
              {t("auth:and")}{" "}
              <a
                href="#"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                {t("auth:privacyPolicy")}
              </a>
            </span>
          </label>
          {fieldErrors.agreedToTerms && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium px-8">
              {fieldErrors.agreedToTerms}
            </p>
          )}
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          {isLoading ? t("auth:creatingAccount") : t("auth:createAccount")}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-8">
        {t("auth:haveAccount")}{" "}
        <Link
          to="/login"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold"
        >
          {t("auth:signIn")}
        </Link>
      </p>
    </div>
  );
}
