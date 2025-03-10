#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to find all test files
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Function to migrate a single file
function migrateFile(filePath) {
  console.log(`Migrating: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove Vitest imports
  content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]vitest['"]/g, (match, imports) => {
    // Don't replace if the imports contain things like 'describe', 'it', 'expect'
    // as these are globals in Jest
    return '';
  });

  // 2. Replace vi.fn() with jest.fn()
  content = content.replace(/vi\.fn\(\)/g, 'jest.fn()');

  // 3. Replace vi.mock() with jest.mock()
  content = content.replace(/vi\.mock\(/g, 'jest.mock(');

  // 4. Replace vi.spyOn() with jest.spyOn()
  content = content.replace(/vi\.spyOn\(/g, 'jest.spyOn(');

  // 5. Replace other vi methods
  content = content.replace(/vi\.clearAllMocks\(\)/g, 'jest.clearAllMocks()');
  content = content.replace(/vi\.resetAllMocks\(\)/g, 'jest.resetAllMocks()');
  content = content.replace(/vi\.restoreAllMocks\(\)/g, 'jest.restoreAllMocks()');

  // 6. Replace vi.setSystemTime() with jest.setSystemTime()
  content = content.replace(/vi\.setSystemTime\(/g, 'jest.useFakeTimers();\njest.setSystemTime(');

  // 7. Replace vi.useRealTimers() with jest.useRealTimers()
  content = content.replace(/vi\.useRealTimers\(\)/g, 'jest.useRealTimers()');

  // 8. Replace any other vi methods that might be used
  content = content.replace(/vi\./g, 'jest.');

  // Save the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Migrated: ${filePath}`);
}

// Main function
function main() {
  // Find all test files in src directory
  const testFiles = findTestFiles(path.join(process.cwd(), 'src'));
  console.log(`Found ${testFiles.length} test files`);

  // Migrate each file
  for (const filePath of testFiles) {
    migrateFile(filePath);
  }

  console.log('Migration completed!');
  console.log('Now run: pnpm test');
}

main();
