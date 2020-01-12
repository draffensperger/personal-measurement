/**
 * @fileoverview Records a event with a given timestamp to a google sheet
 *
 * This is designed to be run as a Google Cloud Function with Node.js 10.
 *
 * It expects the following environment variables to be configured for it:
 *   SPREADSHEET_ID - ID from `docs.google.com/spreadsheets/d/[ID]/edit` URL
 *   RANGE - spreadsheet range to write event rows, e.g. "Webhook Events!A:B"
 *   KEY - any random secret key used to authenticate clients for writing events
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
