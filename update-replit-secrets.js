/**
 * Update Replit Secrets for Production
 * 
 * Run this to update your Replit deployment secrets.
 */

console.log('=== Replit Secrets Update Instructions ===');
console.log('');
console.log('1. Go to your Replit project');
console.log('2. Click on "Secrets" in the left sidebar (lock icon)');
console.log('3. Add or update these secrets:');
console.log('');
console.log('   SENDGRID_API_KEY = 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');
console.log('   DEFAULT_FROM_EMAIL = support@kickdeck.io');
console.log('   NODE_ENV = production');
console.log('');
console.log('4. Go to "Deployments" tab');
console.log('5. Click "Deploy" to create a new deployment with updated secrets');
console.log('');
console.log('6. Test the deployment by visiting:');
console.log('   https://app.kickdeck.io/api/admin/sendgrid/templates');
console.log('   (After logging in as admin)');
console.log('');
console.log('The deployment should now use the correct SendGrid API key.');
