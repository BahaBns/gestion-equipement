import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
const jwtSecret = process.env.JWT_SECRET as string;

// Interface for decoded token payload
interface DecodedToken {
  id: number;
  username: string;
  selectedDatabase?: string;
  // Add any other fields that might be in your token
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookieToken = req.cookies?.token;

  // Check Authorization header
  const authHeader = req.headers.authorization;
  const headerToken = authHeader ? authHeader.split(" ")[1] : null;

  // Use either token source
  const token = cookieToken || headerToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    // Attach the entire decoded token to req.user
    (req as any).user = decoded;

    // Extract selectedDatabase if present
    const selectedDatabase = decoded.selectedDatabase;

    // If no database is selected, default to a specific one or handle as needed
    if (!selectedDatabase) {
      console.warn("No database selected in token, using default database");
      // You can set a default database or handle this case as needed
      // (req as any).user.selectedDatabase = "default_database";
    }

    // Log which database is being used (for debugging)
    console.log(
      `Using database: ${(req as any).user.selectedDatabase || "default"}`
    );

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(403).json({ message: "Invalid or expired token." });
  }
};
