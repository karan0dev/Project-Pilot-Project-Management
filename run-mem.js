const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
  const dbDir = path.join(__dirname, '.db-data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log('Starting in-memory MongoDB server (Replica Set)...');
  const mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1, dbName: 'projectpilot' },
    instanceOpts: [
      {
        dbPath: dbDir,
        storageEngine: 'wiredTiger'
      }
    ]
  });
  const uri = mongod.getUri();
  console.log(`\n======================================================`);
  console.log(`🟢 In-memory MongoDB started at: ${uri}`);
  console.log(`======================================================\n`);

  // Set MONGO_URI in process.env so it's inherited by child processes
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'insecure_development_secret_key';
  process.env.PORT = process.env.PORT || '5000';

  console.log('Seeding standard mock data...');
  const seed = spawn('node', [path.join(__dirname, 'seed.js')], {
    env: process.env,
    stdio: 'inherit'
  });

  seed.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Standard seeding failed with code ${code}. Exiting.`);
      mongod.stop();
      process.exit(code);
    }

    console.log('Seeding Karandeep profile data...');
    const seedKD = spawn('node', [path.join(__dirname, 'scripts', 'seedKarandeepProfile.js')], {
      env: process.env,
      stdio: 'inherit'
    });

    seedKD.on('close', (codeKD) => {
      if (codeKD !== 0) {
        console.error(`❌ Karandeep seeding failed with code ${codeKD}. Exiting.`);
        mongod.stop();
        process.exit(codeKD);
      }

      console.log('\n🟢 All database seeds completed successfully. Starting application server...\n');

      // Run the development server (node server.js)
      const server = spawn('node', [path.join(__dirname, 'server.js')], {
        env: process.env,
        stdio: 'inherit'
      });

      // Handle termination of parent process
      const cleanup = async () => {
        console.log('\nStopping servers and cleaning up in-memory database...');
        server.kill('SIGINT');
        await mongod.stop();
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    });
  });
}

main().catch(err => {
  console.error('❌ Failed to start in-memory project pilot:', err);
});
