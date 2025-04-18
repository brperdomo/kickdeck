import { Request, Response } from 'express';
import { db } from '@db';
import { eq, sql, and, like, gte, lte, desc, asc, or } from 'drizzle-orm';
import { teams, events, users, paymentTransactions } from '@db/schema';
import { log } from '../vite';
import { stringify } from 'csv-stringify/sync';

/**
 * Get Registration Orders Report
 * Provides a detailed report of team registration orders with payment information
 */
export async function getRegistrationOrdersReport(req: Request, res: Response) {
  try {
    const { 
      eventId, 
      status, 
      search, 
      startDate, 
      endDate,
      format = 'json' 
    } = req.query;

    // Build the base SQL query
    let query = db
      .select({
        id: paymentTransactions.id,
        teamId: paymentTransactions.teamId,
        eventId: paymentTransactions.eventId,
        paymentIntentId: paymentTransactions.paymentIntentId,
        amount: paymentTransactions.amount,
        paymentStatus: paymentTransactions.status,
        paymentMethodType: paymentTransactions.paymentMethodType,
        cardBrand: paymentTransactions.cardBrand,
        cardLast4: paymentTransactions.cardLastFour,
        submitterName: teams.submitterName,
        submitterEmail: teams.submitterEmail,
        teamName: teams.name,
        eventName: events.name,
        paymentDate: paymentTransactions.createdAt,
        notes: paymentTransactions.notes,
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .where(
        and(
          eq(paymentTransactions.transactionType, 'payment')
        )
      )
      .orderBy(desc(paymentTransactions.createdAt));

    // Apply filters
    if (eventId) {
      query = query.where(eq(paymentTransactions.eventId, String(eventId)));
    }

    if (status) {
      query = query.where(eq(paymentTransactions.status, String(status)));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(teams.name, searchTerm),
          like(teams.submitterName, searchTerm),
          like(teams.submitterEmail, searchTerm),
          like(paymentTransactions.paymentIntentId, searchTerm)
        )
      );
    }

    if (startDate) {
      query = query.where(gte(paymentTransactions.createdAt, new Date(String(startDate))));
    }

    if (endDate) {
      query = query.where(lte(paymentTransactions.createdAt, new Date(String(endDate))));
    }

    // Execute the query
    const transactions = await query;

    // Format the response based on requested format
    if (format === 'csv') {
      const csvData = stringify(transactions.map(tx => ({
        'Transaction ID': tx.id,
        'Event Name': tx.eventName,
        'Team Name': tx.teamName,
        'Payment ID': tx.paymentIntentId,
        'Amount': (tx.amount / 100).toFixed(2), // Convert cents to dollars
        'Payment Status': tx.paymentStatus,
        'Payment Method': tx.paymentMethodType,
        'Card Details': tx.cardBrand && tx.cardLast4 ? `${tx.cardBrand} **** ${tx.cardLast4}` : '',
        'Submitter Name': tx.submitterName,
        'Submitter Email': tx.submitterEmail,
        'Date': tx.paymentDate ? new Date(tx.paymentDate).toISOString() : '',
        'Notes': tx.notes
      })), { 
        header: true, 
        columns: [
          'Transaction ID',
          'Event Name',
          'Team Name',
          'Payment ID',
          'Amount',
          'Payment Status',
          'Payment Method',
          'Card Details',
          'Submitter Name',
          'Submitter Email',
          'Date',
          'Notes'
        ] 
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=registration-orders-${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csvData);
    }

    // Default JSON response
    return res.json({
      success: true,
      transactions,
      count: transactions.length,
      filters: {
        eventId,
        status,
        search,
        startDate,
        endDate
      }
    });
  } catch (error) {
    log(`Error getting registration orders report: ${error}`, 'reports');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate registration orders report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}