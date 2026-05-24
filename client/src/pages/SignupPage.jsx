import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export const SignupPage = () => {
  const { register, handleSubmit } = useForm();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const getSignupErrorMessage = (err) => {
    const message = err?.response?.data?.message || err?.message || "";
    if (err?.response?.status === 409 || /already in use/i.test(message)) {
      return "Email already in use. Try logging in instead.";
    }
    if (/validation/i.test(message)) {
      return message;
    }
    return message || "Signup failed. Please try again.";
  };

  const onSubmit = async (values) => {
    try {
      setError("");
      await signup({
        name: values.name?.trim(),
        email: values.email?.trim().toLowerCase(),
        password: values.password,
      });
      // After creating account, navigate to login so user may sign in
      navigate("/login", { replace: true });
    } catch (e) {
      setError(getSignupErrorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-md pt-8 md:pt-12">
      <Card className="p-6 md:p-7">
        <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          Launch your AI-powered career dashboard.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Jane Doe"
              {...register("name")}
              required
              autoComplete="name"
              aria-required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="you@company.com"
              {...register("email")}
              required
              autoComplete="email"
              aria-required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Password <span className="text-rose-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="Create password (min 8 chars)"
              {...register("password")}
              required
              autoComplete="new-password"
              aria-required
            />
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <Button className="w-full" size="lg" type="submit">
            Get Started
          </Button>
        </form>
        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          Already a member?{" "}
          <Link
            to="/login"
            className="font-medium text-cyan-600 dark:text-cyan-300"
          >
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};
