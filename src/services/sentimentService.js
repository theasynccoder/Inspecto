const Groq = require("groq-sdk");
require("dotenv").config();

class SentimentService {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  /**
   * Analyze complaint text for sentiment and urgency
   * @param {string} text - The complaint message
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeComplaint(text) {
    try {
      if (!text || text.trim().length === 0) {
        return this.getDefaultAnalysis();
      }

      // Use Groq AI for analysis
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a sentiment analysis expert for food safety complaints. 
Analyze the complaint and respond ONLY with valid JSON in this exact format:
{
  "sentiment": "positive|neutral|negative",
  "sentiment_score": 0.0-1.0,
  "urgency": "low|medium|high|critical",
  "key_issues": ["issue1", "issue2"],
  "summary": "brief summary"
}`
          },
          {
            role: "user",
            content: `Analyze this food safety complaint:\n\n"${text}"\n\nProvide sentiment analysis in JSON format.`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      
      // Parse AI response
      const analysis = JSON.parse(response);
      
      // Validate and normalize
      return {
        sentiment: this.normalizeSentiment(analysis.sentiment),
        sentiment_score: parseFloat(analysis.sentiment_score) || 0.5,
        urgency: this.normalizeUrgency(analysis.urgency),
        key_issues: Array.isArray(analysis.key_issues) ? analysis.key_issues.slice(0, 5) : [],
        summary: analysis.summary || text.substring(0, 100)
      };

    } catch (error) {
      console.error("Sentiment analysis error:", error);
      // Fallback to rule-based analysis
      return this.ruleBasedAnalysis(text);
    }
  }

  /**
   * Rule-based fallback sentiment analysis
   */
  ruleBasedAnalysis(text) {
    const lowerText = text.toLowerCase();
    
    // Critical keywords
    const criticalWords = [
      'rat', 'rats', 'mouse', 'mice', 'cockroach', 'roach', 'pest', 'bug',
      'food poisoning', 'sick', 'vomit', 'vomiting', 'diarrhea', 'ill', 'illness',
      'health department', 'emergency', 'urgent', 'dangerous', 'hazardous'
    ];
    
    // High urgency keywords
    const highWords = [
      'dirty', 'filthy', 'disgusting', 'smell', 'odor', 'stench',
      'contaminated', 'expired', 'moldy', 'rotten', 'spoiled',
      'raw', 'undercooked', 'cold food', 'hot food'
    ];
    
    // Medium urgency keywords
    const mediumWords = [
      'unclean', 'messy', 'disorganized', 'unprofessional',
      'slow', 'poor', 'bad', 'concern', 'issue', 'problem'
    ];

    // Negative sentiment words
    const negativeWords = [
      'terrible', 'awful', 'horrible', 'worst', 'never', 'disgusting',
      'disappointed', 'unhappy', 'angry', 'frustrated'
    ];

    // Count matches
    const criticalCount = criticalWords.filter(word => lowerText.includes(word)).length;
    const highCount = highWords.filter(word => lowerText.includes(word)).length;
    const mediumCount = mediumWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    // Determine urgency
    let urgency = 'low';
    if (criticalCount > 0) urgency = 'critical';
    else if (highCount >= 2 || (highCount === 1 && negativeCount >= 2)) urgency = 'high';
    else if (highCount === 1 || mediumCount >= 2) urgency = 'medium';

    // Determine sentiment
    let sentiment = 'neutral';
    let sentiment_score = 0.5;
    
    if (negativeCount >= 2 || criticalCount > 0 || highCount >= 2) {
      sentiment = 'negative';
      sentiment_score = Math.max(0, 0.9 - (negativeCount + criticalCount + highCount) * 0.1);
    } else if (negativeCount === 1 || mediumCount >= 2) {
      sentiment = 'negative';
      sentiment_score = 0.4;
    }

    // Extract key issues
    const key_issues = [];
    if (criticalCount > 0) key_issues.push(...criticalWords.filter(w => lowerText.includes(w)));
    if (highCount > 0) key_issues.push(...highWords.filter(w => lowerText.includes(w)));

    return {
      sentiment,
      sentiment_score,
      urgency,
      key_issues: [...new Set(key_issues)].slice(0, 5),
      summary: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    };
  }

  /**
   * Batch analyze multiple complaints
   */
  async batchAnalyze(complaints) {
    const results = [];
    
    for (const complaint of complaints) {
      const analysis = await this.analyzeComplaint(complaint.message);
      results.push({
        complaint_id: complaint.id,
        ...analysis
      });
      
      // Small delay to avoid rate limits
      await this.sleep(100);
    }
    
    return results;
  }

  /**
   * Get sentiment statistics
   */
  calculateStats(analyses) {
    const total = analyses.length;
    if (total === 0) return this.getEmptyStats();

    const stats = {
      total,
      sentiment: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      urgency: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      avg_sentiment_score: 0,
      top_issues: {}
    };

    let scoreSum = 0;

    analyses.forEach(analysis => {
      // Count sentiments
      stats.sentiment[analysis.sentiment] = (stats.sentiment[analysis.sentiment] || 0) + 1;
      
      // Count urgency
      stats.urgency[analysis.urgency] = (stats.urgency[analysis.urgency] || 0) + 1;
      
      // Sum scores
      scoreSum += analysis.sentiment_score || 0;
      
      // Count key issues
      if (analysis.key_issues) {
        analysis.key_issues.forEach(issue => {
          stats.top_issues[issue] = (stats.top_issues[issue] || 0) + 1;
        });
      }
    });

    stats.avg_sentiment_score = (scoreSum / total).toFixed(2);
    
    // Convert top issues to sorted array
    stats.top_issues = Object.entries(stats.top_issues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));

    return stats;
  }

  // Helper methods
  normalizeSentiment(sentiment) {
    const normalized = sentiment?.toLowerCase();
    if (['positive', 'neutral', 'negative'].includes(normalized)) {
      return normalized;
    }
    return 'neutral';
  }

  normalizeUrgency(urgency) {
    const normalized = urgency?.toLowerCase();
    if (['low', 'medium', 'high', 'critical'].includes(normalized)) {
      return normalized;
    }
    return 'medium';
  }

  getDefaultAnalysis() {
    return {
      sentiment: 'neutral',
      sentiment_score: 0.5,
      urgency: 'medium',
      key_issues: [],
      summary: 'No content provided'
    };
  }

  getEmptyStats() {
    return {
      total: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      urgency: { low: 0, medium: 0, high: 0, critical: 0 },
      avg_sentiment_score: 0,
      top_issues: []
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SentimentService;
