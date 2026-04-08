# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flux-e2e.spec.ts >> Flux E2E on SPARQL >> create a community
- Location: e2e/flux-e2e.spec.ts:29:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E Test Community')
Expected: visible
Timeout: 240000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 240000ms
  - waiting for getByText('E2E Test Community')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic "Create or join community" [ref=e7]:
      - button "plus" [ref=e11] [cursor=pointer]:
        - img "plus" [ref=e13]: 
    - generic:
      - generic:
        - generic [ref=e16]:
          - generic:
            - generic [ref=e18]:
              - generic:
                - generic "Go to profile" [ref=e19]:
                  - button [ref=e22] [cursor=pointer]:
                    - img [ref=e23]
                - generic [ref=e28]:
                  - generic:
                    - generic "Go to profile" [ref=e29]
                    - generic "Set agent status" [ref=e30]:
                      - generic [ref=e34] [cursor=pointer]:
                        - generic [ref=e40]:
                          - generic: active
                        - generic:
                          - generic: active
                          - generic: asleep
                          - generic: busy
                          - generic: invisible
            - generic "Open app settings" [ref=e43]:
              - img "gear" [ref=e47]: 
        - generic:
          - generic:
            - button:
              - generic:
                - img: 
            - generic:
              - generic: Unknown user
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - button:
                              - generic:
                                - img: 
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - button:
                              - generic:
                                - img: 
            - generic:
              - generic:
                - generic:
                  - checkbox [disabled]
              - generic:
                - button [disabled]
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - img: 
            - generic:
              - button:
                - generic:
                  - img: 
            - generic:
              - generic:
                - img: 
    - main [ref=e48]:
      - generic [ref=e49]:
        - generic [ref=e52]:
          - generic [ref=e53]:
            - generic [ref=e54]:
              - generic [ref=e55] [cursor=pointer]:
                - button [ref=e56]:
                  - img [ref=e57]
                - img "pen" [ref=e63]: 
              - button "pen" [ref=e65] [cursor=pointer]:
                - img "pen" [ref=e67]: 
            - generic [ref=e70]:
              - generic: "@"
          - generic [ref=e75]:
            - generic:
              - tablist [ref=e77]:
                - generic:
                  - tab "Web2" [ref=e79] [cursor=pointer]:
                    - generic [ref=e80]:
                      - generic: Web2
                  - tab "Web3" [selected] [ref=e82] [cursor=pointer]:
                    - generic [ref=e83]:
                      - generic: Web3
              - link "plus Add" [ref=e88] [cursor=pointer]:
                - /url: https://dapp.ad4m.dev/
                - generic [ref=e90]:
                  - generic:
                    - img "plus" [ref=e92]: 
                    - text: Add
        - img "layout-sidebar" [ref=e97] [cursor=pointer]: 
      - generic:
        - generic:
          - generic:
            - generic: Edit profile
            - generic:
              - generic: Upload image
            - generic:
              - generic: Upload image
            - generic: Username
            - generic: Bio
            - generic:
              - generic: Cancel
              - generic: Save
      - generic:
        - generic:
          - generic:
            - generic: Add a link to your profile
            - generic: Web link
            - generic:
              - generic: Cancel
              - generic: Add link
      - generic [ref=e101]:
        - button [ref=e102] [cursor=pointer]:
          - img [ref=e103]
        - generic [ref=e109]:
          - generic:
            - button "arrow-left-short Back" [disabled] [ref=e111]:
              - generic:
                - img "arrow-left-short" [ref=e113]: 
                - text: Back
            - generic [ref=e115]:
              - generic [ref=e116]:
                - generic: Your community is being created
              - generic [ref=e117]:
                - generic: Please be patient, this might take a while right now.
              - img [ref=e122]
      - generic:
        - generic: Voice & Video
        - generic: Transcription
        - generic: Connection
        - generic:
          - generic:
            - generic: Video input device
            - option
        - generic:
          - generic: Audio input device
          - option
  - generic:
    - generic:
      - generic:
        - generic:
          - generic:
            - generic: Cancel
            - generic: Ok
  - button "Open settings" [ref=e132] [cursor=pointer]:
    - img [ref=e133]
```

# Test source

```ts
  1   | import { test, expect, BrowserContext, Page } from '@playwright/test';
  2   | import { connectToLocalNode } from './helpers/ad4m-auth';
  3   | 
  4   | let context: BrowserContext;
  5   | let page: Page;
  6   | 
  7   | test.describe.serial('Flux E2E on SPARQL', () => {
  8   | 
  9   |   test.beforeAll(async ({ browser }) => {
  10  |     context = await browser.newContext();
  11  |     page = await context.newPage();
  12  |   });
  13  | 
  14  |   test.afterAll(async () => {
  15  |     await context?.close();
  16  |   });
  17  | 
  18  |   test('connect to local AD4M node', async () => {
  19  |     await connectToLocalNode(page);
  20  |     await page.screenshot({ path: 'e2e/screenshots/after-connect.png' });
  21  |   });
  22  | 
  23  |   test('verify app loads after auth', async () => {
  24  |     // After auth we should already be on the app — check for profile
  25  |     await expect(page.locator('.profile').first()).toBeVisible({ timeout: 30_000 });
  26  |     await page.screenshot({ path: 'e2e/screenshots/after-load.png' });
  27  |   });
  28  | 
  29  |   test('create a community', async () => {
  30  |     // The "+" button is in the top-left sidebar — it might be an icon/SVG
  31  |     // Try multiple selectors
  32  |     const addCommunityBtn = page.locator('j-button:has-text("+"), button:has-text("+"), [class*="add"], [aria-label*="add"], [aria-label*="create"]').first();
  33  |     
  34  |     // If that doesn't work, try clicking by position — the + is at top-left
  35  |     try {
  36  |       await addCommunityBtn.click({ timeout: 5_000 });
  37  |     } catch {
  38  |       // Fall back to clicking by coordinates (the + is roughly at 45, 45)
  39  |       await page.click('body', { position: { x: 45, y: 45 } });
  40  |     }
  41  |     await page.waitForTimeout(2000);
  42  |     await page.screenshot({ path: 'e2e/screenshots/community-dialog.png' });
  43  | 
  44  |     // Click "Create a Community"
  45  |     await page.getByText('Create a Community').click({ timeout: 10_000 });
  46  |     await page.waitForTimeout(2000);
  47  |     await page.screenshot({ path: 'e2e/screenshots/create-community-form.png' });
  48  | 
  49  |     // Enter community name — j-input is a web component with shadow DOM
  50  |     // Use click + keyboard.type as a reliable cross-shadow-DOM approach
  51  |     // Click right below "Name" label text to focus the input
  52  |     const nameLabel = page.getByText('Name', { exact: true });
  53  |     await nameLabel.waitFor({ state: 'visible', timeout: 10_000 });
  54  |     // Click below the label to focus the input field
  55  |     const nameBbox = await nameLabel.boundingBox();
  56  |     if (nameBbox) {
  57  |       await page.mouse.click(nameBbox.x + nameBbox.width / 2, nameBbox.y + nameBbox.height + 30);
  58  |     }
  59  |     await page.keyboard.type('E2E Test Community');
  60  | 
  61  |     // Click create button — it's a j-button at the bottom, shadow DOM text
  62  |     // Scroll the dialog down and click the purple button
  63  |     // Use evaluate to click the j-button with variant="primary" or find by slot text
  64  |     await page.evaluate(() => {
  65  |       const buttons = document.querySelectorAll('j-button');
  66  |       for (const btn of buttons) {
  67  |         if (btn.textContent?.trim().toLowerCase().includes('create')) {
  68  |           (btn as HTMLElement).click();
  69  |           return;
  70  |         }
  71  |       }
  72  |       // Fallback: click the last j-button (likely the submit)
  73  |       if (buttons.length > 0) {
  74  |         (buttons[buttons.length - 1] as HTMLElement).click();
  75  |       }
  76  |     });
  77  | 
  78  |     // Wait for community to appear (neighbourhood publish is slow)
> 79  |     await expect(page.getByText('E2E Test Community')).toBeVisible({ timeout: 240_000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  80  |     await page.screenshot({ path: 'e2e/screenshots/community-created.png' });
  81  |   });
  82  | 
  83  |   test('send a message in general channel', async () => {
  84  |     // Click into the community if not already there
  85  |     await page.getByText('E2E Test Community').click({ timeout: 15_000 });
  86  |     await page.waitForTimeout(3000);
  87  | 
  88  |     // Look for a general/default channel and click it
  89  |     const generalChannel = page.getByText('general').first();
  90  |     if (await generalChannel.isVisible({ timeout: 5_000 }).catch(() => false)) {
  91  |       await generalChannel.click();
  92  |     }
  93  |     await page.waitForTimeout(2000);
  94  |     await page.screenshot({ path: 'e2e/screenshots/channel-view.png' });
  95  | 
  96  |     // Find the message input
  97  |     const messageInput = page.locator('[contenteditable="true"], textarea, input[type="text"]').last();
  98  |     await messageInput.waitFor({ timeout: 15_000 });
  99  |     await messageInput.click();
  100 |     await page.keyboard.type('Hello from E2E tests!');
  101 |     await page.keyboard.press('Enter');
  102 | 
  103 |     // Verify message appears
  104 |     await expect(page.getByText('Hello from E2E tests!')).toBeVisible({ timeout: 30_000 });
  105 |     await page.screenshot({ path: 'e2e/screenshots/message-sent.png' });
  106 |   });
  107 | });
  108 | 
```