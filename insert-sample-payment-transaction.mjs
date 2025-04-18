/**
 * Insert Sample Payment Transaction
 * This script directly inserts a sample payment transaction into the database
 * for testing the Registration Orders Report
 */
import { db } from './dist/db/index.js';
import { paymentTransactions } from './dist/db/schema.js';

async function insertSampleTransaction() {
  try {
    console.log('Inserting sample payment transaction...');
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Create a sample payment transaction
    const transaction = {
      teamId: null,
      eventId: null,
      userId: 1, // Admin user
      paymentIntentId: 'pi_sample_' + Date.now(),
      transactionType: 'payment',
      amount: 9900, // $99.00
      status: 'succeeded',
      cardBrand: 'visa',
      cardLastFour: '4242',
      paymentMethodType: 'card',
      createdAt: yesterday,
      updatedAt: now,
      metadata: JSON.stringify({
        description: 'Sample transaction for testing'
      }),
      notes: 'Created by test script for report testing'
    };
    
    // Insert the transaction
    const result = await db.insert(paymentTransactions).values(transaction);
    
    console.log('Transaction inserted successfully:', result);
    console.log('Sample transaction created with ID:', transaction.paymentIntentId);
    
    // Insert more transactions with different statuses
    const statuses = ['pending', 'failed', 'refunded', 'partial_refund', 'chargeback'];
    const cardBrands = ['mastercard', 'amex', 'discover', null];
    
    for (let i = 0; i < statuses.length; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i + 2)); // Different dates
      
      const sampleTransaction = {
        teamId: null,
        eventId: null,
        userId: 1,
        paymentIntentId: 'pi_sample_' + Date.now() + '_' + i,
        transactionType: i === 3 ? 'partial_refund' : i === 4 ? 'chargeback' : 'payment',
        amount: 5000 + (i * 1000), // Different amounts
        status: statuses[i],
        cardBrand: cardBrands[i % cardBrands.length],
        cardLastFour: i === 0 ? '5678' : i === 1 ? '9012' : i === 2 ? '3456' : null,
        paymentMethodType: i < 3 ? 'card' : null,
        createdAt: date,
        updatedAt: date,
        metadata: JSON.stringify({
          description: `Sample ${statuses[i]} transaction for testing`
        }),
        notes: `Created by test script (${statuses[i]}) for report testing`
      };
      
      await db.insert(paymentTransactions).values(sampleTransaction);
      console.log(`${statuses[i]} transaction inserted with ID: ${sampleTransaction.paymentIntentId}`);
    }
    
    console.log('All sample transactions created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error inserting sample transaction:', error);
    process.exit(1);
  }
}

insertSampleTransaction();
