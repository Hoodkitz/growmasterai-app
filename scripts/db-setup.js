#!/usr/bin/env node

/**
 * Database Setup Helper
 * Tests connection and provides setup guidance
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🗄️  GrowMaster AI - Database Setup\n');
console.log('═'.repeat(60));

// Load DATABASE_URL from .env
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
let databaseUrl = '';

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('#') || !trimmed) return;
  const match = trimmed.match(/^DATABASE_URL=["']?(.*)["']?$/);
  if (match) {
    databaseUrl = match[1].replace(/^["']|["']$/g, '');
  }
});

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('📋 Database Configuration:\n');
console.log(`   URL: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);

// Parse DATABASE_URL
const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
  console.error('❌ Invalid DATABASE_URL format');
  console.log('   Expected: mysql://user:password@host:port/database');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

console.log(`   User: ${user}`);
console.log(`   Host: ${host}:${port}`);
console.log(`   Database: ${database}`);
console.log('');

// Test MySQL availability
console.log('🔍 Testing MySQL availability...\n');

exec('mysql --version', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ MySQL CLI not found!');
    console.log('\n📝 Installation Guide:');
    console.log('   Windows: Download from https://dev.mysql.com/downloads/mysql/');
    console.log('   macOS: brew install mysql');
    console.log('   Linux: sudo apt-get install mysql-server');
    process.exit(1);
  }

  console.log(`✅ MySQL CLI found: ${stdout.trim()}`);
  console.log('');

  // Test connection
  console.log('🔍 Testing database connection...\n');

  const testCmd = `mysql -u ${user} -p${password} -h ${host} -P ${port} -e "SELECT 1;" 2>&1`;
  
  exec(testCmd, (error, stdout, stderr) => {
    if (error || stderr.includes('ERROR')) {
      console.error('❌ Cannot connect to MySQL server!');
      console.log('\n📝 Troubleshooting:');
      console.log('   1. Check if MySQL is running:');
      console.log('      Windows: net start MySQL');
      console.log('      macOS: brew services start mysql');
      console.log('      Linux: sudo systemctl start mysql');
      console.log('');
      console.log('   2. Verify credentials in .env');
      console.log('   3. Check if MySQL port 3306 is accessible');
      console.log('');
      console.log('Error details:', stderr || error.message);
      process.exit(1);
    }

    console.log('✅ MySQL connection successful!\n');

    // Check if database exists
    const dbCheckCmd = `mysql -u ${user} -p${password} -h ${host} -P ${port} -e "SHOW DATABASES LIKE '${database}';" 2>&1`;
    
    exec(dbCheckCmd, (error, stdout, stderr) => {
      if (error || stderr.includes('ERROR')) {
        console.error('❌ Error checking database');
        process.exit(1);
      }

      if (stdout.includes(database)) {
        console.log(`✅ Database '${database}' exists\n`);
        console.log('🎯 Next Steps:');
        console.log('   1. Run migrations: pnpm db:push');
        console.log('   2. Start dev server: pnpm dev');
        console.log('');
      } else {
        console.log(`⚠️  Database '${database}' does not exist\n`);
        console.log('📝 Create database:');
        console.log(`   mysql -u ${user} -p${password}`);
        console.log(`   CREATE DATABASE ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log('');
        console.log('Or run: pnpm db:push (will create automatically)');
        console.log('');
      }

      console.log('═'.repeat(60));
      console.log('✅ Database setup check complete!\n');
    });
  });
});
