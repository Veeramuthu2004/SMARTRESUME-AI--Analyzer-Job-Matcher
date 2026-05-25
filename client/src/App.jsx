import { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppShell } from "./components/layout/AppShell";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import("./pages/SignupPage").then((m) => ({ default: m.SignupPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const UploadResumePage = lazy(() =>
  import("./pages/UploadResumePage").then((m) => ({
    default: m.UploadResumePage,
  })),
);
const AnalysisResultsPage = lazy(() =>
  import("./pages/AnalysisResultsPage").then((m) => ({
    default: m.AnalysisResultsPage,
  })),
);
const ResumeHistoryPage = lazy(() =>
  import("./pages/ResumeHistoryPage").then((m) => ({
    default: m.ResumeHistoryPage,
  })),
);
const AnalysesPage = lazy(() =>
  import("./pages/AnalysesPage").then((m) => ({ default: m.AnalysesPage })),
);
const JobSearchPage = lazy(() =>
  import("./pages/JobSearchPage").then((m) => ({ default: m.JobSearchPage })),
);
const JobMatchPage = lazy(() =>
  import("./pages/JobMatchPage").then((m) => ({ default: m.default })),
);
const SavedJobsPage = lazy(() =>
  import("./pages/SavedJobsPage").then((m) => ({ default: m.SavedJobsPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard").then((m) => ({ default: m.default })),
);
const AdminUsers = lazy(() =>
  import("./pages/admin/AdminUsers").then((m) => ({ default: m.default })),
);
const AdminPayments = lazy(() =>
  import("./pages/admin/AdminPayments").then((m) => ({ default: m.default })),
);
const AdminAnalytics = lazy(() =>
  import("./pages/admin/AdminAnalytics").then((m) => ({ default: m.default })),
);
const AdminResumes = lazy(() =>
  import("./pages/admin/AdminResumes").then((m) => ({ default: m.default })),
);
const AdminSettings = lazy(() =>
  import("./pages/admin/AdminSettings").then((m) => ({ default: m.default })),
);
const AdminMaintenance = lazy(() =>
  import("./pages/admin/AdminMaintenance").then((m) => ({
    default: m.default,
  })),
);
const AdminReports = lazy(() =>
  import("./pages/admin/AdminReports").then((m) => ({ default: m.default })),
);
const AdminJobs = lazy(() =>
  import("./pages/admin/AdminJobs").then((m) => ({ default: m.default })),
);
const AdminSupportTickets = lazy(() =>
  import("./pages/admin/AdminSupportTickets").then((m) => ({
    default: m.default,
  })),
);
const AdminNotifications = lazy(() =>
  import("./pages/admin/AdminNotifications").then((m) => ({
    default: m.default,
  })),
);
const PricingPage = lazy(() =>
  import("./pages/PricingPage").then((m) => ({ default: m.default })),
);
const ContactPage = lazy(() =>
  import("./pages/ContactPage").then((m) => ({ default: m.ContactPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const MaintenancePage = lazy(() =>
  import("./pages/MaintenancePage").then((m) => ({
    default: m.MaintenancePage,
  })),
);
const ResumeDetailPage = lazy(() =>
  import("./pages/ResumeDetailPage").then((m) => ({
    default: m.ResumeDetailPage,
  })),
);
const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const PaymentSuccessPage = lazy(() =>
  import("./pages/PaymentSuccessPage").then((m) => ({ default: m.default })),
);
const SubscriptionPage = lazy(() =>
  import("./pages/SubscriptionPage").then((m) => ({
    default: m.SubscriptionPage,
  })),
);
const PaymentFailurePage = lazy(() =>
  import("./pages/PaymentFailurePage").then((m) => ({ default: m.default })),
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Suspense
          fallback={
            <div className="p-8 text-slate-200">Loading experience...</div>
          }
        >
          <Routes location={location}>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/about" element={<AboutPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DashboardPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <UploadResumePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AnalysisResultsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ResumeHistoryPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyses"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AnalysesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AnalyticsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume/:id"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ResumeDetailPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/job-search"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <JobSearchPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/job-match"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <JobMatchPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saved-jobs"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SavedJobsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ProfilePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              {/* convenience redirect: allow /admin/login to route to login with admin intent */}
              <Route
                path="/admin/login"
                element={
                  <Navigate
                    to="/login"
                    replace
                    state={{ from: "/admin", intent: "admin" }}
                  />
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminDashboard />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminUsers />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminPayments />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminAnalytics />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/resumes"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminResumes />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/jobs"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminJobs />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminSupportTickets />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminNotifications />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminSettings />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/maintenance"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminMaintenance />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminReports />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SubscriptionPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/payment/failure" element={<PaymentFailurePage />} />
            </Route>
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
