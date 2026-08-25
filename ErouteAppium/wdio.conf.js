import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  runner: 'local',
  port: 4723,
  specs: [
    './tests/**/*.test.js'
  ],
  maxInstances: 1,
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': 'Nexus_6_API_29',
    'appium:automationName': 'UiAutomator2',
    'appium:app': process.env.APK_PATH || path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk'),
    'appium:newCommandTimeout': 240,
  }],
  logLevel: 'warn',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ['appium'],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000
  }
};
