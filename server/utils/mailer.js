const nodemailer = require('nodemailer');

// Uses Gmail "service" shorthand — no SMTP host/port needed.
// Requires SMTP_USER to be a Gmail address and SMTP_PASS to be a Gmail App Password.
// To generate an App Password: Google Account → Security → 2-Step Verification → App Passwords
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// ── Email Templates ──────────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>STEMEd</title>
</head>
<body style="margin:0;padding:0;background:#020202;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020202;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#0d1117,#070b0f);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#00f0ff,#0057ff);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-1px;">⚡ STEMEd</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Science · Technology · Engineering · Math</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
          <p style="margin:0;color:#5e6875;font-size:12px;">© ${new Date().getFullYear()} STEMEd. All rights reserved.</p>
          <p style="margin:8px 0 0;color:#5e6875;font-size:12px;">If you did not request this email, please ignore it.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Verification Email ───────────────────────────────────────────────────────

exports.sendVerificationEmail = async (user, verificationUrl) => {
  const transporter = createTransporter();
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Verify your email address</h2>
    <p style="margin:0 0 24px;color:#a0aab5;font-size:15px;line-height:1.6;">
      Hi <strong style="color:#fff;">${user.name}</strong>, welcome to STEMEd! 🎉<br/>
      Click the button below to verify your email and activate your account.
    </p>
    <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#00f0ff,#0057ff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.5px;">
      ✅ Verify Email Address
    </a>
    <p style="margin:24px 0 0;color:#5e6875;font-size:13px;">
      This link expires in <strong>24 hours</strong>.<br/>
      Or copy this link: <span style="color:#00f0ff;">${verificationUrl}</span>
    </p>
  `);

  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: '✅ Verify your STEMEd account',
    html,
  });
};

// ── Password Reset Email ─────────────────────────────────────────────────────

exports.sendPasswordResetEmail = async (user, resetUrl) => {
  const transporter = createTransporter();
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Reset your password</h2>
    <p style="margin:0 0 24px;color:#a0aab5;font-size:15px;line-height:1.6;">
      Hi <strong style="color:#fff;">${user.name}</strong>,<br/>
      We received a request to reset your STEMEd password. Click the button below to set a new one.
    </p>
    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#ff0055,#ff6b00);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.5px;">
      🔑 Reset Password
    </a>
    <p style="margin:24px 0 0;color:#5e6875;font-size:13px;">
      This link expires in <strong>10 minutes</strong>.<br/>
      If you didn't request this, you can safely ignore this email. Your password won't change.
    </p>
  `);

  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: '🔑 Password Reset - STEMEd',
    html,
  });
};

// ── Mentoring Email Notifications ────────────────────────────────────────────

const fmt12 = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
};

const bookingCard = (booking) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:0;margin:24px 0;overflow:hidden;">
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#a0aab5;font-size:13px;width:140px;">Booking ID</td>
          <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:700;">${booking.bookingId}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#a0aab5;font-size:13px;">Student</td>
          <td style="padding:6px 0;color:#fff;font-size:13px;">${booking.student?.name || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#a0aab5;font-size:13px;">Tutor</td>
          <td style="padding:6px 0;color:#fff;font-size:13px;">${booking.tutor?.name || 'To be assigned'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#a0aab5;font-size:13px;">Session</td>
          <td style="padding:6px 0;color:#fff;font-size:13px;">${booking.duration} minutes</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#a0aab5;font-size:13px;">Date</td>
          <td style="padding:6px 0;color:#fff;font-size:13px;">${booking.date}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#a0aab5;font-size:13px;">Time</td>
          <td style="padding:6px 0;color:#fff;font-size:13px;">${fmt12(booking.time)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#a0aab5;font-size:13px;">Amount</td>
          <td style="padding:6px 0;color:#00ff88;font-size:13px;font-weight:700;">₹${booking.price}</td>
        </tr>
        ${booking.meetingLink ? `
        <tr>
          <td style="padding:6px 0;color:#a0aab5;font-size:13px;">Meeting Link</td>
          <td style="padding:6px 0;font-size:13px;"><a href="${booking.meetingLink}" style="color:#00f0ff;">${booking.meetingLink}</a></td>
        </tr>` : ''}
      </table>
    </td></tr>
  </table>`;

const MENTORING_TEMPLATES = {
  booking_received_student: (b) => ({
    to: b.student?.email,
    subject: `📅 Booking Received — ${b.bookingId} | STEMEd Mentoring`,
    body: `
      <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Booking Received! 🎉</h2>
      <p style="margin:0 0 4px;color:#a0aab5;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">${b.student?.name}</strong>,<br/>
        Your 1-on-1 mentoring session has been booked. We'll confirm it shortly.
      </p>
      ${bookingCard(b)}
      <p style="color:#5e6875;font-size:13px;">You'll receive a confirmation email once the tutor accepts the booking.</p>`,
  }),

  new_booking_tutor: (b) => ({
    to: b.tutor?.email,
    subject: `🔔 New Mentoring Request — ${b.bookingId} | STEMEd`,
    body: `
      <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">New Booking Request!</h2>
      <p style="color:#a0aab5;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">${b.tutor?.name}</strong>,<br/>
        You have a new mentoring request from <strong style="color:#fff;">${b.student?.name}</strong>.
        Please log in to accept or reject it.
      </p>
      ${bookingCard(b)}`,
  }),

  booking_confirmed_student: (b) => ({
    to: b.student?.email,
    subject: `✅ Session Confirmed — ${b.bookingId} | STEMEd Mentoring`,
    body: `
      <h2 style="margin:0 0 8px;color:#00ff88;font-size:22px;">Session Confirmed! ✅</h2>
      <p style="color:#a0aab5;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">${b.student?.name}</strong>,<br/>
        Great news! Your mentoring session has been confirmed by <strong style="color:#fff;">${b.tutor?.name}</strong>.
      </p>
      ${bookingCard(b)}
      <p style="color:#5e6875;font-size:13px;">The tutor will share the meeting link soon. Keep an eye on your email.</p>`,
  }),

  booking_rejected_student: (b) => ({
    to: b.student?.email,
    subject: `❌ Session Cancelled — ${b.bookingId} | STEMEd Mentoring`,
    body: `
      <h2 style="margin:0 0 8px;color:#ff003c;font-size:22px;">Session Not Available</h2>
      <p style="color:#a0aab5;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">${b.student?.name}</strong>,<br/>
        Unfortunately the tutor was unable to accept your session for <strong>${b.date}</strong> at <strong>${fmt12(b.time)}</strong>.
        ${b.rejectionReason ? `<br/><em>Reason: ${b.rejectionReason}</em>` : ''}
      </p>
      ${bookingCard(b)}
      <p style="color:#5e6875;font-size:13px;">A full refund will be processed within 3–5 business days.</p>`,
  }),

  booking_rescheduled_student: (b) => ({
    to: b.student?.email,
    subject: `🔄 Session Rescheduled — ${b.bookingId} | STEMEd Mentoring`,
    body: `
      <h2 style="margin:0 0 8px;color:#f59e0b;font-size:22px;">Session Rescheduled</h2>
      <p style="color:#a0aab5;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">${b.student?.name}</strong>,<br/>
        Your session has been rescheduled to <strong style="color:#fff;">${b.date}</strong> at <strong style="color:#fff;">${fmt12(b.time)}</strong>.
        ${b.rescheduleReason ? `<br/><em>Reason: ${b.rescheduleReason}</em>` : ''}
      </p>
      ${bookingCard(b)}`,
  }),

  meeting_link_added_student: (b) => ({
    to: b.student?.email,
    subject: `🔗 Meeting Link Ready — ${b.bookingId} | STEMEd Mentoring`,
    body: `
      <h2 style="margin:0 0 8px;color:#00f0ff;font-size:22px;">Your Meeting Link is Ready! 🔗</h2>
      <p style="color:#a0aab5;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">${b.student?.name}</strong>,<br/>
        Your tutor has added the meeting link for your upcoming session.
      </p>
      ${bookingCard(b)}
      <a href="${b.meetingLink}" style="display:inline-block;background:linear-gradient(135deg,#00f0ff,#0057ff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;margin-top:8px;">
        🎥 Join Meeting
      </a>`,
  }),

  booking_cancelled_tutor: (b) => ({
    to: b.tutor?.email,
    subject: `❌ Booking Cancelled — ${b.bookingId} | STEMEd`,
    body: `
      <h2 style="margin:0 0 8px;color:#ff003c;font-size:22px;">Booking Cancelled</h2>
      <p style="color:#a0aab5;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#fff;">${b.tutor?.name}</strong>,<br/>
        The student <strong style="color:#fff;">${b.student?.name}</strong> has cancelled their booking.
      </p>
      ${bookingCard(b)}`,
  }),
};

exports.sendMentoringEmail = async (type, booking) => {
  const template = MENTORING_TEMPLATES[type];
  if (!template) return;
  const { to, subject, body } = template(booking);
  if (!to) return;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html: baseTemplate(body),
  });
};

