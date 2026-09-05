SPA varsity schedule service
============================

This Google Apps Script turns the public SPA varsity soccer sheet into:

1. a live `.ics` calendar feed for Apple Calendar, Outlook, and Google Calendar
2. an SMS signup endpoint for parents and players
3. a polling job that texts subscribers when a practice or game changes

Files
-----

- `Code.gs` contains the web app endpoint, live calendar feed, subscriber storage, and change detection
- `appsscript.json` sets the timezone and scopes
- `../schedule-config.js` is where the deployed web app URL gets pasted into the static site

Setup
-----

1. Create a new standalone Google Apps Script project.
2. Paste in `Code.gs`.
3. Replace the manifest with `appsscript.json`.
4. In Apps Script, open `Project Settings` and add these script properties:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER`
5. Deploy the project as a web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copy the deployed `/exec` URL into [schedule-config.js](/Users/alfredhome/.openclaw/workspace/soccer/spa-varsity-schedule-live/schedule-config.js).
7. Run `seedScheduleSnapshot` once from the Apps Script editor.
8. Run `installChangeTrigger` once from the Apps Script editor.

What the service does
---------------------

- `GET ?format=ics` returns a live iCal feed built from the public CSV export.
- `POST action=subscribe` stores a subscriber and optionally sends a Twilio confirmation text.
- `checkForScheduleChanges` re-fetches the schedule, compares it to the saved snapshot, and texts active subscribers when a `Practice` or `Game` row changes.

Notes
-----

- Subscriber data is stored in `ScriptProperties`, which is fine for a modest team-sized list.
- If Twilio properties are not set yet, the web form still stores signups, but texts will not send until Twilio is configured.
- Google Calendar works best as a subscribed feed, not a one-time import. The page copies the feed URL and opens the Google Calendar “Add by URL” screen.
