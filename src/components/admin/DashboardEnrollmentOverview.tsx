"use client";

import { Fragment, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgramFacts } from "@/components/member/DashboardPrograms";
import { PaymentReview } from "@/components/admin/EnrollmentManagement";
import { statusLabel, type Offering, type OfferingEnrollment } from "@/lib/data/enrollments";
import styles from "./DashboardEnrollmentOverview.module.css";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
});
function displayDate(value: string) {
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00+05:30` : value);
  return Number.isNaN(parsed.getTime()) ? "Date unavailable" : dateFormatter.format(parsed);
}
function displayTime(value: string | null | undefined) {
  if (!value) return null;
  const parts = /^(\d{2}):(\d{2})/.exec(value);
  if (!parts || Number(parts[1]) > 23 || Number(parts[2]) > 59) return null;
  const hour = Number(parts[1]);
  return `${hour % 12 || 12}:${parts[2]} ${hour >= 12 ? "PM" : "AM"}`;
}
function Schedule({ item }: { item: Offering }) {
  const start = displayTime(item.program_time), end = displayTime(item.program_end_time);
  return <div className={styles.schedule}>
    <span>{item.start_date ? displayDate(item.start_date) : "Date to be announced"}
      {item.end_date && item.end_date !== item.start_date && ` – ${displayDate(item.end_date)}`}</span>
    <span>{start ? `${start}${end ? ` – ${end}` : ""} IST` : "Time to be announced"}</span>
  </div>;
}
function EnrollmentDetails({ row, refresh }: { row: OfferingEnrollment; refresh: () => Promise<void> }) {
  return <div className={styles.detailBody}>
    <ProgramFacts item={row.offerings} />
    <p>Enrolled on {displayDate(row.created_at)}</p>
    {row.review_note && <p>{row.review_note}</p>}
    {row.status === "payment_review" && <PaymentReview row={row} onReviewed={refresh} />}
  </div>;
}
function EnrollmentStatus({ status }: { status: OfferingEnrollment["status"] }) {
  return <span className={`${styles.status} ${status === "active" ? styles.active : styles.pending}`}>
    {status === "payment_review" ? "Payment review" : statusLabel(status)}
  </span>;
}

export function DashboardEnrollmentOverview({ offerings, enrollments, date, refresh }: {
  offerings: Offering[];
  enrollments: OfferingEnrollment[];
  date: string;
  refresh: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [program, setProgram] = useState("all");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const successful = enrollments.filter(row => row.status === "active");
  const summary = [
    ["Total programs", offerings.length],
    ["Confirmed enrollments", successful.length],
    ["Unique enrolled members", new Set(successful.map(row => row.member_id)).size],
    ["Today's program enrollments", successful.filter(row => row.offerings.start_date === date).length],
    ["Upcoming program enrollments", successful.filter(row => row.offerings.start_date && row.offerings.start_date > date).length],
    ["Programs without enrollments", offerings.filter(item => !enrollments.some(row => row.offering_id === item.id)).length],
  ];
  const name = (row: OfferingEnrollment) => [row.members?.first_name, row.members?.last_name].filter(Boolean).join(" ") || "Member";
  const rows = enrollments.filter(row => (status === "all" || row.status === status) && (program === "all" || row.offering_id === program)
    && `${name(row)} ${row.offerings.title}`.toLowerCase().includes(search.toLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const selected = offerings.find(item => item.id === program);

  return <div className={styles.overview}>
    <section aria-labelledby="enrollment-overview-heading">
      <div className={styles.sectionHeading}><h2 id="enrollment-overview-heading">Enrollment overview</h2>
        <p>Confirmed enrollments and program participation at a glance.</p></div>
      <div className={styles.stats}>{summary.map(([label, count]) => <Card hoverEffect={false} key={label} className={styles.stat}>
        <p className={styles.statLabel}>{label}</p><p className={styles.statValue}>{count}</p>
      </Card>)}</div>
    </section>

    <section aria-labelledby="enrollment-details-heading">
      <div className={styles.sectionHeading}><h2 id="enrollment-details-heading">Program enrollments</h2>
        <p>Browse participants, program schedules and payment status. All times are in IST.</p></div>
      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <label>Search<input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search member or program" type="search" /></label>
          <label>Program<select value={program} onChange={event => { setProgram(event.target.value); setPage(1); }}><option value="all">All programs</option>
            {offerings.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label>Status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="active">Active</option><option value="pending_payment">Pending payment</option><option value="payment_review">Payment review</option></select></label>
        </div>
        {selected && <div className={styles.selectedProgram}><h3>{selected.title}</h3><Schedule item={selected} />
          <span>{enrollments.filter(row => row.offering_id === selected.id).length} enrollment records</span></div>}
        {rows.length ? <>
          <div className={styles.desktopTable} role="region" aria-label="Program enrollment table. Scroll horizontally for additional columns." tabIndex={0}>
            <table className={styles.table}>
              <caption className="sr-only">Participants, program schedules, attendance modes, enrollment dates and payment status.</caption>
              <colgroup><col style={{ width: "20%" }} /><col style={{ width: "35%" }} /><col style={{ width: "12%" }} /><col style={{ width: "15%" }} /><col style={{ width: "18%" }} /></colgroup>
              <thead><tr>{["Member", "Program & schedule", "Mode", "Enrolled on", "Status"].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
              <tbody>{visible.map(row => <Fragment key={row.id}>
                <tr>
                  <td><div className={styles.memberName}>{name(row)}</div><button type="button" className={styles.detailsButton}
                    aria-expanded={expanded === row.id} aria-controls={`enrollment-detail-${row.id}`} onClick={() => setExpanded(expanded === row.id ? null : row.id)}>{expanded === row.id ? "Hide details" : "View details"}</button></td>
                  <td><div className={styles.programName}>{row.offerings.title}</div><Schedule item={row.offerings} /></td>
                  <td>{row.offerings.mode ? <span className={styles.mode}>{row.offerings.mode === "online" ? "Online" : "In person"}</span> : <span className={styles.muted}>To be confirmed</span>}</td>
                  <td><time className={styles.enrollmentDate} dateTime={row.created_at}>{displayDate(row.created_at)}</time></td>
                  <td><EnrollmentStatus status={row.status} /></td>
                </tr>
                {expanded === row.id && <tr id={`enrollment-detail-${row.id}`}><td colSpan={5} className={styles.expandedCell}><EnrollmentDetails row={row} refresh={refresh} /></td></tr>}
              </Fragment>)}</tbody>
            </table>
          </div>
          <div className={styles.mobileRecords}>{visible.map(row => <details key={row.id} className={styles.mobileRecord}>
            <summary><span className={styles.memberName}>{name(row)}</span><span className={styles.programName}>{row.offerings.title}</span><EnrollmentStatus status={row.status} /></summary>
            <EnrollmentDetails row={row} refresh={refresh} />
          </details>)}</div>
        </> : <p className={styles.empty}>No enrollments match these filters.</p>}
        <div className={styles.pagination}><span>{rows.length} records · Page {currentPage} of {pages}</span>
          <div><Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div>
        </div>
      </div>
    </section>
  </div>;
}
