import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";

export const AdminPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyActionId, setBusyActionId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingTarget, setPendingTarget] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      try {
        const overview = await api.get("/admin/overview");
        const users = await api.get("/admin/users");
        const payments = await api.get("/admin/payments");
        const resumes = await api.get("/admin/resumes");
        setData({
          overview: overview.data,
          users: users.data.users || [],
          payments: payments.data.payments || [],
          resumes: resumes.data.resumes || [],
        });
      } catch (e) {
        setError(e.response?.data?.message || "Admin access required");
      }
    };
    run();
  }, []);

  if (error) return <Card>{error}</Card>;
  if (!data) return <Card>Loading admin metrics...</Card>;

  const refreshUsers = async () => {
    const users = await api.get("/admin/users");
    setData((prev) => ({ ...prev, users: users.data.users || [] }));
  };

  const refreshPayments = async () => {
    const payments = await api.get("/admin/payments");
    setData((prev) => ({ ...prev, payments: payments.data.payments || [] }));
  };

  const handleBanToggle = async (u) => {
    setBusyUserId(u._id);
    try {
      await api.patch(`/admin/users/${u._id}/ban`);
      await refreshUsers();
      toast(u.isBanned ? "User unbanned" : "User banned", "success");
      emitAppRefresh({ entity: "admin", action: "ban" });
    } catch (e) {
      toast(
        e.response?.data?.message || "Failed to update user status",
        "error",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (u) => {
    setPendingAction("delete-user");
    setPendingTarget(u);
  };

  const handleRefundPayment = async (payment) => {
    setPendingAction("refund-payment");
    setPendingTarget(payment);
  };

  const confirmPendingAction = async () => {
    if (!pendingTarget || !pendingAction) return;

    const target = pendingTarget;
    const action = pendingAction;
    setPendingAction(null);
    setPendingTarget(null);

    setBusyActionId(target._id);
    try {
      if (action === "delete-user") {
        await api.delete(`/admin/users/${target._id}`);
        await refreshUsers();
        toast("User deleted", "success");
      } else if (action === "refund-payment") {
        await api.patch(`/admin/payments/${target._id}/refund`);
        await refreshPayments();
        await refreshUsers();
        toast("Payment refunded", "success");
      }
      emitAppRefresh({ entity: "admin", action });
    } catch (e) {
      toast(e.response?.data?.message || "Action failed", "error");
    } finally {
      setBusyActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white"
      >
        Admin Panel
      </motion.h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-300">Total Users</p>
          <p className="text-3xl font-bold text-white">
            {data.overview.metrics.totalUsers}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-300">Total Analyses</p>
          <p className="text-3xl font-bold text-white">
            {data.overview.metrics.totalAnalyses}
          </p>
        </Card>
      </div>
      <Card>
        <h2 className="mb-2 text-lg font-semibold text-white">Recent Users</h2>
        <div className="space-y-3 text-sm text-slate-200">
          {data.users.slice(0, 10).map((u) => (
            <div
              key={u._id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>
                {u.name} · {u.email} · {u.role}
                {u.isBanned && (
                  <span className="ml-2 rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">
                    BANNED
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBanToggle(u)}
                  disabled={busyUserId === u._id}
                  className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                >
                  {u.isBanned ? "Unban" : "Ban"}
                </button>
                <button
                  onClick={() => handleDeleteUser(u)}
                  disabled={busyUserId === u._id || busyActionId === u._id}
                  className="rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-semibold text-white">Revenue</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-300">Total Revenue (paise)</p>
            <p className="text-2xl font-bold text-white">
              {data.overview.metrics.totalRevenue || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-300">Total Payments</p>
            <p className="text-2xl font-bold text-white">
              {data.overview.metrics.totalPayments || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-300">Premium Users</p>
            <p className="text-2xl font-bold text-white">
              {data.users.filter((u) => u.subscriptionPlan !== "free").length}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-slate-300">
            Recent Payments
          </h3>
          <div className="space-y-2 text-sm text-slate-200">
            {data.payments.slice(0, 10).map((p) => (
              <div key={p._id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.userId?.name || "User"}</p>
                  <p className="text-xs text-slate-400">{p.userId?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {p.amount} {p.currency}
                  </p>
                  <p className="text-xs text-slate-500">{p.status}</p>
                  {p.status !== "refunded" && (
                    <button
                      onClick={() => handleRefundPayment(p)}
                      disabled={busyActionId === p._id}
                      className="mt-2 rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                    >
                      Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <ConfirmationModal
        open={Boolean(pendingTarget)}
        title={
          pendingAction === "refund-payment"
            ? "Refund payment?"
            : "Delete user?"
        }
        description={
          pendingAction === "refund-payment"
            ? "This will mark the payment as refunded and revoke the user’s active plan immediately."
            : `Delete ${pendingTarget?.email || "this user"} and all associated data?`
        }
        confirmLabel={pendingAction === "refund-payment" ? "Refund" : "Delete"}
        cancelLabel="Cancel"
        loading={Boolean(busyUserId)}
        onCancel={() => {
          setPendingAction(null);
          setPendingTarget(null);
        }}
        onConfirm={confirmPendingAction}
      />

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-white">
          Recent Resumes
        </h2>
        <div className="space-y-2 text-sm text-slate-200">
          {(data.resumes || []).slice(0, 12).map((r) => (
            <div key={r._id} className="flex items-center justify-between">
              <p>
                {r.fileName} · {r.user?.name || "Unknown"}
              </p>
              <p className="text-xs text-slate-400">
                {Math.round((r.size || 0) / 1024)} KB
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
