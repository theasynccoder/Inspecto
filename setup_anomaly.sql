USE food_hygiene;

-- Add anomaly detection columns to inspection_reports table
ALTER TABLE inspection_reports 
ADD COLUMN anomaly_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN anomaly_type VARCHAR(50) NULL,
ADD COLUMN anomaly_severity ENUM('low', 'medium', 'high', 'critical') NULL,
ADD COLUMN anomaly_details JSON NULL,
ADD COLUMN risk_score DECIMAL(5,2) NULL,
ADD COLUMN requires_reinspection BOOLEAN DEFAULT FALSE,
ADD COLUMN anomaly_analyzed_at TIMESTAMP NULL;

-- Create anomaly_logs table for tracking
CREATE TABLE IF NOT EXISTS anomaly_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  analysis_type VARCHAR(50) NOT NULL,
  zone VARCHAR(100),
  analysis_data JSON,
  anomalies_found INT DEFAULT 0,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_anomaly_detected ON inspection_reports(anomaly_detected);
CREATE INDEX idx_anomaly_severity ON inspection_reports(anomaly_severity);
CREATE INDEX idx_requires_reinspection ON inspection_reports(requires_reinspection);

SELECT 'Anomaly detection setup completed successfully!' AS message;
