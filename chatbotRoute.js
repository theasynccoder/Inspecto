const express = require('express');
const router = express.Router();
require('dotenv').config();
const fetch = require('node-fetch');

// Gemini API endpoint and key from .env
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System prompt for Gemini context
const SYSTEM_PROMPT = "Answer only questions related to food hygiene inspections, restaurant hygiene, inspection reports, and inspectors. If asked anything else, politely refuse.";

router.post('/food-chatbot', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ response: 'No prompt provided.' });
  try {
    // Use only the user prompt and system prompt in a single part for compatibility
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `${SYSTEM_PROMPT}\n${prompt}` }] }
        ]
      })
    });
    const data = await response.json();
    console.log('Gemini API response:', data); // Log full response for debugging
    const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not get a response.';
    res.json({ response: botReply });
  } catch (err) {
    res.status(500).json({ response: 'Error connecting to Gemini API.' });
  }
});

module.exports = router;
