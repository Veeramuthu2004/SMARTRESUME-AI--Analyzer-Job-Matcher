import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onTouched" });
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const from = location.state?.from || "/dashboard";
  const isAdminIntent =
    Boolean(location.state?.intent === "admin") ||
    String(from).startsWith("/admin");

  const onSubmit = async (values) => {
    try {
      setError("");
      const data = await login(values);
      const role = data?.user?.role;
      if (role === "admin") {
        const destination = String(from).startsWith("/admin")
          ? from
          : "/admin/dashboard";
        navigate(destination, { replace: true });
      } else {
        if (isAdminIntent) {
          setError(
            "This account does not have admin access. Please use an admin account.",
          );
        }
        navigate("/dashboard", { replace: true });
      }
    } catch (e) {
      setError(e.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="mx-auto max-w-md pt-8 md:pt-12">
      <Card className="p-6 md:p-7">
        <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {isAdminIntent ? "Admin sign in" : "Welcome back"}
        </h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          {isAdminIntent
            ? "Sign in with an administrator account to access the control center."
            : "Login to continue your job matching journey."}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="you@company.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
              required
              aria-required
            />
            {errors.email && (
              <p className="text-sm text-rose-300">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Password <span className="text-rose-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              required
              aria-required
            />
            {errors.password && (
              <p className="text-sm text-rose-300">{errors.password.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <Button className="w-full" size="lg" type="submit">
            {isAdminIntent ? "Sign in as Admin" : "Login"}
          </Button>
        </form>
        <div className="mt-5 flex items-center justify-between text-sm">
          <Link
            to="/signup"
            className="font-medium text-cyan-600 dark:text-cyan-300"
          >
            Create account
          </Link>
          <Link to="/settings" className="text-slate-600 dark:text-slate-300">
            Forgot password?
          </Link>
        </div>
      </Card>
    </div>
  );
};
