import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { backfillUserApplicationsFromAts } from '../src/services/applicationBackfill.service';

const userId = process.argv[2];
const email = process.argv[3];
const fullName = process.argv[4] || '';

if (!userId || !email) {
  console.error('Usage: npx tsx scripts/run-backfill.ts <userId> <email> [fullName]');
  process.exit(1);
}

mongoose
  .connect(env.mongoUri)
  .then(() => backfillUserApplicationsFromAts(userId, email, fullName))
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
