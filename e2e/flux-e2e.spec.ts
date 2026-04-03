import { test, expect, BrowserContext, Page } from '@playwright/test';
import { connectToLocalNode } from './helpers/ad4m-auth';

let context: BrowserContext;
let page: Page;

test.describe.serial('Flux E2E on SPARQL', () => {

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('connect to local AD4M node', async () => {
    await connectToLocalNode(page);
    await page.screenshot({ path: 'e2e/screenshots/after-connect.png' });
  });

  test('verify app loads after auth', async () => {
    // After auth we should already be on the app — check for profile
    await expect(page.locator('.profile').first()).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: 'e2e/screenshots/after-load.png' });
  });

  test('create a community', async () => {
    // The "+" button is in the top-left sidebar — it might be an icon/SVG
    // Try multiple selectors
    const addCommunityBtn = page.locator('j-button:has-text("+"), button:has-text("+"), [class*="add"], [aria-label*="add"], [aria-label*="create"]').first();
    
    // If that doesn't work, try clicking by position — the + is at top-left
    try {
      await addCommunityBtn.click({ timeout: 5_000 });
    } catch {
      // Fall back to clicking by coordinates (the + is roughly at 45, 45)
      await page.click('body', { position: { x: 45, y: 45 } });
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/community-dialog.png' });

    // Click "Create a Community"
    await page.getByText('Create a Community').click({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/create-community-form.png' });

    // Enter community name — j-input is a web component with shadow DOM
    // Use click + keyboard.type as a reliable cross-shadow-DOM approach
    // Click right below "Name" label text to focus the input
    const nameLabel = page.getByText('Name', { exact: true });
    await nameLabel.waitFor({ state: 'visible', timeout: 10_000 });
    // Click below the label to focus the input field
    const nameBbox = await nameLabel.boundingBox();
    if (nameBbox) {
      await page.mouse.click(nameBbox.x + nameBbox.width / 2, nameBbox.y + nameBbox.height + 30);
    }
    await page.keyboard.type('E2E Test Community');

    // Click create button — it's a j-button at the bottom, shadow DOM text
    // Scroll the dialog down and click the purple button
    // Use evaluate to click the j-button with variant="primary" or find by slot text
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('j-button');
      for (const btn of buttons) {
        if (btn.textContent?.trim().toLowerCase().includes('create')) {
          (btn as HTMLElement).click();
          return;
        }
      }
      // Fallback: click the last j-button (likely the submit)
      if (buttons.length > 0) {
        (buttons[buttons.length - 1] as HTMLElement).click();
      }
    });

    // Wait for community to appear (neighbourhood publish is slow)
    await expect(page.getByText('E2E Test Community')).toBeVisible({ timeout: 240_000 });
    await page.screenshot({ path: 'e2e/screenshots/community-created.png' });
  });

  test('send a message in general channel', async () => {
    // Click into the community if not already there
    await page.getByText('E2E Test Community').click({ timeout: 15_000 });
    await page.waitForTimeout(3000);

    // Look for a general/default channel and click it
    const generalChannel = page.getByText('general').first();
    if (await generalChannel.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generalChannel.click();
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/channel-view.png' });

    // Find the message input
    const messageInput = page.locator('[contenteditable="true"], textarea, input[type="text"]').last();
    await messageInput.waitFor({ timeout: 15_000 });
    await messageInput.click();
    await page.keyboard.type('Hello from E2E tests!');
    await page.keyboard.press('Enter');

    // Verify message appears
    await expect(page.getByText('Hello from E2E tests!')).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: 'e2e/screenshots/message-sent.png' });
  });
});
