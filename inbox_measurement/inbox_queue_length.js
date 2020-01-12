/**
 * Records number of GMail Inbox threads and the inbox thread oldest latency
 * It records the data to a spreadsheet you specify in an 'Inbox Latency Data'
 * sheet. It's designed to work with G Suite Developer Hub "Triggers", at
 * https://script.google.com/home/triggers . I set it to run on an hourly
 * trigger and the plot inbox thread count and latency over time to motivate
 * myself to keep my inbox at zero ("Getting Things Done" trick).
 */
function recordInboxLatency() {
  var spreadsheetId = 'docs.google.com/spreadsheets/d/[YOUR_SPREADSHEET]/edit';
  var threads = GmailApp.getInboxThreads();
  var inboxLatencyMs = 0;
  var now = Date.now();
  var inboxThreadCount = threads.length;
  for (var i = 0; i < threads.length; i++) {
    var threadLatencyMs = now - threads[i].getLastMessageDate().getTime();
    if (threadLatencyMs > inboxLatencyMs) {
      inboxLatencyMs = threadLatencyMs;
    }
  }
  var inboxLatencyDays = inboxLatencyMs / 1000 / 3600 / 24;

  var spreadsheet = SpreadsheetApp.openByUrl(spreadsheetId);
  var sheet = spreadsheet.getSheetByName('Inbox Latency Data');
  sheet.appendRow([new Date(now), inboxThreadCount, inboxLatencyDays]);
}
