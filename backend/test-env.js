const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log("Original process.env.MONGODB_URI:", process.env.MONGODB_URI);
  process.env.MONGODB_URI = uri;
  console.log("New process.env.MONGODB_URI:", process.env.MONGODB_URI);
  const { config } = require('./src/config/env');
  console.log("config.mongoUri:", config.mongoUri);
  await mongod.stop();
})();
