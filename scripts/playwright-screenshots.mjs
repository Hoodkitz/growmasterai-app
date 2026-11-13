import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

(async () => {
  const outDir = path.resolve(process.env.HOME, 'symbiose/reports/growmaster-darkmode');
  fs.mkdirSync(outDir, { recursive: true });
  const base = 'http://127.0.0.1:8099';
  const pages = [
    { url: '/smartgrow/index.html', name: 'smartgrow-index' },
    { url: '/smartgrow/device.html', name: 'smartgrow-device' },
    { url: '/smartgrow/hardware.html', name: 'smartgrow-hardware' },
    { url: '/smartgrow/%5Bid%5D.html', name: 'smartgrow-id' },
  ];
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  for (const p of pages) {
    const page = await context.newPage();
    const url = base + p.url;
    console.log('Navigating', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const out = path.join(outDir, `${p.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log('Saved', out);
    } catch (e) {
      console.error('Failed', url, e.message);
    } finally {
      await page.close();
    }
  }
  await browser.close();
})();
