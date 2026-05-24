import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  Globe,
  Mail,
  MessageCircle,
  PhoneCall,
  Send,
  Wallet,
  Heart,
  Code,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import api from "../services/api";

const supportEmail = "veeradpi12@gmail.com";

export const ContactPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(
      `Support request from ${name || "Smart Resume user"}`,
    );
    const body = encodeURIComponent(
      `Name: ${name || "N/A"}\nEmail: ${email || "N/A"}\n\nMessage:\n${message || ""}`,
    );

    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }, [email, message, name]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          Contact
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Questions, enterprise plans, billing help, or product feedback — we’d
          love to hear from you.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
            <MessageCircle size={18} /> Send a message
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Send us a real message and we’ll deliver it to support right away.
          </p>

          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setStatus("");
              setSending(true);
              try {
                const result = await api.post("/contact", {
                  name,
                  email,
                  message,
                });
                setStatus(result.data?.message || "Message sent successfully.");
                setName("");
                setEmail("");
                setMessage("");
              } catch (err) {
                setError(
                  err.response?.data?.message || "Failed to send your message.",
                );
              } finally {
                setSending(false);
              }
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-4 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-4 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Message
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Tell us how we can help..."
                className="w-full rounded-xl border border-slate-300/80 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={sending}>
                <Send size={16} /> {sending ? "Sending..." : "Send message"}
              </Button>
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <Mail size={16} /> Email directly
              </a>
            </div>
            {status && (
              <p className="text-sm text-emerald-600 dark:text-emerald-300">
                {status}
              </p>
            )}
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-300">
                {error}
              </p>
            )}
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
              <PhoneCall size={18} /> Quick support
            </h2>
            <p className="text-slate-700 dark:text-slate-200">
              Need help with your account or resume analysis?
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-3 block font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              {supportEmail}
            </a>
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
              <CreditCard size={18} /> Billing & payment method
            </h2>
            <p className="text-slate-700 dark:text-slate-200">
              For subscriptions or invoices, we support a few common payment
              methods:
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                <Wallet size={14} className="mr-2 inline-block" /> UPI
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                <CreditCard size={14} className="mr-2 inline-block" /> Card
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                <Banknote size={14} className="mr-2 inline-block" /> Bank
                transfer
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                <Mail size={14} className="mr-2 inline-block" /> Invoice support
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Send billing details to{" "}
              <span className="font-semibold text-slate-950 dark:text-white">
                {supportEmail}
              </span>
              .
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
              <Globe size={18} /> Social links
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Code size={16} /> GitHub
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Code size={16} /> LinkedIn
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Heart size={16} /> Instagram
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
