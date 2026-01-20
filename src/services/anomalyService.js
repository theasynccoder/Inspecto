const Groq = require("groq-sdk");
require("dotenv").config();

class AnomalyService {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  /**
   * Analyze inspection reports for anomalies using AI
   * @param {Array} reports - Array of inspection reports
   * @param {Array} restaurants - Array of restaurant data
   * @param {Array} inspectors - Array of inspector data
   * @returns {Promise<Object>} Anomaly analysis results
   */
  async analyzeInspectionAnomalies(reports, restaurants, inspectors) {
    try {
      if (!reports || reports.length === 0) {
        return this.getDefaultAnomalyAnalysis();
      }

      // Prepare data for analysis
      const analysisData = this.prepareDataForAnalysis(reports, restaurants, inspectors);
      
      // Use Groq AI for comprehensive anomaly detection
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert data analyst specializing in detecting anomalies in food safety inspection reports. 
Analyze patterns in inspection data to identify:
1. Inspectors who are too lenient or strict (based on score deviations)
2. Restaurants with suspicious score patterns
3. Regional trends and anomalies
4. High-risk restaurants needing urgent re-inspection
5. Unusual scoring patterns that may indicate bias or fraud

Respond ONLY with valid JSON in this exact format:
{
  "inspector_anomalies": [
    {
      "inspector_id": 1,
      "inspector_name": "name",
      "pattern": "too_lenient|too_strict|inconsistent",
      "avg_score": 0.0,
      "deviation": 0.0,
      "severity": "low|medium|high",
      "details": "explanation"
    }
  ],
  "restaurant_anomalies": [
    {
      "restaurant_id": 1,
      "restaurant_name": "name",
      "pattern": "sudden_improvement|consistent_failure|score_volatility",
      "risk_level": "low|medium|high|critical",
      "needs_reinspection": true|false,
      "details": "explanation"
    }
  ],
  "regional_trends": [
    {
      "zone": "zone_name",
      "avg_score": 0.0,
      "anomaly": "description",
      "severity": "low|medium|high"
    }
  ],
  "urgent_actions": [
    {
      "type": "reinspection|investigation|review",
      "target": "restaurant/inspector name",
      "priority": "high|critical",
      "reason": "explanation"
    }
  ],
  "overall_health": {
    "score": 0-100,
    "status": "healthy|concerning|critical",
    "summary": "brief overall assessment"
  }
}`
          },
          {
            role: "user",
            content: `Analyze these inspection reports for anomalies:\n\n${JSON.stringify(analysisData, null, 2)}\n\nProvide comprehensive anomaly analysis in JSON format.`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 2000
      });

      let response = completion.choices[0]?.message?.content;
      
      // Clean up markdown code fences if present
      if (response.includes('```')) {
        response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      // Parse AI response
      const analysis = JSON.parse(response);
      
      // Add statistical analysis
      const stats = this.calculateStatistics(reports, restaurants, inspectors);
      
      return {
        ...analysis,
        statistics: stats,
        analyzed_at: new Date().toISOString(),
        total_reports_analyzed: reports.length
      };
    } catch (error) {
      console.error('Anomaly analysis error:', error);
      return this.getDefaultAnomalyAnalysis();
    }
  }

  /**
   * Prepare data for AI analysis
   */
  prepareDataForAnalysis(reports, restaurants, inspectors) {
    const inspectorStats = {};
    const restaurantStats = {};
    const zoneStats = {};

    // Process each report
    reports.forEach(report => {
      const inspectorId = report.inspector_id;
      const restaurantId = report.restaurant_id;
      const score = parseFloat(report.hygiene_score) || 0;
      
      // Find restaurant and inspector details
      const restaurant = restaurants.find(r => r.id === restaurantId);
      const inspector = inspectors.find(i => i.id === inspectorId);
      
      if (!restaurant || !inspector) return;

      const zone = restaurant.zone || 'Unknown';

      // Inspector statistics
      if (!inspectorStats[inspectorId]) {
        inspectorStats[inspectorId] = {
          id: inspectorId,
          name: inspector.name,
          scores: [],
          report_count: 0,
          zone: inspector.zone
        };
      }
      inspectorStats[inspectorId].scores.push(score);
      inspectorStats[inspectorId].report_count++;

      // Restaurant statistics
      if (!restaurantStats[restaurantId]) {
        restaurantStats[restaurantId] = {
          id: restaurantId,
          name: restaurant.name,
          scores: [],
          inspectors: new Set(),
          zone: zone
        };
      }
      restaurantStats[restaurantId].scores.push({
        score: score,
        date: report.submitted_at,
        inspector_id: inspectorId
      });
      restaurantStats[restaurantId].inspectors.add(inspectorId);

      // Zone statistics
      if (!zoneStats[zone]) {
        zoneStats[zone] = {
          zone: zone,
          scores: [],
          report_count: 0
        };
      }
      zoneStats[zone].scores.push(score);
      zoneStats[zone].report_count++;
    });

    // Calculate averages and prepare summary
    const inspectorSummary = Object.values(inspectorStats).map(stat => {
      const avg = stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length;
      const variance = stat.scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / stat.scores.length;
      return {
        id: stat.id,
        name: stat.name,
        avg_score: avg.toFixed(2),
        std_deviation: Math.sqrt(variance).toFixed(2),
        report_count: stat.report_count,
        zone: stat.zone,
        scores: stat.scores
      };
    });

    const restaurantSummary = Object.values(restaurantStats).map(stat => {
      const scores = stat.scores.map(s => s.score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const sortedByDate = stat.scores.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return {
        id: stat.id,
        name: stat.name,
        avg_score: avg.toFixed(2),
        inspection_count: scores.length,
        inspector_count: stat.inspectors.size,
        zone: stat.zone,
        score_trend: sortedByDate.map(s => s.score),
        latest_score: sortedByDate[sortedByDate.length - 1]?.score || 0
      };
    });

    const zoneSummary = Object.values(zoneStats).map(stat => {
      const avg = stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length;
      return {
        zone: stat.zone,
        avg_score: avg.toFixed(2),
        report_count: stat.report_count
      };
    });

    return {
      inspectors: inspectorSummary,
      restaurants: restaurantSummary,
      zones: zoneSummary,
      overall_avg: (reports.reduce((sum, r) => sum + (parseFloat(r.hygiene_score) || 0), 0) / reports.length).toFixed(2)
    };
  }

  /**
   * Calculate statistical metrics
   */
  calculateStatistics(reports, restaurants, inspectors) {
    const scores = reports.map(r => parseFloat(r.hygiene_score) || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    return {
      total_reports: reports.length,
      average_score: avg.toFixed(2),
      min_score: Math.min(...scores).toFixed(2),
      max_score: Math.max(...scores).toFixed(2),
      score_distribution: {
        excellent: scores.filter(s => s >= 4.5).length,
        good: scores.filter(s => s >= 3.5 && s < 4.5).length,
        fair: scores.filter(s => s >= 2.5 && s < 3.5).length,
        poor: scores.filter(s => s < 2.5).length
      }
    };
  }

  /**
   * Detect specific anomaly patterns
   */
  detectPatterns(reports, restaurants) {
    const patterns = {
      sudden_improvements: [],
      consistent_failures: [],
      score_volatility: []
    };

    const restaurantScores = {};
    
    reports.forEach(report => {
      const rid = report.restaurant_id;
      if (!restaurantScores[rid]) {
        restaurantScores[rid] = [];
      }
      restaurantScores[rid].push({
        score: parseFloat(report.hygiene_score) || 0,
        date: report.submitted_at
      });
    });

    Object.entries(restaurantScores).forEach(([rid, scores]) => {
      if (scores.length < 2) return;
      
      scores.sort((a, b) => new Date(a.date) - new Date(b.date));
      const restaurant = restaurants.find(r => r.id === parseInt(rid));
      
      // Check for sudden improvement
      for (let i = 1; i < scores.length; i++) {
        if (scores[i].score - scores[i-1].score >= 2.0) {
          patterns.sudden_improvements.push({
            restaurant_id: rid,
            restaurant_name: restaurant?.name || 'Unknown',
            from_score: scores[i-1].score,
            to_score: scores[i].score,
            improvement: (scores[i].score - scores[i-1].score).toFixed(2)
          });
        }
      }
      
      // Check for consistent failures
      const recentScores = scores.slice(-3);
      if (recentScores.every(s => s.score < 2.5)) {
        patterns.consistent_failures.push({
          restaurant_id: rid,
          restaurant_name: restaurant?.name || 'Unknown',
          avg_score: (recentScores.reduce((a, b) => a + b.score, 0) / recentScores.length).toFixed(2)
        });
      }
      
      // Check for volatility
      if (scores.length >= 3) {
        const stdDev = this.calculateStdDev(scores.map(s => s.score));
        if (stdDev > 1.5) {
          patterns.score_volatility.push({
            restaurant_id: rid,
            restaurant_name: restaurant?.name || 'Unknown',
            volatility: stdDev.toFixed(2)
          });
        }
      }
    });

    return patterns;
  }

  /**
   * Calculate standard deviation
   */
  calculateStdDev(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Identify inspectors with unusual patterns
   */
  analyzeInspectorBehavior(reports, inspectors) {
    const inspectorData = {};
    
    reports.forEach(report => {
      const iid = report.inspector_id;
      if (!inspectorData[iid]) {
        inspectorData[iid] = {
          scores: [],
          report_count: 0
        };
      }
      inspectorData[iid].scores.push(parseFloat(report.hygiene_score) || 0);
      inspectorData[iid].report_count++;
    });

    const overallAvg = reports.reduce((sum, r) => sum + (parseFloat(r.hygiene_score) || 0), 0) / reports.length;
    const anomalies = [];

    Object.entries(inspectorData).forEach(([iid, data]) => {
      if (data.report_count < 2) return;
      
      const inspector = inspectors.find(i => i.id === parseInt(iid));
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      const deviation = avg - overallAvg;
      
      if (Math.abs(deviation) > 0.8) {
        anomalies.push({
          inspector_id: iid,
          inspector_name: inspector?.name || 'Unknown',
          avg_score: avg.toFixed(2),
          overall_avg: overallAvg.toFixed(2),
          deviation: deviation.toFixed(2),
          pattern: deviation > 0 ? 'too_lenient' : 'too_strict',
          report_count: data.report_count
        });
      }
    });

    return anomalies;
  }

  /**
   * Get default anomaly analysis
   */
  getDefaultAnomalyAnalysis() {
    return {
      inspector_anomalies: [],
      restaurant_anomalies: [],
      regional_trends: [],
      urgent_actions: [],
      overall_health: {
        score: 75,
        status: 'healthy',
        summary: 'Insufficient data for comprehensive analysis'
      },
      statistics: {
        total_reports: 0,
        average_score: '0.00',
        min_score: '0.00',
        max_score: '0.00',
        score_distribution: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0
        }
      },
      analyzed_at: new Date().toISOString(),
      total_reports_analyzed: 0
    };
  }

  /**
   * Generate recommendations based on anomalies
   */
  generateRecommendations(anomalyData) {
    const recommendations = [];

    // Inspector-based recommendations
    if (anomalyData.inspector_anomalies && anomalyData.inspector_anomalies.length > 0) {
      anomalyData.inspector_anomalies.forEach(anomaly => {
        if (anomaly.severity === 'high') {
          recommendations.push({
            type: 'inspector_review',
            priority: 'high',
            message: `Review inspector ${anomaly.inspector_name}'s reports for ${anomaly.pattern} pattern`,
            action: 'Schedule training or audit'
          });
        }
      });
    }

    // Restaurant-based recommendations
    if (anomalyData.restaurant_anomalies && anomalyData.restaurant_anomalies.length > 0) {
      anomalyData.restaurant_anomalies.forEach(anomaly => {
        if (anomaly.needs_reinspection) {
          recommendations.push({
            type: 'reinspection',
            priority: anomaly.risk_level === 'critical' ? 'critical' : 'high',
            message: `Schedule urgent re-inspection for ${anomaly.restaurant_name}`,
            action: 'Immediate action required'
          });
        }
      });
    }

    return recommendations;
  }
}

module.exports = AnomalyService;
