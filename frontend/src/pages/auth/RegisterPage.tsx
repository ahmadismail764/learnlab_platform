import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Input } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts";
import {
  addAdminOverrideEmail,
  removeAdminOverrideEmail,
} from "@/utils/adminOverride";

/**
 * RegisterPage — UC-01
 *
 * Flow:
 * 1. Student opens LearnLab → system shows registration form
 * 2. Student enters unique email and password
 * 3. System validates inputs (client-side: email format, password strength, match, terms)
 * 4. System calls backend register API
 * 5. System authenticates and redirects to student dashboard
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
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "idle" | "requesting" | "ok" | "error"
  >("idle");
  const [grantAdminTestingAccess, setGrantAdminTestingAccess] = useState(false);

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
      errors.agreedToTerms =
        t("auth:agreeToTermsRequired") || "You must agree to the terms";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setBackendStatus("requesting");

    if (!validate()) return;

    setIsLoading(true);

    try {
      if (grantAdminTestingAccess) {
        addAdminOverrideEmail(formData.email);
      } else {
        removeAdminOverrideEmail(formData.email);
      }

      const user = await register({
        email: formData.email,
        username: formData.email.split("@")[0],
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
      });
      setBackendStatus("ok");
      setSuccess(true);
      const nextRoute = user.role === "admin" ? "/admin" : "/student";
      setTimeout(() => navigate(nextRoute, { replace: true }), 700);
    } catch (err: unknown) {
      setBackendStatus("error");
      const message =
        err instanceof Error ? err.message : t("auth:registrationFailed");
      if (message.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: message }));
      } else {
        setGeneralError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state briefly before redirect
  if (success) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/10">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
          {t("auth:registrationSuccess")}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Synchronizing neural profile...
        </p>
      </div>
    );
  }

  return (
    <div className="stagger-in space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-display tracking-tight">
          {t("auth:createAccount")}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t("auth:startLearning")}
        </p>
      </div>

      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
        {t("auth:createAccount")}
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8">
        {t("auth:startLearning")}
      </p>

      <div className="mb-4 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-300">
        <p className="font-medium">Backend Auth Status</p>
        {backendStatus === "idle" && <p>Ready to send registration request.</p>}
        {backendStatus === "requesting" && (
          <p>Sending registration request to backend...</p>
        )}
        {backendStatus === "ok" && (
          <p>Registration successful. Auto-login and redirect in progress...</p>
        )}
        {backendStatus === "error" && (
          <p>Backend returned an error. See details below.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
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
          <div className="text-sm text-error bg-error/10 border border-error/20 px-4 py-3 rounded-2xl animate-in slide-in-from-top-2">
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
            <p className="text-xs text-error font-medium px-8">
              {fieldErrors.agreedToTerms}
            </p>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={grantAdminTestingAccess}
            onChange={(e) => setGrantAdminTestingAccess(e.target.checked)}
            className="rounded border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 mt-0.5"
          />
          <span className="text-amber-700 dark:text-amber-300">
            Grant temporary admin access for this account (frontend testing
            mode)
          </span>
        </label>

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
