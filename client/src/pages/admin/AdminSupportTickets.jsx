import { useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { FilterBar } from "../../components/ui/FilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../hooks/useToast";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import {
  adminPrimaryButtonClass,
  adminPageTitleClass,
  adminPageLeadClass,
  adminButtonClass,
  adminChipClass,
  adminMutedPanelClass,
  adminSelectClass,
  adminTextAreaClass,
} from "../../components/admin/adminUi";

const getRequesterLabel = (ticket) => {
  const fromName = ticket?.metadata?.fromName?.trim();
  const fromEmail = ticket?.metadata?.fromEmail?.trim();
  const userName = ticket?.userId?.name?.trim();
  const userEmail = ticket?.userId?.email?.trim();

  if (fromName && fromEmail) return `${fromName} <${fromEmail}>`;
  if (fromName) return fromName;
  if (userName && userEmail) return `${userName} <${userEmail}>`;
  if (userName) return userName;
  if (userEmail) return userEmail;
  return "Guest";
};

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [busyAction, setBusyAction] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useAdminSocket();

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.listSupportTickets();
      const nextTickets = res.tickets || [];
      setTickets(nextTickets);
      if (selected) {
        const refreshed = nextTickets.find(
          (ticket) => ticket._id === selected._id,
        );
        if (refreshed) setSelected(refreshed);
      }
    } catch (err) {
      toast("Failed to load support tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesQuery =
        !query ||
        [
          ticket.subject,
          ticket.message,
          ticket.priority,
          ticket.status,
          getRequesterLabel(ticket),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [search, statusFilter, tickets]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const pageTickets = filteredTickets.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    load();
    const h = (e) => {
      if (!e?.detail) return;
      if (
        ["ticket_created", "ticket_updated", "ticket_deleted"].includes(
          e.detail.type,
        )
      ) {
        load();
        if (e.detail.type === "ticket_created") {
          toast("New support ticket received", "info");
          if (!selected && e.detail.ticket) {
            setSelected(e.detail.ticket);
          }
        }
      }
    };
    window.addEventListener("admin-update", h);
    return () => window.removeEventListener("admin-update", h);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className={adminPageTitleClass}>Admin — Support Tickets</h1>
        <p className={adminPageLeadClass}>
          Review incoming requests, reply to users, and keep the queue moving.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={adminChipClass}>{tickets.length} total</span>
        <span className={adminChipClass}>
          {tickets.filter((t) => t.status === "open").length} open
        </span>
        <span className={adminChipClass}>
          {tickets.filter((t) => t.status === "pending").length} pending
        </span>
        <span className={adminChipClass}>
          {tickets.filter((t) => t.status === "resolved").length} resolved
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        <FilterBar
          value={search}
          onChange={setSearch}
          placeholder="Search subject, message, requester..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={adminSelectClass}
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="min-w-0">
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80"
                  />
                ))}
              </div>
            )}

            {!loading && tickets.length === 0 && (
              <Card>
                <div className="text-slate-500">No support tickets.</div>
              </Card>
            )}

            {!loading && tickets.length > 0 && pageTickets.length === 0 && (
              <Card>
                <div className="text-slate-500">
                  No tickets match your filters.
                </div>
              </Card>
            )}

            {pageTickets.map((t) => (
              <Card
                key={t._id}
                className={`cursor-pointer transition ${
                  selected?._id === t._id
                    ? "border-cyan-400/70 ring-2 ring-cyan-400/20"
                    : "hover:border-cyan-200 dark:hover:border-cyan-700/50"
                }`}
                onClick={() => setSelected(t)}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {t.subject}
                      </div>
                      <span className={adminChipClass}>
                        {t.priority || "medium"}
                      </span>
                      <span className={adminChipClass}>{t.status}</span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {t.message}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className={adminMutedPanelClass}>
                        {getRequesterLabel(t)}
                      </span>
                      <span>{new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-start gap-2 lg:justify-end">
                    <div className="flex flex-wrap gap-2">
                      {t.status !== "resolved" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmConfig({
                              title: "Mark resolved",
                              description: "Mark this ticket as resolved?",
                              tone: "default",
                              onConfirm: async () => {
                                setBusyAction(`resolve:${t._id}`);
                                try {
                                  await adminService.updateSupportTicket(
                                    t._id,
                                    {
                                      status: "resolved",
                                      message: "Resolved by admin",
                                    },
                                  );
                                  toast("Ticket marked resolved", "success");
                                  load();
                                } catch (err) {
                                  toast("Failed to update ticket", "error");
                                } finally {
                                  setBusyAction(null);
                                  setConfirmOpen(false);
                                }
                              },
                            });
                            setConfirmOpen(true);
                          }}
                          className={adminPrimaryButtonClass}
                          disabled={busyAction === `resolve:${t._id}`}
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmConfig({
                            title: "Delete ticket",
                            description:
                              "Delete ticket? This cannot be undone.",
                            tone: "danger",
                            onConfirm: async () => {
                              setBusyAction(`delete:${t._id}`);
                              try {
                                await adminService.deleteSupportTicket(t._id);
                                toast("Ticket deleted", "success");
                                if (selected?._id === t._id) {
                                  setSelected(null);
                                  setReply("");
                                }
                                load();
                              } catch (err) {
                                toast("Failed to delete ticket", "error");
                              } finally {
                                setBusyAction(null);
                                setConfirmOpen(false);
                              }
                            },
                          });
                          setConfirmOpen(true);
                        }}
                        className={adminButtonClass}
                        disabled={busyAction === `delete:${t._id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredTickets.length > 0 && (
              <div className="flex justify-end px-1 pt-1">
                <Pagination page={page} pages={totalPages} onChange={setPage} />
              </div>
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Selected ticket
              </h3>
              {!selected && (
                <p className="mt-2 text-sm text-slate-500">
                  Select a ticket to view details and reply.
                </p>
              )}
            </div>
            {selected && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selected.subject}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100">
                        Requester:
                      </strong>{" "}
                      {getRequesterLabel(selected)}
                    </div>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100">
                        Status:
                      </strong>{" "}
                      {selected.status}
                    </div>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100">
                        Priority:
                      </strong>{" "}
                      {selected.priority || "medium"}
                    </div>
                  </div>
                </div>
                <div className="max-h-64 overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300 whitespace-pre-wrap">
                  {selected.message}
                </div>
                <div className="mt-2">
                  <label className="block text-sm text-slate-700 dark:text-slate-200">
                    Reply to requester
                  </label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    This response is appended to the ticket history for admin
                    visibility.
                  </p>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    className={adminTextAreaClass}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      if (!reply || !reply.trim())
                        return toast("Reply cannot be empty", "error");
                      setBusyAction(`reply:${selected._id}`);
                      try {
                        await adminService.updateSupportTicket(selected._id, {
                          message: reply,
                        });
                        toast("Reply posted", "success");
                        setReply("");
                        load();
                      } catch (err) {
                        toast("Failed to post reply", "error");
                      } finally {
                        setBusyAction(null);
                      }
                    }}
                    className={adminPrimaryButtonClass}
                    disabled={busyAction === `reply:${selected._id}`}
                  >
                    Reply
                  </button>
                  {selected.status !== "pending" && (
                    <button
                      onClick={async () => {
                        setBusyAction(`pending:${selected._id}`);
                        try {
                          await adminService.updateSupportTicket(selected._id, {
                            status: "pending",
                          });
                          toast("Ticket marked pending", "success");
                          load();
                        } catch (err) {
                          toast("Failed to update ticket", "error");
                        } finally {
                          setBusyAction(null);
                        }
                      }}
                      className={adminButtonClass}
                      disabled={busyAction === `pending:${selected._id}`}
                    >
                      Mark pending
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(null)}
                    className={adminButtonClass}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
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
