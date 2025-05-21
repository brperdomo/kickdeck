import { Request, Response, NextFunction } from 'express';

/**
 * This is a disabled version of the emulation service.
 * User emulation functionality has been removed from the system.
 */

/**
 * Start an emulation session - DISABLED
 * This function will always return null, disabling the emulation functionality.
 */
export async function startEmulation(
  superAdminId: number, 
  adminToEmulateId: number
): Promise<string | null> {
  console.log('User emulation functionality has been disabled');
  return null;
}

/**
 * Stop an emulation session - DISABLED
 * This function will always return false, as emulation is disabled.
 */
export function stopEmulation(token: string): boolean {
  console.log('User emulation functionality has been disabled');
  return false;
}

/**
 * Get the currently emulated user ID if a session exists - DISABLED
 * This function will always return null, as emulation is disabled.
 */
export function getEmulatedUserId(token: string): number | null {
  return null;
}

/**
 * Middleware to handle emulation sessions - DISABLED
 * This middleware does nothing and simply passes control to the next middleware.
 */
export function emulationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Emulation is disabled, do nothing
  next();
}