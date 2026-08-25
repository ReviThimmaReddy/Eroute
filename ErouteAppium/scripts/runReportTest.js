import Mocha from 'mocha';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runAppiumSuite() {
  console.log('====================================================');
  console.log('📱 RUNNING EROUTE MOBILE APPIUM E2E SUITE (1,111 TESTS)');
  console.log('====================================================');

  const mocha = new Mocha({
    timeout: 180000,
    reporter: 'spec',
  });

  const testFile = path.resolve(__dirname, '../tests/12_e2e/mega_android_1100.test.js');
  mocha.addFile(testFile);

  return new Promise((resolve) => {
    mocha.run((failures) => {
      console.log(`\n✨ Mobile Appium Suite execution completed with ${failures} failures.`);
      resolve(failures);
    });
  });
}

runAppiumSuite();
