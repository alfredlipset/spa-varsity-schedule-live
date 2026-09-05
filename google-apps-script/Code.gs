const SERVICE_SOURCE = "spa-schedule-service";
const DISPLAY_TIME_ZONE = "America/Chicago";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1T5_MEg9U-CFIYcJ9FBcoAd2K-xq14MCNQC2OTPx_kKc/edit?usp=drivesdk";
const CSV_URL = "https://docs.google.com/spreadsheets/d/1T5_MEg9U-CFIYcJ9FBcoAd2K-xq14MCNQC2OTPx_kKc/export?format=csv";
const SUBSCRIBERS_PROPERTY = "spa_schedule_subscribers_v1";
const SNAPSHOT_PROPERTY = "spa_schedule_snapshot_v1";
const LAST_CHANGE_PROPERTY = "spa_schedule_last_change_v1";
const MAX_SUBSCRIBERS = 250;

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

    const result = subscribe_(params);
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

  saveSubscribers_(subscribers);

  if (isSmsConfigured_()) {
    sendSms_(
      phone,
      "SPA soccer texts are on. You will get schedule change alerts for " +
        describeAlertType_(alertType) +
        ". Calendar feed: " +
        safeServiceUrl_() +
        "?format=ics"
    );
  }

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
  const raw = PropertiesService.getScriptProperties().getProperty(SUBSCRIBERS_PROPERTY);
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
  PropertiesService.getScriptProperties().setProperty(
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
    throw new Error("Twilio send failed with status " + statusCode + ".");
  }
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
  const latestEvents = loadScheduleEvents_();
  const previousEvents = loadSnapshot_();
  saveSnapshot_(latestEvents);

  if (!previousEvents.length) {
    return {
      status: "seeded",
      events: latestEvents.length
    };
  }

  const changes = diffEvents_(previousEvents, latestEvents).filter(function(change) {
    const category = (change.after || change.before).category;
    return category === "Practice" || category === "Game";
  });

  if (!changes.length) {
    return {
      status: "no_change",
      events: latestEvents.length
    };
  }

  const subscribers = loadSubscribers_().filter(function(subscriber) {
    return subscriber.status === "active";
  });
  let sentCount = 0;

  subscribers.forEach(function(subscriber) {
    const relevant = changes.filter(function(change) {
      return subscriberMatchesChange_(subscriber, change);
    });

    if (!relevant.length) {
      return;
    }

    if (isSmsConfigured_()) {
      try {
        sendSms_(subscriber.phone, buildChangeMessage_(relevant));
        sentCount += 1;
      } catch (error) {
        // Keep sending to the rest of the list even if one number fails.
      }
    }
  });

  PropertiesService.getScriptProperties().setProperty(
    LAST_CHANGE_PROPERTY,
    new Date().toISOString()
  );

  return {
    status: "notified",
    changes: changes.length,
    subscribers: sentCount
  };
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
  const feedUrl = safeServiceUrl_();
  if (feedUrl) {
    lines.push("Calendar: " + feedUrl + "?format=ics");
  }
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
  const raw = PropertiesService.getScriptProperties().getProperty(SNAPSHOT_PROPERTY);
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
  PropertiesService.getScriptProperties().setProperty(
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
    .everyMinutes(15)
    .create();

  return {
    status: "installed"
  };
}
