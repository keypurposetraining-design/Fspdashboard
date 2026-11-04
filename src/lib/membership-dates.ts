export function membershipExpiry(start: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return '';
  const [y,m,d] = start.split('-').map(Number);
  return `${y+1}-${String(m).padStart(2,'0')}-${String(Math.min(d,new Date(Date.UTC(y+1,m,0)).getUTCDate())).padStart(2,'0')}`;
}
export function todayDate() {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
export function daysRemaining(end: string | null) { return end ? Math.round((Date.parse(end)-Date.parse(todayDate()))/86400000) : null; }
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^\s*[=+@\-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
