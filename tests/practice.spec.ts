import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function navigate(page: Page, title: string) {
  const opener = page.getByRole('button', {
    name: 'Open navigation',
    exact: true,
  });
  if (await opener.isVisible()) await opener.click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: title, exact: true })
    .click();
}
const correctOptions = [1, 0, 2, 1, 0, 2];
async function completePractice(page: Page, wrongFirst = false) {
  for (let i = 0; i < correctOptions.length; i++) {
    const choices = page
      .getByRole('group', { name: 'Answer choices' })
      .getByRole('button');
    await choices.nth(wrongFirst && i === 0 ? 0 : correctOptions[i]).click();
    await page.getByRole('button', { name: 'Submit Answer' }).click();
    await expect(
      page.getByRole('region', { name: 'Answer explanation' }),
    ).toBeVisible();
    await page
      .getByRole('button', {
        name: i === 5 ? 'Finish Practice' : 'Next Question',
      })
      .click();
  }
  await expect(
    page.getByRole('heading', { name: 'Practice complete!' }),
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('best scores and completion survive the history retention limit', async ({
  page,
}) => {
  await completePractice(page);
  await page.evaluate(() => {
    const key = 'retdemquest.progress.v1';
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.history = Array.from({ length: 100 }, () => ({
      id: 'wound',
      answers: [0, 1, 0, 0, 1, 0],
      completedAt: new Date().toISOString(),
    }));
    saved.bestRuns.wound = 0;
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await navigate(page, 'My Progress');
  await expect(page.getByText('300', { exact: true })).toBeVisible();
  await expect(page.getByText('2 / 3', { exact: true })).toBeVisible();
  await navigate(page, 'Achievements');
  await expect(
    page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'Perfect Practice' }) }),
  ).toContainText('Earned');
});

test('answers require a choice, feedback is accurate, and progress survives reload', async ({
  page,
}) => {
  await expect(
    page.getByRole('button', { name: 'Submit Answer' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'View Explanation' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'B Perform hand hygiene.' }).click();
  await page.getByRole('button', { name: 'Submit Answer' }).click();
  await expect(page.getByText('Well done! +50 pts')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Answer explanation' }),
  ).toContainText('Gloves do not replace hand hygiene.');
  await expect(
    page
      .getByRole('group', { name: 'Answer choices' })
      .getByRole('button')
      .first(),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Hide Explanation' }).click();
  await expect(
    page.getByRole('region', { name: 'Answer explanation' }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('QUESTION 2 OF 6')).toBeVisible();
  await page.getByRole('button', { name: 'Step 1, answered' }).click();
  await expect(page.getByText('Well done! +50 pts')).toBeVisible();
});

test('a complete run records real results and replays cannot multiply the best score', async ({
  page,
}) => {
  await completePractice(page, true);
  await expect(page.getByText('5 / 6', { exact: true })).toBeVisible();
  await expect(page.getByLabel('33% overall progress')).toBeVisible();
  await page.getByRole('button', { name: 'Practice again' }).click();
  await completePractice(page);
  await expect(page.getByText('6 / 6', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Practice again' }).click();
  await completePractice(page);
  await navigate(page, 'My Progress');
  await expect(page.getByText('300', { exact: true })).toBeVisible();
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await navigate(page, 'Achievements');
  await expect(page.locator('.badge-card.unlocked')).toHaveCount(2);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Practice complete!' }),
  ).toBeVisible();
});

test('all procedures can be completed and aggregate progress is correct', async ({
  page,
}) => {
  await completePractice(page);
  for (const title of ['Wound Dressing', 'Vital Signs Assessment']) {
    await navigate(page, 'Procedures');
    await page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      .getByRole('button', { name: 'Start Practice' })
      .click();
    await completePractice(page);
  }
  await expect(page.getByLabel('100% overall progress')).toBeVisible();
  await navigate(page, 'My Progress');
  await expect(page.getByText('3 / 3', { exact: true })).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await expect(page.getByText('900', { exact: true })).toBeVisible();
});

test('search, navigation, profile, notifications, and reset work', async ({
  page,
}) => {
  await navigate(page, 'Procedures');
  await page.getByRole('textbox', { name: 'Search procedures' }).fill('wound');
  await expect(page.getByRole('article')).toHaveCount(1);
  await page
    .getByRole('textbox', { name: 'Search procedures' })
    .fill('does not exist');
  await expect(
    page.getByRole('heading', { name: 'No procedures found' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Show all procedures' }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
  for (const title of [
    'My Progress',
    'Leaderboards',
    'Achievements',
    'Resources',
    'About',
  ]) {
    await navigate(page, title);
    await expect(
      page.getByRole('heading', { name: title, exact: true, level: 1 }),
    ).toBeVisible();
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'What should we call you?' })
    .fill('Alex');
  await page.getByRole('button', { name: 'Save Profile' }).click();
  await navigate(page, 'Dashboard');
  await page.getByRole('button', { name: 'B Perform hand hygiene.' }).click();
  await page.getByRole('button', { name: 'Submit Answer' }).click();
  await page
    .getByRole('button', { name: 'Notifications', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('You’re all caught up');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page
    .getByRole('button', { name: 'Reset progress', exact: true })
    .click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Reset progress', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Reset progress', exact: true })
    .click();
  await page.getByRole('button', { name: 'Yes, reset my progress' }).click();
  await expect(page.getByText('QUESTION 1 OF 6')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Submit Answer' }),
  ).toBeDisabled();
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'What should we call you?' }),
  ).toHaveValue('Alex');
});

test('malformed saved data recovers and no page overflows the viewport', async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem('retdemquest.progress.v1', '{broken'),
  );
  await page.reload();
  await expect(
    page.getByText('Saved progress could not be loaded.', { exact: false }),
  ).toBeVisible();
  for (const title of [
    'Dashboard',
    'Procedures',
    'My Progress',
    'Leaderboards',
    'Achievements',
    'Resources',
    'About',
  ]) {
    await navigate(page, title);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test('keyboard users can select answers and the dialog traps focus', async ({
  page,
}) => {
  const first = page
    .getByRole('group', { name: 'Answer choices' })
    .getByRole('button')
    .first();
  await first.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'B Perform hand hygiene.' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Close dialog' }),
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByRole('button', { name: 'Reset progress', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Close dialog' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Settings', exact: true }),
  ).toBeFocused();
});
