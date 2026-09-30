# SPA BVS schedule and weather text service

## Current state (September 29, 2026)

Source prepared and local behavioral tests passing. Google web app deployed; live snapshot seeded; unauthenticated health and 96-event calendar feed verified. **Not activated:** the public `schedule-config.js` must stay blank until Twilio setup and real SMS tests pass.

Google project (Alfred's account):
https://script.google.com/home/projects/1715LWldaw9MD4ZTsvz9sy1_mbup7Ev8qv-WbOFp7ZMQuTlBOMC1f1mbt/edit

Deployed service (not yet linked to public signup):
https://script.google.com/macros/s/AKfycbyVCQ3ffGg_mZa-YXktMXjx_i9u5OQV8GGBd3BWuZAqoDfXw5sZzjYvS39pHUWSK2-lYw/exec

Health verified `smsConfigured: false`, `subscriberCount: 0`. No texts sent, no polling trigger installed.

## Activation

1. Sign into the team's Twilio account in the browser. Use an SMS-capable sender with active registration/verification required by Twilio for US messaging. Do not put credentials in git or chat.
2. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` directly in Apps Script **Project Settings → Script Properties**.
3. Save `Code.gs` and `appsscript.json`. Deploy a Web app executing as Me, access Anyone. Record its `/exec` URL.
4. Run `seedScheduleSnapshot`, set `OWNER_TEST_NUMBER` privately to Max’s approved test number, then run `sendOwnerTest`. Check Twilio Message Logs for **delivered**, not just queued/accepted; confirm Max receives it. Test only Max's number until authorized.
5. Submit an opt-in with consent via the service; test a controlled schedule change, verifying delivery, then restore it. Reply STOP and confirm further sends are blocked; reply START and resubmit opt-in to rejoin. Twilio handles these keywords; error 21610 suppresses the local subscriber on the next attempt. Verify HELP support in the sender configuration.
6. Run `installChangeTrigger` (one-minute polling), and verify its execution.
7. Only then paste `/exec` into `../schedule-config.js`, commit/push, and verify the public form and delivery again.

## Immediate weather alerts

These are editor-only owner functions; no public broadcast API exists.

1. Set `WEATHER_ALERT_TEXT` in Script Properties to the exact proposed message.
2. Run `previewWeatherAlert` to see full text and active-recipient count.
3. Obtain Max's approval for that exact team message. Set `WEATHER_ALERT_APPROVED_TEXT` to that exact text.
4. Run `sendApprovedWeatherAlert`. It queues the alert immediately to all active opt-ins, then clears approval to avoid accidental repeated broadcasts. It does not wait for a schedule edit.
5. Check logs. `accepted` is Twilio acceptance, not handset delivery; check Twilio delivery records.

## Reliability and limits

- Consent is required. Signups fail visibly when Twilio is unconfigured or confirmation fails; no false active status is saved.
- Subscriber/snapshot/outbox data is chunked below Apps Script's 9 KB per-property limit.
- Schedule checking ignores past events and refuses an empty schedule response, avoiding false mass cancellations.
- Failed sends remain in an outbox for retry, rather than silently disappearing. After five failures they remain pending for operator review; inspect the error and correct the issue before resetting attempts. Do not delete pending alerts blindly.
- Twilio STOP blocking is authoritative. STOP'd numbers are locally suppressed when Twilio returns error 21610; START plus successful opt-in allows rejoining.
- Calls are serialized with a script lock. Accepted recipients are checkpointed. An interruption between Twilio acceptance and local checkpoint can still produce a duplicate on retry (at-least-once delivery).
- Google Apps Script quotas/runtime and SMS provider outages can delay alerts. This is not a guaranteed emergency notification system.
- The polling trigger must not be installed until provider setup is complete. Manual weather alert content is not generated automatically from weather forecasts.

## Tests

Run `node google-apps-script/service.test.cjs` from the repository root. These are isolated behavioral tests (no provider traffic). Live delivery, STOP/START, and trigger verification are separate activation gates.
