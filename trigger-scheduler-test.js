// Test the scheduler with direct import
import('../../server/services/simple-scheduler.ts').then(async (module) => {
  const { SimpleScheduler } = module;
  
  console.log('🧪 Testing getRealComplexesForEvent...');
  const result = await SimpleScheduler.getRealComplexesForEvent('1844329078');
  console.log('Result:', JSON.stringify(result, null, 2));
}).catch(console.error);