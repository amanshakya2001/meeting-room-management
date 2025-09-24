// helper-email.js

function escapeHtml(str = '') {
    return String(str)
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
   * buildMeetingEmail(meeting, organizerEmail, opts)
   * - meeting: object with keys: reason, startTime, endTime, room (with name), _id (optional), description, location, candidates
   * - organizerEmail: string
   * - opts: { appUrl, action } where action = 'created'|'updated'|'cancelled' (defaults to 'created')
   *
   * returns: { subject, html, text, action }
   */
  function buildMeetingEmail(meeting = {}, organizerEmail = '', opts = {}) {
    const action = (opts.action || 'created').toLowerCase(); // created | updated | cancelled
    const startRaw = meeting.startDate || '';
    const endRaw = meeting.endDate || '';
    const start = new Date(startRaw);
    const end = new Date(endRaw);
  
    const startLabel = formatDateToUI(start);
    const endLabel = formatDateToUI(end);
  
    const roomName = (meeting.room && meeting.room.name) ? meeting.room.name : '—';
    const reason = meeting.reason || 'Meeting';
    const attendeesCount = Array.isArray(meeting.candidates) ? meeting.candidates.length : (meeting.attendeesCount || '—');
  
    // subject prefix & headline based on action
    let subjectPrefix = 'Meeting Scheduled';
    let headline = 'Meeting Scheduled';
    let accentColor = '#0b78e3';
    let introLine = `You have a new meeting scheduled by ${organizerEmail}.`;
  
    if (action === 'updated') {
      subjectPrefix = 'Meeting Updated';
      headline = 'Meeting Updated';
      accentColor = '#f59e0b'; // amber
      introLine = `The meeting has been updated by ${organizerEmail}. Please review the new details.`;
    } else if (action === 'cancelled' || action === 'deleted') {
      subjectPrefix = 'Meeting Cancelled';
      headline = 'Meeting Cancelled';
      accentColor = '#ef4444'; // red
      introLine = `The meeting scheduled by ${organizerEmail} has been cancelled.`;
    }
  
    const subject = `${subjectPrefix}: ${roomName} — ${startLabel}`;
  
    // meeting URL (optional)
    const base = (opts.appUrl || process.env.APP_URL || 'https://app.example.com').replace(/\/$/, '');
    const meetingUrl = meeting._id ? `${base}/meetings/${meeting._id}` : base;
  
    // CTA text - different for cancelled
    const ctaText = (action === 'cancelled') ? 'View Details' : 'View Meeting';
  
    // HTML body
    const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
    </head>
    <body style="font-family: Arial, Helvetica, sans-serif; color:#222; margin:0; padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:20px; background:#f7f7f7;">
            <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
              <tr>
                <td style="padding:24px 28px; border-bottom:1px solid #eee;">
                  <h2 style="margin:0; font-size:20px; color:${escapeHtml(accentColor)};">${escapeHtml(headline)}</h2>
                  <p style="margin:6px 0 0; color:#555;">${escapeHtml(introLine)}</p>
                </td>
              </tr>
  
              <tr>
                <td style="padding:18px 28px;">
                  <table role="presentation" width="100%" cellpadding="6" cellspacing="0">
                    <tr>
                      <td style="width:150px; font-weight:600; color:#333;">When</td>
                      <td style="color:#555;">${escapeHtml(startLabel)}${endLabel ? ` — ${escapeHtml(endLabel)}` : ''}</td>
                    </tr>
                    <tr>
                      <td style="font-weight:600; color:#333;">Where</td>
                      <td style="color:#555;">${escapeHtml(roomName)}</td>
                    </tr>
                    <tr>
                      <td style="font-weight:600; color:#333;">Organizer</td>
                      <td style="color:#555;">${escapeHtml(organizerEmail)}</td>
                    </tr>
                    <tr>
                      <td style="font-weight:600; color:#333;">Attendees</td>
                      <td style="color:#555;">${escapeHtml(String(attendeesCount))}</td>
                    </tr>
                    ${ meeting.location ? (`<tr><td style="font-weight:600; color:#333;">Location</td><td style="color:#555;">${escapeHtml(meeting.location)}</td></tr>`) : '' }
                  </table>
  
                  <div style="margin:18px 0;">
                    <p style="color:#333; margin:0 0 12px;">Details:</p>
                    <div style="padding:12px; background:#f4f6fb; border-radius:6px; color:#444;">
                      ${escapeHtml(meeting.description || meeting.reason || 'No additional details provided.')}
                    </div>
                  </div>
  
                  <div style="text-align:center; margin-top:18px;">
                    <a href="${meetingUrl}" style="display:inline-block; text-decoration:none; background:${escapeHtml(accentColor)}; color:#fff; padding:10px 18px; border-radius:6px;">
                      ${escapeHtml(ctaText)}
                    </a>
                  </div>
  
                  ${ action === 'cancelled' ? `<p style="font-size:12px; color:#777; margin-top:12px;">This meeting has been cancelled. If this was an error, please contact ${escapeHtml(organizerEmail)}.</p>` : '' }
                </td>
              </tr>
  
              <tr>
                <td style="padding:14px 28px; border-top:1px solid #eee; font-size:12px; color:#777;">
                  <p style="margin:0;">If you can't attend, please contact ${escapeHtml(organizerEmail)} or update your RSVP in the app.</p>
                </td>
              </tr>
  
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `.trim();
  
    // Plain text fallback
    const actionTextMap = {
      created: 'Scheduled',
      updated: 'Updated',
      cancelled: 'Cancelled'
    };
    const plainHeader = `${reason} — ${actionTextMap[action] || 'Scheduled'}`;
  
    const text = [
      plainHeader,
      '',
      `When: ${startLabel}${endLabel ? ` — ${endLabel}` : ''}`,
      `Where: ${roomName}`,
      `Organizer: ${organizerEmail}`,
      `Attendees: ${attendeesCount || '—'}`,
      '',
      'Details:',
      (meeting.description || meeting.reason || 'No additional details provided.'),
      '',
      `${ctaText}: ${meetingUrl}`,
      '',
      action === 'cancelled' ? `NOTE: This meeting has been cancelled.` : `If you can't attend, please contact ${organizerEmail}.`
    ].join('\n');
  
    return { subject, html, text, action };
  }
  
  module.exports = { buildMeetingEmail };
  