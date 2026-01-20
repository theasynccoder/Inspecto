# Sentiment Analysis Setup Script
# Run this script to set up sentiment analysis feature

Write-Host "🤖 Setting up AI Sentiment Analysis Feature..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
    
    # Check if GROQ_API_KEY exists
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "GROQ_API_KEY") {
        Write-Host "✓ GROQ_API_KEY is configured" -ForegroundColor Green
    } else {
        Write-Host "⚠ GROQ_API_KEY not found in .env" -ForegroundColor Yellow
        Write-Host "  Please add: GROQ_API_KEY=your_api_key_here" -ForegroundColor Yellow
        Write-Host "  Get your free API key from: https://console.groq.com/" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "  Please create .env file with GROQ_API_KEY" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Database Migration" -ForegroundColor Cyan
Write-Host "To add sentiment analysis fields to your database, run:"
Write-Host "  mysql -u root -p your_database < src/config/migrations.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or execute the SQL commands in src/config/migrations.sql manually" -ForegroundColor Gray

Write-Host ""
Write-Host "🔄 Analyze Existing Complaints" -ForegroundColor Cyan
Write-Host "To analyze complaints that already exist, run:"
Write-Host "  node analyzeSentiment.js" -ForegroundColor Yellow

Write-Host ""
Write-Host "📚 Documentation" -ForegroundColor Cyan
Write-Host "Read SENTIMENT_ANALYSIS.md for complete guide" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Setup checklist:" -ForegroundColor Green
Write-Host "  1. Add GROQ_API_KEY to .env file"
Write-Host "  2. Run database migrations"
Write-Host "  3. (Optional) Analyze existing complaints"
Write-Host "  4. Restart server: npm run dev"
Write-Host "  5. Visit /admin/complaints to see sentiment analysis"
Write-Host ""
