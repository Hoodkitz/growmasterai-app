#!/usr/bin/env node

/**
 * Setup Validation Script
 * Checks if all required environment variables are configured
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 GrowMaster AI - Setup Validation\n');
console.log('═'.repeat(60));

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('   Run: cp .env.example .env');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  
  const match = trimmed.match(/^([A-Z_]+)=["']?(.*)["']?$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/["']$/, ''); // Remove trailing quotes
  }
});

// Required variables
const required = {
  DATABASE_URL: 'Database connection string',
  GEMINI_API_KEY: 'Google Gemini API key',
  JWT_SECRET: 'JWT secret (min 32 chars)',
  PORT: 'Server port',
  NODE_ENV: 'Node environment',
  EXPO_PUBLIC_API_URL: 'Expo API URL',
};

// Optional but recommended
const recommended = {
  REVENUECAT_API_KEY: 'RevenueCat subscription management',
  GOOGLE_CLIENT_ID: 'Google OAuth',
  OWNER_OPEN_ID: 'Admin access',
};

console.log('\n📋 Required Variables:\n');
let hasErrors = false;
let hasWarnings = false;

Object.entries(required).forEach(([key, description]) => {
  const value = envVars[key];
  const placeholder = 'your-' + key.toLowerCase().replace(/_/g, '-') + '-here';
  const isSet = value && value.length > 0 && value !== placeholder && !value.includes('TODO:');
  
  if (isSet) {
    console.log(`✅ ${key.padEnd(25)} ${description}`);
    
    // Additional validation
    if (key === 'JWT_SECRET' && value.length < 32) {
      console.log(`   ⚠️  Warning: JWT_SECRET should be at least 32 characters`);
      hasWarnings = true;
    }
    if (key === 'DATABASE_URL' && !value.startsWith('mysql://')) {
      console.log(`   ⚠️  Warning: DATABASE_URL should start with mysql://`);
      hasWarnings = true;
    }
  } else {
    console.log(`❌ ${key.padEnd(25)} ${description} - NOT SET!`);
    hasErrors = true;
  }
});

console.log('\n📋 Recommended Variables:\n');

Object.entries(recommended).forEach(([key, description]) => {
  const value = envVars[key];
  const isSet = value && value !== 'your-' + key.toLowerCase().replace(/_/g, '-') + '-here';
  
  if (isSet) {
    console.log(`✅ ${key.padEnd(25)} ${description}`);
  } else {
    console.log(`⚠️  ${key.padEnd(25)} ${description} - not set`);
    hasWarnings = true;
  }
});

console.log('\n' + '═'.repeat(60));

if (hasErrors) {
  console.log('\n❌ Setup incomplete! Please configure missing variables.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Setup complete with warnings. Review recommendations above.\n');
  process.exit(0);
} else {
  console.log('\n✅ Setup complete! All variables configured correctly.\n');
  process.exit(0);
}
