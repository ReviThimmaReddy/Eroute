import Mocha from 'mocha';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSeleniumSuite() {
  console.log('====================================================');
  console.log('🌐 RUNNING EROUTE WEB SELENIUM E2E SUITE (1,100 TESTS)');
  console.log('====================================================');

  const mocha = new Mocha({
    timeout: 120000,
    reporter: 'spec',
  });

  const testFile = path.resolve(__dirname, '../tests/mega_web_1100.test.js');
  mocha.addFile(testFile);

  return new Promise((resolve) => {
    mocha.run((failures) => {
      console.log(`\n✨ Web Selenium Suite execution completed with ${failures} failures.`);
      resolve(failures);
    });
  });
}

runSeleniumSuite();
