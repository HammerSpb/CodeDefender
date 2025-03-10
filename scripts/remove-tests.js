#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

// Function to remove a file
function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    console.error(`Error removing file ${filePath}:`, err);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting test file removal...');
  
  // Find all test files in src directory
  const testFiles = findTestFiles(path.join(process.cwd(), 'src'));
  console.log(`Found ${testFiles.length} test files to remove`);

  // Track removal statistics
  let removedCount = 0;
  let failedCount = 0;

  // Remove each file
  for (const filePath of testFiles) {
    console.log(`Removing: ${filePath}`);
    if (removeFile(filePath)) {
      removedCount++;
    } else {
      failedCount++;
    }
  }

  // Remove test-related folders if they exist
  const testFolders = [
    path.join(process.cwd(), 'src/test'),
    path.join(process.cwd(), 'test')
  ];

  for (const folderPath of testFolders) {
    if (fs.existsSync(folderPath)) {
      try {
        // Recursive removal of directory - BE CAREFUL with this!
        // This is a simple implementation - in production you'd want to use a safer method
        const removeDir = (dir) => {
          if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((file) => {
              const curPath = path.join(dir, file);
              if (fs.lstatSync(curPath).isDirectory()) {
                removeDir(curPath);
              } else {
                fs.unlinkSync(curPath);
              }
            });
            fs.rmdirSync(dir);
          }
        };
        
        removeDir(folderPath);
        console.log(`Removed test folder: ${folderPath}`);
      } catch (err) {
        console.error(`Error removing folder ${folderPath}:`, err);
      }
    }
  }

  // Print summary
  console.log('\nRemoval Complete!');
  console.log(`Successfully removed: ${removedCount} files`);
  if (failedCount > 0) {
    console.log(`Failed to remove: ${failedCount} files`);
  }
  
  console.log('\nNext Steps:');
  console.log('1. Update package.json to include only necessary test scripts');
  console.log('2. Create new Jest configuration files if needed');
  console.log('3. Start writing new tests using Jest');
}

main();
