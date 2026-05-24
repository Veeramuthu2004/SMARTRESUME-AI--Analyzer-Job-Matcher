import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { useToast } from "../../hooks/useToast";
import {
  adminButtonClass,
  adminInputClass,
  adminPageLeadClass,
  adminPageTitleClass,
  adminPrimaryButtonClass,
  adminSelectClass,
  adminTextAreaClass,
} from "../../components/admin/adminUi";

export default function AdminNotifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
  });
  const [scheduleDue, setScheduleDue] = useState("");
  const [scheduled, setScheduled] = useState([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.listAdminNotifications();
      setNotes(res.notifications || []);
    } catch (err) {
      toast(
        err?.response?.data?.message || "Failed to load notifications",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadScheduled = async () => {
    setScheduledLoading(true);
    try {
      const res = await adminService.listScheduledAdminNotifications();
      setScheduled(res.scheduled || []);
    } catch (err) {
      toast(
        err?.response?.data?.message || "Failed to load scheduled",
        "error",
      );
    } finally {
      setScheduledLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadScheduled();
    const h = (e) => {
      if (!e?.detail) return;
      if (String(e.detail.type || "").startsWith("notification")) load();
    };
    const onNote = () => load();
    const onUpdate = (ev) => {
      if (ev?.detail?.type && String(ev.detail.type).startsWith("notification"))
        load();
    };
    window.addEventListener("admin-notification", onNote);
    window.addEventListener("admin-update", onUpdate);
    return () => {
      window.removeEventListener("admin-notification", onNote);
      window.removeEventListener("admin-update", onUpdate);
    };
  }, []);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const createNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast("Title and message are required", "error");
      return;
    }

    setCreating(true);
    try {
      await adminService.createAdminNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
      });
      toast("Notification created", "success");
      setForm({ title: "", message: "", type: "info" });
      load();
    } catch (err) {
      toast(
        err?.response?.data?.message || "Failed to create notification",
        "error",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Admin — Notifications</h1>
        <p className={adminPageLeadClass}>
          Create announcements, mark them as read, or remove old messages.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={adminInputClass}
            placeholder="Notification title"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            className={adminSelectClass}
          >
            <option value="info">info</option>
            <option value="success">success</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
            <option value="system">system</option>
          </select>
          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((p) => ({ ...p, message: e.target.value }))
            }
            className={`${adminTextAreaClass} md:col-span-2`}
            rows={4}
            placeholder="Notification message"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={createNotification}
            disabled={creating}
            className={adminPrimaryButtonClass}
          >
            {creating ? "Creating..." : "Create notification"}
          </button>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-3 md:items-end">
          <input
            type="datetime-local"
            value={scheduleDue}
            onChange={(e) => setScheduleDue(e.target.value)}
            className={adminInputClass}
          />
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={adminInputClass}
            placeholder="Notification title"
          />
          <button
            onClick={async () => {
              if (!form.title.trim() || !form.message.trim() || !scheduleDue) {
                toast("Title, message and schedule are required", "error");
                return;
              }
              try {
                await adminService.createScheduledAdminNotification({
                  title: form.title.trim(),
                  message: form.message.trim(),
                  type: form.type,
                  dueAt: new Date(scheduleDue).toISOString(),
                });
                toast("Notification scheduled", "success");
                setForm({ title: "", message: "", type: "info" });
                setScheduleDue("");
                // server will emit when sent; optionally refresh list
                load();
              } catch (err) {
                toast(
                  err?.response?.data?.message || "Failed to schedule",
                  "error",
                );
              }
            }}
            className={adminPrimaryButtonClass}
          >
            Schedule notification
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 rounded-2xl" />
          ))
        ) : notes.length === 0 ? (
          <Card>
            <p className="text-slate-500 dark:text-slate-400">
              No notifications yet.
            </p>
          </Card>
        ) : (
          notes.map((n) => (
            <Card key={n._id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {n.title}
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                      {n.type}
                    </span>
                    {n.read && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Read
                      </span>
                    )}
                  </div>
                  <div className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {n.message}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {!n.read && (
                    <button
                      onClick={async () => {
                        setMarkingId(n._id);
                        try {
                          await adminService.markNotificationRead(n._id);
                          toast("Notification marked read", "success");
                          load();
                        } catch (err) {
                          toast("Failed to update notification", "error");
                        } finally {
                          setMarkingId(null);
                        }
                      }}
                      disabled={markingId === n._id}
                      className={adminButtonClass}
                    >
                      {markingId === n._id ? "Updating..." : "Mark read"}
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      setConfirmConfig({
                        title: "Delete notification",
                        description: "Delete notification?",
                        tone: "danger",
                        onConfirm: async () => {
                          try {
                            await adminService.deleteAdminNotification(n._id);
                            toast("Notification deleted", "success");
                            load();
                          } catch (err) {
                            toast("Failed to delete notification", "error");
                          } finally {
                            setConfirmOpen(false);
                          }
                        },
                      });
                      setConfirmOpen(true);
                    }}
                    className={adminButtonClass}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Scheduled notifications</h2>
        {scheduledLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : scheduled.length === 0 ? (
          <Card>
            <p className="text-slate-500">No scheduled notifications.</p>
          </Card>
        ) : (
          scheduled.map((s) => (
            <Card key={s._id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-slate-500">{s.message}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(s.dueAt).toLocaleString()}
                  </div>
                  {s.deadLetter && (
                    <div className="text-xs text-rose-600">
                      Failed delivery (dead-letter)
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!s.cancelled && (
                    <button
                      onClick={async () => {
                        try {
                          await adminService.cancelScheduledAdminNotification(
                            s._id,
                          );
                          toast("Scheduled cancelled", "success");
                          loadScheduled();
                        } catch (err) {
                          toast("Failed to cancel", "error");
                        }
                      }}
                      className={adminButtonClass}
                    >
                      Cancel
                    </button>
                  )}
                  {!s.deadLetter && (
                    <button
                      onClick={async () => {
                        try {
                          await adminService.forceDeadLetterScheduledNotification(
                            s._id,
                          );
                          toast("Scheduled forced to dead-letter", "success");
                          loadScheduled();
                        } catch (err) {
                          toast("Failed to force dead-letter", "error");
                        }
                      }}
                      className={adminButtonClass}
                    >
                      Force fail
                    </button>
                  )}
                  {s.deadLetter && (
                    <button
                      onClick={async () => {
                        try {
                          await adminService.retryScheduledAdminNotification(
                            s._id,
                          );
                          toast("Requeued scheduled notification", "success");
                          loadScheduled();
                        } catch (err) {
                          toast("Failed to requeue", "error");
                        }
                      }}
                      className={adminButtonClass}
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await adminService.deleteScheduledAdminNotification(
                          s._id,
                        );
                        toast("Scheduled deleted", "success");
                        loadScheduled();
                      } catch (err) {
                        toast("Failed to delete", "error");
                      }
                    }}
                    className={adminButtonClass}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      {confirmConfig && (
        <ConfirmationModal
          open={confirmOpen}
          title={confirmConfig.title}
          description={confirmConfig.description}
          tone={confirmConfig.tone}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
