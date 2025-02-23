import { Request, Response, NextFunction } from "express";

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  next();
};
