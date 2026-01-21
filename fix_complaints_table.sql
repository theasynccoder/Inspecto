USE fssai;

-- Add missing columns to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS images JSON AFTER is_anonymous,
ADD COLUMN IF NOT EXISTS sentiment VARCHAR(50) AFTER images,
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2) AFTER sentiment,
ADD COLUMN IF NOT EXISTS urgency VARCHAR(50) AFTER sentiment_score,
ADD COLUMN IF NOT EXISTS ai_analysis JSON AFTER urgency,
ADD COLUMN IF NOT EXISTS analyzed_at DATETIME AFTER ai_analysis;

-- Show the updated table structure
DESCRIBE complaints;
