/**
 * Test OpenAI API Key
 * This script tests if the OpenAI API key is working properly.
 */

import 'dotenv/config';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testOpenAIKey() {
  try {
    console.log('Testing OpenAI API key...');
    
    // Simple test to see if the API key works - making a trivial request
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a testing assistant. Respond with a simple 'API key is working correctly.'"
        },
        {
          role: "user",
          content: "Test the API connection."
        }
      ],
      max_tokens: 50,
      temperature: 0.0
    });
    
    if (response.choices && response.choices.length > 0) {
      console.log('API Response:', response.choices[0].message.content);
      console.log('Success! The OpenAI API key is working correctly.');
    } else {
      console.error('Error: Received empty response from OpenAI');
    }
  } catch (error) {
    console.error('Error testing OpenAI API key:');
    
    if (error.status === 401) {
      console.error('Authentication error: Your API key is invalid. Check the key and try again.');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded: You have hit your API usage limit. Check your quota.');
    } else if (error.error && error.error.type === 'insufficient_quota') {
      console.error('Insufficient quota: Your account has run out of available credits.');
    } else {
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Error response:', error.response);
      }
    }
  }
}

// Run the test
testOpenAIKey();