import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyze financial data and generate insights
 * @param {Object} data - The financial data to analyze
 * @param {string} analysisType - The type of analysis to perform (e.g., 'revenue', 'trends', 'forecasting')
 * @returns {Promise<Object>} - The analysis results
 */
export async function analyzeFinancialData(data: any, analysisType: string): Promise<any> {
  try {
    const prompt = generateAnalysisPrompt(data, analysisType);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst and data expert who specializes in tournament registration data. Provide clear, concise insights from financial data with actionable recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error(`Failed to analyze financial data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a visualization caption for the data
 * @param {Object} data - The financial data to visualize
 * @param {string} visualizationType - The type of visualization (e.g., 'pie', 'bar', 'line') 
 * @returns {Promise<string>} - A visualization caption
 */
export async function generateVisualizationCaption(data: any, visualizationType: string): Promise<string> {
  try {
    const prompt = `Create a concise caption for a ${visualizationType} chart that visualizes the following data: ${JSON.stringify(data)}. 
    The caption should explain what the visualization shows and highlight 1-2 key insights that can be derived from it.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are a data visualization expert who writes clear, concise captions for charts and graphs."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ]
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("OpenAI caption generation error:", error);
    return "Data visualization showing key metrics and trends.";
  }
}

/**
 * Generate recommendations based on financial data
 * @param {Object} data - The financial data
 * @returns {Promise<Array<string>>} - List of recommendations
 */
export async function generateRecommendations(data: any): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor who specializes in sports tournament management. Generate actionable recommendations based on financial and registration data."
        },
        {
          role: "user",
          content: `Based on this financial and registration data, provide 3-5 specific, actionable recommendations to improve revenue and operational efficiency: ${JSON.stringify(data)}. Format your response as a JSON array of strings.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content);
    return Array.isArray(parsedResponse.recommendations) ? parsedResponse.recommendations : [];
  } catch (error) {
    console.error("OpenAI recommendations error:", error);
    return ["Consider reviewing fee structures based on registration patterns.", 
            "Analyze event performance to optimize resource allocation."];
  }
}

/**
 * Helper function to generate analysis prompts based on analysis type
 */
function generateAnalysisPrompt(data: any, analysisType: string): string {
  switch (analysisType) {
    case 'revenue':
      return `Analyze this revenue data for tournament registrations and provide insights on trends, highest performing events, and areas for improvement: ${JSON.stringify(data)}. 
      Return your analysis as a JSON object with these fields:
      {
        "topRevenueEvents": [{"eventName": string, "revenue": number, "registrationCount": number}],
        "revenueByMonth": [{"month": string, "revenue": number}],
        "averageTransactionValue": number,
        "keyInsights": [string],
        "growthOpportunities": [string]
      }`;
    
    case 'trends':
      return `Analyze the following registration and payment trend data and identify patterns: ${JSON.stringify(data)}.
      Return your analysis as a JSON object with these fields:
      {
        "registrationTrends": {"pattern": string, "description": string},
        "paymentMethodTrends": [{"method": string, "percentage": number, "trend": string}],
        "seasonalPatterns": [{"season": string, "pattern": string}],
        "keyInsights": [string]
      }`;
    
    case 'forecasting':
      return `Based on this historical registration and revenue data, provide a forecast for future periods: ${JSON.stringify(data)}.
      Return your forecast as a JSON object with these fields:
      {
        "revenueForecast": [{"period": string, "projectedRevenue": number, "confidenceLevel": string}],
        "registrationForecast": [{"period": string, "projectedRegistrations": number}],
        "growthRate": number,
        "keyFactors": [string],
        "recommendations": [string]
      }`;
    
    case 'summary':
      return `Provide a comprehensive summary of this financial data for team registrations: ${JSON.stringify(data)}.
      Return your summary as a JSON object with these fields:
      {
        "totalRevenue": number,
        "totalRegistrations": number,
        "averageRevenuePerRegistration": number,
        "topEvents": [{"name": string, "revenue": number}],
        "paymentMethodBreakdown": [{"method": string, "percentage": number}],
        "keyInsights": [string]
      }`;
      
    default:
      return `Analyze this financial data and provide general insights: ${JSON.stringify(data)}.
      Return your analysis as a JSON object with a "insights" array containing string insights.`;
  }
}