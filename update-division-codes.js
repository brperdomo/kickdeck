import { updateDivisionCodes } from './server/migrations/update_division_codes.js';

// Run the migration directly
console.log('Starting division code migration...');
updateDivisionCodes()
  .then(success => {
    console.log(`Division code migration ${success ? 'completed successfully' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error during division code migration:', error);
    process.exit(1);
  });