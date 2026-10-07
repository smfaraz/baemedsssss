import React, { useEffect, useMemo, useState } from "react";
import { Download, LogIn, LogOut, RefreshCw, Search, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type Enquiry = {
  id: string;
  type: string;
  product: string | null;
  name: string;
  phone: string;
  email: string;
  rental_duration: string | null;
  message: string;
  status: string;
  created_at: string;
};
type NewsletterSubscriber = {
  id: string;
  email: string;
  subscribed_at: string;
};
type Status = "all" | "new" | "contacted" | "closed" | "failed";
type Type = "all" | "rental" | "contact" | "bulk" | "availability";
const statusStyles: Record<string, string> = {
  new: "border-amber-200 bg-amber-50 text-amber-800",
  contacted: "border-sky-200 bg-sky-50 text-sky-800",
  closed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  failed: "border-rose-200 bg-rose-50 text-rose-800",
};

const escapeCsv = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const AdminPage: React.FC = () => {
  const [session, setSession] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [type, setType] = useState<Type>("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const [{ data, error: queryError }, { data: subscriberData, error: subscriberError }] = await Promise.all([
      supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false }),
      supabase
        .from("newsletter_subscribers")
        .select("id,email,subscribed_at")
        .order("subscribed_at", { ascending: false }),
    ]);
    if (queryError || subscriberError) setError((queryError || subscriberError)?.message || 'Unable to load admin data.');
    else setEnquiries((data || []) as Enquiry[]);
    if (!subscriberError) setSubscribers((subscriberData || []) as NewsletterSubscriber[]);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(Boolean(data.session));
      if (data.session) load();
    });
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return enquiries
      .filter((item) => {
        const matchesStatus = status === "all" || item.status === status;
        const matchesType = type === "all" || item.type === type;
        const haystack = [
          item.name,
          item.email,
          item.phone,
          item.product,
          item.message,
          item.type,
        ]
          .join(" ")
          .toLowerCase();
        return (
          matchesStatus && matchesType && (!needle || haystack.includes(needle))
        );
      })
      .sort((a, b) =>
        sortNewest
          ? b.created_at.localeCompare(a.created_at)
          : a.created_at.localeCompare(b.created_at),
      );
  }, [enquiries, query, status, type, sortNewest]);

  const counts = useMemo(
    () => ({
      all: enquiries.length,
      new: enquiries.filter((item) => item.status === "new").length,
      contacted: enquiries.filter((item) => item.status === "contacted").length,
      closed: enquiries.filter((item) => item.status === "closed").length,
      failed: enquiries.filter((item) => item.status === "failed").length,
    }),
    [enquiries],
  );

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) setError(loginError.message);
    else {
      setSession(true);
      await load();
    }
    setLoading(false);
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(false);
    setEnquiries([]);
    setSubscribers([]);
  };
  const updateStatus = async (id: string, nextStatus: string) => {
    const { error: updateError } = await supabase
      .from("enquiries")
      .update({ status: nextStatus })
      .eq("id", id);
    if (updateError) setError(updateError.message);
    else
      setEnquiries((items) =>
        items.map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item,
        ),
      );
  };
  const exportCsv = () => {
    const headers = [
      "id",
      "type",
      "product",
      "name",
      "phone",
      "email",
      "rental_duration",
      "message",
      "status",
      "created_at",
    ];
    const csv = [
      headers,
      ...filtered.map((item) =>
        headers.map((header) => item[header as keyof Enquiry]),
      ),
    ]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `baemeds-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportSubscribers = () => {
    const csv = [["email", "subscribed_at"], ...subscribers.map((item) => [item.email, item.subscribed_at])]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `baemeds-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!session)
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <form
          onSubmit={login}
          className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-medical-primary">
            Baemeds operations
          </p>
          <h1 className="mt-2 text-3xl font-black text-medical-dark">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the staff account created in Supabase Authentication.
          </p>
          <input
            required
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Staff email"
            className="mt-6 min-h-12 w-full rounded-xl border border-slate-300 px-4"
          />
          <input
            required
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 px-4"
          />
          {error && (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-rose-700"
            >
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-medical-primary font-bold text-white shadow-soft transition hover:bg-medical-dark"
          >
            <LogIn size={18} />
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    );

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-medical-primary">
              Baemeds operations
            </p>
            <h1 className="mt-2 text-3xl font-black text-medical-dark">
              Customer enquiries
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-bold text-medical-dark"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!filtered.length}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-medical-primary px-4 font-bold text-white disabled:bg-slate-300"
            >
              <Download size={17} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportSubscribers}
              disabled={!subscribers.length}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-medical-primary bg-white px-4 font-bold text-medical-primary disabled:border-slate-200 disabled:text-slate-400"
            >
              <Download size={17} />
              Newsletter CSV
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-bold text-medical-dark"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </div>
        </div>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft" aria-labelledby="newsletter-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-medical-primary">Marketing opt-ins</p>
              <h2 id="newsletter-heading" className="mt-1 text-xl font-black text-medical-dark">Newsletter subscribers ({subscribers.length})</h2>
            </div>
            <p className="text-sm text-slate-500">Stored securely in Supabase</p>
          </div>
          {subscribers.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className="rounded-xl border border-slate-200 px-3 py-2">
                  <p className="break-all text-sm font-bold text-medical-dark">{subscriber.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(subscriber.subscribed_at).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-slate-600">No newsletter subscribers yet.</p>}
        </section>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800"
          >
            {error}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(["all", "new", "contacted", "closed", "failed"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-2xl border p-4 text-left ${status === key ? "border-medical-primary bg-medical-light" : "border-slate-200 bg-white"}`}
            >
              <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                {key}
              </span>
              <strong className="mt-1 block text-2xl font-black text-medical-dark">
                {counts[key]}
              </strong>
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_auto]">
          <label className="relative">
            <Search
              size={17}
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, product, message"
              className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-9 text-sm outline-none focus:border-medical-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center text-slate-500"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Type)}
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold"
          >
            <option value="all">All enquiry types</option>
            <option value="rental">Rental</option>
            <option value="contact">Contact</option>
            <option value="bulk">Bulk order</option>
            <option value="availability">Availability</option>
          </select>
          <select
            value={sortNewest ? "newest" : "oldest"}
            onChange={(e) => setSortNewest(e.target.value === "newest")}
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <p className="flex items-center text-sm font-semibold text-slate-500">
            Showing {filtered.length} of {enquiries.length}
          </p>
        </div>
        <div className="mt-5 grid gap-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-medical-primary">
                    {item.type}
                    {item.product ? ` Â· ${item.product}` : ""}
                  </p>
                  <h2 className="mt-1 text-lg font-black text-medical-dark">
                    {item.name}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {item.phone} Â· {item.email}
                  </p>
                </div>
              <select
                aria-label={`Status for ${item.name}`}
                value={item.status}
                onChange={(e) => updateStatus(item.id, e.target.value)}
                className={`min-h-10 rounded-lg border px-3 text-sm font-bold ${statusStyles[item.status] ?? 'border-slate-300 bg-white text-slate-700'}`}
              >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {item.message}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {item.rental_duration
                  ? `Duration: ${item.rental_duration} Â· `
                  : ""}
                {new Date(item.created_at).toLocaleString("en-IN")}
              </p>
            </article>
          ))}
          {!filtered.length && !loading && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-600">
              No enquiries match these filters.
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminPage;
