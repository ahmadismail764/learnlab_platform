import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle, Mail, RotateCcw } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { authService, AuthRequestError } from "@/services/auth";
import { forgotPasswordSchema, validateForm } from "@/validation";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const validation = validateForm(forgotPasswordSchema, { email: email.trim() });
    if (!validation.success) {
      setError(validation.fieldErrors.email ?? t("auth:invalidEmail"));
      return;
    }

    setIsLoading(true);

    try {
      await authService.requestPasswordReset(validation.data.email);
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof AuthRequestError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : t("auth:forgotPasswordError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <Card
          className="border-green-200 bg-green-50/80 dark:border-green-900/60 dark:bg-green-950/30"
          padding="lg"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {t("auth:forgotPasswordSubmittedTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {t("auth:forgotPasswordSubmittedDescription", { email })}
              </p>
            </div>
            <Link to="/login" className="w-full">
              <Button fullWidth leftIcon={<ArrowLeft className="h-4 w-4 rtl:rotate-180" />}>
                {t("auth:backToSignIn")}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200">
          <RotateCcw className="h-5 w-5" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("auth:forgotPasswordTitle")}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t("auth:forgotPasswordDescription")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t("auth:email")}
          type="email"
          placeholder={t("auth:emailPlaceholder")}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth isLoading={isLoading}>
          {t("auth:sendResetLink")}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {t("auth:backToSignIn")}
        </Link>
      </p>
    </div>
  );
}
