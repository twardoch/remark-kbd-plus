#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Get version from git tags following semantic versioning
 * @returns {string} Version string in semantic versioning format
 */
function getVersionFromGit() {
  try {
    // Get the latest git tag
    const latestTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
    
    if (!latestTag) {
      // No tags found, start with 0.1.0
      return '0.1.0';
    }
    
    // Validate that the tag follows semantic versioning
    const semverRegex = /^v?(\d+\.\d+\.\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    const match = latestTag.match(semverRegex);
    
    if (!match) {
      throw new Error(`Latest tag "${latestTag}" does not follow semantic versioning format`);
    }
    
    const version = match[1]; // Extract version without 'v' prefix
    
    // Check if we're exactly on a tag
    try {
      const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const tagCommit = execSync(`git rev-parse ${latestTag}`, { encoding: 'utf8' }).trim();
      
      if (currentCommit === tagCommit) {
        // We're exactly on a tag, use the tag version
        return version;
      } else {
        // We're ahead of the tag, add pre-release info
        const commitsSinceTag = execSync(`git rev-list --count ${latestTag}..HEAD`, { encoding: 'utf8' }).trim();
        const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
        
        if (commitsSinceTag === '0') {
          return version;
        } else {
          return `${version}-dev.${commitsSinceTag}+${shortHash}`;
        }
      }
    } catch (_error) {
      // If we can't get commit info, just use the tag version
      return version;
    }
  } catch (error) {
    // If git operations fail, use development version
    console.warn('Could not determine version from git tags:', error.message);
    return '0.1.0-dev';
  }
}

/**
 * Update package.json version
 * @param {string} version Version to set
 */
function updatePackageVersion(version) {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.version = version;
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Updated package.json version to ${version}`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const version = getVersionFromGit();
  updatePackageVersion(version);
  console.log(`Version: ${version}`);
}

export { getVersionFromGit, updatePackageVersion };