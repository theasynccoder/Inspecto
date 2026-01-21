const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixComplaintsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('Connected to database. Fixing complaints table...');

    // Add missing columns
    const alterQueries = [
      'ALTER TABLE complaints ADD COLUMN images JSON AFTER is_anonymous',
      'ALTER TABLE complaints ADD COLUMN sentiment VARCHAR(50) AFTER images',
      'ALTER TABLE complaints ADD COLUMN sentiment_score DECIMAL(3,2) AFTER sentiment',
      'ALTER TABLE complaints ADD COLUMN urgency VARCHAR(50) AFTER sentiment_score',
      'ALTER TABLE complaints ADD COLUMN ai_analysis JSON AFTER urgency',
      'ALTER TABLE complaints ADD COLUMN analyzed_at DATETIME AFTER ai_analysis'
    ];

    for (const query of alterQueries) {
      try {
        await connection.query(query);
        console.log('✅ Executed:', query.substring(0, 60) + '...');
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  Column already exists, skipping:', query.substring(0, 60) + '...');
        } else {
          throw err;
        }
      }
    }

    // Show updated table structure
    const [columns] = await connection.query('DESCRIBE complaints');
    console.log('\n✅ Updated complaints table structure:');
    console.table(columns);

    console.log('\n🎉 Successfully fixed complaints table!');
  } catch (error) {
    console.error('❌ Error fixing complaints table:', error.message);
  } finally {
    await connection.end();
  }
}

fixComplaintsTable();
