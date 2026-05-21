const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, 'docs/screenshots');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: '01-home', url: '/en' },
  { name: '02-incidents-safety-gate', url: '/en/incidents/safety' },
  { name: '03-incidents-new', url: '/en/incidents/new' },
  { name: '04-incidents-success', url: '/en/incidents/success' },
  { name: '05-referral-directory', url: '/en/referral' },
  { name: '06-dashboard', url: '/en/dashboard' },
  { name: '07-incidents-list', url: '/en/incidents' },
  { name: '08-users', url: '/en/users' },
  { name: '09-reports', url: '/en/reports' },
  { name: '10-audit-log', url: '/en/audit' },
  { name: '11-admin-manual', url: '/en/admin/manual' },
  { name: '12-admin-services', url: '/en/admin/services' },
  { name: '13-not-found', url: '/en/this-page-does-not-exist' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  for (const { name, url } of PAGES) {
    try {
      try {
        await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch (_) {
        // timeout on waitUntil – page may still have loaded, continue
      }
      await page.waitForTimeout(4000);
      const filePath = path.join(OUT, `${name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`✓ ${name} → ${filePath}`);
    } catch (e) {
      console.error(`✗ ${name}: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\nDone!');
})();
