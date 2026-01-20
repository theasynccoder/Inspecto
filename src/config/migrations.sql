-- Migration: Add Sentiment Analysis Fields to Complaints Table
-- Run this SQL in your MySQL database

USE fssai;

-- Add sentiment analysis columns to complaints table
ALTER TABLE complaints
ADD COLUMN sentiment VARCHAR(20) COMMENT 'positive, neutral, negative',
ADD COLUMN sentiment_score DECIMAL(3,2) COMMENT 'Score from 0.00 to 1.00',
ADD COLUMN urgency VARCHAR(20) COMMENT 'low, medium, high, critical',
ADD COLUMN ai_analysis JSON COMMENT 'Full AI analysis results',
ADD COLUMN analyzed_at TIMESTAMP NULL COMMENT 'When sentiment analysis was performed';

-- Create index for filtering by urgency and sentiment
CREATE INDEX idx_urgency ON complaints(urgency);
CREATE INDEX idx_sentiment ON complaints(sentiment);
CREATE INDEX idx_status_urgency ON complaints(status, urgency);

-- Create sentiment analysis log table for audit
CREATE TABLE IF NOT EXISTS sentiment_analysis_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  sentiment VARCHAR(20),
  urgency VARCHAR(20),
  confidence_score DECIMAL(3,2),
  analysis_method VARCHAR(50) COMMENT 'groq-ai, rule-based, manual',
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- Add some sample data if needed (optional)
-- UPDATE complaints SET urgency = 'medium' WHERE urgency IS NULL;

SELECT 'Migration completed successfully!' as status;
