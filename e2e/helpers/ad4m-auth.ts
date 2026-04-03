import { readFileSync } from 'fs';
import { Page, expect } from '@playwright/test';

const STDOUT_LOG = process.env.AD4M_STDOUT_LOG ?? '/tmp/ad4m-e2e-stdout.log';

/**
 * Read the most recent 6-digit auth code from the executor stdout log.
 */
export function readAuthCode(logPath: string = STDOUT_LOG): string {
  const content = readFileSync(logPath, 'utf-8');
  const matches = content.match(/Random number challenge:\s*(\d{6})/g);
  if (!matches || matches.length === 0) {
    throw new Error(`No auth code found in ${logPath}`);
  }
  const last = matches[matches.length - 1];
  const code = last.match(/(\d{6})/)![1];
  return code;
}

/**
 * Complete the full ad4m-connect auth flow:
 * 1. Connect to local node
 * 2. Authorize
 * 3. Enter the 6-digit code
 * 4. Wait for the app to load (profile or home page)
 */
export async function connectToLocalNode(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Wait for the connect UI to load
  await page.getByText('Connect to Local Node').click({ timeout: 30_000 });

  // Click Authorize
  await page.getByText('Authorize').click({ timeout: 15_000 });

  // Small delay for code generation
  await page.waitForTimeout(2000);

  // Read the code
  const code = readAuthCode();

  // Enter the code — ad4m-connect may show 6 separate digit inputs or a single input
  const singleInput = page.locator('input[placeholder="000000"]');
  if (await singleInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await singleInput.fill(code);
  } else {
    // Multiple input boxes — click the first visible one and type all digits
    const firstInput = page.locator('input').first();
    await firstInput.click();
    await page.keyboard.type(code, { delay: 100 });
  }

  // Wait for the ad4m-connect dialog to disappear and app to load
  // Look for the profile "@" text which indicates we're in the app
  await expect(page.locator('.profile').first()).toBeVisible({ timeout: 30_000 });
}
