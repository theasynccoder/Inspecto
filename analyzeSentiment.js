// Script to analyze existing complaints that don't have sentiment data
const db = require('./src/config/dbConnect');
const SentimentService = require('./src/services/sentimentService');

async function analyzeExistingComplaints() {
  console.log('🤖 Starting sentiment analysis for existing complaints...\n');

  try {
    // Get complaints without sentiment analysis
    const [complaints] = await db.query(`
      SELECT id, message FROM complaints 
      WHERE sentiment IS NULL OR urgency IS NULL
    `);

    if (complaints.length === 0) {
      console.log('✅ All complaints already analyzed!');
      return;
    }

    console.log(`Found ${complaints.length} complaints to analyze...\n`);

    const sentimentService = new SentimentService();
    let analyzed = 0;

    for (const complaint of complaints) {
      try {
        const analysis = await sentimentService.analyzeComplaint(complaint.message);

        // Update complaint with analysis
        await db.query(`
          UPDATE complaints 
          SET sentiment = ?,
              sentiment_score = ?,
              urgency = ?,
              ai_analysis = ?,
              analyzed_at = NOW()
          WHERE id = ?
        `, [
          analysis.sentiment,
          analysis.sentiment_score,
          analysis.urgency,
          JSON.stringify(analysis),
          complaint.id
        ]);

        // Log to sentiment_analysis_log
        await db.query(`
          INSERT INTO sentiment_analysis_log 
          (complaint_id, sentiment, urgency, confidence_score, analysis_method)
          VALUES (?, ?, ?, ?, 'groq-ai')
        `, [
          complaint.id,
          analysis.sentiment,
          analysis.urgency,
          analysis.sentiment_score
        ]);

        analyzed++;
        console.log(`✓ Analyzed complaint #${complaint.id} - ${analysis.urgency} urgency, ${analysis.sentiment} sentiment`);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`✗ Error analyzing complaint #${complaint.id}:`, error.message);
      }
    }

    console.log(`\n✅ Analysis complete! ${analyzed}/${complaints.length} complaints analyzed successfully.`);

    // Show statistics
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN urgency = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN urgency = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN urgency = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN urgency = 'low' THEN 1 ELSE 0 END) as low,
        AVG(sentiment_score) as avg_score
      FROM complaints
    `);

    console.log('\n📊 Overall Statistics:');
    console.log(`Total Complaints: ${stats[0].total}`);
    console.log(`\nSentiment Breakdown:`);
    console.log(`  😞 Negative: ${stats[0].negative}`);
    console.log(`  😐 Neutral: ${stats[0].neutral}`);
    console.log(`  😊 Positive: ${stats[0].positive}`);
    console.log(`\nUrgency Breakdown:`);
    console.log(`  🔴 Critical: ${stats[0].critical}`);
    console.log(`  🟠 High: ${stats[0].high}`);
    console.log(`  🟡 Medium: ${stats[0].medium}`);
    console.log(`  🟢 Low: ${stats[0].low}`);
    console.log(`\nAverage Sentiment Score: ${stats[0].avg_score ? stats[0].avg_score.toFixed(2) : 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

// Run the analysis
analyzeExistingComplaints();
