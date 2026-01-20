USE food_hygiene;

-- Test complaint 1: Critical urgency, negative sentiment
INSERT INTO complaints (user_id, restaurant_id, subject, message, is_anonymous, status, urgency, sentiment, sentiment_score, ai_analysis) 
VALUES (
  'hello@gmail.com', 
  7, 
  'Food Poisoning - Extremely Dangerous!', 
  'I ate at this restaurant yesterday and got severe food poisoning. My entire family is hospitalized. The food was undercooked and smelled terrible. This is absolutely unacceptable and dangerous!', 
  0, 
  'pending', 
  'critical', 
  'negative', 
  0.15, 
  '{"key_issues": ["food poisoning", "hospitalization", "undercooked food"], "summary": "Severe food safety violation causing hospitalization"}'
);

-- Test complaint 2: High urgency, negative sentiment
INSERT INTO complaints (user_id, restaurant_id, subject, message, is_anonymous, status, urgency, sentiment, sentiment_score, ai_analysis) 
VALUES (
  'tanmaydev49@gmail.com', 
  7, 
  'Dirty Kitchen Area', 
  'I saw cockroaches in the kitchen when the door was open. The staff were not wearing gloves. Very unhygienic conditions.', 
  0, 
  'pending', 
  'high', 
  'negative', 
  0.25, 
  '{"key_issues": ["cockroaches", "no gloves", "unhygienic"], "summary": "Pest infestation and hygiene violations"}'
);

-- Test complaint 3: Low urgency, neutral sentiment
INSERT INTO complaints (user_id, restaurant_id, subject, message, is_anonymous, status, urgency, sentiment, sentiment_score, ai_analysis) 
VALUES (
  'hello@gmail.com', 
  7, 
  'Minor Cleanliness Issue', 
  'The tables were a bit sticky and took some time to get cleaned. Otherwise food was okay.', 
  0, 
  'pending', 
  'low', 
  'neutral', 
  0.50, 
  '{"key_issues": ["sticky tables", "slow cleaning"], "summary": "Minor cleanliness concern"}'
);

-- Test complaint 4: Medium urgency, negative sentiment
INSERT INTO complaints (user_id, restaurant_id, subject, message, is_anonymous, status, urgency, sentiment, sentiment_score, ai_analysis) 
VALUES (
  'tanmaydev49@gmail.com', 
  7, 
  'Expired Products Found', 
  'I noticed that some of the packaged items in the display were past their expiry date. The milk used in my coffee tasted sour.', 
  0, 
  'pending', 
  'medium', 
  'negative', 
  0.30, 
  '{"key_issues": ["expired products", "sour milk"], "summary": "Expired food items being served"}'
);

SELECT 'Test complaints added successfully!' as status;
