import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loglens');
  const Project = mongoose.connection.collection('projects');
  let project = await Project.findOne();
  if (!project) {
    console.log("No project found. Creating one...");
    const res = await Project.insertOne({ name: 'Test Project', apiKey: 'test_api_key_123', createdAt: new Date(), updatedAt: new Date() });
    console.log("Created project with ID:", res.insertedId);
    project = await Project.findOne({ _id: res.insertedId });
  }
  console.log("API_KEY=" + project.apiKey);
  console.log("PROJECT_ID=" + project._id.toString());
  
  process.exit(0);
}
run().catch(console.error);
