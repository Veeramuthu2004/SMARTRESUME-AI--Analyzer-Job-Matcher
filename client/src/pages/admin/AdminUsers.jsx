import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../hooks/useToast";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { FilterBar } from "../../components/ui/FilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import {
  adminButtonClass,
  adminDangerButtonClass,
  adminInputClass,
  adminMutedPanelClass,
  adminPageLeadClass,
  adminPageTitleClass,
  adminSelectClass,
  adminChipClass,
  adminWarningButtonClass,
} from "../../components/admin/adminUi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [loading, setLoading] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editing, setEditing] = useState({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminService.listUsers();
      setUsers(r.users || []);
    } catch (e) {
      toast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();

    const h = (e) => {
      if (!e?.detail?.type) return;
      // reload user list on any user-related admin update
      if (String(e.detail.type).startsWith("user")) load();
    };
    window.addEventListener("admin-update", h);
    return () => window.removeEventListener("admin-update", h);
  }, [load]);

  // ensure socket is initialized for realtime events
  useAdminSocket();

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !query ||
        [u.name, u.email, u.subscriptionPlan, u.role]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query));
      const matchesRole = role === "all" || u.role === role;
      const matchesStatus =
        status === "all" ||
        (status === "banned" && u.isBanned) ||
        (status === "active" && !u.isBanned) ||
        (status === "premium" &&
          (u.isPremium || (u.subscriptionPlan || "free") !== "free"));
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, search, role, status]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const summary = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      banned: users.filter((u) => u.isBanned).length,
      premium: users.filter((u) => (u.subscriptionPlan || "free") !== "free")
        .length,
    }),
    [users],
  );

  const selectedUserDetails = selectedUser
    ? [
        ["Name", selectedUser.name || "—"],
        ["Email", selectedUser.email || "—"],
        ["Role", selectedUser.role || "user"],
        ["Subscription", selectedUser.subscriptionPlan || "free"],
        ["Status", selectedUser.isBanned ? "Banned" : "Active"],
        [
          "Joined",
          selectedUser.createdAt
            ? new Date(selectedUser.createdAt).toLocaleString()
            : "—",
        ],
      ]
    : [];

  const openUserDetails = async (id) => {
    try {
      const response = await adminService.getUser(id);
      setSelectedUser(response.user);
    } catch (e) {
      toast("Failed to load user details", "error");
    }
  };

  const handleDelete = async (id) => {
    setConfirmConfig({
      title: "Delete user",
      description: "Delete user? This cannot be undone.",
      tone: "danger",
      onConfirm: async () => {
        setConfirmLoading(true);
        setRowBusyId(id);
        try {
          await adminService.deleteUser(id);
          toast("User deleted", "success");
          await load();
        } catch (e) {
          toast("Delete failed", "error");
        } finally {
          setConfirmLoading(false);
          setRowBusyId(null);
          setConfirmOpen(false);
        }
      },
    });
    setConfirmOpen(true);
  };

  const handleBan = async (id) => {
    setRowBusyId(id);
    try {
      await adminService.toggleBanUser(id);
      toast("User status updated", "success");
      await load();
    } catch (e) {
      toast("Action failed", "error");
    } finally {
      setRowBusyId(null);
    }
  };

  const handleSave = async (u) => {
    setRowBusyId(u._id);
    try {
      const payload = editing[u._id] || {};
      await adminService.updateUser(u._id, payload);
      toast("User updated", "success");
      setEditing((prev) => ({ ...prev, [u._id]: {} }));
      await load();
    } catch (e) {
      toast(e?.response?.data?.message || "Update failed", "error");
    } finally {
      setRowBusyId(null);
    }
  };

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>User Management</h1>
        <p className={adminPageLeadClass}>
          Manage access, subscriptions, and account safety in one place.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={adminMutedPanelClass}>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Total users
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {summary.total}
          </p>
        </div>
        <div className={adminMutedPanelClass}>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Admins
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {summary.admins}
          </p>
        </div>
        <div className={adminMutedPanelClass}>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Premium
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {summary.premium}
          </p>
        </div>
        <div className={adminMutedPanelClass}>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Banned
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {summary.banned}
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <FilterBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, email, plan..."
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className={adminSelectClass}
          aria-label="Filter users by role"
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={adminSelectClass}
          aria-label="Filter users by account status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {pageUsers.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  No users found.
                </div>
              ) : (
                pageUsers.map((u) => {
                  const draft = editing[u._id] || {};
                  const isDirty = Object.entries(draft).some(([k, v]) => {
                    if (k === "subscriptionPlan") {
                      return v !== (u.subscriptionPlan || "free");
                    }
                    if (k === "role") {
                      return v !== (u.role || "user");
                    }
                    return v !== u[k];
                  });
                  const isBusy = rowBusyId === u._id;

                  return (
                    <div
                      key={u._id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {u.name}
                          </p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                            {u.email}
                          </p>
                        </div>
                        <img
                          src={u.avatarUrl || "/avatar.png"}
                          className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                          alt={`${u.name || "User"} avatar`}
                        />
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Plan
                          <select
                            value={
                              draft.subscriptionPlan ||
                              u.subscriptionPlan ||
                              "free"
                            }
                            onChange={(e) =>
                              setEditing((prev) => ({
                                ...prev,
                                [u._id]: {
                                  ...(prev[u._id] || {}),
                                  subscriptionPlan: e.target.value,
                                },
                              }))
                            }
                            className={`${adminSelectClass} mt-1`}
                          >
                            <option value="free">free</option>
                            <option value="pro">pro</option>
                            <option value="premium">premium</option>
                          </select>
                        </label>
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Role
                          <select
                            value={draft.role || u.role || "user"}
                            onChange={(e) =>
                              setEditing((prev) => ({
                                ...prev,
                                [u._id]: {
                                  ...(prev[u._id] || {}),
                                  role: e.target.value,
                                },
                              }))
                            }
                            className={`${adminSelectClass} mt-1`}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </label>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className={adminChipClass}>
                          {u.isBanned
                            ? "Banned"
                            : u.isPremium
                              ? "Premium"
                              : "Active"}
                        </span>
                        <span>
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleBan(u._id)}
                          disabled={isBusy}
                          className={adminWarningButtonClass}
                        >
                          {u.isBanned ? "Unban" : "Ban"}
                        </button>
                        <button
                          onClick={() => handleSave(u)}
                          disabled={!isDirty || isBusy}
                          className={adminButtonClass}
                        >
                          {isBusy ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => openUserDetails(u._id)}
                          disabled={isBusy}
                          className={adminButtonClass}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(u._id)}
                          disabled={isBusy}
                          className={adminDangerButtonClass}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-300">
                    <th className="py-3 font-medium">Avatar</th>
                    <th className="font-medium">Name</th>
                    <th className="font-medium">Email</th>
                    <th className="font-medium">Plan</th>
                    <th className="font-medium">Role</th>
                    <th className="font-medium">Status</th>
                    <th className="font-medium">Joined</th>
                    <th className="font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    pageUsers.map((u) => {
                      const draft = editing[u._id] || {};
                      const isDirty = Object.entries(draft).some(([k, v]) => {
                        if (k === "subscriptionPlan") {
                          return v !== (u.subscriptionPlan || "free");
                        }
                        if (k === "role") {
                          return v !== (u.role || "user");
                        }
                        return v !== u[k];
                      });
                      const isBusy = rowBusyId === u._id;
                      return (
                        <tr
                          key={u._id}
                          className="border-b border-slate-100 align-top last:border-b-0 dark:border-slate-800/80"
                        >
                          <td className="py-4 pr-3">
                            <img
                              src={u.avatarUrl || "/avatar.png"}
                              className="h-9 w-9 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                              alt={`${u.name || "User"} avatar`}
                            />
                          </td>
                          <td className="py-4 pr-3 text-slate-900 dark:text-slate-100">
                            {u.name}
                          </td>
                          <td className="py-4 pr-3 text-slate-600 dark:text-slate-300">
                            {u.email}
                          </td>
                          <td className="py-4 pr-3">
                            <select
                              value={
                                draft.subscriptionPlan ||
                                u.subscriptionPlan ||
                                "free"
                              }
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [u._id]: {
                                    ...(prev[u._id] || {}),
                                    subscriptionPlan: e.target.value,
                                  },
                                }))
                              }
                              className={adminSelectClass}
                            >
                              <option value="free">free</option>
                              <option value="pro">pro</option>
                              <option value="premium">premium</option>
                            </select>
                          </td>
                          <td className="py-4 pr-3">
                            <select
                              value={draft.role || u.role || "user"}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [u._id]: {
                                    ...(prev[u._id] || {}),
                                    role: e.target.value,
                                  },
                                }))
                              }
                              className={adminSelectClass}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="py-4 pr-3 text-xs font-medium text-slate-500 dark:text-slate-300">
                            <span className={adminChipClass}>
                              {u.isBanned
                                ? "Banned"
                                : u.isPremium
                                  ? "Premium"
                                  : "Active"}
                            </span>
                          </td>
                          <td className="py-4 pr-3 text-slate-600 dark:text-slate-300">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleBan(u._id)}
                                disabled={isBusy}
                                className={adminWarningButtonClass}
                              >
                                {u.isBanned ? "Unban" : "Ban"}
                              </button>
                              <button
                                onClick={() => handleSave(u)}
                                disabled={!isDirty || isBusy}
                                className={adminButtonClass}
                              >
                                {isBusy ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={() => openUserDetails(u._id)}
                                disabled={isBusy}
                                className={adminButtonClass}
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDelete(u._id)}
                                disabled={isBusy}
                                className={adminDangerButtonClass}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {pageUsers.length} of {filteredUsers.length} users
              </p>
              <Pagination page={page} pages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {selectedUser && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Selected user
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Quick snapshot of the selected account.
              </p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className={adminButtonClass}
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selectedUserDetails.map(([label, value]) => (
              <div key={label} className={adminMutedPanelClass}>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
      {confirmConfig && (
        <ConfirmationModal
          open={confirmOpen}
          title={confirmConfig.title}
          description={confirmConfig.description}
          tone={confirmConfig.tone}
          loading={confirmLoading}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => {
            if (confirmLoading) return;
            setConfirmOpen(false);
          }}
        />
      )}
    </div>
  );
}
