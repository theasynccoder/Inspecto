const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSentimentLogTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('Connected to database. Creating sentiment_analysis_log table...');

    // Create sentiment_analysis_log table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sentiment_analysis_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_id INT NOT NULL,
        sentiment VARCHAR(50),
        urgency VARCHAR(50),
        confidence_score DECIMAL(3,2),
        analysis_method VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ sentiment_analysis_log table created successfully!');

    // Show table structure
    const [columns] = await connection.query('DESCRIBE sentiment_analysis_log');
    console.log('\n✅ Table structure:');
    console.table(columns);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createSentimentLogTable();
