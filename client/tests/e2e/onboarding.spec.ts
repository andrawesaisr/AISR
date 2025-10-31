import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

test.describe('Workspace onboarding', () => {
  test('register, create workspace, project, task and document', async ({ page }) => {
    const email = `user-${randomUUID()}@example.com`;
    const password = 'Password123!';
    const workspaceName = 'QA Workspace';

    await page.goto('/');
    await page.getByRole('link', { name: /get started/i }).click();

    await page.getByLabel('Username').fill('owner-' + randomUUID().slice(0, 6));
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);

    const workspaceToggle = page.getByLabel('Create workspace');
    if (await workspaceToggle.isVisible()) {
      await workspaceToggle.check();
      const workspaceNameField = page.getByLabel('Workspace name');
      await workspaceNameField.waitFor({ state: 'visible' });
      await workspaceNameField.fill(workspaceName);
    }

    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: /quick actions/i })).toBeVisible();

    await page.getByRole('link', { name: 'Start a project', exact: true }).click();
    await page.waitForURL('**/new-project');

    await page.getByLabel('Project name *').fill('E2E Project');
    await page.getByRole('button', { name: /create project/i }).click();
    await page.waitForURL(/\/projects\//);
    await expect(page.getByRole('heading', { name: 'E2E Project' })).toBeVisible();

    await page.getByRole('button', { name: /new task/i }).click();
    await page.getByLabel('Title \*').fill('Board Task');
    await page.getByRole('button', { name: /create task/i }).click();
    await expect(page.getByText('Board Task')).toBeVisible();

    await page.getByRole('link', { name: /documents/i }).click();
    await page.waitForURL('**/documents');
    await page.getByRole('button', { name: /new document/i }).click();
    await page.getByLabel('Document title').fill('Test Meeting Notes');
    await page.getByLabel('Document type').selectOption('meeting');
    await page.getByPlaceholder('Add context or leave blank to start fresh in the editor.').fill('## Summary\n- Item one');
    await page.locator('form').getByRole('button', { name: 'Create document' }).click();
    await expect(page.getByText('Test Meeting Notes')).toBeVisible();
  });
});
