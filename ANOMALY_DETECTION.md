# Inspection Report Anomaly Detection System

## Overview
An AI-powered system that analyzes inspection reports to detect unusual patterns, identify potential issues, and provide actionable insights for food safety administrators.

## Features

### 1. **Inspector Behavior Analysis** 👮
- Detects inspectors who may be too lenient or too strict
- Compares individual inspector scores against zone averages
- Identifies inconsistent scoring patterns
- Flags inspectors requiring training or review

**Example Detection:**
- Inspector A consistently scores 1.5 points higher than average → Flagged as "too lenient"
- Inspector B shows high variance in scores → Flagged as "inconsistent"

### 2. **Restaurant Risk Patterns** 🏪
- **Sudden Improvement**: Restaurants that jump from low to high scores unexpectedly
- **Consistent Failures**: Establishments repeatedly scoring below safety thresholds
- **Score Volatility**: Restaurants with highly variable inspection results

**Risk Levels:**
- 🟢 **Low**: Normal operations
- 🟡 **Medium**: Monitor closely
- 🟠 **High**: Requires attention
- 🔴 **Critical**: Immediate action needed

### 3. **Regional Trends** 📊
- Zone-level scoring patterns
- Comparative analysis across regions
- Identification of zone-specific issues
- Performance benchmarking

### 4. **Urgent Action Recommendations** ⚠️
- AI-generated priority actions
- Automated re-inspection flagging
- Inspector review recommendations
- Investigation triggers

## Technical Implementation

### Database Schema

```sql
-- Added to inspection_reports table
anomaly_detected BOOLEAN DEFAULT FALSE
anomaly_type VARCHAR(50)
anomaly_severity ENUM('low', 'medium', 'high', 'critical')
anomaly_details JSON
risk_score DECIMAL(5,2)
requires_reinspection BOOLEAN DEFAULT FALSE
anomaly_analyzed_at TIMESTAMP

-- New table for logging
anomaly_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  analysis_type VARCHAR(50),
  zone VARCHAR(100),
  analysis_data JSON,
  anomalies_found INT,
  analyzed_at TIMESTAMP
)
```

### API Endpoints

#### 1. **GET /admin/anomalies**
Main dashboard page for anomaly detection

#### 2. **GET /admin/api/anomalies/analyze**
Performs comprehensive AI analysis
- Fetches all approved inspection reports for zone
- Analyzes patterns using Groq AI (Llama 3.3 70B)
- Returns:
  - Inspector anomalies
  - Restaurant risk patterns
  - Regional trends
  - Urgent actions
  - Overall health score

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "inspector_anomalies": [...],
    "restaurant_anomalies": [...],
    "regional_trends": [...],
    "urgent_actions": [...],
    "overall_health": {
      "score": 75,
      "status": "healthy|concerning|critical",
      "summary": "..."
    },
    "statistics": {
      "total_reports": 45,
      "average_score": "3.8",
      "score_distribution": {...}
    }
  }
}
```

#### 3. **GET /admin/api/anomalies/inspectors**
Focused inspector behavior analysis

#### 4. **GET /admin/api/anomalies/restaurants**
Focused restaurant risk pattern detection

#### 5. **POST /admin/api/anomalies/mark-reinspection/:reportId**
Marks a report/restaurant for urgent re-inspection

#### 6. **GET /admin/api/anomalies/stats**
Statistics dashboard for anomaly tracking

### AI Analysis Service

**File:** `src/services/anomalyService.js`

**Key Methods:**

1. **analyzeInspectionAnomalies(reports, restaurants, inspectors)**
   - Main analysis orchestrator
   - Uses Groq AI with Llama 3.3 70B model
   - Temperature: 0.3 (for consistent, factual analysis)
   - Max tokens: 2000

2. **prepareDataForAnalysis()**
   - Aggregates inspector statistics
   - Calculates restaurant score histories
   - Computes zone-level metrics
   - Formats data for AI consumption

3. **analyzeInspectorBehavior()**
   - Statistical analysis of inspector patterns
   - Deviation calculation from zone average
   - Pattern classification (lenient/strict/inconsistent)

4. **detectPatterns()**
   - Time-series analysis of restaurant scores
   - Sudden change detection
   - Volatility calculation
   - Trend identification

5. **calculateStatistics()**
   - Score distribution analysis
   - Average/min/max calculations
   - Performance categorization

## Usage Guide

### For Administrators

1. **Access the Dashboard**
   - Navigate to Admin Dashboard
   - Click "Anomaly Detection ⭐" card

2. **Review Analysis**
   - System automatically analyzes all approved reports
   - Review overall health score (0-100)
   - Check urgent actions section

3. **Investigate Anomalies**
   - **Inspector Tab**: Review flagged inspectors
   - **Restaurant Tab**: Check high-risk establishments
   - **Regional Tab**: Analyze zone-level trends

4. **Take Action**
   - Mark restaurants for re-inspection
   - Schedule inspector training
   - Investigate suspicious patterns
   - Generate compliance reports

### Best Practices

- Run analysis regularly (weekly recommended)
- Review urgent actions immediately
- Track patterns over time using anomaly_logs
- Combine with sentiment analysis for comprehensive oversight
- Use findings to guide training programs

## Detection Algorithms

### Inspector Lenience/Strictness
```
Deviation = Inspector_Avg_Score - Zone_Avg_Score
If |Deviation| > 0.8:
  - Deviation > 0 → Too Lenient
  - Deviation < 0 → Too Strict
```

### Score Volatility
```
Standard_Deviation = sqrt(Σ(score - avg)² / n)
If Standard_Deviation > 1.5:
  Flag as "High Volatility"
```

### Sudden Improvement
```
For each consecutive score pair:
  If (Current_Score - Previous_Score) >= 2.0:
    Flag as "Sudden Improvement"
```

### Consistent Failure
```
If last 3 scores < 2.5:
  Flag as "Consistent Failure"
  Mark for urgent re-inspection
```

## Benefits

### 1. **Proactive Risk Management**
- Identify issues before they escalate
- Predict which restaurants need urgent attention
- Prevent health violations

### 2. **Quality Assurance**
- Ensure inspector consistency
- Maintain scoring standards
- Identify training needs

### 3. **Resource Optimization**
- Focus inspections on high-risk establishments
- Allocate inspectors efficiently
- Prioritize reviews intelligently

### 4. **Compliance & Accountability**
- Track inspector performance objectively
- Document investigation triggers
- Maintain audit trail via anomaly_logs

### 5. **Data-Driven Decisions**
- AI-powered insights
- Statistical validation
- Trend identification

## Example Scenarios

### Scenario 1: Lenient Inspector
```
Detection:
- Inspector John averages 4.2/5.0
- Zone average: 3.4/5.0
- Deviation: +0.8 (exceeds threshold)

Action:
- Review John's recent reports
- Compare with peer inspections
- Schedule calibration training
```

### Scenario 2: Sudden Restaurant Improvement
```
Detection:
- Restaurant ABC:
  - March: 1.8/5.0
  - April: 4.5/5.0
  - Improvement: +2.7

Action:
- Schedule verification inspection
- Review documentation
- Check for inspector bias
```

### Scenario 3: Zone-Wide Decline
```
Detection:
- Zone East average dropped from 3.8 to 2.9
- 60% of restaurants show score decline

Action:
- Investigate regional factors
- Check for seasonal patterns
- Review inspector assignments
```

## Configuration

### Environment Variables
```
GROQ_API_KEY=your_groq_api_key_here
```

### AI Model Settings
- Model: llama-3.3-70b-versatile
- Temperature: 0.3 (factual, consistent)
- Max Tokens: 2000

### Thresholds (customizable in code)
```javascript
const THRESHOLDS = {
  INSPECTOR_DEVIATION: 0.8,
  VOLATILITY: 1.5,
  SUDDEN_IMPROVEMENT: 2.0,
  FAILURE_THRESHOLD: 2.5,
  MIN_REPORTS_FOR_ANALYSIS: 2
};
```

## Security Considerations

- Zone-based access control
- Session validation required
- SQL injection prevention via parameterized queries
- Rate limiting recommended for AI API calls
- Audit logging in anomaly_logs table

## Future Enhancements

1. **Machine Learning Models**
   - Train custom models on historical data
   - Improve prediction accuracy over time

2. **Automated Actions**
   - Auto-schedule re-inspections
   - Send notifications to inspectors
   - Generate compliance reports

3. **Advanced Visualizations**
   - Time-series charts
   - Heat maps for geographic patterns
   - Inspector performance dashboards

4. **Integration**
   - Connect with complaint sentiment analysis
   - Link to scheduling system
   - Export to external compliance tools

## Troubleshooting

### No Data Showing
- Ensure database has approved inspection reports
- Check zone assignment in session
- Verify Groq API key is valid

### Analysis Taking Too Long
- Reduce max_tokens in AI model
- Implement caching for recent analyses
- Consider background job processing

### Inaccurate Detections
- Adjust threshold values
- Increase minimum reports per inspector
- Review AI prompt engineering

## Support

For issues or questions:
1. Check anomaly_logs table for error details
2. Review console logs for API errors
3. Verify database schema matches requirements
4. Ensure all dependencies are installed

---

**Last Updated:** January 20, 2026
**Version:** 1.0
**Status:** Production Ready
