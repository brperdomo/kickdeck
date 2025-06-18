/**
 * Fee Calculator Admin Routes
 * 
 * Provides API endpoints for fee calculation and revenue distribution analysis
 */

import type { Express } from "express";
import { calculateEventFees, formatFeeCalculation, simulateFeeScenarios } from "../../services/fee-calculator";

export function registerFeeCalculatorRoutes(app: Express) {
  
  // Calculate fees for a specific amount and event
  app.post('/api/admin/fee-calculator/calculate', async (req, res) => {
    try {
      const { tournamentCost, eventId } = req.body;
      
      if (!tournamentCost || tournamentCost <= 0) {
        return res.status(400).json({ error: 'Valid tournament cost is required' });
      }

      // Calculate fees using the enhanced calculator
      const calculation = await calculateEventFees(eventId || 'demo', tournamentCost);
      const formatted = formatFeeCalculation(calculation);
      
      res.json({
        calculation,
        formatted,
        volumeData: null // TODO: Implement actual volume data retrieval
      });
      
    } catch (error) {
      console.error('Error calculating fees:', error);
      res.status(500).json({ error: 'Failed to calculate fees' });
    }
  });

  // Get fee calculation scenarios for analysis
  app.get('/api/admin/fee-calculator/scenarios', (req, res) => {
    try {
      const scenarios = [
        { name: "Small Tournament", amount: 5000 },
        { name: "Medium Tournament", amount: 25000 },
        { name: "Large Tournament", amount: 100000 },
        { name: "Enterprise Tournament", amount: 200000 }
      ].map(scenario => ({
        ...scenario,
        calculation: calculateEventFees('demo', scenario.amount)
      }));

      res.json({ scenarios });
      
    } catch (error) {
      console.error('Error generating scenarios:', error);
      res.status(500).json({ error: 'Failed to generate scenarios' });
    }
  });

  // Simulate fee scenarios (for testing/debugging)
  app.get('/api/admin/fee-calculator/simulate', (req, res) => {
    try {
      // Capture console output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };
      
      simulateFeeScenarios();
      
      // Restore console.log
      console.log = originalLog;
      
      res.json({ 
        success: true,
        simulationOutput: output 
      });
      
    } catch (error) {
      console.error('Error running simulation:', error);
      res.status(500).json({ error: 'Failed to run simulation' });
    }
  });

  // Get volume discount tiers information
  app.get('/api/admin/fee-calculator/volume-tiers', (req, res) => {
    try {
      const tiers = [
        { minAmount: 0, maxAmount: 10000, platformFeeRate: 0.04, description: "$0-$100: 4%" },
        { minAmount: 10001, maxAmount: 50000, platformFeeRate: 0.035, description: "$100.01-$500: 3.5%" },
        { minAmount: 50001, maxAmount: 100000, platformFeeRate: 0.03, description: "$500.01-$1000: 3%" },
        { minAmount: 100001, maxAmount: Infinity, platformFeeRate: 0.025, description: "$1000+: 2.5%" }
      ];
      
      res.json({ tiers });
      
    } catch (error) {
      console.error('Error fetching volume tiers:', error);
      res.status(500).json({ error: 'Failed to fetch volume tiers' });
    }
  });
}