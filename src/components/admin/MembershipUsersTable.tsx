"use client";

import Link from 'next/link';
import { daysRemaining } from '@/lib/membership-dates';
import styles from './MembershipUsersTable.module.css';

export interface MembershipUserRow {
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  providers: string[];
  member_id: string | null;
  membership_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

const calendarDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const clockTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
const roles: Record<string, string> = { member: 'Member', trainer: 'Trainer', admin: 'Admin', super_admin: 'Super admin' };
const statuses: Record<string, string> = { none: 'Unassigned', active: 'Active', pending: 'Pending', expired: 'Expired', cancelled: 'Cancelled', suspended: 'Suspended' };

function formattedDate(value: string): string {
  // Membership dates have no time zone. Keep the selected calendar day intact.
  const date = new Date(value.length === 10 ? `${value}T00:00:00+05:30` : value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : calendarDate.format(date);
}

function AccountDate({ value }: { value: string | null }) {
  if (!value) return <span className={styles.empty}>No sign-in yet</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span className={styles.empty}>Unavailable</span>;
  return <time dateTime={value}>
    <span className={styles.date}>{formattedDate(value)}</span>
    <span className={styles.secondary}>{clockTime.format(date)} IST</span>
  </time>;
}

export function MembershipUsersTable({ rows, total, onEdit, onHistory }: {
  rows: MembershipUserRow[];
  total: number;
  onEdit: (user: MembershipUserRow, renew?: boolean) => void;
  onHistory: (user: MembershipUserRow) => void;
}) {
  return <div className={styles.container}>
    <div className={styles.heading}>
      <div><h2>Registered participants</h2><p>Account activity and membership details · All times in IST</p></div>
      <span className={styles.count}>{total} {total === 1 ? 'participant' : 'participants'}</span>
    </div>
    <div className={styles.scroll} role="region" aria-label="Registered participants table. Scroll horizontally for more columns." tabIndex={0}>
      <table className={styles.table}>
        <caption className="sr-only">Registered participants, registration and last sign-in dates, membership periods, status and management actions.</caption>
        <colgroup>
          <col className={styles.participantColumn} /><col className={styles.dateColumn} /><col className={styles.dateColumn} />
          <col className={styles.membershipColumn} /><col className={styles.statusColumn} /><col className={styles.actionsColumn} />
        </colgroup>
        <thead><tr>{['Participant', 'Registered', 'Last sign-in', 'Membership period', 'Status', 'Actions'].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
        <tbody>{rows.map(row => {
          const days = daysRemaining(row.end_date);
          const initials = (row.name || row.email).trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
          return <tr key={row.user_id}>
            <td><div className={styles.identity}>
              <span className={styles.avatar} aria-hidden="true">{initials}</span>
              <div className={styles.identityText}><div className={styles.name}>{row.name || 'Unnamed participant'}</div><div className={styles.email}>{row.email}</div><span className={styles.role}>{roles[row.role] || row.role}</span></div>
            </div></td>
            <td><AccountDate value={row.created_at} /></td>
            <td><AccountDate value={row.last_sign_in_at} /><span className={styles.provider}>{row.providers.map(provider => provider === 'google' ? 'Google' : provider === 'email' ? 'Email' : provider).join(' · ')}</span></td>
            <td>{row.membership_id ? <>
              <div className={styles.term}><span className={styles.termLabel}>From</span><span className={styles.date}>{row.start_date ? <time dateTime={row.start_date}>{formattedDate(row.start_date)}</time> : 'Not set'}</span>
                <span className={styles.termLabel}>Until</span><span className={styles.date}>{row.end_date ? <time dateTime={row.end_date}>{formattedDate(row.end_date)}</time> : 'Not set'}</span></div>
              <div className={styles.remaining}>{days === null ? 'Expiry date not set' : days === 0 ? 'Expires today' : `${Math.abs(days)} days ${days < 0 ? 'past expiry' : 'remaining'}`}</div>
            </> : <span className={styles.empty}>No membership yet</span>}</td>
            <td><span className={`${styles.status} ${styles[row.status] || ''}`}>{statuses[row.status] || row.status}</span></td>
            <td><div className={styles.primaryActions}>
              <button type="button" className={`${styles.action} ${styles.primary}`} onClick={() => onEdit(row)}>{row.membership_id ? 'Manage' : 'Assign membership'}</button>
              {row.membership_id && <button type="button" className={styles.action} onClick={() => onEdit(row, true)}>Renew</button>}
            </div><div className={styles.secondaryActions}>
              <button type="button" className={styles.textAction} onClick={() => onHistory(row)}>History</button>
              {row.member_id && <Link className={styles.textAction} href={`/admin/members/${row.member_id}`}>Profile</Link>}
              <Link className={styles.textAction} href="/admin/payments">Payments</Link>
            </div></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}
