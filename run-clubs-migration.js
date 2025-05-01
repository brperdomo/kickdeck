import { createClubsTable } from './server/migrations/add_clubs_table.js';

// Run the migration
console.log('Running clubs table migration...');
createClubsTable()
  .then(result => {
    console.log('Migration completed:', result ? 'Successfully' : 'Failed');
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Migration failed with error:', err);
    process.exit(1);
  });