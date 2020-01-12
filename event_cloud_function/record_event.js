/**
 * @fileoverview Records a event with a given timestamp to a google sheet
 *
 * This is designed to be run as a Google Cloud Function with Node.js 10.
 *
 * It expects the following environment variables to be configured for it:
 *   SPREADSHEET_ID - ID from `docs.google.com/spreadsheets/d/[ID]/edit` URL
 *   RANGE - spreadsheet range to write event rows, e.g. "Webhook Events!A:B"
 *   KEY - any random secret key used to authenticate clients for writing events
 *
 * Note that you will need to given edit access in your Google sheet to the GCP
 * Service Account that runs your Cloud Function.
 *
 * This can be set up with an HTTP trigger for Cloud Functions and then
 * allows writing events with JSON in the format of:
 *   {"key":"[YOUR_KEY]","event":"[YOUR_EVENT_NAME"}
 *
 * This causes the event name and timestamp to be written to your Google sheet.
 * This can be used with apps like iOS Shortcuts, IFTTT, or even `curl` commands
 * in arbitrary scripts (such as OpenWRT device usage tracking) to then enable
 * various forms of personal habit tracking, such as measuring how often you go
 * to the gym or how often you use your work computer from your home network.
 */

const {google} = require('googleapis');
const {timingSafeEqual} = require('crypto');

exports.recordEvent = async (req, res) => {
  if (!timingSafeEqual(
          Buffer.from(req.body.key), Buffer.from(process.env.KEY))) {
    res.status(401).send('{"status":"bad key"}');
    return;
  }

  // block on auth + getting the sheets API object
  const auth = await google.auth.getClient(
      {scopes: ['https://www.googleapis.com/auth/spreadsheets']});
  const sheets = google.sheets({version: 'v4', auth});

  const appendRequest = {
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: process.env.RANGE,
    valueInputOption: 'RAW',
    resource: {
      values: [[new Date().toISOString(), req.body.event]],
    }
  };

  sheets.spreadsheets.values.append(appendRequest, (err, resp) => {
    if (err) {
      console.error(err);
      res.status(500).send('{"status":"error"}');
    }
    console.log(JSON.stringify(resp, null, 2));
    res.status(200).send('{"status":"success"}');
  });
};
