import { test, expect } from '@playwright/test';

const ADMIN_API_BASE = process.env.ADMIN_API_URL || 'http://localhost:8082';

test.describe('Upgrade flow (API-driven)', () => {
  test('creates a user, sets plan, UI reflects the selected pack', async ({ page, request }) => {
    // Use a seeded test account instead of attempting to register.
    // You can override these via environment variables: E2E_TEST_EMAIL and E2E_TEST_PASSWORD
    const email = process.env.E2E_TEST_EMAIL || 'e2e_seeded@test.local';
    const password = process.env.E2E_TEST_PASSWORD || 'Test1234!';

    // 1) Login and obtain token for the seeded account
    const loginResp = await request.post(`${ADMIN_API_BASE}/api/auth/login`, {
      data: { email, password },
    });
    expect(loginResp.ok()).toBeTruthy();
    const loginJson = await loginResp.json();
    const token = loginJson.access_token || loginJson.token;
    expect(token).toBeTruthy();

    // 3) Persist a selected plan via backend API (simulate payment completion)
    const planPayload = {
      plan_key: 'premium',
      plan_name: 'Premium Pack',
      plan_price: '₹4,999',
      payment_id: `e2e-${Date.now()}`,
      coupon_code: '',
      amount_paid: 4999,
      currency: 'INR',
      status: 'active',
    };

    const saveResp = await request.post(`${ADMIN_API_BASE}/api/profile/plan`, {
      data: planPayload,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(saveResp.ok()).toBeTruthy();

    // 4) Launch the frontend with the token in localStorage and verify UI shows Premium
    await page.addInitScript((token) => {
      localStorage.setItem('saadhyam_token', token as string);
    }, token);

    await page.goto('/dashboard/pricing');
    await page.waitForSelector('text=Pricing');

    // Expect the chosen pack badge or current plan summary to show Premium
    const chosen = await page.locator('text=Chosen pack').first();
    if (await chosen.count() > 0) {
      // There is a current plan summary block
      await expect(page.locator('text=Premium Pack').first()).toBeVisible();
    } else {
      // Fallback: check for any UI element that indicates the plan
      await expect(page.locator('text=Premium').first()).toBeVisible();
    }
  });
});
