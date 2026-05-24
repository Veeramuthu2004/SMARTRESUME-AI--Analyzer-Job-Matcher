import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../hooks/useToast";
import { FilterBar } from "../../components/ui/FilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import {
  adminButtonClass,
  adminMutedPanelClass,
  adminPageLeadClass,
  adminPageTitleClass,
  adminSelectClass,
} from "../../components/admin/adminUi";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminService.listPayments();
      setPayments(r.payments || []);
    } catch (e) {
      toast("Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const h = (e) => {
      if (!e?.detail?.type) return;
      // reload payments when payment-related admin events occur
      if (String(e.detail.type).toLowerCase().includes("payment")) load();
    };
    window.addEventListener("admin-update", h);
    return () => window.removeEventListener("admin-update", h);
  }, []);

  useAdminSocket();

  const filtered = payments.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      [
        p.paymentId,
        p.orderId,
        p.userId?.email,
        p.userId?.name,
        p.subscriptionPlan,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    const matchesStatus = status === "all" || p.status === status;
    return matchesQuery && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  const selectedPaymentDetails = selectedPayment
    ? [
        ["Customer", selectedPayment.userId?.name || "—"],
        ["Email", selectedPayment.userId?.email || "—"],
        ["Payment ID", selectedPayment.paymentId || "—"],
        ["Order ID", selectedPayment.orderId || "—"],
        [
          "Amount",
          `${selectedPayment.amount || 0} ${selectedPayment.currency || ""}`.trim(),
        ],
        ["Plan", selectedPayment.subscriptionPlan || "—"],
        ["Status", selectedPayment.status || "—"],
        [
          "Date",
          selectedPayment.createdAt
            ? new Date(selectedPayment.createdAt).toLocaleString()
            : "—",
        ],
      ]
    : [];

  const handleRefund = async (id) => {
    setConfirmConfig({
      title: "Refund payment",
      description: "Refund this payment?",
      tone: "danger",
      onConfirm: async () => {
        try {
          await adminService.refundPayment(id);
          toast("Payment refunded", "success");
          load();
        } catch (e) {
          toast("Refund failed", "error");
        } finally {
          setConfirmOpen(false);
        }
      },
    });
    setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const exportCsv = () => {
    const header = [
      "paymentId",
      "orderId",
      "email",
      "amount",
      "currency",
      "status",
      "plan",
      "date",
    ];
    const rows = filtered.map((p) => [
      p.paymentId || "",
      p.orderId || "",
      p.userId?.email || "",
      p.amount || "",
      p.currency || "",
      p.status || "",
      p.subscriptionPlan || "",
      p.createdAt || "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Payments</h1>
        <p className={adminPageLeadClass}>
          Monitor subscription charges, refunds, and payment health in real
          time.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <FilterBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search payment ID, order ID, email..."
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={adminSelectClass}
        >
          <option value="all">All status</option>
          <option value="pending">pending</option>
          <option value="success">success</option>
          <option value="failed">failed</option>
          <option value="cancelled">cancelled</option>
          <option value="refunded">refunded</option>
        </select>
        <button onClick={exportCsv} className={adminButtonClass}>
          Export CSV
        </button>
      </div>
      <Card>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-sm text-slate-200">
            {items.length === 0 ? (
              <p className="py-8 text-center text-slate-500 dark:text-slate-400">
                No payments found.
              </p>
            ) : (
              items.map((p) => (
                <div
                  key={p._id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {p.userId?.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.userId?.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.paymentId || p.orderId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {p.amount} {p.currency}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.status}
                    </p>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className={adminButtonClass}
                      >
                        Details
                      </button>
                      {p.status !== "refunded" && (
                        <button
                          onClick={() => handleRefund(p._id)}
                          className={adminButtonClass}
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Pagination page={page} pages={totalPages} onChange={setPage} />
        </div>
      </Card>

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

      {selectedPayment && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Payment details
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Clean summary for audit and support follow-up.
              </p>
            </div>
            <button
              onClick={() => setSelectedPayment(null)}
              className={adminButtonClass}
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selectedPaymentDetails.map(([label, value]) => (
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
    </div>
  );
}
