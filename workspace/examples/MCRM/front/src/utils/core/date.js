// Date formatting utilities for Gregorian calendar with Arabic numerals
// م for AM (morning) and ص for PM (afternoon)

export const arabicNumerals = {
  0: "٠", 1: "١", 2: "٢", 3: "٣", 4: "٤",
  5: "٥", 6: "٦", 7: "٧", 8: "٨", 9: "٩",
};

export const convertToArabic = (num) => {
  return num
    .toString()
    .split("")
    .map((digit) => arabicNumerals[digit] || digit)
    .join("");
};

/**
 * Format date to Gregorian calendar with Arabic numerals
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
/**
 * Get YYYY-MM-DD in local timezone (avoids toISOString UTC shift).
 * Use for date keys in call-center queue chips, counts, list filters.
 */
export const toLocalDateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatGregorianDate = (dateString, includeTime = true) => {
  // Handle null, undefined, or empty values
  if (!dateString || dateString === null || dateString === undefined) {
    return includeTime ? "لا يوجد تاريخ ووقت" : "لا يوجد تاريخ";
  }

  // Handle Date objects
  if (dateString instanceof Date) {
    // If it's already a Date object, use it directly
    const date = dateString;
    
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateString);
      return includeTime ? "تاريخ ووقت غير صحيح" : "تاريخ غير صحيح";
    }

    // Format date in Gregorian calendar
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const formattedDate = `${convertToArabic(day)}/${convertToArabic(month)}/${convertToArabic(year)}`;

    if (!includeTime) {
      return formattedDate;
    }

    // Format time with م/ص
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const period = hours < 12 ? "م" : "ص";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    const formattedTime = `${convertToArabic(displayHours)}:${convertToArabic(
      minutes.toString().padStart(2, "0")
    )} ${period}`;

    return `${formattedDate} ${formattedTime}`;
  }

  // Handle string values
  if (typeof dateString !== 'string') {
    console.warn("Invalid date type:", typeof dateString, dateString);
    return includeTime ? "تاريخ ووقت غير صحيح" : "تاريخ غير صحيح";
  }

  // Parse the date string properly, handling GMT timezone
  let date;

  if (dateString.includes("GMT")) {
    // For GMT strings like "Mon, 27 Oct 2025 20:17:45 GMT"
    // Parse as UTC to avoid timezone conversion issues
    const utcString = dateString.replace(" GMT", "") + " UTC";
    date = new Date(utcString);
  } else {
    // For non-GMT strings, assume they are already in local timezone
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) {
    console.warn("Invalid date format:", dateString);
    return includeTime ? "تاريخ ووقت غير صحيح" : "تاريخ غير صحيح";
  }

  // Format date in Gregorian calendar
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const formattedDate = `${convertToArabic(day)}/${convertToArabic(
    month
  )}/${convertToArabic(year)}`;

  if (!includeTime) {
    return formattedDate;
  }

  // Format time with م/ص
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const period = hours < 12 ? "م" : "ص";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  const formattedTime = `${convertToArabic(displayHours)}:${convertToArabic(
    minutes.toString().padStart(2, "0")
  )} ${period}`;

  return `${formattedDate} ${formattedTime}`;
};

/**
 * Format time only with م/ص
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted time string
 */
export const formatTimeOnly = (dateString) => {
  // Handle null, undefined, or empty values
  if (!dateString || dateString === null || dateString === undefined) {
    return "لا يوجد وقت";
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date format:", dateString);
    return "وقت غير صحيح";
  }


  const hours = date.getHours();
  const minutes = date.getMinutes();

  const period = hours < 12 ? "م" : "ص";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${convertToArabic(displayHours)}:${convertToArabic(
    minutes.toString().padStart(2, "0")
  )} ${period}`;
};

/** Arabic weekday names (Sunday = 0) */
const ARABIC_WEEKDAYS = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
];

/**
 * Format time + day name (no date numbers). For call history: "الخميس ٢:٣٤ م"
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} "dayName time" e.g. "الخميس ٢:٣٤ م"
 */
export const formatTimeAndDayName = (dateString) => {
  if (!dateString || dateString === null || dateString === undefined) {
    return "لا يوجد وقت";
  }

  let date;
  if (dateString instanceof Date) {
    date = dateString;
  } else if (dateString.includes("GMT")) {
    const utcString = dateString.replace(" GMT", "") + " UTC";
    date = new Date(utcString);
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) {
    return "وقت غير صحيح";
  }


  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? "م" : "ص";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const time = `${convertToArabic(displayHours)}:${convertToArabic(
    minutes.toString().padStart(2, "0")
  )} ${period}`;

  const dayName = ARABIC_WEEKDAYS[date.getDay()];
  return `${dayName} ${time}`;
};

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

/**
 * Format date with Arabic month name: "٢٧ فبراير ٢٠٢٦"
 * @param {string|Date} dateString
 * @returns {string}
 */
export const formatDateWithArabicMonth = (dateString) => {
  if (!dateString) return "لا يوجد تاريخ";
  let date;
  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === "string" && dateString.includes("GMT")) {
    const utcString = dateString.replace(" GMT", "") + " UTC";
    date = new Date(utcString);
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return "تاريخ غير صحيح";
  const day = convertToArabic(date.getDate());
  const monthName = ARABIC_MONTHS[date.getMonth()];
  const year = convertToArabic(date.getFullYear());
  return `${day} ${monthName} ${year}`;
};

/**
 * Format date only (without time)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (dateString) => {
  // Handle null, undefined, or empty values
  if (!dateString || dateString === null || dateString === undefined) {
    return "لا يوجد تاريخ";
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date format:", dateString);
    return "تاريخ غير صحيح";
  }


  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${convertToArabic(day)}/${convertToArabic(month)} (${convertToArabic(
    year
  )})`;
};

/**
 * Parse Arabic-formatted date string back to Date object
 * @param {string} arabicDateString - Date string with Arabic numerals (e.g., "٢١/٩/٢٠٢٥ ٥:٥١ ص")
 * @returns {Date|null} Parsed Date object or null if invalid
 */
const parseArabicDate = (arabicDateString) => {
  if (!arabicDateString || typeof arabicDateString !== "string") {
    return null;
  }

  // Arabic to Latin numeral mapping
  const arabicToLatin = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };

  // Convert Arabic numerals to Latin
  const convertToLatin = (str) => {
    return str.replace(/[٠-٩]/g, (char) => arabicToLatin[char] || char);
  };

  // Check if the string contains Arabic numerals (indicating it's an Arabic-formatted date)
  const hasArabicNumerals = /[٠-٩]/.test(arabicDateString);

  if (!hasArabicNumerals) {
    // Not an Arabic date, try parsing as-is
    return new Date(arabicDateString);
  }

  try {
    // Convert Arabic numerals to Latin
    const latinDateString = convertToLatin(arabicDateString);

    // Parse the converted string
    // Expected format: "21/9/2025 5:51 ص" or "21/9/2025 5:51 م"
    const dateTimeMatch = latinDateString.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})\s+([مص])/
    );

    if (dateTimeMatch) {
      const [, day, month, year, hours, minutes, period] = dateTimeMatch;

      // Convert to 24-hour format
      let hour24 = parseInt(hours, 10);
      if (period === "ص" && hour24 !== 12) {
        hour24 += 12;
      } else if (period === "م" && hour24 === 12) {
        hour24 = 0;
      }

      // Create Date object (month is 0-indexed in JavaScript)
      return new Date(year, month - 1, day, hour24, parseInt(minutes, 10));
    }

    // If no time component, try date only
    const dateOnlyMatch = latinDateString.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );
    if (dateOnlyMatch) {
      const [, day, month, year] = dateOnlyMatch;
      return new Date(year, month - 1, day);
    }

    return null;
  } catch (error) {
    console.warn("Error parsing Arabic date:", arabicDateString, error);
    return null;
  }
};

/**
 * Get relative time (e.g., "منذ 5 دقائق")
 * @param {string|Date} dateString - ISO date string, Date object, or Arabic-formatted date string
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  // Handle null, undefined, or empty values
  if (!dateString || dateString === null || dateString === undefined) {
    return "لا يوجد وقت";
  }

  let date;

  // If it's already a Date object, use it
  if (dateString instanceof Date) {
    date = dateString;
  } else {
    // Parse the date string properly, handling GMT timezone
    if (dateString.includes("GMT")) {
      // For GMT strings like "Mon, 27 Oct 2025 20:17:45 GMT"
      // Parse as UTC to avoid timezone conversion issues
      const utcString = dateString.replace(" GMT", "") + " UTC";
      date = new Date(utcString);
    } else {
      // Try parsing as Arabic date first
      date = parseArabicDate(dateString);

      // If Arabic parsing failed, try standard parsing
      if (!date) {
        date = new Date(dateString);
      }
    }
  }

  const now = new Date();

  if (isNaN(date.getTime())) {
    console.warn("Invalid date format:", dateString);
    return "وقت غير صحيح";
  }

  // Calculate difference in seconds (past dates will be positive, future dates will be negative)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);


  // Handle future dates (negative diffInSeconds)
  if (diffInSeconds < 0) {
    const futureSeconds = Math.abs(diffInSeconds);

    if (futureSeconds < 60) {
      return "خلال لحظات";
    } else if (futureSeconds < 3600) {
      const minutes = Math.floor(futureSeconds / 60);
      return `خلال ${convertToArabic(minutes)} دقيقة`;
    } else if (futureSeconds < 86400) {
      const hours = Math.floor(futureSeconds / 3600);
      return `خلال ${convertToArabic(hours)} ساعة`;
    } else {
      const days = Math.floor(futureSeconds / 86400);
      if (days === 1) {
        return "غداً";
      } else {
        return `خلال ${convertToArabic(days)} يوم`;
      }
    }
  }

  // Handle past dates (positive diffInSeconds)
  if (diffInSeconds < 60) {
    return "الآن";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `منذ ${convertToArabic(minutes)} دقيقة`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `منذ ${convertToArabic(hours)} ساعة`;
  } else {
    // For days and beyond, show actual date instead of relative time
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // Get Arabic month names
    const arabicMonths = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    
    const monthName = arabicMonths[month - 1];
    const formattedDay = convertToArabic(day);
    const formattedYear = convertToArabic(year);
    
    // Format: "٩ مارس ٢٠٢٦" (day month year)
    return `${formattedDay} ${monthName} ${formattedYear}`;
  }
};

/**
 * Get short relative time in Arabic without "منذ" prefix
 * Examples: "من دقيقة", "من 3 ساعات", "من 5 أيام", "من شهر", "من 3 شهور", "من سنة", "من سنتين", "من 3 سنوات"
 * @param {string|Date} dateString
 * @returns {string}
 */
export const getRelativeTimeShort = (dateString) => {
  if (!dateString) return "الآن";

  let date;

  // If it's already a Date object, use it
  if (dateString instanceof Date) {
    date = dateString;
  } else {
    // Try parsing as Arabic date first
    date = parseArabicDate(dateString);

    // If Arabic parsing failed, try standard parsing
    if (!date) {
      date = new Date(dateString);
    }
  }

  const now = new Date();
  if (isNaN(date.getTime())) return "الآن";

  const diffMs = now - date;
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const month = Math.floor(day / 30);
  const year = Math.floor(day / 365);


  if (sec < 60) return "الآن";
  if (min < 60) return `من ${convertToArabic(min)} دقيقة`;
  if (hr < 24) return `من ${convertToArabic(hr)} ساعة`;
  if (day < 30) return `من ${convertToArabic(day)} يوم`;

  if (month < 12) {
    if (month === 1) return "من شهر";
    if (month === 2) return "من شهرين";
    return `من ${convertToArabic(month)} شهور`;
  }

  if (year === 1) return "من سنة";
  if (year === 2) return "من سنتين";
  return `من ${convertToArabic(year)} سنوات`;
};

export const formatDistanceToNowAr = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `منذ لحظات`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;

  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;

  const years = Math.floor(months / 12);
  return `منذ ${years} سنة`;
};
