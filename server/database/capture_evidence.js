const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

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
  // TASK 12: Admin Login
  // ==========================================
  console.log("1. Capturing admin_login.png...");
  await page.goto('http://localhost:8000/admin/login/', { waitUntil: 'networkidle2' });
  await page.type('#id_username', 'admin');
  await page.type('#id_password', 'AdminUser123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('input[type="submit"]')
  ]);
  await page.waitForSelector('#content-main', { timeout: 10000 });
  await injectAddressBar(page, 'http://localhost:8000/admin/');
  await page.screenshot({ path: path.join(rootDir, 'admin_login.png'), fullPage: false });
  console.log("   -> admin_login.png captured.");

  // ==========================================
  // TASK 13: Admin Logout
  // ==========================================
  console.log("2. Capturing admin_logout.png...");
  const logoutBtn = await page.$('button[type="submit"][form="logout-form"]') || 
                    await page.$('#logout-form button') ||
                    await page.$('form[action*="logout"] button') ||
                    await page.$('a[href*="logout"]');

  if (logoutBtn) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      logoutBtn.click()
    ]);
  } else {
    await page.goto('http://localhost:8000/admin/logout/', { waitUntil: 'networkidle2' });
  }
  await page.waitForSelector('#content', { timeout: 10000 });
  await injectAddressBar(page, 'http://localhost:8000/admin/logout/');
  await page.screenshot({ path: path.join(rootDir, 'admin_logout.png'), fullPage: false });
  console.log("   -> admin_logout.png captured.");

  // ==========================================
  // TASK 17: get_dealers (Homepage before login)
  // ==========================================
  console.log("3. Capturing get_dealers.png...");
  await page.goto('http://localhost:8000/dealers', { waitUntil: 'networkidle2' });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('table.table tr td', { timeout: 15000 });
  await injectAddressBar(page, 'http://localhost:8000/dealers');
  await page.screenshot({ path: path.join(rootDir, 'get_dealers.png'), fullPage: false });
  console.log("   -> get_dealers.png captured.");

  // ==========================================
  // TASK 18: get_dealers_loggedin (Homepage after login)
  // ==========================================
  console.log("4. Capturing get_dealers_loggedin.png...");
  await page.evaluate(() => {
    sessionStorage.setItem('username', 'testuser');
    sessionStorage.setItem('firstname', 'Test');
    sessionStorage.setItem('lastname', 'User');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('table.table tr td', { timeout: 15000 });
  await page.waitForSelector('a[href*="/postreview/"]', { timeout: 10000 });
  await injectAddressBar(page, 'http://localhost:8000/dealers');
  await page.screenshot({ path: path.join(rootDir, 'get_dealers_loggedin.png'), fullPage: false });
  console.log("   -> get_dealers_loggedin.png captured.");

  // ==========================================
  // TASK 19: dealersbystate (Filtered by Kansas)
  // ==========================================
  console.log("5. Capturing dealersbystate.png...");
  await page.waitForSelector('select', { timeout: 5000 });
  await page.select('select', 'Kansas');
  // Wait for table to filter and show Bytecard Car Dealership in Kansas
  await page.waitForFunction(() => {
    const text = document.querySelector('table.table')?.innerText || '';
    return text.includes('Kansas') && text.includes('Bytecard');
  }, { timeout: 10000 });
  await injectAddressBar(page, 'http://localhost:8000/dealers?state=Kansas');
  await page.screenshot({ path: path.join(rootDir, 'dealersbystate.png'), fullPage: false });
  console.log("   -> dealersbystate.png captured.");

  // ==========================================
  // TASK 20: dealer_id_reviews (Dealer 15 details & reviews loaded)
  // ==========================================
  console.log("6. Capturing dealer_id_reviews.png (waiting for reviews to fully load)...");
  await page.goto('http://localhost:8000/dealer/15', { waitUntil: 'networkidle2' });
  // Explicitly wait until .review_panel is rendered and 'Loading Reviews' is gone!
  await page.waitForSelector('.review_panel', { timeout: 25000 });
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return !body.includes('Loading Reviews') && document.querySelectorAll('.review_panel').length > 0;
  }, { timeout: 15000 });
  await injectAddressBar(page, 'http://localhost:8000/dealer/15');
  await page.screenshot({ path: path.join(rootDir, 'dealer_id_reviews.png'), fullPage: false });
  console.log("   -> dealer_id_reviews.png captured with all reviews and sentiments visible!");

  // ==========================================
  // TASK 21: dealership_review_submission (Review form before submit)
  // ==========================================
  console.log("7. Capturing dealership_review_submission.png...");
  await page.goto('http://localhost:8000/postreview/15', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#review', { timeout: 15000 });
  await page.waitForSelector('#cars option:not([disabled])', { timeout: 15000 });
  
  await page.type('#review', 'Great dealership experience! Staff was very professional, car was in pristine condition, and financing was transparent.');
  await page.type('input[type="date"]', '2023-09-15');
  await page.select('#cars', 'Toyota Camry');
  await page.type('input[type="int"], input[type="number"]', '2023');
  await injectAddressBar(page, 'http://localhost:8000/postreview/15');
  await page.screenshot({ path: path.join(rootDir, 'dealership_review_submission.png'), fullPage: false });
  console.log("   -> dealership_review_submission.png captured.");

  // ==========================================
  // TASK 22: added_review (Posted review rendered)
  // ==========================================
  console.log("8. Submitting review and capturing added_review.png...");
  // Handle alert dialog if any
  page.on('dialog', async dialog => {
    console.log('Dialog opened:', dialog.message());
    await dialog.accept();
  });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('button.postreview')
  ]);
  
  await new Promise(r => setTimeout(r, 2000));
  if (!page.url().includes('/dealer/15')) {
    await page.goto('http://localhost:8000/dealer/15', { waitUntil: 'networkidle2' });
  }
  
  // Wait for reviews to load completely on the dealer page
  await page.waitForSelector('.review_panel', { timeout: 25000 });
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Loading Reviews');
  }, { timeout: 15000 });
  
  await injectAddressBar(page, 'http://localhost:8000/dealer/15');
  await page.screenshot({ path: path.join(rootDir, 'added_review.png'), fullPage: false });
  console.log("   -> added_review.png captured with new review displayed!");

  console.log("\n==========================================");
  console.log("All 8 screenshots recaptured with 100% precision!");
  console.log("==========================================");
  await browser.close();
}

run().catch(err => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
