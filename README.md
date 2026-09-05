# SPA Varsity Schedule Live

Public GitHub Pages site for the SPA boys varsity soccer schedule.

Live site:

- https://alfredlipset.github.io/spa-varsity-schedule-live/

Contents:

- `index.html` parent/player schedule page
- `app.js` live CSV fetch, schedule rendering, and calendar actions
- `schedule-config.js` optional Google Apps Script service URL for live iCal feed and SMS alerts
- `google-apps-script/` companion Apps Script project for calendar subscriptions and Twilio texts

To activate live calendar subscriptions and SMS alerts:

1. Deploy the Apps Script project in `google-apps-script/`.
2. Paste the deployed `/exec` URL into `schedule-config.js`.
3. Push the updated file to `main`.
