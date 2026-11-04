"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { auditMeta } from "@/components/super-admin/auditLabels";
import styles from "./ActivityLog.module.css";

interface ActivityLog {
  id: string;
  action: string;
  performed_at: string;
  performed_by: string | null;
  users: { name: string | null; email: string } | null;
}
const readableAction = (action: string) => auditMeta(action.trim().toUpperCase().replace(/[\s.-]+/g, "_")).label;
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const PAGE_SIZE = 25;

export default function AdminAuditLogs() {
  const [db] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await db.from("audit_logs")
        .select("id, action, performed_at, performed_by, users:performed_by(name, email)")
        .order("performed_at", { ascending: false }).limit(500);
      if (error) throw error;
      setLogs((data ?? []) as unknown as ActivityLog[]);
    } catch (err) {
      console.error("Could not load activity log:", err);
      setError("Activity could not be loaded. Please refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const query = search.trim().toLowerCase();
  const matches = logs.filter(log => `${readableAction(log.action)} ${log.users?.name ?? ""} ${log.users?.email ?? ""} ${log.performed_by ? "" : "System"}`.toLowerCase().includes(query));
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return <div className={styles.page}>
    <header className={styles.header}>
      <h1>Activity log</h1>
      <p>A clear history of account, membership and program activity.</p>
    </header>
    <section className={styles.toolbar} aria-label="Activity search">
      <div className={styles.search}>
        <Search size={16} aria-hidden="true" />
        <input type="search" aria-label="Search activity, name or email" placeholder="Search activity, name or email" value={search}
          onChange={event => { setSearch(event.target.value); setPage(1); }} />
      </div>
      <Button variant="outline" size="sm" disabled={loading} onClick={load} icon={<RefreshCcw className="h-4 w-4" />}>Refresh</Button>
    </section>
    <section className={styles.panel} aria-label="Recent activity">
      <div className={styles.panelHeading}><h2>Recent activity</h2><span>Latest 500 entries · Times in IST</span></div>
      {loading ? <p className={styles.message} role="status">Loading activity...</p>
        : error ? <p className={styles.error} role="alert">{error}</p>
        : !matches.length ? <p className={styles.message}>{query ? "No activity matches your search." : "No activity recorded yet."}</p>
        : <div className={styles.scroll} role="region" aria-label="Activity log table. Scroll horizontally on smaller screens." tabIndex={0}>
          <table className={styles.table}>
            <caption className="sr-only">Recent actions, the person who performed them, and when they happened.</caption>
            <colgroup><col style={{ width: "42%" }} /><col style={{ width: "34%" }} /><col style={{ width: "24%" }} /></colgroup>
            <thead><tr><th scope="col">Activity</th><th scope="col">Performed by</th><th scope="col">Date & time</th></tr></thead>
            <tbody>{visible.map(log => {
              const date = new Date(log.performed_at);
              const valid = !Number.isNaN(date.getTime());
              return <tr key={log.id}>
                <td><span className={styles.action}>{readableAction(log.action)}</span></td>
                <td><div className={styles.name}>{log.users?.name?.trim() || log.users?.email || (log.performed_by ? "Account unavailable" : "System")}</div>
                  {log.users?.name?.trim() && log.users.email && <div className={styles.email}>{log.users.email}</div>}</td>
                <td>{valid ? <time dateTime={log.performed_at}><span className={styles.date}>{dateFormat.format(date)}</span><span className={styles.time}>{timeFormat.format(date)} IST</span></time> : <span className={styles.time}>Date unavailable</span>}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      {!loading && !error && matches.length > 0 && <footer className={styles.pagination}>
        <span>{matches.length} {matches.length === 1 ? "entry" : "entries"} · Page {currentPage} of {pages}</span>
        <div><Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div>
      </footer>}
    </section>
  </div>;
}
