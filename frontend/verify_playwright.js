const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

  // ── 1. Congregants page ──────────────────────────────────────────────
  await page.goto('http://localhost:5174/congregants', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=ערן בוטבול', { timeout: 15000 });
  await page.click('text=ערן בוטבול');
  await page.waitForSelector('text=מאיר', { timeout: 15000 });
  await page.screenshot({ path: 'verify_congregant.png', fullPage: true });
  const bodyText1 = await page.innerText('body');
  console.log('--- Congregant modal contains "אבא: מאיר"? ---', bodyText1.includes('אבא: מאיר'));
  console.log('--- Congregant modal contains "בן מאיר" (old label)? ---', bodyText1.includes('בן מאיר'));
  await page.click('button:has-text("עריכה") >> nth=-1').catch(() => {});
  // close modal (press Escape) - try clicking backdrop or close btn if exists
  await page.keyboard.press('Escape').catch(() => {});

  // ── 2. Calendar page ─────────────────────────────────────────────────
  await page.goto('http://localhost:5174/calendar', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=לוח עברי', { timeout: 15000 });
  await page.waitForTimeout(1500); // allow month-view query to resolve
  await page.screenshot({ path: 'verify_calendar_month.png', fullPage: true });

  // Click the Friday cell (3) that has parashat Pinchas week - grid shows hebrew day "יז" is today (17 Tammuz)
  // Click day cell for gregorian 3/7 - locate by hebrew day string "יח" (18 Tammuz = July 3) or "יט" (19 = July 4, Saturday)
  const bodyText2 = await page.innerText('body');
  console.log('--- Month view contains today marker ---');

  await browser.close();
  console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors));
})();
