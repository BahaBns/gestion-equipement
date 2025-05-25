// Using pg package to run a direct query
import { Pool } from 'pg';
import * as dotenv from 'dotenv'; // Make sure to install dotenv if not already installed

// Load environment variables from .env file
dotenv.config();

async function updateUserEmail() {
  // Create a connection pool with explicit parameters
  // This approach gives you more control over individual connection parameters
  const pool = new Pool({
    // You can either use the connection string approach:
    connectionString: process.env.AUTH_DATABASE_URL,
    
    // Or alternatively, use explicit parameters (uncommenting the following):
    /*
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    */
  });

  try {
    // Log connection attempt (for debugging)
    console.log('Attempting to connect to database...');
    
    const result = await pool.query(`
      UPDATE "User"
      SET email = 'akram.bensassi@insight-times.com'
      WHERE email = 'admin@insight-times.com'
      RETURNING id, email, name;
    `);

    if (result.rowCount != null && result.rowCount > 0) {
      console.log('Email updated successfully:', result.rows[0]);
    } else {
      console.log('No user found with email admin@insight-times.com');
    }
  } catch (error) {
    console.error('Error updating email:', error);
    // Print more detailed error info
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await pool.end();
  }
}

// Execute the function
updateUserEmail();
