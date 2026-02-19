const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5000',
    headless: true,
  },
  webServer: {
    command: 'python app.py',
    url: 'http://localhost:5000',
    reuseExistingServer: true,
    timeout: 15000,
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
});
