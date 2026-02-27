# Custody Dashboard Data Scripts

JavaScript data processing scripts for the custody tracking dashboard.

## Scripts

### 1. `scripts/process-custody-data.js`

Processes CSV data from Google Sheets and calculates all KPIs.

**Usage:**
```bash
# Process default CSV file (data/custody-data.csv)
npm run process-data

# Or process a specific CSV file
node scripts/process-custody-data.js /path/to/your.csv
```

**Output:** `data/custody-data.json`

**Calculates:**
- Laura primary % (days and percentage)
- Amber primary % (days and percentage)
- Forfeited days % (days Amber was scheduled but didn't have custody)
- Routine care breakdown by parent
- Monthly aggregations (actual vs scheduled, engagement, hours)
- Day of week breakdown
- Amber engagement hours and equivalent days
- Expense totals

### 2. `scripts/fetch-sheets-data.js`

Fetches data from Google Sheets API v4, saves as CSV, and triggers processing.

**Usage:**
```bash
# Set environment variables and run
export GOOGLE_SHEETS_API_KEY=your_api_key_here
export GOOGLE_SHEETS_ID=1sXBco6sNFGMl2DQG61Z34jRcg3JTMuuMW4mI5vaTDyY
npm run fetch-data

# Or run directly
node scripts/fetch-sheets-data.js
```

**Environment Variables:**
- `GOOGLE_SHEETS_API_KEY` (required) - Your Google Sheets API key
- `GOOGLE_SHEETS_ID` (optional) - Spreadsheet ID (defaults to the custody log sheet)
- `GOOGLE_SHEETS_RANGE` (optional) - Cell range to fetch (default: `Parenting Time!A1:AM1000`)

**Output:**
- `data/custody-data.csv` - Raw CSV from Google Sheets
- `data/custody-data.json` - Processed JSON data

## Data Format

The processed JSON file (`data/custody-data.json`) contains:

```json
{
  "meta": {
    "dateRange": "January 01, 2025 – February 25, 2026",
    "totalDays": 421,
    "generatedAt": "2026-02-27T08:00:00Z"
  },
  "kpi": {
    "lauraPrimary": { "value": 77.9, "days": 328, "totalDays": 421 },
    "amberPrimary": { "value": 1.2, "days": 5, "totalDays": 421 },
    "forfeited": { "value": 62.8, "days": 142, "scheduledDays": 226 },
    "routineCare": { "laura": 1428, "lauraPct": 98.4, "amber": 23, "amberPct": 1.6, "total": 1451 },
    "amberHours": { "total": 241.6, "equivalentDays": 10.1 },
    "scheduled": { "laura": 0, "amberOnly": 195, "both": 31 }
  },
  "routineCareData": { ... },
  "monthlyData": { ... },
  "dayOfWeekData": { ... },
  "raw": { ... }
}
```

## Installation

```bash
npm install
```

## Google Sheets API Setup

1. Go to https://console.cloud.google.com
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create an API key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - (Optional) Restrict the key to Google Sheets API only
5. Share your Google Sheet:
   - Open your Google Sheet
   - Click "Share" → "Change to anyone with the link can view"
   - Or keep private and share with a service account email

## CSV Format Expected

The script expects a CSV with columns matching the Google Sheets "Parenting Time" tab:

| Column | Field |
|--------|-------|
| 0 | Date |
| 1 | Scheduled (Laura/Amber/Both) |
| 2 | Actual (Laura/Amber/Both) |
| 3 | Forfeited (Y/Yes) |
| 15-25 | Routine care columns |
| 34 | Amber Engaged (Y/N) |
| 36 | Duration (hours) |

Date formats supported:
- `Wednesday, January 01, 2025`
- `01/01/2025`
- `2025-01-01`

## NPM Scripts

- `npm run fetch-data` - Fetch from Google Sheets and process
- `npm run process-data` - Process local CSV file
- `npm run refresh` - Alias for fetch-data
