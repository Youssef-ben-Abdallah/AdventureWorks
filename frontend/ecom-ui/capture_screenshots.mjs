import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';

const mockOrders = [
  {
    id: 101,
    status: 1,
    total: 250.0,
    createdAtUtc: new Date().toISOString(),
    items: [
      { productName: 'Mountain Bike', qty: 1, unitPrice: 200, lineTotal: 200 },
      { productName: 'Helmet', qty: 1, unitPrice: 50, lineTotal: 50 }
    ]
  }
];

const WAIT_MS = 5000;
const FAST_WAIT = 1000;
const DASH_WAIT = 10000;
const CUBE_WAIT = 30000;

async function runTheme(theme) {
  console.log(`Processing theme: ${theme}`);
  const browser = await chromium.launch();

  // ----- CONTEXT 1: Normal User -----
  let context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  let page = await context.newPage();

  const setTheme = async (p) => {
    await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  };

  // 1. No Sign In
  await page.goto(`${BASE_URL}/`);
  await setTheme(page);
  await page.waitForTimeout(WAIT_MS);
  await page.screenshot({ path: `screenshot/${theme}/home_no_signin.png`, fullPage: true });

  await page.goto(`${BASE_URL}/products`);
  await setTheme(page);
  await page.waitForTimeout(WAIT_MS);
  await page.screenshot({ path: `screenshot/${theme}/products_no_signin.png`, fullPage: true });

  // 2. Sign up page
  await page.goto(`${BASE_URL}/login`);
  await setTheme(page);
  await page.waitForTimeout(WAIT_MS);
  
  await page.click('button[data-testid="mode-register"]');
  await page.waitForTimeout(FAST_WAIT);
  await page.screenshot({ path: `screenshot/${theme}/login_register.png`, fullPage: true });

  // 3. Normal User Home
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token-for-ui');
    localStorage.setItem('role', 'User');
    localStorage.setItem('username', 'TestUser');
  });
  await page.goto(`${BASE_URL}/`);
  await setTheme(page);
  await page.waitForTimeout(WAIT_MS);
  await page.screenshot({ path: `screenshot/${theme}/home_user.png`, fullPage: true });

  // Normal User Add to Cart
  await page.goto(`${BASE_URL}/products`);
  await setTheme(page);
  await page.waitForTimeout(WAIT_MS);
  
  if (await page.locator('[data-testid="product-add-to-cart"]:not([disabled])').count() > 0) {
    await page.locator('[data-testid="product-add-to-cart"]:not([disabled])').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/products_user_added_to_cart.png`, fullPage: true });

    await page.goto(`${BASE_URL}/cart`);
    await setTheme(page);
    await page.waitForTimeout(WAIT_MS);
    await page.screenshot({ path: `screenshot/${theme}/cart_user.png`, fullPage: true });
  }

  await context.close();

  // ----- CONTEXT 2: Admin User -----
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await context.newPage();

  // Intercept orders just in case
  await page.route('**/api/orders/my', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrders) }));
  await page.route('**/api/orders', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrders) }));

  await page.goto(`${BASE_URL}/login`);
  await setTheme(page);
  
  // Login as admin
  await page.fill('[data-testid="login-username"]', 'admin');
  await page.fill('[data-testid="login-password"]', 'Admin123!');
  await page.click('[data-testid="auth-submit"]');
  await page.waitForTimeout(3000);

  // Base Pages
  const pages = [
    { name: 'home_admin', url: '/' },
    { name: 'products', url: '/products' },
    { name: 'cart', url: '/cart' },
    { name: 'orders', url: '/orders' }
  ];
  for (const p of pages) {
    await page.goto(`${BASE_URL}${p.url}`);
    await setTheme(page);
    await page.waitForTimeout(WAIT_MS);
    await page.screenshot({ path: `screenshot/${theme}/${p.name}.png`, fullPage: true });
  }

  // Dashboard Tabs (10s wait)
  await page.goto(`${BASE_URL}/dashboard`);
  await setTheme(page);
  await page.waitForTimeout(WAIT_MS);
  let dashTabs = page.locator('.tab-button');
  let dashCount = await dashTabs.count();
  for (let i = 0; i < dashCount; i++) {
    await dashTabs.nth(i).click();
    console.log(`[${theme}] Dashboard tab ${i} - Waiting ${DASH_WAIT}ms...`);
    await page.waitForTimeout(DASH_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/dashboard_tab_${i}.png`, fullPage: true });
  }

  // Cube Insights Tabs (30s wait)
  await page.goto(`${BASE_URL}/cube-insights`);
  await setTheme(page);
  await page.waitForTimeout(WAIT_MS);
  let cubeTabs = page.locator('.ci-tabs .tab-button');
  let cubeCount = await cubeTabs.count();
  for (let i = 0; i < cubeCount; i++) {
    await cubeTabs.nth(i).click();
    console.log(`[${theme}] Cube Insights tab ${i} - Waiting ${CUBE_WAIT}ms...`);
    await page.waitForTimeout(CUBE_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/cube_insights_tab_${i}.png`, fullPage: true });
  }

  // Admin Dashboard Lists & Modals
  await page.goto(`${BASE_URL}/admin`);
  await setTheme(page);
  await page.waitForTimeout(WAIT_MS);

  const closeEsc = async () => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(FAST_WAIT);
  };

  // Categories
  await page.locator('[data-testid="admin-tab-categories"]').click();
  await page.waitForTimeout(WAIT_MS);
  await page.screenshot({ path: `screenshot/${theme}/admin_list_categories.png`, fullPage: true });
  
  await page.locator('.admin-section.visible .btn-primary-glow').click();
  await page.waitForTimeout(FAST_WAIT);
  await page.screenshot({ path: `screenshot/${theme}/admin_cat_modal_new.png`, fullPage: true });
  await closeEsc();
  
  if (await page.locator('.admin-section.visible .tbl-btn:has-text("Edit")').count() > 0) {
    await page.locator('.admin-section.visible .tbl-btn:has-text("Edit")').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/admin_cat_modal_edit.png`, fullPage: true });
    await closeEsc();
    
    await page.locator('.admin-section.visible .tbl-btn-danger:has-text("Del")').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/admin_cat_modal_del.png`, fullPage: true });
    await closeEsc();
  }

  // Sub-categories
  await page.locator('[data-testid="admin-tab-subcategories"]').click();
  await page.waitForTimeout(WAIT_MS);
  await page.screenshot({ path: `screenshot/${theme}/admin_list_subcategories.png`, fullPage: true });
  
  await page.locator('.admin-section.visible .btn-primary-glow').click();
  await page.waitForTimeout(FAST_WAIT);
  await page.screenshot({ path: `screenshot/${theme}/admin_subcat_modal_new.png`, fullPage: true });
  await closeEsc();
  
  if (await page.locator('.admin-section.visible .tbl-btn:has-text("Edit")').count() > 0) {
    await page.locator('.admin-section.visible .tbl-btn:has-text("Edit")').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/admin_subcat_modal_edit.png`, fullPage: true });
    await closeEsc();
    
    await page.locator('.admin-section.visible .tbl-btn-danger:has-text("Del")').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/admin_subcat_modal_del.png`, fullPage: true });
    await closeEsc();
  }

  // Products
  await page.locator('[data-testid="admin-tab-products"]').click();
  await page.waitForTimeout(WAIT_MS);
  await page.screenshot({ path: `screenshot/${theme}/admin_list_products.png`, fullPage: true });
  
  await page.locator('.admin-section.visible .btn-primary-glow').click();
  await page.waitForTimeout(FAST_WAIT);
  await page.screenshot({ path: `screenshot/${theme}/admin_prod_modal_new.png`, fullPage: true });
  await closeEsc();
  
  if (await page.locator('.admin-section.visible .tbl-btn:has-text("Edit")').count() > 0) {
    await page.locator('.admin-section.visible .tbl-btn:has-text("Edit")').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/admin_prod_modal_edit.png`, fullPage: true });
    await closeEsc();
    
    await page.locator('.admin-section.visible .tbl-btn-danger:has-text("Del")').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/admin_prod_modal_del.png`, fullPage: true });
    await closeEsc();
  }

  // Orders
  await page.locator('[data-testid="admin-tab-orders"]').click();
  await page.waitForTimeout(WAIT_MS);
  await page.screenshot({ path: `screenshot/${theme}/admin_list_orders.png`, fullPage: true });
  
  if (await page.locator('.admin-section.visible .tbl-btn:has-text("Ticket")').count() > 0) {
    await page.locator('.admin-section.visible .tbl-btn:has-text("Ticket")').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/admin_order_ticket.png`, fullPage: true });
    await closeEsc();
    
    await page.locator('.admin-section.visible .tbl-btn-danger:has-text("Del")').first().click();
    await page.waitForTimeout(FAST_WAIT);
    await page.screenshot({ path: `screenshot/${theme}/admin_order_modal_del.png`, fullPage: true });
    await closeEsc();
  }

  await browser.close();
}

async function runAll() {
  if (!fs.existsSync('screenshot/dark')) fs.mkdirSync('screenshot/dark', { recursive: true });
  if (!fs.existsSync('screenshot/light')) fs.mkdirSync('screenshot/light', { recursive: true });

  await runTheme('light');
  await runTheme('dark');
  console.log('All screenshots completed.');
}

runAll().catch(console.error);
