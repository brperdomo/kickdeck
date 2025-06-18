/**
 * Phone Number Formatting Middleware
 * 
 * This middleware automatically formats phone numbers to the standard (XXX) XXX-XXXX format
 * when data is being saved to the database. This ensures consistency even if frontend
 * formatting is bypassed or incomplete.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Formats a phone number to the standard (XXX) XXX-XXXX format
 */
function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') return phoneNumber || '';

  // Strip all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different number lengths
  if (cleaned.length === 10) {
    // Standard US 10-digit number
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // US number with country code
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 7) {
    // 7-digit local number
    return `(   ) ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }

  // Return original if we can't format it properly
  return phoneNumber;
}

/**
 * Recursively formats phone number fields in an object
 */
function formatPhoneFieldsInObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const phoneFields = [
    'phone',
    'managerPhone',
    'headCoachPhone',
    'assistantCoachPhone',
    'emergencyContactPhone',
    'parentGuardianPhone'
  ];

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => formatPhoneFieldsInObject(item));
  }

  // Handle objects
  const formatted = { ...obj };
  
  for (const field of phoneFields) {
    if (formatted[field]) {
      formatted[field] = formatPhoneNumber(formatted[field]);
    }
  }

  // Handle nested coach data (JSON string)
  if (formatted.coach && typeof formatted.coach === 'string') {
    try {
      const coachData = JSON.parse(formatted.coach);
      if (coachData.headCoachPhone) {
        coachData.headCoachPhone = formatPhoneNumber(coachData.headCoachPhone);
      }
      if (coachData.assistantCoachPhone) {
        coachData.assistantCoachPhone = formatPhoneNumber(coachData.assistantCoachPhone);
      }
      formatted.coach = JSON.stringify(coachData);
    } catch (error) {
      // If coach data isn't valid JSON, leave it as is
    }
  }

  // Handle nested players array
  if (formatted.players && Array.isArray(formatted.players)) {
    formatted.players = formatted.players.map((player: any) => {
      const formattedPlayer = { ...player };
      if (formattedPlayer.emergencyContactPhone) {
        formattedPlayer.emergencyContactPhone = formatPhoneNumber(formattedPlayer.emergencyContactPhone);
      }
      if (formattedPlayer.parentGuardianPhone) {
        formattedPlayer.parentGuardianPhone = formatPhoneNumber(formattedPlayer.parentGuardianPhone);
      }
      return formattedPlayer;
    });
  }

  return formatted;
}

/**
 * Express middleware to format phone numbers in request body
 */
export function phoneFormatterMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = formatPhoneFieldsInObject(req.body);
  }
  next();
}

export { formatPhoneNumber };