/**
 * Lead capture for the portfolio contact form.
 * Receives the form POST, appends a row to a Google Sheet, emails you the enquiry (reply-to = the visitor)
 * and sends the visitor a short confirmation.
 *
 * SETUP (about 3 minutes, one time)
 * 1. Go to script.google.com > New project. Paste this whole file. Save.
 * 2. Run `setup` once (Run button). Approve the permissions. It creates a Google Sheet called "Portfolio leads"
 *    and stores its id. The sheet's link is printed in the Execution log.
 * 3. Deploy > New deployment > type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Copy the Web app URL (ends in /exec).
 * 4. Put that URL in content/site.json > contact > formEndpoint (or in the admin panel: Site settings > Contact >
 *    "Enquiry form endpoint"), commit, push. The form is live.
 * If you edit this script later: Deploy > Manage deployments > edit > New version (the URL stays the same).
 */
const OWNER_NAME = 'Asad Gulshair';
const SHEET_NAME = 'Leads';
const SEND_CONFIRMATION = true;   // short "I got your enquiry" email to the visitor
const HEADERS = ['Received', 'Name', 'Email', 'Company', 'Need', 'Budget', 'Timeline', 'Message', 'Source', 'Page', 'Referrer', 'Reply by', 'Phone'];

function setup() {
  const ss = SpreadsheetApp.create('Portfolio leads');
  const sh = ss.getSheets()[0]; sh.setName(SHEET_NAME);
  sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sh.setColumnWidth(8, 420);
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  Logger.log('Leads sheet: ' + ss.getUrl());
}

function doGet() { return json_({ ok: true, service: 'lead-capture' }); }

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    const d = JSON.parse(raw);
    const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
    const lead = {
      name: clean(d.name, 80), email: clean(d.email, 120), company: clean(d.company, 100), topic: clean(d.topic, 60),
      budget: clean(d.budget, 40), timeline: clean(d.timeline, 40), message: clean(d.message, 3000),
      source: clean(d.source, 40), page: clean(d.page, 300), referrer: clean(d.referrer, 300),
      reply: clean(d.reply, 20), phone: clean(d.phone, 30),
    };
    if (lead.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email) || lead.message.length < 15) return json_({ ok: false, error: 'invalid' });

    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
      if (!id) return json_({ ok: false, error: 'run setup() first' });
      const sh = SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);
      // very light duplicate guard: same email + same message within the sheet's last 20 rows
      const last = sh.getLastRow(), from = Math.max(2, last - 19);
      if (last >= 2) {
        const rows = sh.getRange(from, 1, last - from + 1, HEADERS.length).getValues();
        if (rows.some((r) => r[2] === lead.email && r[7] === lead.message)) return json_({ ok: true, duplicate: true });
      }
      sh.appendRow([new Date(), lead.name, lead.email, lead.company, lead.topic, lead.budget, lead.timeline, lead.message, lead.source, lead.page, lead.referrer, lead.reply, lead.phone]);
    } finally { lock.releaseLock(); }

    const me = Session.getEffectiveUser().getEmail();
    const opt = (label, v) => (v ? label + ': ' + v : null);
    const body = [
      'New enquiry from the portfolio site', '',
      'Name: ' + lead.name, 'Email: ' + lead.email, opt('Company', lead.company), opt('Need', lead.topic), opt('Budget', lead.budget), opt('Timeline', lead.timeline), opt('Reply by', lead.reply), opt('Phone', lead.phone),
      '', lead.message, '', '---', 'Sent from: ' + lead.page,
    ].filter((x) => x !== null).join('\n');
    MailApp.sendEmail({ to: me, replyTo: lead.email, name: 'Portfolio site', subject: 'New enquiry: ' + lead.name + (lead.topic ? ' (' + lead.topic + ')' : ''), body: body });
    if (SEND_CONFIRMATION) {
      MailApp.sendEmail({
        to: lead.email, name: OWNER_NAME, replyTo: me, subject: 'Thanks for your enquiry',
        body: 'Hi ' + lead.name.split(' ')[0] + ',\n\nThanks for getting in touch. I have your message and will reply within a day.\n\n' + OWNER_NAME + '\n\n---\nYour message:\n' + lead.message,
      });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
