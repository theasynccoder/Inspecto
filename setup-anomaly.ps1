# PowerShell script to set up anomaly detection columns in the database

Write-Host "Setting up Anomaly Detection in MySQL..." -ForegroundColor Cyan

# Database credentials
$DB_USER = "tanmay"
$DB_PASS = "tannu"
$DB_NAME = "food_hygiene"

# SQL commands to add anomaly detection columns
$SQL_COMMANDS = @"
USE $DB_NAME;

ALTER TABLE inspection_reports 
ADD COLUMN IF NOT EXISTS anomaly_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anomaly_type VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS anomaly_severity ENUM('low', 'medium', 'high', 'critical') NULL,
ADD COLUMN IF NOT EXISTS anomaly_details JSON NULL,
ADD COLUMN IF NOT EXISTS risk_score DECIMAL(5,2) NULL,
ADD COLUMN IF NOT EXISTS requires_reinspection BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anomaly_analyzed_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS anomaly_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  analysis_type VARCHAR(50) NOT NULL,
  zone VARCHAR(100),
  analysis_data JSON,
  anomalies_found INT DEFAULT 0,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anomaly_detected ON inspection_reports(anomaly_detected);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON inspection_reports(anomaly_severity);
CREATE INDEX IF NOT EXISTS idx_requires_reinspection ON inspection_reports(requires_reinspection);
"@

# Execute SQL commands
try {
    $SQL_COMMANDS | mysql -u $DB_USER -p$DB_PASS 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Anomaly detection columns added successfully!" -ForegroundColor Green
        Write-Host "  - Added anomaly tracking fields to inspection_reports" -ForegroundColor Gray
        Write-Host "  - Created anomaly_logs table" -ForegroundColor Gray
        Write-Host "  - Added performance indexes" -ForegroundColor Gray
    } else {
        Write-Host "Error setting up anomaly detection!" -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to connect to MySQL" -ForegroundColor Red
}

Write-Host "Setup complete!" -ForegroundColor Cyan
