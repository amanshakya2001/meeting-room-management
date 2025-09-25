function escapeHtml(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateToUI(inputDate) {
  const d = inputDate instanceof Date ? inputDate : new Date(inputDate);
  if (isNaN(d)) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

/**
 * Helper: normalize a recipient item (string or object) into { display, email }
 */
function normalizeRecipient(item) {
  if (!item) return { display: '', email: '' };
  if (typeof item === 'string') {
    const s = item.trim();
    return { display: s, email: s.includes('@') ? s : '' };
  }
  const name = item.fullname || item.name || '';
  const email = item.email || '';
  const display = name && email ? `${name} <${email}>` : (name || email || String(item));
  return { display, email: email || (item._id ? String(item._id) : '') };
}

/**
 * buildMeetingEmail(meeting, actionEmail, organizerEmail, opts)
 * - opts.action: 'created' | 'updated' | 'cancelled' | 'candidates_removed' | 'pending' | 'reminder'
 * - opts.removedCandidates: array (for candidates_removed)
 * - opts.managers: array of recipients (for pending)
 * - opts.admins: array of recipients (for pending)
 * - opts.appUrl: base url for meeting link
 *
 * Returns: { subject, html, text, action, notifyList } where notifyList is an array
 * of display/email strings (useful for sending emails to managers/admins).
 */
function buildMeetingEmail(meeting = {}, actionEmail = '', organizerEmail = '', opts = {}) {
  const action = (opts.action || 'created').toLowerCase();
  const notifyTarget = (opts.notify || '').toLowerCase(); // e.g. 'removed'
  const startRaw = meeting.startDate || '';
  const endRaw = meeting.endDate || '';
  const start = new Date(startRaw);
  const end = new Date(endRaw);

  const startLabel = formatDateToUI(start);
  const endLabel = formatDateToUI(end);

  const roomName = (meeting.room && meeting.room.name) ? meeting.room.name : '—';
  const reason = meeting.reason || 'Meeting';
  const attendeesCount = Array.isArray(meeting.candidates) ? meeting.candidates.length : (meeting.attendeesCount || '—');

  // removed candidates list now taken from opts
  const rawRemoved = Array.isArray(opts.removedCandidates) ? opts.removedCandidates : [];
  const removedListDisplay = rawRemoved.map(item => {
    if (!item) return String(item);
    if (typeof item === 'string') return item;
    const name = item.fullname || item.name || '';
    const email = item.email || '';
    if (name && email) return `${name} <${email}>`;
    if (name) return name;
    if (email) return email;
    return (item._id ? String(item._id) : String(item));
  });

  // --- Normalize managers/admins (for 'pending' action) ---
  const managersRaw = Array.isArray(opts.managers) ? opts.managers : [];
  const adminsRaw = Array.isArray(opts.admins) ? opts.admins : [];

  const normManagers = managersRaw.map(normalizeRecipient).filter(r => r.display);
  const normAdmins   = adminsRaw.map(normalizeRecipient).filter(r => r.display);

  // Build unique notify lists (display strings and email strings)
  const combined = [...normManagers, ...normAdmins];
  const seenDisplays = new Set();
  const notifyDisplays = [];
  const notifyEmails = [];
  combined.forEach(r => {
    if (!r.display) return;
    if (!seenDisplays.has(r.display)) {
      seenDisplays.add(r.display);
      notifyDisplays.push(r.display);
      if (r.email) notifyEmails.push(r.email);
    }
  });

  // Default subject & copy
  let subjectPrefix = 'Meeting Scheduled';
  let headline = 'Meeting Scheduled';
  let accentColor = '#0b78e3';
  let introLine = `You have a new meeting scheduled by ${actionEmail}.`;

  // --- Extra: compute "starts in X minutes" when start is valid ---
  let startsInMinutes = null;
  try {
    if (!isNaN(start)) {
      const now = new Date();
      const diffMs = start - now;
      startsInMinutes = Math.round(diffMs / 60000); // can be negative if started already
    }
  } catch (e) {
    startsInMinutes = null;
  }

  // Action-specific adjustments
  if (action === 'updated') {
    subjectPrefix = 'Meeting Updated';
    headline = 'Meeting Updated';
    accentColor = '#f59e0b';
    introLine = `The meeting has been updated by ${actionEmail}. Please review the new details.`;
  } else if (action === 'cancelled' || action === 'deleted') {
    subjectPrefix = 'Meeting Cancelled';
    headline = 'Meeting Cancelled';
    accentColor = '#ef4444';
    introLine = `The meeting scheduled by ${actionEmail} has been cancelled.`;
  } else if (action === 'candidates_removed') {
    subjectPrefix = 'Attendees Removed';
    headline = 'Attendees Removed from Meeting';
    accentColor = '#d946ef';
    introLine = `Some attendees were removed from the meeting by ${actionEmail}.`;

    if (notifyTarget === 'removed') {
      subjectPrefix = `You were no longer invited to meeting`;
      headline = 'You were no longer invited to this meeting';
      introLine = `You have been no longer invited to this meeting by ${actionEmail}.`;
      accentColor = '#9b5cf6';
    }
  } else if (action === 'pending') {
    // NEW: meeting created but requires approval -> send to managers + admins
    subjectPrefix = 'Meeting Pending Approval';
    headline = 'Meeting Pending Approval';
    accentColor = '#6b7280'; // neutral gray for pending
    introLine = `A new meeting created by ${actionEmail} requires approval. Please review and approve or reject.`;
  } else if (action === 'reminder') {
    // Reminder (intended to be sent ~5 minutes before meeting)
    subjectPrefix = 'Meeting Reminder';
    headline = 'Upcoming Meeting — Starting Soon';
    accentColor = '#06b6d4';
    if (startsInMinutes !== null && Number.isFinite(startsInMinutes) && startsInMinutes >= 0) {
      // Prefer an accurate minutes-based intro when possible
      if (startsInMinutes === 0) {
        introLine = `This is a reminder: the meeting is starting now (${startLabel}).`;
      } else if (startsInMinutes === 1) {
        introLine = `This is a reminder: the meeting will start in about 1 minute (${startLabel}).`;
      } else {
        introLine = `This is a reminder: the meeting will start in approximately ${startsInMinutes} minutes (${startLabel}).`;
      }
    } else {
      // Fallback copy (suitable for the standard "5 minutes before" scenario)
      introLine = `This is a reminder that the meeting will start in approximately 5 minutes.`;
    }
  }

  const subject = `${subjectPrefix}: ${roomName} — ${startLabel}`;

  const base = (opts.appUrl || process.env.APP_URL || 'https://app.example.com').replace(/\/$/, '');
  const meetingUrl = meeting._id ? `${base}/meetings/${meeting._id}` : base;
  const ctaText = (action === 'cancelled') ? 'View Details' : (action === 'pending' ? 'Review & Approve' : (action === 'reminder' ? 'Join Meeting' : 'View Meeting'));

  // Removed candidates blocks (only shown when action === 'candidates_removed' and list present)
  const removedHtmlBlock = (action === 'candidates_removed' && removedListDisplay.length > 0)
    ? `<div style="margin-top:12px;">
         <p style="margin:0 0 8px; font-weight:600; color:#333;">Removed attendees</p>
         <ul style="padding-left:18px; margin:0 0 8px 0; color:#555;">
           ${removedListDisplay.map(it => `<li>${escapeHtml(it)}</li>`).join('')}
         </ul>
       </div>`
    : '';

  const removedTextBlock = (action === 'candidates_removed' && removedListDisplay.length > 0)
    ? `Removed attendees:\n- ${removedListDisplay.join('\n- ')}\n`
    : '';

  // Pending approval block (HTML + text)
  const pendingHtmlBlock = (action === 'pending' && notifyDisplays.length > 0)
    ? `<div style="margin-top:12px;">
         <p style="margin:0 0 8px; font-weight:600; color:#333;">Requires approval from</p>
         <ul style="padding-left:18px; margin:0 0 8px 0; color:#555;">
           ${notifyDisplays.map(it => `<li>${escapeHtml(it)}</li>`).join('')}
         </ul>
       </div>`
    : '';

  const pendingTextBlock = (action === 'pending' && notifyDisplays.length > 0)
    ? `Requires approval from:\n- ${notifyDisplays.join('\n- ')}\n`
    : '';

  // HTML body
  const html = `
  <!doctype html>
  <html>
  <head><meta charset="utf-8" /></head>
  <body style="font-family: Arial, Helvetica, sans-serif; color:#222; margin:0; padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px; background:#f7f7f7;">
        <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:8px; overflow:hidden;">
          <tr><td style="padding:24px 28px; border-bottom:1px solid #eee;">
            <h2 style="margin:0; font-size:20px; color:${escapeHtml(accentColor)};">${escapeHtml(headline)}</h2>
            <p style="margin:6px 0 0; color:#555;">${escapeHtml(introLine)}</p>
          </td></tr>

          <tr><td style="padding:18px 28px;">
            <table role="presentation" width="100%" cellpadding="6" cellspacing="0">
              <tr><td style="width:150px; font-weight:600; color:#333;">When</td>
                  <td style="color:#555;">${escapeHtml(startLabel)}${endLabel ? ` — ${escapeHtml(endLabel)}` : ''}</td></tr>
              <tr><td style="font-weight:600; color:#333;">Where</td>
                  <td style="color:#555;">${escapeHtml(roomName)}</td></tr>
              <tr><td style="font-weight:600; color:#333;">Organizer</td>
                  <td style="color:#555;">${escapeHtml(organizerEmail)}</td></tr>
              <tr><td style="font-weight:600; color:#333;">Attendees</td>
                  <td style="color:#555;">${escapeHtml(String(attendeesCount))}</td></tr>
              ${ meeting.location ? (`<tr><td style="font-weight:600; color:#333;">Location</td><td style="color:#555;">${escapeHtml(meeting.location)}</td></tr>`) : '' }
            </table>

            <div style="margin:18px 0;">
              <p style="color:#333; margin:0 0 12px;">Details:</p>
              <div style="padding:12px; background:#f4f6fb; border-radius:6px; color:#444;">
                ${escapeHtml(meeting.description || meeting.reason || 'No additional details provided.')}
              </div>

              <div style="margin-top:12px;">
                <p style="margin:0 0 8px; font-weight:600; color:#333;">Attendees</p>
                <ul style="padding-left:18px; margin:0 0 8px 0; color:#555;">
                  ${ (Array.isArray(meeting.candidates) ? meeting.candidates.map(it => `<li>${escapeHtml(it.fullname || it.name || String(it))}</li>`).join('') : '') }
                </ul>
              </div>

              ${removedHtmlBlock}
              ${pendingHtmlBlock}
            </div>

            <div style="text-align:center; margin-top:18px;">
              <a href="${meetingUrl}" style="display:inline-block; text-decoration:none; background:${escapeHtml(accentColor)}; color:#fff; padding:10px 18px; border-radius:6px;">
                ${escapeHtml(ctaText)}
              </a>
            </div>

            ${ action === 'cancelled' ? `<p style="font-size:12px; color:#777; margin-top:12px;">This meeting has been cancelled. If this was an error, please contact ${escapeHtml(organizerEmail)}.</p>` : '' }
          </td></tr>

          <tr><td style="padding:14px 28px; border-top:1px solid #eee; font-size:12px; color:#777;">
            <p style="margin:0;">If you can't attend, please contact ${escapeHtml(organizerEmail)} or update your RSVP in the app.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `.trim();

  // Plain text fallback
  const actionTextMap = {
    created: 'Scheduled',
    updated: 'Updated',
    cancelled: 'Cancelled',
    candidates_removed: 'Attendees Removed',
    pending: 'Pending Approval',
    reminder: 'Reminder'
  };
  const plainHeader = `${reason} — ${actionTextMap[action] || 'Scheduled'}`;

  const textParts = [
    plainHeader,
    '',
    `When: ${startLabel}${endLabel ? ` — ${endLabel}` : ''}`,
    `Where: ${roomName}`,
    `Organizer: ${organizerEmail}`,
    `Attendees: ${attendeesCount || '—'}`,
    '',
    'Details:',
    (meeting.description || meeting.reason || 'No additional details provided.'),
    ''
  ];

  if (removedTextBlock) textParts.push(removedTextBlock);
  if (pendingTextBlock) textParts.push(pendingTextBlock);

  // If reminder, add an explicit reminder line if startsInMinutes available
  if (action === 'reminder') {
    if (startsInMinutes !== null && Number.isFinite(startsInMinutes) && startsInMinutes >= 0) {
      textParts.push(`Reminder: Meeting starts in ~${startsInMinutes} minute(s).`);
    } else {
      textParts.push(`Reminder: Meeting will start in approximately 5 minutes.`);
    }
    textParts.push('');
  }

  textParts.push(`${ctaText}: ${meetingUrl}`);
  textParts.push('');
  textParts.push(action === 'cancelled' ? `NOTE: This meeting has been cancelled.` : `If you can't attend, please contact ${organizerEmail}.`);

  const text = textParts.join('\n');

  // Return notifyList (emails) and notifyDisplay for convenience to the caller when action === 'pending'
  return {
    subject,
    html,
    text,
    action,
    notifyList: notifyEmails,     // array of email strings (may be empty if not provided)
    notifyDisplay: notifyDisplays // human readable display strings
  };
}

module.exports = { buildMeetingEmail };
