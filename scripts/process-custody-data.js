#!/usr/bin/env node
/**
 * Process Custody Data Script
 * ============================
 * Reads CSV from Google Sheets format and calculates all KPIs
 * Outputs JSON to data/custody-data.json
 * 
 * USAGE:
 *   node scripts/process-custody-data.js <path-to-csv>
 *   node scripts/process-custody-data.js  # uses data/custody-data.csv as default
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Month calendar days lookup
const MONTH_CALENDAR_DAYS = {
  '2025-01': 31, '2025-02': 28, '2025-03': 31, '2025-04': 30,
  '2025-05': 31, '2025-06': 30, '2025-07': 31, '2025-08': 31,
  '2025-09': 30, '2025-10': 31, '2025-11': 30, '2025-12': 31,
  '2026-01': 31, '2026-02': 28, '2026-03': 31, '2026-04': 30,
  '2026-05': 31, '2026-06': 30, '2026-07': 31, '2026-08': 31,
  '2026-09': 30, '2026-10': 31, '2026-11': 30, '2026-12': 31,
};

// Routine care column indices and names
const ROUTINE_CARE_COLS = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
const ROUTINE_CARE_NAMES = [
  'No School Day Care', 'Morning routine', 'School drop-off',
  'School pick-up', 'Homework/reading', 'Transport to Extracurricular',
  'Dinner', 'Bedtime', 'Sick care', 'Medical appt', 'Meds administered'
];

const DOW_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Parse date from multiple formats
 * @param {string} dateStr - Date string to parse
 * @returns {Date|null} Parsed date or null
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = dateStr.trim().replace(/^"|"$/g, '');
  
  const formats = [
    { regex: /^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d+),\s+(\d{4})$/, parser: (m) => new Date(`${m[1]} ${m[2]}, ${m[3]}`) },
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, parser: (m) => new Date(`${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`) },
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, parser: (m) => new Date(`${m[1]}-${m[2]}-${m[3]}`) },
  ];
  
  for (const { regex, parser } of formats) {
    const match = d.match(regex);
    if (match) {
      try {
        const parsed = parser(match);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch (e) {
        // Continue to next format
      }
    }
  }
  
  // Fallback to native Date parsing
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;
  } catch (e) {
    // Failed to parse
  }
  
  return null;
}

/**
 * Format date as YYYY-MM
 * @param {Date} date 
 * @returns {string}
 */
function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Create default monthly accumulator
 * @returns {Object}
 */
function createMonthlyAccumulator() {
  return {
    laura: 0,
    amber: 0,
    both: 0,
    amberHours: 0,
    amberEngagedDays: 0,
    totalDays: 0,
    forfeited: 0,
    amberScheduled: 0,
    amberScheduledHours: 0   // Expected hours per parenting plan: Wed 3hrs, Fri 8hrs, Sat 24hrs, Sun 17hrs
  };
}

/**
 * Create default day of week accumulator
 * @returns {Object}
 */
function createDowAccumulator() {
  return { Laura: 0, Amber: 0 };
}

/**
 * Process CSV data and calculate all KPIs
 * @param {string} csvPath - Path to CSV file
 * @returns {Object} Processed data
 */
function processCustodyData(csvPath) {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(csvContent, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true
  });

  // Remove header row
  const dataRows = rows.slice(1);
  console.log(`Loaded ${dataRows.length} data rows from CSV`);

  // Accumulators
  let totalDays = 0;
  let lauraPrimary = 0;
  let amberPrimary = 0;
  let bothPrimary = 0;
  let forfeitedDays = 0;
  let amberScheduledTotal = 0;
  let lauraScheduled = 0;
  let amberOnlyScheduled = 0;
  let bothScheduled = 0;

  const monthly = {};
  const dowRoutine = {};
  const routineLaura = {};
  const routineAmber = {};
  let routineLauraTotal = 0;
  let routineAmberTotal = 0;
  const monthlyEng = {};

  let firstDate = null;
  let lastDate = null;

  // Initialize accumulators
  DOW_NAMES.forEach(d => { dowRoutine[d] = createDowAccumulator(); });
  ROUTINE_CARE_NAMES.forEach(name => {
    routineLaura[name] = 0;
    routineAmber[name] = 0;
  });

  for (const row of dataRows) {
    const dt = parseDate(row[0]);
    if (!dt) continue;

    totalDays++;

    if (!firstDate || dt < firstDate) firstDate = dt;
    if (!lastDate || dt > lastDate) lastDate = dt;

    const scheduled = (row[1] || '').trim();
    const actual = (row[2] || '').trim();
    const forfeitedFlag = (row[3] || '').trim();

    const monthKey = getMonthKey(dt);
    const dayName = DOW_NAMES[dt.getDay() === 0 ? 6 : dt.getDay() - 1]; // Adjust for Sunday

    // Initialize monthly accumulator if needed
    if (!monthly[monthKey]) {
      monthly[monthKey] = createMonthlyAccumulator();
    }
    if (!monthlyEng[monthKey]) {
      monthlyEng[monthKey] = { engaged: 0, notEngaged: 0 };
    }

    const schedLower = scheduled.toLowerCase();
    const actualLower = actual.toLowerCase();

    // Scheduled tracking
    if (schedLower.includes('laura') && !schedLower.includes('amber') && !schedLower.includes('both')) {
      lauraScheduled++;
    } else if (schedLower.includes('amber') && !schedLower.includes('laura') && !schedLower.includes('both')) {
      amberOnlyScheduled++;
    } else if (schedLower.includes('both')) {
      bothScheduled++;
    }

    // Primary parent tracking
    if (actualLower.includes('laura') && !actualLower.includes('amber') && !actualLower.includes('both')) {
      lauraPrimary++;
      monthly[monthKey].laura++;
    } else if (actualLower.includes('amber') && !actualLower.includes('laura') && !actualLower.includes('both')) {
      amberPrimary++;
      monthly[monthKey].amber++;
    } else if (actualLower.includes('both')) {
      bothPrimary++;
      monthly[monthKey].both++;
    } else {
      // Default to Laura if no match
      lauraPrimary++;
      monthly[monthKey].laura++;
    }

    monthly[monthKey].totalDays++;

    // Forfeited tracking
    if (schedLower.includes('amber') || schedLower.includes('both')) {
      amberScheduledTotal++;
      monthly[monthKey].amberScheduled++;

      // Scheduled hours per parenting plan:
      //   Wednesday visits: 4:30 PM – 7:30 PM = 3 hrs
      //   Every other weekend: Fri 4 PM–midnight = 8 hrs, Sat = 24 hrs, Sun midnight–5 PM = 17 hrs
      if (dayName === 'Wednesday') {
        monthly[monthKey].amberScheduledHours += 3;
      } else if (dayName === 'Friday') {
        monthly[monthKey].amberScheduledHours += 8;
      } else if (dayName === 'Saturday') {
        monthly[monthKey].amberScheduledHours += 24;
      } else if (dayName === 'Sunday') {
        monthly[monthKey].amberScheduledHours += 17;
      }

      if (actualLower.includes('laura') && !actualLower.includes('amber') && !actualLower.includes('both')) {
        forfeitedDays++;
        monthly[monthKey].forfeited++;
      } else if (['y', 'yes', 'true', '1', 'amber forfeited parenting time'].includes(forfeitedFlag.toLowerCase())) {
        forfeitedDays++;
        monthly[monthKey].forfeited++;
      }
    }

    // Engagement tracking
    const amberEngaged = (row[34] || '').trim().toUpperCase();
    const amberHoursStr = (row[36] || '').trim();

    if (amberEngaged === 'Y' || amberEngaged === 'N') {
      if (amberEngaged === 'Y') {
        monthly[monthKey].amberEngagedDays++;
        monthlyEng[monthKey].engaged++;
      } else {
        monthlyEng[monthKey].notEngaged++;
      }
    }

    try {
      const amberHours = parseFloat(amberHoursStr);
      if (!isNaN(amberHours)) {
        monthly[monthKey].amberHours += amberHours;
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Routine care tracking
    for (let idx = 0; idx < ROUTINE_CARE_COLS.length; idx++) {
      const col = ROUTINE_CARE_COLS[idx];
      const careName = ROUTINE_CARE_NAMES[idx];
      
      if (row.length > col) {
        const val = (row[col] || '').trim().toLowerCase();
        if (val.includes('laura')) {
          routineLaura[careName]++;
          routineLauraTotal++;
          dowRoutine[dayName].Laura++;
        } else if (val.includes('amber')) {
          routineAmber[careName]++;
          routineAmberTotal++;
          dowRoutine[dayName].Amber++;
        }
      }
    }
  }

  // Calculate KPIs
  const sortedMonths = Object.keys(monthly).sort();
  const totalAmberHours = sortedMonths.reduce((sum, m) => sum + monthly[m].amberHours, 0);
  const totalAmberDaysEquiv = Math.round((totalAmberHours / 24) * 10) / 10;
  const numMonths = sortedMonths.length;

  const lauraPct = Math.round((lauraPrimary / totalDays) * 1000) / 10;
  const amberPct = Math.round((amberPrimary / totalDays) * 1000) / 10;
  const forfeitedPct = amberScheduledTotal > 0 
    ? Math.round((forfeitedDays / amberScheduledTotal) * 1000) / 10 
    : 0;
  
  const routineTotal = routineLauraTotal + routineAmberTotal;
  const routineLauraPct = routineTotal > 0 
    ? Math.round((routineLauraTotal / routineTotal) * 1000) / 10 
    : 0;
  const routineAmberPct = routineTotal > 0 
    ? Math.round((routineAmberTotal / routineTotal) * 1000) / 10 
    : 0;

  const dateRangeStr = firstDate && lastDate
    ? `${firstDate.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })} – ${lastDate.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}`
    : 'Unknown';

  console.log(`\n=== PROCESSED METRICS ===`);
  console.log(`Date range: ${dateRangeStr}`);
  console.log(`Total days: ${totalDays}`);
  console.log(`Laura primary: ${lauraPrimary} (${lauraPct}%)`);
  console.log(`Amber primary: ${amberPrimary} (${amberPct}%)`);
  console.log(`Both: ${bothPrimary}`);
  console.log(`Forfeited: ${forfeitedDays}/${amberScheduledTotal} (${forfeitedPct}%)`);
  console.log(`Amber hours: ${totalAmberHours.toFixed(1)} (${totalAmberDaysEquiv} days)`);
  console.log(`Routine care: Laura ${routineLauraTotal} (${routineLauraPct}%) / Amber ${routineAmberTotal} (${routineAmberPct}%)`);

  // Build routineCareData
  const routineCareMap = {
    'Morning routine': { laura: routineLaura['Morning routine'] || 0, amber: routineAmber['Morning routine'] || 0 },
    'School drop-off': { laura: routineLaura['School drop-off'] || 0, amber: routineAmber['School drop-off'] || 0 },
    'School pick-up': { laura: routineLaura['School pick-up'] || 0, amber: routineAmber['School pick-up'] || 0 },
    'Homework / reading': { laura: routineLaura['Homework/reading'] || 0, amber: routineAmber['Homework/reading'] || 0 },
    'Dinner': { laura: routineLaura['Dinner'] || 0, amber: routineAmber['Dinner'] || 0 },
    'Bedtime': { laura: routineLaura['Bedtime'] || 0, amber: routineAmber['Bedtime'] || 0 },
    'Transport': { laura: routineLaura['Transport to Extracurricular'] || 0, amber: routineAmber['Transport to Extracurricular'] || 0 },
    'Sick care': { laura: routineLaura['Sick care'] || 0, amber: routineAmber['Sick care'] || 0 },
    'Medical appt': { laura: routineLaura['Medical appt'] || 0, amber: routineAmber['Medical appt'] || 0 },
    'Meds': { laura: routineLaura['Meds administered'] || 0, amber: routineAmber['Meds administered'] || 0 },
  };

  // Build monthlyData
  const monthlyData = {};
  for (const m of sortedMonths) {
    const d = monthly[m];
    const calDays = MONTH_CALENDAR_DAYS[m] || 30;
    const eng = monthlyEng[m]?.engaged || 0;
    const notEng = d.totalDays - eng;
    const hrs = Math.round(d.amberHours * 10) / 10;
    
    monthlyData[m] = {
      total: d.totalDays,
      lauraActual: d.laura,
      amberActual: d.amber,
      bothActual: d.both,
      forfeited: d.forfeited,
      amberScheduled: d.amberScheduled,
      amberScheduledHours: Math.round(d.amberScheduledHours * 10) / 10,
      engaged: eng,
      notEngaged: notEng,
      amberHours: hrs,
      calDays: calDays
    };
  }

  // Build dayOfWeekData
  const dayOfWeekData = {};
  for (const d of DOW_NAMES) {
    dayOfWeekData[d] = {
      Laura: dowRoutine[d].Laura,
      Amber: dowRoutine[d].Amber
    };
  }

  // Build output structure
  const output = {
    meta: {
      dateRange: dateRangeStr,
      totalDays: totalDays,
      generatedAt: new Date().toISOString()
    },
    kpi: {
      lauraPrimary: { value: lauraPct, days: lauraPrimary, totalDays: totalDays },
      amberPrimary: { value: amberPct, days: amberPrimary, totalDays: totalDays },
      forfeited: { value: forfeitedPct, days: forfeitedDays, scheduledDays: amberScheduledTotal },
      routineCare: { laura: routineLauraTotal, lauraPct: routineLauraPct, amber: routineAmberTotal, amberPct: routineAmberPct, total: routineTotal },
      amberHours: { total: Math.round(totalAmberHours * 10) / 10, equivalentDays: totalAmberDaysEquiv },
      scheduled: {
        laura: lauraScheduled,
        amberOnly: amberOnlyScheduled,
        both: bothScheduled
      }
    },
    routineCareData: routineCareMap,
    monthlyData: monthlyData,
    dayOfWeekData: dayOfWeekData,
    raw: {
      lauraScheduled,
      amberOnlyScheduled,
      bothScheduled,
      lauraPrimary,
      amberPrimary,
      bothPrimary,
      forfeitedDays,
      amberScheduledTotal
    }
  };

  return output;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const csvPath = args[0] || path.join(__dirname, '..', 'data', 'custody-data.csv');
  const outputPath = path.join(__dirname, '..', 'data', 'custody-data.json');

  try {
    const data = processCustodyData(csvPath);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write JSON output
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n✓ Data written to: ${outputPath}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processCustodyData, parseDate };
