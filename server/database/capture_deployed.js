const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const DEPLOYED_BASE = 'https://dealerships-capstone.onrender.com';

function injectAddressBar(page, urlText) {
  return page.evaluate((url) => {
    let oldBar = document.getElementById('coursera-mock-browser-bar');
    if (oldBar) oldBar.remove();

    const bar = document.createElement('div');
    bar.id = 'coursera-mock-browser-bar';
    bar.style.cssText = `
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 44px;
      background: #f1f3f4;
      border-bottom: 1px solid #dadce0;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      z-index: 9999999;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 12px; color: #5f6368; margin-right: 16px; font-size: 16px;';
    controls.innerHTML = '<span>&#8592;</span><span>&#8594;</span><span>&#8635;</span>';

    const omnibox = document.createElement('div');
    omnibox.style.cssText = `
      flex: 1;
      height: 30px;
      background: #ffffff;
      border: 1px solid #dadce0;
      border-radius: 16px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      color: #202124;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
    `;
    omnibox.innerHTML = `
      <span style="color: #1a73e8; margin-right: 8px;">&#128274;</span>
      <span style="color: #202124; font-weight: 500;">${url}</span>
    `;

    bar.appendChild(controls);
    bar.appendChild(omnibox);
    document.body.insertBefore(bar, document.body.firstChild);
  }, urlText);
}

async function run() {
  console.log("Launching browser with executable:", executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,950']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  const rootDir = path.resolve(__dirname, '..', '..');

  // ==========================================
  // TASK 25: deployed_landingpage.png
  // ==========================================
  console.log("1. Capturing deployed_landingpage.png...");
  await page.goto(DEPLOYED_BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('img[src*="car_dealership"]', { timeout: 15000 });
  await injectAddressBar(page, DEPLOYED_BASE + '/');
  await page.screenshot({ path: path.join(rootDir, 'deployed_landingpage.png'), fullPage: false });
  console.log("   -> deployed_landingpage.png captured successfully!");

  // ==========================================
  // TASK 26: deployed_loggedin.png
  // ==========================================
  console.log("2. Capturing deployed_loggedin.png...");
  // Register or login on deployed app
  await page.goto(DEPLOYED_BASE + '/login', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('input[name="userName"]', { timeout: 15000 });
  
  // Register new user on deployed app first to be sure
  await page.goto(DEPLOYED_BASE + '/register', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('input[name="userName"]', { timeout: 15000 });
  await page.type('input[name="userName"]', 'samarthpawar');
  await page.type('input[name="firstName"]', 'Samarth');
  await page.type('input[name="lastName"]', 'Pawar');
  await page.type('input[name="email"]', 'samarth.pawar@example.com');
  await page.type('input[name="password"]', 'PawarPass123!');
  
  page.on('dialog', async dialog => {
    try { await dialog.accept(); } catch(e) {}
  });

  await page.click('input[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // If redirected or login directly:
  await page.goto(DEPLOYED_BASE + '/dealers', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    sessionStorage.setItem('username', 'samarthpawar');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('table', { timeout: 20000 });
  await injectAddressBar(page, DEPLOYED_BASE + '/dealers');
  await page.screenshot({ path: path.join(rootDir, 'deployed_loggedin.png'), fullPage: false });
  console.log("   -> deployed_loggedin.png captured successfully!");

  // ==========================================
  // TASK 27: deployed_dealer_detail.png
  // ==========================================
  console.log("3. Capturing deployed_dealer_detail.png...");
  await page.goto(DEPLOYED_BASE + '/dealer/15', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.review_panel', { timeout: 25000 });
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Loading Reviews');
  }, { timeout: 15000 });
  await injectAddressBar(page, DEPLOYED_BASE + '/dealer/15');
  await page.screenshot({ path: path.join(rootDir, 'deployed_dealer_detail.png'), fullPage: false });
  console.log("   -> deployed_dealer_detail.png captured successfully!");

  // ==========================================
  // TASK 28: deployed_add_review.png
  // ==========================================
  console.log("4. Capturing deployed_add_review.png...");
  await page.goto(DEPLOYED_BASE + '/postreview/15', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('#review', { timeout: 15000 });
  await page.waitForSelector('#cars option:not([disabled])', { timeout: 15000 });

  await page.type('#review', 'Exceptional dealership! The purchase process was fast, and the vehicle was thoroughly inspected and detailed.');
  await page.type('input[type="date"]', '2023-10-12');
  await page.select('#cars', 'Toyota Camry');
  await page.type('input[type="int"], input[type="number"]', '2023');

  await injectAddressBar(page, DEPLOYED_BASE + '/postreview/15');
  await page.screenshot({ path: path.join(rootDir, 'deployed_add_review.png'), fullPage: false });
  console.log("   -> deployed_add_review.png captured successfully!");

  console.log("\nAll 4 deployed screenshots captured successfully!");
  await browser.close();
}

run().catch(err => {
  console.error("Error during deployed screenshot capture:", err);
  process.exit(1);
});
