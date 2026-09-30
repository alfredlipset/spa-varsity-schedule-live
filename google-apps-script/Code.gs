const SERVICE_SOURCE = "spa-schedule-service";
const DISPLAY_TIME_ZONE = "America/Chicago";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1T5_MEg9U-CFIYcJ9FBcoAd2K-xq14MCNQC2OTPx_kKc/edit?usp=drivesdk";
const CSV_URL = "https://docs.google.com/spreadsheets/d/1T5_MEg9U-CFIYcJ9FBcoAd2K-xq14MCNQC2OTPx_kKc/export?format=csv";
const SUBSCRIBERS_PROPERTY = "spa_schedule_subscribers_v1";
const SNAPSHOT_PROPERTY = "spa_schedule_snapshot_v1";
const LAST_CHANGE_PROPERTY = "spa_schedule_last_change_v1";
const MAX_SUBSCRIBERS = 250;
const OUTBOX_PROPERTY = "spa_schedule_outbox_v1";
const SITE_URL = "https://alfredlipset.github.io/spa-varsity-schedule-live/";

function withServiceLock_(work) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return work(); } finally { lock.releaseLock(); }
}

// Script properties have a 9 KB per-value limit. Keep team data in small chunks.
function readLargeProperty_(key) {
  const props = PropertiesService.getScriptProperties();
  const count = Number(props.getProperty(key + "_parts") || 0);
  if (!count) return props.getProperty(key);
  let value = "";
  for (let i = 0; i < count; i++) value += props.getProperty(key + "_part_" + i) || "";
  return value;
}

function writeLargeProperty_(key, value) {
  const props = PropertiesService.getScriptProperties();
  const oldCount = Number(props.getProperty(key + "_parts") || 0);
  const count = Math.ceil(value.length / 1500);
  for (let i = 0; i < count; i++) props.setProperty(key + "_part_" + i, value.slice(i * 1500, (i + 1) * 1500));
  props.setProperty(key + "_parts", String(count));
  for (let i = count; i < oldCount; i++) props.deleteProperty(key + "_part_" + i);
  props.deleteProperty(key);
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const format = String(params.format || "").toLowerCase();
  const callback = params.callback || "";

  if (format === "ics") {
    return buildCalendarOutput_(Boolean(params.download));
  }

  return buildOutput_(callback, {
    ok: true,
    source: SERVICE_SOURCE,
    serviceUrl: safeServiceUrl_(),
    smsConfigured: isSmsConfigured_(),
    subscriberCount: loadSubscribers_().length,
    lastChangeAt: PropertiesService.getScriptProperties().getProperty(LAST_CHANGE_PROPERTY) || ""
  });
}

function doPost(e) {
  const params = readParams_(e);
  const action = String(params.action || "subscribe").toLowerCase();
  const requestId = params.requestId || "";
  const targetOrigin = normalizeTargetOrigin_(params.origin);

  try {
    if (action !== "subscribe") {
      throw new Error("Unsupported action.");
    }

    const result = withServiceLock_(function() { return subscribe_(params); });
    result.requestId = requestId;
    result.source = SERVICE_SOURCE;
    return buildResultPage_(targetOrigin, result);
  } catch (error) {
    return buildResultPage_(targetOrigin, {
      source: SERVICE_SOURCE,
      status: "error",
      requestId: requestId,
      message: error && error.message ? error.message : "Subscription failed."
    });
  }
}

function subscribe_(params) {
  const name = String(params.name || "").trim();
  const phone = normalizePhone_(params.phone);
  const alertType = normalizeAlertType_(params.alertType);
  const consent = String(params.consent || "").toLowerCase() === "yes";

  if (!name) {
    throw new Error("Name is required.");
  }
  if (!phone) {
    throw new Error("A valid mobile number is required.");
  }
  if (!consent) {
    throw new Error("Consent is required before enabling text alerts.");
  }

  if (!isSmsConfigured_()) throw new Error("Text alerts are not available yet. Please try again later.");
  const subscribers = loadSubscribers_();
  const now = new Date().toISOString();
  const existingIndex = subscribers.findIndex(function(subscriber) {
    return subscriber.phone === phone;
  });

  const record = {
    name: name,
    phone: phone,
    alertType: alertType,
    consentAt: now,
    updatedAt: now,
    status: "active"
  };

  if (existingIndex >= 0) {
    record.consentAt = subscribers[existingIndex].consentAt || now;
    subscribers[existingIndex] = record;
  } else {
    if (subscribers.length >= MAX_SUBSCRIBERS) {
      throw new Error("The text alert list is full right now.");
    }
    subscribers.push(record);
  }

  if (isSmsConfigured_()) {
    sendSms_(
      phone,
      "SPA soccer texts are on. You will get schedule change alerts for " +
        describeAlertType_(alertType) +
        ". Calendar feed: " +
        safeServiceUrl_() +
        "?format=ics. Reply STOP to unsubscribe; HELP for help. Message and data rates may apply."
    );
  }
  saveSubscribers_(subscribers);

  return {
    status: "ok",
    message: isSmsConfigured_()
      ? "Text alerts are on. A confirmation message should arrive shortly."
      : "Subscription saved. Add Twilio settings in Apps Script to start sending texts."
  };
}

function buildCalendarOutput_(download) {
  const events = loadScheduleEvents_();
  const calendarText = buildIcs_(events);
  const output = ContentService
    .createTextOutput(calendarText)
    .setMimeType(ContentService.MimeType.ICAL);

  if (download && output.downloadAsFile) {
    output.downloadAsFile("spa-boys-varsity-soccer-2026.ics");
  }
  return output;
}

function readParams_(e) {
  const params = {};
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function(key) {
      params[key] = e.parameter[key];
    });
  }

  const body = e && e.postData && e.postData.contents ? e.postData.contents : "";
  const type = e && e.postData && e.postData.type ? e.postData.type : "";
  if (body && type.indexOf("application/json") === 0) {
    const parsed = JSON.parse(body);
    Object.keys(parsed).forEach(function(key) {
      params[key] = parsed[key];
    });
  }
  return params;
}

function buildOutput_(callback, payload) {
  const body = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + body + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}

function buildResultPage_(targetOrigin, payload) {
  const safePayload = JSON.stringify(payload).replace(/<\//g, "<\\/");
  const safeOrigin = JSON.stringify(targetOrigin || "*");
  const bodyText = payload.status === "ok"
    ? "Text alerts enabled. You can close this window."
    : "Text alert signup failed. Return to the schedule page and try again.";

  return HtmlService.createHtmlOutput(
    "<!doctype html><html><body style=\"font-family:Arial,sans-serif;padding:16px;\">" +
      "<p>" + bodyText + "</p>" +
      "<script>" +
        "const payload=" + safePayload + ";" +
        "const targetOrigin=" + safeOrigin + ";" +
        "const targets=[];" +
        "if (window.parent && window.parent !== window) targets.push(window.parent);" +
        "if (window.top && window.top !== window && window.top !== window.parent) targets.push(window.top);" +
        "if (window.opener) targets.push(window.opener);" +
        "targets.forEach(function(target) { try { target.postMessage(payload, targetOrigin); } catch (error) {} });" +
      "</script>" +
    "</body></html>"
  );
}

function loadScheduleEvents_() {
  const response = UrlFetchApp.fetch(CSV_URL, { muteHttpExceptions: true });
  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error("Could not fetch the public schedule CSV.");
  }

  const csvText = response.getContentText();
  const rows = Utilities.parseCsv(csvText);
  if (!rows.length) {
    return [];
  }

  const headers = rows[0];
  return rows.slice(1).filter(function(cells) {
    return cells.some(function(cell) {
      return String(cell || "").trim() !== "";
    });
  }).map(function(cells, index) {
    const record = {};
    headers.forEach(function(header, headerIndex) {
      record[header] = String(cells[headerIndex] || "").trim();
    });
    return normalizeEvent_(record, index);
  }).filter(Boolean);
}

function normalizeEvent_(record, index) {
  const date = record["Date"];
  if (!date) {
    return null;
  }

  const startMinutes = parseTimeToMinutes_(record["Start Time"]);
  if (startMinutes == null) {
    return null;
  }

  const endMinutes = parseTimeToMinutes_(record["End Time"]);
  const category = String(record["Category"] || "Event").trim();
  return {
    id: date + "-" + index,
    date: date,
    category: category,
    homeAway: record["Home/Away"] || "",
    opponent: record["Opponent"] || "",
    title: buildTitle_(record),
    arrivalTime: record["Arrival Time"] || "",
    startTime: record["Start Time"] || "",
    endTime: record["End Time"] || "",
    startMinutes: startMinutes,
    endMinutes: endMinutes != null ? endMinutes : startMinutes + 90,
    location: record["Location"] || "",
    notes: record["Notes"] || "",
    key: buildDiffKey_(record)
  };
}

function buildTitle_(record) {
  const category = String(record["Category"] || "Event").trim();
  const homeAway = record["Home/Away"] || "";
  const opponent = record["Opponent"] || "";

  if (category === "Game" && opponent) {
    return (homeAway || "vs") + " " + opponent;
  }
  if (category === "Practice" && opponent) {
    return opponent + " Practice";
  }
  if (category === "Strength & Conditioning" && opponent) {
    return opponent + " Strength and Conditioning";
  }
  return category;
}

function buildDiffKey_(record) {
  const category = String(record["Category"] || "Event").trim().toLowerCase();
  const date = String(record["Date"] || "").trim().toLowerCase();
  const homeAway = String(record["Home/Away"] || "").trim().toLowerCase();
  const opponent = String(record["Opponent"] || "").trim().toLowerCase();
  return [date, category, homeAway, opponent].join("|");
}

function parseTimeToMinutes_(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "n/a") {
    return null;
  }

  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3];

  if (meridiem === "pm" && hours !== 12) {
    hours += 12;
  }
  if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  return (hours * 60) + minutes;
}

function buildIcs_(events) {
  const stamp = Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SPA Boys Varsity Soccer//Schedule Service//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SPA Boys Varsity Soccer 2026",
    "X-WR-TIMEZONE:" + DISPLAY_TIME_ZONE
  ];

  events.forEach(function(event) {
    lines.push("BEGIN:VEVENT");
    lines.push("UID:" + event.id + "@spa-bvs-schedule");
    lines.push("DTSTAMP:" + stamp);
    lines.push("DTSTART;TZID=" + DISPLAY_TIME_ZONE + ":" + asIcsLocal_(event.date, event.startMinutes));
    lines.push("DTEND;TZID=" + DISPLAY_TIME_ZONE + ":" + asIcsLocal_(event.date, event.endMinutes));
    lines.push(foldIcsLine_("SUMMARY:" + escapeIcsText_(event.title)));
    lines.push(foldIcsLine_("DESCRIPTION:" + escapeIcsText_(buildEventDescription_(event))));
    if (event.location) {
      lines.push(foldIcsLine_("LOCATION:" + escapeIcsText_(event.location)));
    }
    lines.push("URL:" + SHEET_URL);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

function asIcsLocal_(date, minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return date.replace(/-/g, "") + "T" + pad_(hours) + pad_(mins) + "00";
}

function pad_(value) {
  return ("0" + value).slice(-2);
}

function buildEventDescription_(event) {
  const lines = [];
  if (event.notes) {
    lines.push(event.notes);
  }
  if (event.arrivalTime) {
    lines.push("Arrival: " + event.arrivalTime);
  }
  if (event.location) {
    lines.push("Location: " + event.location);
  }
  lines.push("Source: " + SHEET_URL);
  return lines.join("\n");
}

function escapeIcsText_(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n");
}

function foldIcsLine_(line) {
  const limit = 72;
  if (line.length <= limit) {
    return line;
  }

  const segments = [];
  for (let index = 0; index < line.length; index += limit) {
    segments.push((index === 0 ? "" : " ") + line.slice(index, index + limit));
  }
  return segments.join("\r\n");
}

function loadSubscribers_() {
  const raw = readLargeProperty_(SUBSCRIBERS_PROPERTY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveSubscribers_(subscribers) {
  writeLargeProperty_(
    SUBSCRIBERS_PROPERTY,
    JSON.stringify(subscribers)
  );
}

function normalizeAlertType_(value) {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "games" || normalized === "practices") {
    return normalized;
  }
  return "all";
}

function describeAlertType_(alertType) {
  if (alertType === "games") {
    return "games only";
  }
  if (alertType === "practices") {
    return "practices only";
  }
  return "practice and game changes";
}

function normalizePhone_(value) {
  const trimmed = String(value || "").trim();
  const digits = trimmed.replace(/\D+/g, "");

  if (trimmed.indexOf("+") === 0 && digits.length >= 11) {
    return "+" + digits;
  }
  if (digits.length === 10) {
    return "+1" + digits;
  }
  if (digits.length === 11 && digits.indexOf("1") === 0) {
    return "+" + digits;
  }
  return "";
}

function normalizeTargetOrigin_(origin) {
  if (!origin) {
    return "*";
  }
  if (origin === "*") {
    return "*";
  }

  const value = String(origin).trim();
  if (!(value.indexOf("http://") === 0 || value.indexOf("https://") === 0)) {
    return "*";
  }

  const parts = value.split("/");
  if (parts.length < 3 || !parts[2]) {
    return "*";
  }

  return parts[0] + "//" + parts[2];
}

function safeServiceUrl_() {
  return ScriptApp.getService().getUrl() || "";
}

function isSmsConfigured_() {
  const props = PropertiesService.getScriptProperties();
  return Boolean(
    props.getProperty("TWILIO_ACCOUNT_SID") &&
    props.getProperty("TWILIO_AUTH_TOKEN") &&
    props.getProperty("TWILIO_FROM_NUMBER")
  );
}

function sendSms_(to, body) {
  const props = PropertiesService.getScriptProperties();
  const sid = props.getProperty("TWILIO_ACCOUNT_SID");
  const token = props.getProperty("TWILIO_AUTH_TOKEN");
  const from = props.getProperty("TWILIO_FROM_NUMBER");

  if (!sid || !token || !from) {
    throw new Error("Twilio is not configured.");
  }

  const response = UrlFetchApp.fetch(
    "https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json",
    {
      method: "post",
      muteHttpExceptions: true,
      headers: {
        Authorization: "Basic " + Utilities.base64Encode(sid + ":" + token)
      },
      payload: {
        To: to,
        From: from,
        Body: body
      }
    }
  );

  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    let code = 0;
    try { code = JSON.parse(response.getContentText()).code || 0; } catch (ignored) {}
    const error = new Error("Twilio send failed with status " + statusCode + " (code " + code + ").");
    if (code === 21610) error.message = "This number opted out. Reply START to the SPA soccer number, then sign up again.";
    error.twilioCode = code;
    throw error;
  }
  const result = JSON.parse(response.getContentText());
  return { sid: result.sid, status: result.status }; // Accepted/queued is not delivered.
}

function seedScheduleSnapshot() {
  const events = loadScheduleEvents_();
  saveSnapshot_(events);
  return {
    status: "seeded",
    events: events.length
  };
}

function checkForScheduleChanges() {
  return withServiceLock_(function() {
    if (!isSmsConfigured_()) throw new Error("Twilio is not configured.");
    const latestEvents = loadScheduleEvents_();
    const previousEvents = loadSnapshot_();
    if (!latestEvents.length) throw new Error("Empty schedule: preserving snapshot; no cancellation alerts sent.");
    const outbox = JSON.parse(readLargeProperty_(OUTBOX_PROPERTY) || "[]");
    const changes = previousEvents.length ? diffEvents_(previousEvents, latestEvents).filter(function(change) {
      const event = change.after || change.before;
      const today = Utilities.formatDate(new Date(), DISPLAY_TIME_ZONE, "yyyy-MM-dd");
      return (event.category === "Practice" || event.category === "Game") && event.date >= today;
    }) : [];
    if (changes.length) {
      const batch = Utilities.getUuid();
      loadSubscribers_().filter(function(s) { return s.status === "active"; }).forEach(function(s) {
        const relevant = changes.filter(function(c) { return subscriberMatchesChange_(s, c); });
        if (relevant.length) outbox.push({ id: batch + ":" + s.phone, phone: s.phone, body: buildChangeMessage_(relevant), attempts: 0 });
      });
      writeLargeProperty_(OUTBOX_PROPERTY, JSON.stringify(outbox));
      PropertiesService.getScriptProperties().setProperty(LAST_CHANGE_PROPERTY, new Date().toISOString());
    }
    saveSnapshot_(latestEvents);
    return drainOutbox_(outbox);
  });
}

function drainOutbox_(outbox) {
  let accepted = 0;
  let optedOut = 0;
  const remaining = [];
  outbox.forEach(function(item) {
    if (item.status === "accepted" || item.status === "skipped") return;
    const subscriber = loadSubscribers_().find(function(s) { return s.phone === item.phone; });
    if (!subscriber || subscriber.status !== "active") { item.status = "skipped"; return; }
    if (item.attempts >= 5) { remaining.push(item); return; }
    try {
      sendSms_(item.phone, item.body);
      accepted++;
      item.status = "accepted";
      writeLargeProperty_(OUTBOX_PROPERTY, JSON.stringify(outbox));
    } catch (error) {
      if (error.twilioCode === 21610) {
        const subscribers = loadSubscribers_();
        subscribers.forEach(function(s) { if (s.phone === item.phone) s.status = "opted_out"; });
        saveSubscribers_(subscribers);
        optedOut++;
      } else {
        item.attempts = (item.attempts || 0) + 1;
        item.lastError = error.message;
        remaining.push(item);
      }
    }
  });
  writeLargeProperty_(OUTBOX_PROPERTY, JSON.stringify(remaining));
  const result = { status: remaining.length ? "retry_pending" : "processed", accepted: accepted, optedOut: optedOut, pending: remaining.length };
  console.log(JSON.stringify(result));
  return result;
}

// Owner-only editor functions: never exposed by doPost.
// Set WEATHER_ALERT_TEXT in Script Properties, preview, then approve its exact
// text in WEATHER_ALERT_APPROVED_TEXT. Sending clears approval to avoid repeats.
function previewWeatherAlert() {
  const text = String(PropertiesService.getScriptProperties().getProperty("WEATHER_ALERT_TEXT") || "").trim();
  if (!text || text.length > 1000) throw new Error("Set WEATHER_ALERT_TEXT (1-1000 characters).");
  const result = { message: "SPA soccer weather alert: " + text + " Reply STOP to unsubscribe.", recipients: loadSubscribers_().filter(function(s) { return s.status === "active"; }).length };
  console.log(JSON.stringify(result));
  return result;
}

function sendApprovedWeatherAlert() {
  return withServiceLock_(function() {
    if (!isSmsConfigured_()) throw new Error("Twilio is not configured.");
    const props = PropertiesService.getScriptProperties();
    const preview = previewWeatherAlert();
    const text = String(props.getProperty("WEATHER_ALERT_TEXT") || "").trim();
    if (props.getProperty("WEATHER_ALERT_APPROVED_TEXT") !== text) throw new Error("Review preview, then set WEATHER_ALERT_APPROVED_TEXT to the exact approved text.");
    const outbox = JSON.parse(readLargeProperty_(OUTBOX_PROPERTY) || "[]");
    const batch = Utilities.getUuid();
    loadSubscribers_().filter(function(s) { return s.status === "active"; }).forEach(function(s) {
      outbox.push({ id: batch + ":" + s.phone, phone: s.phone, body: preview.message, attempts: 0 });
    });
    writeLargeProperty_(OUTBOX_PROPERTY, JSON.stringify(outbox));
    props.deleteProperty("WEATHER_ALERT_APPROVED_TEXT");
    return drainOutbox_(outbox);
  });
}

function sendOwnerTest() {
  const number = normalizePhone_(PropertiesService.getScriptProperties().getProperty("OWNER_TEST_NUMBER"));
  if (!number) throw new Error("Set OWNER_TEST_NUMBER to the owner-approved test recipient.");
  const result = sendSms_(number, "SPA BVS test only: weather and schedule text service connectivity check. No team alert was sent. Reply STOP to unsubscribe.");
  console.log(JSON.stringify(result));
  return result;
}

function subscriberMatchesChange_(subscriber, change) {
  const category = (change.after || change.before).category;
  if (subscriber.alertType === "games") {
    return category === "Game";
  }
  if (subscriber.alertType === "practices") {
    return category === "Practice";
  }
  return category === "Game" || category === "Practice";
}

function buildChangeMessage_(changes) {
  const lines = ["SPA soccer schedule update:"];
  changes.slice(0, 3).forEach(function(change) {
    lines.push("- " + describeChange_(change));
  });
  if (changes.length > 3) {
    lines.push("- " + (changes.length - 3) + " more update(s) in the live calendar");
  }
  lines.push("Schedule: " + SITE_URL);
  lines.push("Reply STOP to unsubscribe.");
  return lines.join(" ");
}

function describeChange_(change) {
  const event = change.after || change.before;
  const dateLabel = Utilities.formatDate(new Date(event.date + "T12:00:00Z"), DISPLAY_TIME_ZONE, "EEE MMM d");

  if (change.type === "added") {
    return event.title + " added on " + dateLabel + " at " + event.startTime + ".";
  }
  if (change.type === "removed") {
    return event.title + " removed from " + dateLabel + ".";
  }

  const fields = [];
  change.fields.forEach(function(field) {
    if (field === "startTime" || field === "endTime") {
      fields.push("time updated");
    } else if (field === "location") {
      fields.push("location changed");
    } else if (field === "notes") {
      fields.push("notes updated");
    } else if (field === "date") {
      fields.push("date changed");
    }
  });
  if (!fields.length) {
    fields.push("details updated");
  }

  return event.title + " on " + dateLabel + ": " + fields.join(", ") + ".";
}

function diffEvents_(previousEvents, latestEvents) {
  const previousMap = toEventMap_(previousEvents);
  const latestMap = toEventMap_(latestEvents);
  const keys = {};
  const changes = [];

  Object.keys(previousMap).forEach(function(key) { keys[key] = true; });
  Object.keys(latestMap).forEach(function(key) { keys[key] = true; });

  Object.keys(keys).forEach(function(key) {
    const before = previousMap[key];
    const after = latestMap[key];

    if (!before && after) {
      changes.push({ type: "added", after: after });
      return;
    }
    if (before && !after) {
      changes.push({ type: "removed", before: before });
      return;
    }

    const fields = changedFields_(before, after);
    if (fields.length) {
      changes.push({ type: "changed", before: before, after: after, fields: fields });
    }
  });

  return changes;
}

function toEventMap_(events) {
  const map = {};
  events.forEach(function(event) {
    map[event.key] = event;
  });
  return map;
}

function changedFields_(before, after) {
  const fields = ["date", "startTime", "endTime", "arrivalTime", "location", "notes", "title"];
  return fields.filter(function(field) {
    return String(before[field] || "") !== String(after[field] || "");
  });
}

function loadSnapshot_() {
  const raw = readLargeProperty_(SNAPSHOT_PROPERTY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveSnapshot_(events) {
  writeLargeProperty_(
    SNAPSHOT_PROPERTY,
    JSON.stringify(events)
  );
}

function installChangeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "checkForScheduleChanges") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("checkForScheduleChanges")
    .timeBased()
    .everyMinutes(5)
    .create();

  return {
    status: "installed"
  };
}
