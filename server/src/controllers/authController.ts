import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/auth-client";
import dotenv from "dotenv";

dotenv.config();

const jwtSecret: Secret = process.env.JWT_SECRET || "default_secret";
const jwtExpiresIn = "1h";
const TOKEN_EXPIRY = "7d";

// Dummy user data (replace with database)
const users = [
  {
    id: 1,
    username: "admin",
    password: "$2a$10$r0qjaDXvPi5e8baza.FT3uNOFHUo4WSbcyYszsszrDLHHuALcP5PC",
  }, // password: "admin123"
];

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);

  if (!user) {
    console.log("User not found");
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    console.log("Invalid password");
    return res.status(401).json({ message: "Invalid username or password" });
  }

  try {
    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    console.log("Generated token:", token);

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: 3600000, // 1 hour
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })
      .json({
        success: true,
        message: "Login successful",
        token: token, // Include token in response for client storage
      });
  } catch (error) {
    console.error("JWT Signing Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const selectDatabase = async (req: Request, res: Response) => {
  const { token, selectedDatabase } = req.body;

  if (!token || !selectedDatabase) {
    return res.status(400).json({
      success: false,
      message: "Token and database selection are required",
    });
  }
  try {
    // Verify the token is valid
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

    const { iat,exp, ...payloadWithoutExp } = decoded;

    // Create a new token with the selected database
    const newToken = jwt.sign(
      {
        ...payloadWithoutExp,
        selectedDatabase,
      },
      jwtSecret,
      { expiresIn: TOKEN_EXPIRY || "7d" }
    );

    res
      .cookie("token", newToken, {
        httpOnly: true,
        maxAge: 3600000, // 1 hour
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      })
      .json({
        success: true,
        message: "Database selected successfully",
        token: newToken,
      });
  } catch (error) {
    console.error("Database selection error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
