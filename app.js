const SHEET_URL = "https://docs.google.com/spreadsheets/d/1T5_MEg9U-CFIYcJ9FBcoAd2K-xq14MCNQC2OTPx_kKc/edit?usp=drivesdk";
const CSV_URL = "https://docs.google.com/spreadsheets/d/1T5_MEg9U-CFIYcJ9FBcoAd2K-xq14MCNQC2OTPx_kKc/export?format=csv";
const DISPLAY_TIME_ZONE = "America/Chicago";
const SCHEDULE_CONFIG = window.SPA_SCHEDULE_CONFIG || {};
const SERVICE_URL = typeof SCHEDULE_CONFIG.serviceUrl === "string" ? SCHEDULE_CONFIG.serviceUrl.trim() : "";
const PLAYER_SURVEY = SCHEDULE_CONFIG.playerSurvey && typeof SCHEDULE_CONFIG.playerSurvey === "object"
  ? SCHEDULE_CONFIG.playerSurvey
  : {};
const INSTAGRAM_PROFILE_URL = typeof SCHEDULE_CONFIG.instagramProfileUrl === "string" ? SCHEDULE_CONFIG.instagramProfileUrl.trim() : "";
const INSTAGRAM_EMBED_URL = typeof SCHEDULE_CONFIG.instagramEmbedUrl === "string" ? SCHEDULE_CONFIG.instagramEmbedUrl.trim() : "";
const GAME_VIDEOS = Array.isArray(SCHEDULE_CONFIG.gameVideos) ? SCHEDULE_CONFIG.gameVideos : [];
const TEAM_STATS = SCHEDULE_CONFIG.stats && typeof SCHEDULE_CONFIG.stats === "object" ? SCHEDULE_CONFIG.stats : {};
const GAME_PLANS = Array.isArray(SCHEDULE_CONFIG.gamePlans) ? SCHEDULE_CONFIG.gamePlans : [];
let parsedServiceUrl = null;
try {
  parsedServiceUrl = SERVICE_URL ? new URL(SERVICE_URL) : null;
} catch (error) {
  parsedServiceUrl = null;
}
const SERVICE_ORIGIN = parsedServiceUrl ? parsedServiceUrl.origin : "";
const SERVICE_SOURCE = "spa-schedule-service";
const FALLBACK_CSV = `Date,Day,Category,Home/Away,Opponent,Arrival Time,Start Time,End Time,Location,Notes
2026-08-17,Monday,Tryout,,,8:00 AM,8:30 AM,10:30 AM,,Morning tryout session
2026-08-17,Monday,Tryout,,,2:30 PM,3:00 PM,5:00 PM,,Afternoon tryout session
2026-08-17,Monday,Meeting,,,6:55 PM,7:00 PM,8:00 PM,Virtual - Zoom or Google Meet,Parent virtual meeting
2026-08-18,Tuesday,Tryout,,,8:00 AM,8:30 AM,10:30 AM,,Morning tryout session
2026-08-18,Tuesday,Tryout,,,2:30 PM,3:00 PM,5:00 PM,,Afternoon tryout session
2026-08-19,Wednesday,Tryout,,,8:00 AM,8:30 AM,10:30 AM,,Morning tryout session
2026-08-19,Wednesday,Tryout,,,2:30 PM,3:00 PM,5:00 PM,,Afternoon tryout session; Team formation at end of practice
2026-08-20,Thursday,Practice,,Varsity,2:30 PM,3:00 PM,5:00 PM,St. Paul Academy and Summit School,Varsity practice
2026-08-20,Thursday,Practice,,JV & C Teams,4:00 PM,4:30 PM,6:30 PM,St. Paul Academy and Summit School,JV and C Teams practice
2026-08-21,Friday,Practice,,Varsity,10:00 AM,10:30 AM,12:30 PM,St. Paul Academy and Summit School,Varsity practice
2026-08-21,Friday,Practice,,JV & C Teams,4:00 PM,4:30 PM,6:30 PM,St. Paul Academy and Summit School,JV and C Teams practice; Goalkeepers have additional sessions 2-3x per week in addition to team training
2026-08-22,Saturday,Game,vs,Saint Thomas Academy,3:00 PM,3:30 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Scrimmage; Two 40 minute halves
2026-08-22,Saturday,Varsity team dinner player/parent(s) 1672 Grand Ave. Post scrimmage ,,,5:30/6 PM,7:00/7:30 PM,,1672 Grand Ave. ,
2026-08-24,Monday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; 72+ hours before next game
2026-08-24,Monday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-08-25,Tuesday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; placed inside 72-hour window because of schedule compression
2026-08-25,Tuesday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-08-26,Wednesday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-08-27,Thursday,Game,@,Providence Academy,6:30 PM,7:00 PM,,Providence Academy,
2026-08-28,Friday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-08-29,Saturday,Game,vs,St. Croix Lutheran Academy,11:30 AM,12:00 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,
2026-08-31,Monday,Strength & Conditioning,,Team,n/a,3:15 PM,4:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-08-31,Monday,Practice,,Team,n/a,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-01,Tuesday,Game,vs,Mounds Park Academy,4:00 PM,4:30 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,
2026-09-02,Wednesday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-03,Thursday,Game,@,Breck School,7:00 PM,7:30 PM,,Breck School McKnight Stadium,
2026-09-04,Friday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before next game
2026-09-04,Friday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-05,Saturday,Strength & Conditioning,,Team,8:30 AM,8:45 AM,9:30 AM,St. Paul Academy and Summit School,Strength & conditioning before Saturday training
2026-09-05,Saturday,Practice,,Team,9:30 AM,10:00 AM,11:30 AM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Saturday training
2026-09-07,Monday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-08,Tuesday,Game,vs,Minnehaha Academy,4:00 PM,4:30 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,
2026-09-09,Wednesday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-10,Thursday,Game,@,Blake School,6:30 PM,7:00 PM,,Blake School - Hopkins Campus Gordy Aamoth Stadium,
2026-09-11,Friday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before next game
2026-09-11,Friday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-12,Saturday,Strength & Conditioning,,Team,8:30 AM,8:45 AM,9:30 AM,St. Paul Academy and Summit School,Strength & conditioning before Saturday training
2026-09-12,Saturday,Practice,,Team,9:00 AM,9:30 AM,11:30 AM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Saturday training
2026-09-14,Monday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; placed inside 72-hour window because of schedule compression
2026-09-14,Monday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-15,Tuesday,Game,vs,Providence Academy,4:00 PM,4:30 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,
2026-09-16,Wednesday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; placed inside 72-hour window because of schedule compression
2026-09-16,Wednesday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-17,Thursday,Game,@,Mounds Park Academy,4:00 PM,4:30 PM,,Mounds Park Academy MPA Varsity Soccer Field,
2026-09-18,Friday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-19,Saturday,Game,@,Rochester Lourdes,6:30 PM,7:00 PM,,RCTC Stadium,
2026-09-21,Monday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; placed inside 72-hour window because of schedule compression
2026-09-21,Monday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-22,Tuesday,Game,vs,Breck School,4:00 PM,4:30 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,
2026-09-23,Wednesday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; placed inside 72-hour window because of schedule compression
2026-09-23,Wednesday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-24,Thursday,Game,@,Minnehaha Academy,6:30 PM,7:00 PM,,Minnehaha Academy - Upper School Athletic Spaces Guido Kauls Field,
2026-09-25,Friday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-26,Saturday,Game,vs,Cristo Rey Jesuit,11:30 AM,12:00 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,
2026-09-28,Monday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-09-29,Tuesday,Game,vs,Blake School,4:00 PM,4:30 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,
2026-09-30,Wednesday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; placed inside 72-hour window because of schedule compression
2026-09-30,Wednesday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-10-01,Thursday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-10-02,Friday,Game,vs,Saint Agnes,4:00 PM,4:30 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Homecoming
2026-10-03,Saturday,Strength & Conditioning,,Team,8:30 AM,8:45 AM,9:30 AM,St. Paul Academy and Summit School,Strength & conditioning before Saturday training
2026-10-03,Saturday,Practice,,Team,9:00 AM,9:30 AM,11:30 AM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Saturday training
2026-10-05,Monday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; placed inside 72-hour window because of schedule compression
2026-10-05,Monday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-10-06,Tuesday,Game,@,St. Paul Humboldt/OWL,6:00 PM,6:30 PM,,St. Paul Humboldt High School Bob Ryan Athletic Complex,
2026-10-07,Wednesday,Strength & Conditioning,,Team,3:00 PM,3:15 PM,4:00 PM,St. Paul Academy and Summit School,Strength & conditioning before practice; placed inside 72-hour window because of schedule compression
2026-10-07,Wednesday,Practice,,Team,3:30 PM,4:00 PM,6:00 PM,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,Team practice
2026-10-08,Thursday,Game,vs,St. Cloud Cathedral,4:00 PM,4:30 PM,,St. Paul Academy and Summit School - Randolph (Middle/Upper Campus) Lang Field,`;

const state = {
  events: [],
  filteredEvents: [],
  sourceLabel: "Snapshot",
  syncedAt: "",
  lastError: "",
  pendingSmsRequestId: "",
  filters: {
    search: "",
    category: "all",
    group: "all",
    month: "all"
  }
};

const sheetLinkEl = document.getElementById("sheetLink");
const csvLinkEl = document.getElementById("csvLink");
const dataStatusEl = document.getElementById("dataStatus");
const instagramLinksEl = document.getElementById("instagramLinks");
const instagramStatusEl = document.getElementById("instagramStatus");
const instagramEmbedEl = document.getElementById("instagramEmbed");
const teamStatsUpdatedEl = document.getElementById("teamStatsUpdated");
const teamStatsGridEl = document.getElementById("teamStatsGrid");
const playerStatsListEl = document.getElementById("playerStatsList");
const downloadCalendarButtonEl = document.getElementById("downloadCalendarButton");
const downloadGamesCalendarButtonEl = document.getElementById("downloadGamesCalendarButton");
const appleCalendarLinkEl = document.getElementById("appleCalendarLink");
const googleCalendarButtonEl = document.getElementById("googleCalendarButton");
const copyFeedButtonEl = document.getElementById("copyFeedButton");
const feedUrlInputEl = document.getElementById("feedUrlInput");
const calendarStatusEl = document.getElementById("calendarStatus");
const playerSurveyStatusEl = document.getElementById("playerSurveyStatus");
const playerSurveyListEl = document.getElementById("playerSurveyList");
const nextHeadingEl = document.getElementById("nextHeading");
const nextCardEl = document.getElementById("nextCard");
const weekStackEl = document.getElementById("weekStack");
const statsGridEl = document.getElementById("statsGrid");
const smsFormEl = document.getElementById("smsForm");
const requestIdInputEl = document.getElementById("requestIdInput");
const originInputEl = document.getElementById("originInput");
const subscriberPhoneEl = document.getElementById("subscriberPhone");
const smsConsentEl = document.getElementById("smsConsent");
const smsSubscribeButtonEl = document.getElementById("smsSubscribeButton");
const smsStatusEl = document.getElementById("smsStatus");
const searchInputEl = document.getElementById("searchInput");
const categoryFilterEl = document.getElementById("categoryFilter");
const teamFilterEl = document.getElementById("teamFilter");
const monthFilterEl = document.getElementById("monthFilter");
const gameVideosCountEl = document.getElementById("gameVideosCount");
const gameVideosListEl = document.getElementById("gameVideosList");
const gamePlansCountEl = document.getElementById("gamePlansCount");
const gamePlansListEl = document.getElementById("gamePlansList");
const refreshButtonEl = document.getElementById("refreshButton");
const resetButtonEl = document.getElementById("resetButton");
const scheduleMetaEl = document.getElementById("scheduleMeta");
const resultsHeadingEl = document.getElementById("resultsHeading");
const resultsSubheadEl = document.getElementById("resultsSubhead");
const scheduleDaysEl = document.getElementById("scheduleDays");

if (sheetLinkEl) sheetLinkEl.href = SHEET_URL;
if (csvLinkEl) csvLinkEl.href = CSV_URL;
originInputEl.value = window.location.origin && window.location.origin.startsWith("http") ? window.location.origin : "*";
originInputEl.defaultValue = originInputEl.value;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
  return rows
    .slice(1)
    .filter((cells) => cells.some((cell) => String(cell || "").trim()))
    .map((cells) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = String(cells[index] || "").trim();
      });
      return record;
    });
}

function parseTimeToMinutes(value) {
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

function minutesToClock(minutes) {
  if (minutes == null) {
    return "";
  }
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function displayRange(startValue, endValue) {
  const startMinutes = parseTimeToMinutes(startValue);
  const endMinutes = parseTimeToMinutes(endValue);
  if (startMinutes == null && endMinutes == null) {
    return "Time not listed";
  }
  if (startMinutes != null && endMinutes != null) {
    return `${minutesToClock(startMinutes)} - ${minutesToClock(endMinutes)}`;
  }
  if (startMinutes != null) {
    return minutesToClock(startMinutes);
  }
  return endValue;
}

function asIcsLocal(date, minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${date.replaceAll("-", "")}T${pad(hours)}${pad(mins)}00`;
}

function escapeIcsText(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n");
}

function foldIcsLine(line) {
  const limit = 72;
  if (line.length <= limit) {
    return line;
  }

  let output = "";
  for (let index = 0; index < line.length; index += limit) {
    const chunk = line.slice(index, index + limit);
    output += index === 0 ? chunk : `\r\n ${chunk}`;
  }
  return output;
}

function icsLine(key, value) {
  return foldIcsLine(`${key}:${value}`);
}

function buildServiceUrl(params = {}) {
  if (!parsedServiceUrl) {
    return "";
  }

  const url = new URL(parsedServiceUrl.toString());
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function liveFeedUrl() {
  return buildServiceUrl({ format: "ics" });
}

function webcalFeedUrl() {
  const feedUrl = liveFeedUrl();
  if (!feedUrl) {
    return "";
  }
  return feedUrl.replace(/^https:/i, "webcal:");
}

function eventDescription(event) {
  const lines = [];
  if (event.notes) {
    lines.push(event.notes);
  }
  if (event.arrivalTime) {
    lines.push(`Arrival: ${event.arrivalTime}`);
  }
  if (event.location) {
    lines.push(`Location: ${event.location}`);
  }
  lines.push(`Source: ${SHEET_URL}`);
  return lines.join("\n");
}

function buildIcs(events) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SPA Boys Varsity Soccer//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    icsLine("X-WR-CALNAME", "SPA Boys Varsity Soccer 2026"),
    icsLine("X-WR-TIMEZONE", DISPLAY_TIME_ZONE)
  ];

  events.forEach((event) => {
    if (event.startMinutes == null) {
      return;
    }
    const endMinutes = event.endMinutes != null ? event.endMinutes : event.startMinutes + 90;
    lines.push("BEGIN:VEVENT");
    lines.push(icsLine("UID", `${event.id}@spa-bvs-schedule`));
    lines.push(icsLine("DTSTAMP", stamp));
    lines.push(icsLine(`DTSTART;TZID=${DISPLAY_TIME_ZONE}`, asIcsLocal(event.date, event.startMinutes)));
    lines.push(icsLine(`DTEND;TZID=${DISPLAY_TIME_ZONE}`, asIcsLocal(event.date, endMinutes)));
    lines.push(icsLine("SUMMARY", escapeIcsText(event.title)));
    lines.push(icsLine("DESCRIPTION", escapeIcsText(eventDescription(event))));
    if (event.location) {
      lines.push(icsLine("LOCATION", escapeIcsText(event.location)));
    }
    lines.push(icsLine("URL", SHEET_URL));
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function downloadIcsEvents(events, filename, statusMessage) {
  const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  calendarStatusEl.textContent = statusMessage;
}

function downloadIcsFile() {
  downloadIcsEvents(
    state.events,
    "spa-boys-varsity-soccer-2026.ics",
    "Downloaded the current season calendar as an .ics file for Outlook or iCal."
  );
}

function downloadGamesIcsFile() {
  const games = state.events.filter((event) => event.category === "Game");
  if (!games.length) {
    setCalendarStatus("No game dates are available to download yet.", true);
    return;
  }
  downloadIcsEvents(
    games,
    "spa-boys-varsity-soccer-2026-games-only.ics",
    `Downloaded ${games.length} game dates as an .ics file for Outlook or iCal.`
  );
}

async function copyTextToClipboard(value) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard access is unavailable in this browser.");
  }
  await navigator.clipboard.writeText(value);
}

function setCalendarStatus(message, isError = false) {
  calendarStatusEl.textContent = message;
  calendarStatusEl.classList.toggle("error", Boolean(isError));
}

function renderCalendarControls() {
  const feedUrl = liveFeedUrl();
  const hasService = Boolean(feedUrl);
  feedUrlInputEl.value = feedUrl || "Deploy the schedule service and paste its URL into schedule-config.js to enable live subscriptions.";

  if (hasService) {
    appleCalendarLinkEl.href = webcalFeedUrl();
    appleCalendarLinkEl.classList.remove("disabled");
    googleCalendarButtonEl.disabled = false;
    copyFeedButtonEl.disabled = false;
    setCalendarStatus("Live feed ready. Apple Calendar can subscribe directly, and Google Calendar can add the copied feed URL.");
  } else {
    appleCalendarLinkEl.href = "#";
    appleCalendarLinkEl.classList.add("disabled");
    googleCalendarButtonEl.disabled = true;
    copyFeedButtonEl.disabled = true;
    setCalendarStatus("Direct download works now. Live Apple/Google subscriptions turn on after the Apps Script service URL is added.");
  }
}

function normalizePhone(value) {
  const trimmed = String(value || "").trim();
  const digits = trimmed.replace(/\D+/g, "");

  if (trimmed.startsWith("+") && digits.length >= 11) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return "";
}

function buildRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function setSmsStatus(message, isError = false) {
  smsStatusEl.textContent = message;
  smsStatusEl.classList.toggle("error", Boolean(isError));
}

function handleServiceMessage(event) {
  if (!SERVICE_ORIGIN) {
    return;
  }

  if (event.origin !== SERVICE_ORIGIN) {
    return;
  }

  const payload = event.data;
  if (!payload || payload.source !== SERVICE_SOURCE || payload.requestId !== state.pendingSmsRequestId) {
    return;
  }

  state.pendingSmsRequestId = "";
  smsSubscribeButtonEl.disabled = false;
  smsSubscribeButtonEl.textContent = "Turn On Text Alerts";

  if (payload.status === "ok") {
    smsFormEl.reset();
    originInputEl.value = originInputEl.defaultValue;
    setSmsStatus(payload.message || "Text alerts are on.");
    return;
  }

  setSmsStatus(payload.message || "Could not enable text alerts. Try again.", true);
}

function dateKeyInZone(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function currentMinutesInZone(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return (hour * 60) + minute;
}

function formatDateLabel(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    month: "long",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));
}

function deriveGroup(record) {
  if (record["Opponent"]) {
    return record["Opponent"];
  }
  return "General";
}

function normalizeCategory(value) {
  const category = String(value || "").trim();
  const knownCategories = new Set([
    "Tryout",
    "Meeting",
    "Practice",
    "Game",
    "Strength & Conditioning"
  ]);
  if (knownCategories.has(category)) {
    return category;
  }
  return "Team Event";
}

function eventTitle(record) {
  const category = record["Category"] || "Event";
  const homeAway = record["Home/Away"] || "";
  const opponent = record["Opponent"] || "";

  if (category === "Game" && opponent) {
    return `${homeAway || "vs"} ${opponent}`;
  }
  if (category === "Practice" && opponent) {
    return `${opponent} Practice`;
  }
  if (category === "Strength & Conditioning" && opponent) {
    return `${opponent} Strength and Conditioning`;
  }
  return category;
}

function normalizeEvents(records) {
  return records
    .map((record, index) => {
      const startMinutes = parseTimeToMinutes(record["Start Time"]);
      const endMinutes = parseTimeToMinutes(record["End Time"]);
      const arrivalMinutes = parseTimeToMinutes(record["Arrival Time"]);
      const date = record["Date"];
      if (!date) {
        return null;
      }

      const category = record["Category"] || "Event";
      const categoryLabel = normalizeCategory(category);
      const endMinutesResolved = endMinutes ?? (startMinutes != null ? startMinutes + 90 : null);
      const monthKey = date.slice(0, 7);

      return {
        id: `${date}-${index}`,
        date,
        monthKey,
        day: record["Day"] || "",
        category,
        categoryLabel,
        homeAway: record["Home/Away"] || "",
        opponent: record["Opponent"] || "",
        group: deriveGroup(record),
        arrivalTime: record["Arrival Time"] || "",
        startTime: record["Start Time"] || "",
        endTime: record["End Time"] || "",
        startMinutes,
        endMinutes: endMinutesResolved,
        arrivalMinutes,
        location: record["Location"] || "",
        notes: record["Notes"] || "",
        title: eventTitle(record),
        summary: displayRange(record["Start Time"], record["End Time"]),
        sortKey: `${date}-${String(startMinutes ?? 9999).padStart(4, "0")}`,
        raw: record
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeExternalUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:") {
      return "";
    }
    return url.toString();
  } catch (error) {
    return "";
  }
}

function canInlineInstagramEmbed(value) {
  const normalized = normalizeExternalUrl(value);
  if (!normalized) {
    return "";
  }

  const url = new URL(normalized);
  const host = url.hostname.replace(/^www\./i, "");
  if (host.endsWith("instagram.com")) {
    const trimmedPath = url.pathname.replace(/\/+$/, "");
    if (trimmedPath.includes("/embed")) {
      return `${url.origin}${trimmedPath}${url.search}`;
    }
    if (/^\/(p|reel|tv)\/[^/]+$/i.test(trimmedPath)) {
      return `${url.origin}${trimmedPath}/embed/captioned`;
    }
    return "";
  }
  return normalized;
}

function instagramLinkMeta(value) {
  const normalized = normalizeExternalUrl(value);
  if (!normalized) {
    return {
      url: "",
      label: "Follow the Team",
      status: "Add the team Instagram link to turn this section on."
    };
  }

  const url = new URL(normalized);
  const trimmedPath = url.pathname.replace(/\/+$/, "");
  if (/^\/(p|reel|tv)\/[^/]+$/i.test(trimmedPath)) {
    return {
      url: `${url.origin}${trimmedPath}/`,
      label: "Follow the Team",
      status: "Latest Instagram post is linked below."
    };
  }

  return {
    url: normalized,
    label: "Follow the Team",
    status: "Team Instagram link is live."
  };
}

function normalizeGameVideos(records) {
  return records
    .map((record) => ({
      title: String(record?.title || "").trim(),
      url: String(record?.url || "").trim(),
      notes: String(record?.notes || "").trim()
    }))
    .filter((record) => record.title && record.url);
}

function normalizePlayerSurvey(record) {
  return {
    title: String(record?.title || "").trim(),
    url: String(record?.url || "").trim(),
    notes: String(record?.notes || "").trim()
  };
}

function renderInstagram() {
  const linkMeta = instagramLinkMeta(INSTAGRAM_PROFILE_URL);
  const embedUrl = canInlineInstagramEmbed(INSTAGRAM_EMBED_URL);

  instagramLinksEl.innerHTML = linkMeta.url
    ? `<a class="button-link" href="${escapeHtml(linkMeta.url)}" target="_blank" rel="noreferrer">${escapeHtml(linkMeta.label)}</a>`
    : "";

  if (embedUrl) {
    instagramEmbedEl.innerHTML = `
      <iframe
        class="instagram-embed"
        src="${escapeHtml(embedUrl)}"
        title="SPA boys varsity soccer Instagram"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    `;
    instagramStatusEl.textContent = "Latest Instagram post is featured below.";
    return;
  }

  if (linkMeta.url) {
    instagramEmbedEl.innerHTML = `
      <div class="instagram-placeholder">
        <strong>Latest team updates</strong>
        <p>
          Tap <strong>Follow the Team</strong> to open the live @spa_boyssoccer feed with the newest game-day posts, highlights, and program updates.
        </p>
      </div>
    `;
    instagramStatusEl.textContent = linkMeta.status;
    return;
  }

  instagramEmbedEl.innerHTML = `
    <div class="instagram-placeholder">
      <strong>Add the team Instagram page here</strong>
      <p>
        Set <code>instagramProfileUrl</code> in <code>schedule-config.js</code> to show the team page here. If you later have a supported embed URL, add <code>instagramEmbedUrl</code> too.
      </p>
    </div>
  `;
  instagramStatusEl.textContent = "Instagram section added and ready for a profile link or embed URL.";
}

function mapLink(location) {
  if (!location) {
    return "";
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function categoryTagClass(category) {
  const normalized = category.toLowerCase();
  if (normalized.includes("game")) return "game";
  if (normalized.includes("practice")) return "practice";
  if (normalized.includes("meeting")) return "meeting";
  if (normalized.includes("tryout")) return "tryout";
  return "";
}

function applyFilters() {
  const search = state.filters.search.trim().toLowerCase();
  state.filteredEvents = state.events.filter((event) => {
    if (state.filters.category !== "all" && event.categoryLabel !== state.filters.category) {
      return false;
    }
    if (state.filters.group !== "all" && event.group !== state.filters.group) {
      return false;
    }
    if (state.filters.month !== "all" && event.monthKey !== state.filters.month) {
      return false;
    }
    if (!search) {
      return true;
    }
    const haystack = [
      event.title,
      event.category,
      event.categoryLabel,
      event.group,
      event.opponent,
      event.location,
      event.notes,
      event.day
    ].join(" ").toLowerCase();
    return haystack.includes(search);
  });
}

function currentStatusForEvent(event) {
  const todayKey = dateKeyInZone();
  const nowMinutes = currentMinutesInZone();

  if (event.date < todayKey) {
    return "Completed";
  }
  if (event.date > todayKey) {
    return "Upcoming";
  }
  if (event.startMinutes != null && event.endMinutes != null && nowMinutes >= event.startMinutes && nowMinutes <= event.endMinutes) {
    return "Live now";
  }
  if (event.startMinutes != null && nowMinutes < event.startMinutes) {
    return "Today";
  }
  return "Past today";
}

function upcomingEvents() {
  const todayKey = dateKeyInZone();
  const nowMinutes = currentMinutesInZone();

  return state.events.filter((event) => {
    if (event.date > todayKey) {
      return true;
    }
    if (event.date < todayKey) {
      return false;
    }
    if (event.endMinutes != null) {
      return event.endMinutes >= nowMinutes;
    }
    if (event.startMinutes != null) {
      return event.startMinutes >= nowMinutes;
    }
    return true;
  });
}

function renderNextCard() {
  const upcoming = upcomingEvents();
  const nextEvent = upcoming[0];

  if (!nextEvent) {
    nextHeadingEl.textContent = "Season schedule complete";
    nextCardEl.innerHTML = `
      <div class="next-status">Season complete</div>
      <h3 class="next-title">No upcoming events listed.</h3>
      <p class="next-subtitle">Check the Google Sheet if more dates are added later.</p>
    `;
    return;
  }

  nextHeadingEl.textContent = nextEvent.date === dateKeyInZone() ? "Today on deck" : "Next scheduled event";
  nextCardEl.innerHTML = `
    <div class="next-status">${escapeHtml(currentStatusForEvent(nextEvent))}</div>
    <h3 class="next-title">${escapeHtml(nextEvent.title)}</h3>
    <p class="next-subtitle">${escapeHtml(formatDateLabel(nextEvent.date))}</p>
    <div class="next-meta">
      <div class="meta-block">
        <span class="meta-label">Time</span>
        <div class="meta-value">${escapeHtml(nextEvent.summary)}</div>
      </div>
      <div class="meta-block">
        <span class="meta-label">Arrival</span>
        <div class="meta-value">${escapeHtml(nextEvent.arrivalTime || "Not listed")}</div>
      </div>
      <div class="meta-block">
        <span class="meta-label">Location</span>
        <div class="meta-value">${escapeHtml(nextEvent.location || "TBD")}</div>
      </div>
    </div>
    ${nextEvent.notes ? `<p class="next-subtitle">${escapeHtml(nextEvent.notes)}</p>` : ""}
    ${nextEvent.location ? `<div class="action-row"><a class="mini-link" href="${mapLink(nextEvent.location)}" target="_blank" rel="noreferrer">Open directions</a></div>` : ""}
  `;
}

function renderWeekStack() {
  const upcoming = upcomingEvents().slice(0, 5);
  if (!upcoming.length) {
    weekStackEl.innerHTML = `<div class="empty-state">No upcoming events to show.</div>`;
    return;
  }

  weekStackEl.innerHTML = upcoming.map((event) => `
    <div class="week-card">
      <strong>${escapeHtml(formatDateLabel(event.date))}</strong>
      <span>${escapeHtml(event.title)}</span>
      <span>${escapeHtml(event.summary)}${event.location ? ` · ${escapeHtml(event.location)}` : ""}</span>
    </div>
  `).join("");
}

function renderStats() {
  const totalGames = state.events.filter((event) => event.category === "Game").length;
  const totalPractices = state.events.filter((event) => event.category === "Practice").length;
  const totalStrength = state.events.filter((event) => event.category === "Strength & Conditioning").length;
  const dateRange = state.events.length ? `${formatDateLabel(state.events[0].date)} - ${formatDateLabel(state.events[state.events.length - 1].date)}` : "No dates loaded";

  statsGridEl.innerHTML = `
    <div class="stat-card">
      <div class="panel-kicker">Season Window</div>
      <span class="stat-number">${escapeHtml(state.events.length ? `${state.events[0].date.slice(5)} to ${state.events[state.events.length - 1].date.slice(5)}` : "--")}</span>
      <div class="status-line">${escapeHtml(dateRange)}</div>
    </div>
    <div class="stat-card">
      <div class="panel-kicker">Total Events</div>
      <span class="stat-number">${state.events.length}</span>
      <div class="status-line">Pulled from the shared schedule</div>
    </div>
    <div class="stat-card">
      <div class="panel-kicker">Games</div>
      <span class="stat-number">${totalGames}</span>
      <div class="status-line">Home and away match dates</div>
    </div>
    <div class="stat-card">
      <div class="panel-kicker">Training</div>
      <span class="stat-number">${totalPractices + totalStrength}</span>
      <div class="status-line">${totalPractices} practices and ${totalStrength} strength sessions</div>
    </div>
  `;
}

function normalizeTeamStatCards(records) {
  return (Array.isArray(records) ? records : [])
    .map((record) => ({
      label: String(record?.label || "").trim(),
      value: String(record?.value || "").trim(),
      detail: String(record?.detail || "").trim()
    }))
    .filter((record) => record.label && record.value);
}

function normalizePlayerStatCards(records) {
  return (Array.isArray(records) ? records : [])
    .map((record) => ({
      name: String(record?.name || "").trim(),
      role: String(record?.role || "").trim(),
      detail: String(record?.detail || "").trim(),
      stats: normalizeTeamStatCards(record?.stats)
    }))
    .filter((record) => record.name);
}

function normalizeGamePlans(records) {
  return (Array.isArray(records) ? records : [])
    .map((record) => ({
      title: String(record?.title || "").trim(),
      url: String(record?.url || "").trim(),
      notes: String(record?.notes || "").trim()
    }))
    .filter((record) => record.title && record.url);
}

function renderTeamAndPlayerStats() {
  if (!teamStatsUpdatedEl || !teamStatsGridEl || !playerStatsListEl) {
    return;
  }

  const teamCards = normalizeTeamStatCards(TEAM_STATS.team);
  const players = normalizePlayerStatCards(TEAM_STATS.players);
  const updated = String(TEAM_STATS.updated || "").trim();
  teamStatsUpdatedEl.textContent = updated ? `Updated ${updated}` : "Current stats";

  teamStatsGridEl.innerHTML = teamCards.length
    ? teamCards.map((stat) => `
        <div class="stat-card">
          <div class="panel-kicker">${escapeHtml(stat.label)}</div>
          <span class="stat-number">${escapeHtml(stat.value)}</span>
          <div class="status-line">${escapeHtml(stat.detail)}</div>
        </div>
      `).join("")
    : `<div class="empty-state">Team statistics will be posted here as they are updated.</div>`;

  playerStatsListEl.innerHTML = players.length
    ? players.map((player) => `
        <article class="resource-card">
          <div class="player-stat-head">
            <h3>${escapeHtml(player.name)}</h3>
            ${player.role ? `<span>${escapeHtml(player.role)}</span>` : ""}
          </div>
          <div class="mini-stats">
            ${player.stats.map((stat) => `
              <div class="mini-stat">
                <strong>${escapeHtml(stat.value)}</strong>
                <span>${escapeHtml(stat.label)}</span>
              </div>
            `).join("")}
          </div>
          ${player.detail ? `<p>${escapeHtml(player.detail)}</p>` : ""}
        </article>
      `).join("")
    : `<div class="empty-state">Player statistics will be posted here as they are updated.</div>`;
}

function renderGamePlans() {
  if (!gamePlansCountEl || !gamePlansListEl) {
    return;
  }

  const plans = normalizeGamePlans(GAME_PLANS);
  gamePlansCountEl.textContent = plans.length ? `${plans.length} plan${plans.length === 1 ? "" : "s"}` : "Coming soon";
  gamePlansListEl.innerHTML = plans.length
    ? plans.map((plan) => `
        <article class="resource-card">
          <h3>${escapeHtml(plan.title)}</h3>
          ${plan.notes ? `<p>${escapeHtml(plan.notes)}</p>` : ""}
          <a class="resource-link" href="${escapeHtml(plan.url)}" target="_blank" rel="noreferrer">Open game plan</a>
        </article>
      `).join("")
    : `<div class="empty-state">Game plans will be posted here when they are ready for players and families.</div>`;
}

function renderGameVideos() {
  if (!gameVideosCountEl || !gameVideosListEl) {
    return;
  }

  const videos = normalizeGameVideos(GAME_VIDEOS);
  gameVideosCountEl.textContent = videos.length ? `${videos.length} link${videos.length === 1 ? "" : "s"}` : "Ready for links";

  if (!videos.length) {
    gameVideosListEl.innerHTML = `
      <div class="empty-state">
        No game film links are posted yet. Add items to <code>gameVideos</code> in <code>schedule-config.js</code>.
      </div>
    `;
    return;
  }

  gameVideosListEl.innerHTML = videos.map((video) => `
    <article class="resource-card">
      <h3>${escapeHtml(video.title)}</h3>
      ${video.notes ? `<p>${escapeHtml(video.notes)}</p>` : ""}
      <a class="resource-link" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">Open video link</a>
    </article>
  `).join("");
}

function renderPlayerSurvey() {
  if (!playerSurveyStatusEl || !playerSurveyListEl) {
    return;
  }

  const survey = normalizePlayerSurvey(PLAYER_SURVEY);
  playerSurveyStatusEl.textContent = survey.url ? "Live link" : "Ready for link";

  if (!survey.url) {
    playerSurveyListEl.innerHTML = `
      <div class="empty-state">
        The daily wellness survey link will be posted here once it is ready.
      </div>
    `;
    return;
  }

  playerSurveyListEl.innerHTML = `
    <article class="resource-card">
      <h3>${escapeHtml(survey.title || "Daily Player Survey")}</h3>
      <p>${escapeHtml(survey.notes || "Quick daily check-in for players before training.")}</p>
      <a class="resource-link" href="${escapeHtml(survey.url)}" target="_blank" rel="noreferrer">Open survey</a>
    </article>
  `;
}

function fillSelect(selectEl, options, currentValue, allLabel) {
  selectEl.innerHTML = [
    `<option value="all">${escapeHtml(allLabel)}</option>`,
    ...options.map((option) => `<option value="${escapeHtml(option)}"${option === currentValue ? " selected" : ""}>${escapeHtml(option)}</option>`)
  ].join("");
}

function renderFilters() {
  const categories = [...new Set(state.events.map((event) => event.categoryLabel))];
  const groups = [...new Set(state.events.map((event) => event.group))];
  const months = [...new Set(state.events.map((event) => event.monthKey))];

  fillSelect(categoryFilterEl, categories, state.filters.category, "All categories");
  fillSelect(teamFilterEl, groups, state.filters.group, "All groups");
  monthFilterEl.innerHTML = [
    `<option value="all">All months</option>`,
    ...months.map((month) => `<option value="${escapeHtml(month)}"${month === state.filters.month ? " selected" : ""}>${escapeHtml(formatMonthLabel(month))}</option>`)
  ].join("");
}

function renderSchedule() {
  const total = state.filteredEvents.length;
  resultsHeadingEl.textContent = total === state.events.length ? "Full schedule" : "Filtered schedule";
  resultsSubheadEl.textContent = total === 1 ? "Showing 1 event" : `Showing ${total} events`;

  if (!total) {
    scheduleDaysEl.innerHTML = `
      <div class="empty-state">
        No schedule items match those filters. Try broadening the search or reset the view.
      </div>
    `;
    return;
  }

  const grouped = new Map();
  state.filteredEvents.forEach((event) => {
    if (!grouped.has(event.date)) {
      grouped.set(event.date, []);
    }
    grouped.get(event.date).push(event);
  });

  const dayCards = [];
  grouped.forEach((events, date) => {
    const labels = [...new Set(events.map((event) => event.categoryLabel))];
    dayCards.push(`
      <section class="day-card">
        <div class="day-head">
          <div>
            <h3 class="day-date">${escapeHtml(formatDateLabel(date))}</h3>
            <div class="status-line">${events.length === 1 ? "1 event" : `${events.length} events`}</div>
          </div>
          <div class="day-badge">${escapeHtml(labels.join(" / "))}</div>
        </div>
        <div class="event-stack">
          ${events.map((event) => `
            <article class="event-card">
              <div class="event-top">
                <div>
                  <div class="event-title">${escapeHtml(event.title)}</div>
                  <div class="event-tags">
                    <span class="tag ${categoryTagClass(event.categoryLabel)}">${escapeHtml(event.categoryLabel)}</span>
                    ${event.homeAway ? `<span class="tag">${escapeHtml(event.homeAway)}</span>` : ""}
                    ${event.group && event.group !== "General" ? `<span class="tag">${escapeHtml(event.group)}</span>` : ""}
                  </div>
                </div>
                <div class="event-time">${escapeHtml(event.summary)}</div>
              </div>
              <div class="detail-grid">
                <div class="detail-block ${event.arrivalTime ? "" : "empty"}">
                  <span class="meta-label">Arrival</span>
                  <p class="detail-text">${escapeHtml(event.arrivalTime)}</p>
                </div>
                <div class="detail-block ${event.location ? "" : "empty"}">
                  <span class="meta-label">Location</span>
                  <p class="detail-text">${escapeHtml(event.location)}</p>
                </div>
                <div class="detail-block ${event.notes ? "" : "empty"}">
                  <span class="meta-label">Notes</span>
                  <p class="detail-text">${escapeHtml(event.notes)}</p>
                </div>
              </div>
              ${event.location ? `<div class="action-row"><a class="mini-link" href="${mapLink(event.location)}" target="_blank" rel="noreferrer">Directions</a></div>` : ""}
            </article>
          `).join("")}
        </div>
      </section>
    `);
  });

  scheduleDaysEl.innerHTML = dayCards.join("");
}

function renderMeta() {
  const source = state.sourceLabel;
  const syncText = state.syncedAt ? `Last sync: ${state.syncedAt}` : "Using local snapshot";
  scheduleMetaEl.textContent = `${source}. ${syncText}${state.lastError ? ` (${state.lastError})` : ""}`;
  if (dataStatusEl) {
    dataStatusEl.textContent = source === "Live Google Sheet" ? `Live sync active · ${syncText}` : `Snapshot mode · ${syncText}`;
  }
}

function syncUi() {
  applyFilters();
  renderMeta();
  renderInstagram();
  renderCalendarControls();
  renderNextCard();
  renderWeekStack();
  renderStats();
  renderTeamAndPlayerStats();
  renderPlayerSurvey();
  renderGameVideos();
  renderGamePlans();
  renderFilters();
  renderSchedule();
}

function ingestCsv(csvText, sourceLabel) {
  const records = parseCsv(csvText);
  state.events = normalizeEvents(records);
  state.sourceLabel = sourceLabel;
  state.syncedAt = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
  syncUi();
}

async function refreshSchedule() {
  refreshButtonEl.disabled = true;
  refreshButtonEl.textContent = "Refreshing...";

  try {
    const response = await fetch(`${CSV_URL}&cacheBust=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Google returned ${response.status}`);
    }
    const csvText = await response.text();
    state.lastError = "";
    ingestCsv(csvText, "Live Google Sheet");
  } catch (error) {
    state.lastError = "Live refresh unavailable";
    if (!state.events.length) {
      ingestCsv(FALLBACK_CSV, "Snapshot");
    } else {
      renderMeta();
    }
  } finally {
    refreshButtonEl.disabled = false;
    refreshButtonEl.textContent = "Refresh";
  }
}

function wireEvents() {
  downloadCalendarButtonEl.addEventListener("click", downloadIcsFile);
  downloadGamesCalendarButtonEl.addEventListener("click", downloadGamesIcsFile);

  googleCalendarButtonEl.addEventListener("click", async () => {
    const feedUrl = liveFeedUrl();
    if (!feedUrl) {
      setCalendarStatus("The live feed is not configured yet. Download the .ics file for now.", true);
      return;
    }

    try {
      await copyTextToClipboard(feedUrl);
      window.open("https://calendar.google.com/calendar/u/0/r/settings/addbyurl", "_blank", "noopener");
      setCalendarStatus("Feed URL copied. In Google Calendar, paste it into Other calendars > From URL.");
    } catch (error) {
      setCalendarStatus(error.message || "Could not copy the live feed URL.", true);
    }
  });

  copyFeedButtonEl.addEventListener("click", async () => {
    const feedUrl = liveFeedUrl();
    if (!feedUrl) {
      setCalendarStatus("The live feed is not configured yet.", true);
      return;
    }

    try {
      await copyTextToClipboard(feedUrl);
      setCalendarStatus("Live feed URL copied.");
    } catch (error) {
      setCalendarStatus(error.message || "Could not copy the live feed URL.", true);
    }
  });

  smsFormEl.addEventListener("submit", (event) => {
    if (!SERVICE_URL) {
      event.preventDefault();
      setSmsStatus("Text alerts will turn on after the schedule service URL is added to schedule-config.js.", true);
      return;
    }

    const normalizedPhone = normalizePhone(subscriberPhoneEl.value);
    if (!normalizedPhone) {
      event.preventDefault();
      setSmsStatus("Enter a valid mobile number so alerts can be delivered.", true);
      return;
    }

    if (!smsConsentEl.checked) {
      event.preventDefault();
      setSmsStatus("Consent is required before sending schedule text alerts.", true);
      return;
    }

    const requestId = buildRequestId();
    state.pendingSmsRequestId = requestId;
    requestIdInputEl.value = requestId;
    subscriberPhoneEl.value = normalizedPhone;
    smsFormEl.action = SERVICE_URL;
    smsSubscribeButtonEl.disabled = true;
    smsSubscribeButtonEl.textContent = "Saving...";
    setSmsStatus("Submitting your text alert request...");
  });

  searchInputEl.addEventListener("input", (event) => {
    state.filters.search = event.target.value;
    syncUi();
  });

  categoryFilterEl.addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    syncUi();
  });

  teamFilterEl.addEventListener("change", (event) => {
    state.filters.group = event.target.value;
    syncUi();
  });

  monthFilterEl.addEventListener("change", (event) => {
    state.filters.month = event.target.value;
    syncUi();
  });

  refreshButtonEl.addEventListener("click", refreshSchedule);

  resetButtonEl.addEventListener("click", () => {
    state.filters = { search: "", category: "all", group: "all", month: "all" };
    searchInputEl.value = "";
    syncUi();
  });
}

window.addEventListener("message", handleServiceMessage);
ingestCsv(FALLBACK_CSV, "Snapshot");
wireEvents();
refreshSchedule();
