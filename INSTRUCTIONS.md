# Setup Instructions

## 1. Google Sheet Setup
1. Create a new Google Sheet.
2. Note down the **Spreadsheet ID** from the URL (e.g., `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`).

## 2. Google Apps Script Setup
1. In the Google Sheet, go to **Extensions > Apps Script**.
2. Delete any existing code in `Code.gs`.
3. Copy the content of `APPS_SCRIPT.js` from this project and paste it into `Code.gs`.
4. Replace `YOUR_SPREADSHEET_ID_HERE` at the top of the script with your actual Spreadsheet ID.
5. Click **Save** (Floppy disk icon).

## 3. Deploy as Web App
1. Click **Deploy > New deployment**.
2. Select type: **Web app**.
3. Description: "Amman Printers API".
4. **Execute as**: "Me" (your email).
5. **Who has access**: "Anyone" (This is important for the static site to access it without complex OAuth).
6. Click **Deploy**.
7. Copy the **Web App URL** (ends in `/exec`).

## 4. Configure Frontend
1. Open `config.js` in the `plainjs` folder.
2. Paste the Web App URL into the `SCRIPT_URL` variable.
   ```javascript
   const CONFIG = {
       SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
   };
   ```

## 5. Hosting on GitHub Pages
1. Push the `plainjs` folder to your GitHub repository.
2. Go to Repository **Settings > Pages**.
3. Select the source as `main` (or `master`) branch and `/plainjs` folder (if possible, or move contents to root if needed).
   - *Note*: GitHub Pages usually serves from root or `/docs`. If you want to serve from `/plainjs`, you might need to configure it or move files to root.
   - **Recommended**: If this repo is dedicated to this site, move the contents of `plainjs` to the root directory.

## 6. Initial Data
- The first time you run the script (e.g., try to login), it will automatically create the `Login` and `Orders` sheets if they don't exist.
- Default Login: `admin` / `admin`. You can change this in the `Login` sheet.
