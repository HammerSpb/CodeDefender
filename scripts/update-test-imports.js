#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to find test files
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist' && file !== 'test') {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Function to check if file already has fixed imports
function hasFixedImports(content) {
  return content.includes('../test/jest.setup') || 
         content.includes('../test/test-helpers');
}

// Function to add imports to a file
function updateImportsInFile(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already fixed
  if (hasFixedImports(content)) {
    console.log(`File already has fixed imports: ${filePath}`);
    return;
  }

  // Remove old incorrect imports
  content = content.replace(/import\s+{[^}]*}\s+from\s+['"]..\/..\/test\/jest.setup['"];?\n?/g, '');
  content = content.replace(/import\s+{[^}]*}\s+from\s+['"]..\/..\/test\/test-helpers['"];?\n?/g, '');
  
  // Common local declarations to handle
  const hasLocalUserRole = content.includes('const UserRole =');
  const hasLocalScanStatus = content.includes('const ScanStatus =');
  const hasLocalRepositoryProvider = content.includes('const RepositoryProvider =');
  const hasLocalWorkspaceRole = content.includes('const WorkspaceRole =');
  
  // Prepare imports based on what's needed
  const imports = [];
  
  // Only import what's not locally declared
  const enumImports = [];
  if (!hasLocalUserRole) enumImports.push('UserRole');
  if (!hasLocalScanStatus) enumImports.push('ScanStatus');
  if (!hasLocalRepositoryProvider) enumImports.push('RepositoryProvider');
  if (!hasLocalWorkspaceRole) enumImports.push('WorkspaceRole');
  
  if (enumImports.length > 0) {
    imports.push(`import { ${enumImports.join(', ')} } from '../test/jest.setup';`);
  }
  
  // Helper imports
  imports.push(`import { 
  mockWithRequiredFields, 
  createMockPrismaService,
  createMockAuthService,
  createMockAuditLogsService,
  createMockScansService,
  createMockUsersService,
  createMockRepositoriesService,
  createMockWorkspacesService,
  createMockSchedulesService
} from '../test/test-helpers';`);

  // Find a good place to add the imports
  const lines = content.split('\n');
  let lastImportLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportLine = i;
    }
  }

  if (lastImportLine >= 0) {
    // Add imports after last import line
    lines.splice(lastImportLine + 1, 0, imports.join('\n'));
    content = lines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added imports to: ${filePath}`);
  } else {
    // Add imports at the beginning if no imports found
    content = imports.join('\n') + '\n' + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added imports to top of: ${filePath}`);
  }
}

// Function to fix enum usage in tests
function fixEnumUsage(filePath) {
  console.log(`Fixing enum usage in: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only proceed if we've already added the imports
  if (!hasFixedImports(content)) {
    console.log(`Skipping enum fixes for: ${filePath} - run updateImports first`);
    return;
  }
  
  // Common enum string replacements
  const replacements = [
    { pattern: /provider:\s*['"]GITHUB['"]/, replacement: 'provider: RepositoryProvider.GITHUB' },
    { pattern: /provider:\s*['"]GITLAB['"]/, replacement: 'provider: RepositoryProvider.GITLAB' },
    { pattern: /provider:\s*['"]BITBUCKET['"]/, replacement: 'provider: RepositoryProvider.BITBUCKET' },
    { pattern: /role:\s*['"]SUPER['"]/, replacement: 'role: UserRole.SUPER' },
    { pattern: /role:\s*['"]OWNER['"]/, replacement: 'role: UserRole.OWNER' },
    { pattern: /role:\s*['"]ADMIN['"]/, replacement: 'role: UserRole.ADMIN' },
    { pattern: /role:\s*['"]MEMBER['"]/, replacement: 'role: UserRole.MEMBER' },
    { pattern: /role:\s*['"]SUPPORT['"]/, replacement: 'role: UserRole.SUPPORT' },
    { pattern: /ScanStatus\.QUEUED/, replacement: 'ScanStatus.QUEUED' },
    { pattern: /ScanStatus\.RUNNING/, replacement: 'ScanStatus.RUNNING' },
    { pattern: /ScanStatus\.COMPLETED/, replacement: 'ScanStatus.COMPLETED' },
    { pattern: /ScanStatus\.FAILED/, replacement: 'ScanStatus.FAILED' },
  ];
  
  // Apply all replacements
  replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(new RegExp(pattern, 'g'), replacement);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed enum usage in: ${filePath}`);
}

// Function to update mock object creation
function updateMockCreation(filePath) {
  console.log(`Updating mock creation in: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only proceed if we've already added the imports
  if (!hasFixedImports(content)) {
    console.log(`Skipping mock updates for: ${filePath} - run updateImports first`);
    return;
  }
  
  // Common mock creation patterns with better replacements
  const replacements = [
    { 
      pattern: /const mockAuthService = {\s*login: jest\.fn\(\)(,|)\s*};/g, 
      replacement: 'const mockAuthService = createMockAuthService();' 
    },
    { 
      pattern: /const mockAuditLogsService = {[^}]*};/g, 
      replacement: 'const mockAuditLogsService = createMockAuditLogsService();' 
    },
    { 
      pattern: /const mockScansService = {[^}]*};/g, 
      replacement: 'const mockScansService = createMockScansService();' 
    },
    { 
      pattern: /const mockUsersService = {[^}]*};/g, 
      replacement: 'const mockUsersService = createMockUsersService();' 
    },
    { 
      pattern: /const mockRepositoriesService = {[^}]*};/g, 
      replacement: 'const mockRepositoriesService = createMockRepositoriesService();' 
    },
    { 
      pattern: /const mockWorkspacesService = {[^}]*};/g, 
      replacement: 'const mockWorkspacesService = createMockWorkspacesService();' 
    },
    { 
      pattern: /const mockSchedulesService = {[^}]*};/g, 
      replacement: 'const mockSchedulesService = createMockSchedulesService();' 
    },
    { 
      pattern: /const mockPrismaService = {[^}]*};/g, 
      replacement: 'const mockPrismaService = createMockPrismaService();' 
    },
  ];
  
  // Apply all replacements (be careful with this)
  for (const { pattern, replacement } of replacements) {
    // Using split and join instead of replace to handle large replacement blocks better
    const parts = content.split(pattern);
    if (parts.length > 1) {
      content = parts.join(replacement);
      console.log(`  - Applied replacement: ${replacement}`);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated mock creation in: ${filePath}`);
}

// Main function
function main() {
  const command = process.argv[2] || 'all';
  
  // Find all test files
  const testFiles = findTestFiles(path.join(process.cwd(), 'src'));
  console.log(`Found ${testFiles.length} test files`);

  if (command === 'imports' || command === 'all') {
    // Update imports in each file
    for (const filePath of testFiles) {
      updateImportsInFile(filePath);
    }
  }

  if (command === 'enums' || command === 'all') {
    // Fix enum usage in each file
    for (const filePath of testFiles) {
      fixEnumUsage(filePath);
    }
  }

  if (command === 'mocks' || command === 'all') {
    // Update mock creation in each file
    for (const filePath of testFiles) {
      updateMockCreation(filePath);
    }
  }

  console.log('Processing completed!');
  console.log('You may still need to manually fix some specific issues.');
}

main();
