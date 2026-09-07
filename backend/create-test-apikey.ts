import mongoose from 'mongoose';
import crypto from 'crypto';

const URI = "mongodb+srv://tharunvarshans087_db_user:7mXUjJrJjb0NXr03@cluster0.gq61gyv.mongodb.net/?appName=Cluster0";
const rawKey = 'll_live_test_apikey_12345';
const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

async function run() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const projectId = new mongoose.Types.ObjectId('6a4fc18c5acef4bd21e342a5');
  const userId = new mongoose.Types.ObjectId('6a4e18611131c0930add7960');
  
  await db!.collection('apikeys').insertOne({
    name: 'CLI Test Key',
    hashedKey: hashedKey,
    prefix: 'll_test_',
    projectId: projectId,
    createdBy: userId,
    revoked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  });

  console.log("Inserted test API Key.");
  console.log("API_KEY:", rawKey);
  process.exit(0);
}
run().catch(console.error);
