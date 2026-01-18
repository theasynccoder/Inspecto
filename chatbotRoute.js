// const express = require("express");
// const router = express.Router();
// const mysql = require("mysql2/promise");
// require("dotenv").config();
// const fetch = require("node-fetch");

// // ================= GEMINI CONFIG =================
// const GEMINI_API_URL =
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// // ================= MYSQL POOL =================
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
//   database: process.env.DB_NAME || "fssai",
//   waitForConnections: true,
//   connectionLimit: 10,
// });

// // ================= SYSTEM PROMPT =================
// const SYSTEM_PROMPT = `You are a Food Hygiene Inspection Assistant.
// Answer ONLY using DATABASE CONTEXT.
// If unrelated, politely refuse.`;

// // ================= CHECKLIST =================
// const checklistSchema = {
//   personalHygiene: {
//     handsClean: "Staff hands are clean and washed regularly",
//     uniformClean: "Staff uniforms are clean and appropriate",
//     hairCovered: "Hair is properly covered during food handling",
//     noJewelry: "No jewelry worn during food preparation",
//   },
// };

// // ================= SEARCH TERM CLEANER =================
// function extractSearchTerm(query) {
//   let q = query.toLowerCase();

//   q = q.replace(
//     /\b(what|where|who|can|tell|show|find|about|is|are|the|a|an|give|get|provide|please|of|this|that|its)\b/gi,
//     ""
//   );

//   q = q.replace(
//     /\b(inspection|report|rating|score|hygiene|restaurant|hotel|cafe|eatery|place|hub|located|location|address)\b/gi,
//     ""
//   );

//   q = q.replace(/\b(email|gmail|mail|phone|contact|number)\b/gi, "");

//   return q.replace(/\s+/g, " ").trim();
// }

// // ================= CHECKLIST SUMMARY =================
// function summarizeChecklistIssues(reportJson) {
//   if (!reportJson) return "No checklist data available.";

//   let issues = [];
//   for (const section in reportJson) {
//     for (const key in reportJson[section]) {
//       if (reportJson[section][key] === false) {
//         issues.push(checklistSchema[section]?.[key] || key);
//       }
//     }
//   }

//   return issues.length
//     ? `Issues found:\n- ${issues.join("\n- ")}`
//     : "✅ No checklist violations found.";
// }

// // ================= MAIN RETRIEVAL WITH MEMORY =================
// async function retrieveRelevantData(userQuery, session) {
//   const queryLower = userQuery.toLowerCase();
//   let term = extractSearchTerm(userQuery);

//   // 🧠 FIX: ALWAYS USE MEMORY IF TERM IS EMPTY
//   if (!term && session.lastRestaurant) {
//     console.log("🧠 Using memory:", session.lastRestaurant);
//     term = session.lastRestaurant.toLowerCase();
//   }

//   let context = "";
//   let dataFound = false;

//   // ================= EMAIL / PHONE =================
//   if (
//     queryLower.includes("email") ||
//     queryLower.includes("phone") ||
//     queryLower.includes("contact")
//   ) {
//     const [rows] = await pool.query(
//       `
//       SELECT name, email, phone, address, zone, region
//       FROM restaurants
//       WHERE LOWER(name) LIKE ?
//       LIMIT 1
//       `,
//       [`%${term}%`]
//     );

//     if (rows.length > 0) {
//       dataFound = true;
//       context += `Restaurant: ${rows[0].name}\n`;
//       context += `Email: ${rows[0].email || "Not available"}\n`;
//       context += `Phone: ${rows[0].phone || "Not available"}\n`;
//       context += `Address: ${rows[0].address}\n`;
//       context += `Zone: ${rows[0].zone} | Region: ${rows[0].region}\n`;
//       return context;
//     }
//   }

//   // ================= RESTAURANT SEARCH =================
//   if (term.length > 1) {
//     const [restaurants] = await pool.query(
//       `
//       SELECT r.id, r.name, r.address, r.zone, r.region,
//              AVG(ir.hygiene_score) AS avg_rating
//       FROM restaurants r
//       LEFT JOIN inspection_reports ir ON r.id = ir.restaurant_id
//       WHERE LOWER(r.name) LIKE ?
//       GROUP BY r.id
//       LIMIT 1
//       `,
//       [`%${term}%`]
//     );

//     if (restaurants.length > 0) {
//       dataFound = true;

//       // 🧠 SAVE MEMORY
//       session.lastRestaurant = restaurants[0].name;

//       context += `Restaurant: ${restaurants[0].name}\n`;
//       context += `Address: ${restaurants[0].address}\n`;
//       context += `Zone: ${restaurants[0].zone} | Region: ${restaurants[0].region}\n`;
//       context += `Avg Hygiene Score: ${
//         restaurants[0].avg_rating
//           ? Number(restaurants[0].avg_rating).toFixed(1)
//           : "Not rated"
//       } / 5.0\n`;
//     }
//   }

//   return dataFound
//     ? context
//     : "No data found. Try restaurant name or location.";
// }

// // ================= CHATBOT ENDPOINT =================
// router.post("/food-chatbot", async (req, res) => {
//   const { prompt } = req.body;
//   if (!prompt) return res.status(400).json({ response: "No prompt provided." });

//   try {
//     const dbContext = await retrieveRelevantData(prompt, req.session);

//     const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [
//               {
//                 text: `${SYSTEM_PROMPT}\n\nDATABASE CONTEXT:\n${dbContext}`,
//               },
//             ],
//           },
//         ],
//       }),
//     });

//     const data = await response.json();

//     return res.json({
//       response:
//         data?.candidates?.[0]?.content?.parts?.[0]?.text || dbContext,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ response: "Server error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");
require("dotenv").config();
const fetch = require("node-fetch");

// ✅ Gemini API Configuration
const GEMINI_API_URL = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  database: process.env.DB_NAME || "fssai",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Conversation memory (in-memory, could be moved to Redis for production)
const conversationMemory = new Map(); // sessionId -> { context: [], lastRestaurant: null }

// ✅ Generate session ID from IP or create random
function getSessionId(req) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  return Buffer.from(`${ip}:${userAgent}`).toString('base64').substring(0, 32);
}

// ✅ Checklist Schema matching your project
const checklistSchema = {
  personalHygiene: {
    handsClean: 'Staff hands are clean and washed regularly',
    uniformClean: 'Staff uniforms are clean and appropriate',
    hairCovered: 'Hair is properly covered during food handling',
    noJewelry: 'No jewelry worn during food preparation'
  },
  premisesCleanliness: {
    floorsClean: 'Floors are clean and well-maintained',
    wallsClean: 'Walls are clean and free from stains',
    ceilingsClean: 'Ceilings are clean and well-maintained',
    tablesClean: 'Tables and surfaces are properly sanitized'
  },
  foodStorage: {
    temperatureControlled: 'Food stored at appropriate temperatures',
    separateRawCooked: 'Raw and cooked foods stored separately',
    properLabeling: 'Food items are properly labeled with dates',
    noExpiredItems: 'No expired food items found'
  },
  equipment: {
    cleanUtensils: 'Utensils are clean and properly stored',
    workingRefrigeration: 'Refrigeration equipment working properly',
    properSanitization: 'Equipment is properly sanitized',
    maintenanceUpToDate: 'Equipment maintenance is up to date'
  },
  wasteManagement: {
    properDisposal: 'Waste is disposed of properly',
    coveredBins: 'Waste bins are covered and clean',
    regularCollection: 'Regular waste collection schedule followed',
    pestControl: 'Effective pest control measures in place'
  }
};

// ✅ Vector store simulation (in-memory)
let vectorStore = {
  documents: [],
  restaurantIndex: new Map(),
  reportIndex: new Map(),
  inspectorIndex: new Map(),
  complaintIndex: new Map()
};

// ✅ Simple text similarity function
function calculateSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ✅ Extract keywords from query
function extractKeywords(query) {
  const stopWords = new Set([
    'what', 'where', 'when', 'who', 'why', 'how', 'can', 'could', 'would', 'should',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'about', 'above', 'below', 'under', 'over', 'between', 'among', 'through', 'during', 'before',
    'after', 'since', 'until', 'while', 'from', 'into', 'onto', 'upon', 'within', 'without',
    'me', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'our', 'your', 'my', 'his', 'her',
    'this', 'that', 'these', 'those', 'there', 'here', 'where', 'when', 'why', 'how',
    'not', 'no', 'yes', 'ok', 'please', 'thank', 'thanks', 'sorry', 'excuse'
  ]);
  
  const hygieneWords = new Set([
    'hygiene', 'inspection', 'inspect', 'report', 'rating', 'score', 'clean', 'cleanliness',
    'restaurant', 'hotel', 'cafe', 'eatery', 'food', 'kitchen', 'safety', 'health',
    'violation', 'complaint', 'inspector', 'checklist', 'audit', 'compliance'
  ]);
  
  const words = query.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.has(word))
    .filter(word => !hygieneWords.has(word));
  
  return [...new Set(words)];
}

// ✅ Enhanced query understanding with conversation memory
function understandQueryWithContext(userQuery, sessionData) {
  const queryLower = userQuery.toLowerCase();
  let enhancedQuery = userQuery;
  
  // If query contains pronouns referring to previous restaurant
  const referringWords = ['it', 'that', 'this', 'there', 'the restaurant', 'the place'];
  const isReferring = referringWords.some(word => 
    queryLower.includes(word) && queryLower.split(/\s+/).length < 5
  );
  
  // If user is referring to previously mentioned restaurant
  if (isReferring && sessionData.lastRestaurant) {
    enhancedQuery = `${userQuery} about ${sessionData.lastRestaurant.name}`;
    console.log(`🔄 Enhanced query with context: "${enhancedQuery}"`);
  }
  
  // If query is vague but we have context
  if ((queryLower.includes('inspection') || queryLower.includes('report') || queryLower.includes('score')) &&
      !extractKeywords(userQuery).length && sessionData.lastRestaurant) {
    enhancedQuery = `${userQuery} for ${sessionData.lastRestaurant.name}`;
    console.log(`🔄 Enhanced vague query: "${enhancedQuery}"`);
  }
  
  return enhancedQuery;
}

// ✅ System prompt for RAG with memory awareness
const SYSTEM_PROMPT = `You are a Food Hygiene Inspection Assistant with comprehensive database access and conversation memory.

RESPONSE GUIDELINES:
1. Answer based ONLY on the RETRIEVED CONTEXT below
2. Use CONVERSATION CONTEXT to understand references like "it", "that restaurant", "the place"
3. If contact info (email/phone/address) is in context, provide it when asked
4. For multiple matches, list them clearly with relevant details
5. Be concise, factual, and helpful
6. If information is not in context, admit it and suggest alternatives

ALLOWED TOPICS:
- Restaurants and their details (name, address, contact, location)
- Inspection reports, scores, and findings
- Inspectors and their assignments
- Complaints and resolutions
- Hygiene ratings and compliance
- Restaurant locations (zone/region)
- Checklist violations and issues
- System statistics and summaries

CONVERSATION CONTEXT:
{{CONVERSATION_CONTEXT}}`;

/**
 * ✅ Create document chunks from database
 */
async function createDocumentChunks() {
  console.log("📚 Creating document chunks from database...");
  
  const chunks = [];
  
  try {
    // 1. Restaurants (primary documents)
    const [restaurants] = await pool.query(`
      SELECT 
        id, name, address, zone, region, phone, email,
        license_number, contact_person, hygiene_score,
        created_at, status, last_inspection_date
      FROM restaurants
    `);
    
    restaurants.forEach(r => {
      chunks.push({
        id: `restaurant_${r.id}`,
        content: `
          RESTAURANT: ${r.name}
          ID: ${r.id}
          ADDRESS: ${r.address}
          ZONE: ${r.zone || 'N/A'}
          REGION: ${r.region || 'N/A'}
          PHONE: ${r.phone || 'N/A'}
          EMAIL: ${r.email || 'N/A'}
          LICENSE: ${r.license_number || 'N/A'}
          CONTACT PERSON: ${r.contact_person || 'N/A'}
          STATUS: ${r.status || 'pending'}
          HYGIENE SCORE: ${r.hygiene_score || 'Not rated'}/5.0
          LAST INSPECTION: ${r.last_inspection_date ? new Date(r.last_inspection_date).toLocaleDateString() : 'Never'}
          CREATED AT: ${new Date(r.created_at).toLocaleDateString()}
        `,
        metadata: {
          type: 'restaurant',
          id: r.id,
          name: r.name,
          zone: r.zone,
          region: r.region,
          hasContact: !!(r.email || r.phone),
          score: r.hygiene_score,
          status: r.status
        },
        keywords: extractKeywords(`${r.name} ${r.address} ${r.zone} ${r.region} ${r.contact_person}`)
      });
      
      if (r.email || r.phone) {
        chunks.push({
          id: `contact_${r.id}`,
          content: `
            CONTACT INFORMATION FOR ${r.name}:
            📧 Email: ${r.email || 'Not available'}
            📞 Phone: ${r.phone || 'Not available'}
            👤 Contact Person: ${r.contact_person || 'N/A'}
            📍 Location: ${r.address}
            📋 Status: ${r.status}
            ⭐ Hygiene Score: ${r.hygiene_score || 'Not rated'}/5.0
          `,
          metadata: {
            type: 'contact',
            restaurantId: r.id,
            restaurantName: r.name,
            hasEmail: !!r.email,
            hasPhone: !!r.phone
          },
          keywords: extractKeywords(`email phone contact ${r.name} ${r.email} ${r.phone}`)
        });
      }
    });
    
    // 2. Inspection Reports
    const [reports] = await pool.query(`
      SELECT 
        ir.id, ir.restaurant_id, ir.submitted_at, ir.hygiene_score, 
        ir.status, ir.notes, ir.report_json,
        r.name as restaurant_name,
        i.name as inspector_name
      FROM inspection_reports ir
      JOIN restaurants r ON ir.restaurant_id = r.id
      JOIN inspectors i ON ir.inspector_id = i.id
      ORDER BY ir.submitted_at DESC
      LIMIT 100
    `);
    
    reports.forEach(rep => {
      let issues = [];
      let allPassed = true;
      if (rep.report_json) {
        try {
          const parsed = typeof rep.report_json === 'string' ? JSON.parse(rep.report_json) : rep.report_json;
          
          for (const section in checklistSchema) {
            if (parsed[section]) {
              for (const key in checklistSchema[section]) {
                if (parsed[section][key] === false) {
                  const description = checklistSchema[section][key];
                  issues.push(description);
                  allPassed = false;
                }
              }
            }
          }
        } catch (e) {
          console.error("Checklist parse error:", e.message);
        }
      }
      
      chunks.push({
        id: `report_${rep.id}`,
        content: `
          INSPECTION REPORT
          RESTAURANT: ${rep.restaurant_name}
          REPORT ID: ${rep.id}
          DATE: ${new Date(rep.submitted_at).toLocaleDateString()}
          SCORE: ${rep.hygiene_score}/5.0
          STATUS: ${rep.status}
          INSPECTOR: ${rep.inspector_name}
          NOTES: ${rep.notes || 'No notes'}
          ${issues.length > 0 ? `ISSUES FOUND:\n- ${issues.join('\n- ')}` : '✅ ALL CHECKLIST ITEMS PASSED'}
          ${!allPassed && issues.length === 0 ? '⚠️ Some checklist items missing or invalid' : ''}
        `,
        metadata: {
          type: 'inspection_report',
          id: rep.id,
          restaurantId: rep.restaurant_id,
          restaurantName: rep.restaurant_name,
          date: rep.submitted_at,
          score: rep.hygiene_score,
          status: rep.status,
          inspector: rep.inspector_name,
          hasIssues: issues.length > 0,
          issueCount: issues.length
        },
        keywords: extractKeywords(`${rep.restaurant_name} ${rep.inspector_name} inspection report score ${rep.hygiene_score} ${rep.status}`)
      });
    });
    
    // Store in vector store
    vectorStore.documents = chunks;
    
    // Build indexes for faster lookup
    vectorStore.restaurantIndex.clear();
    vectorStore.reportIndex.clear();
    
    chunks.forEach(chunk => {
      switch (chunk.metadata.type) {
        case 'restaurant':
        case 'contact':
          vectorStore.restaurantIndex.set(chunk.metadata.id || chunk.metadata.restaurantId, chunk);
          break;
        case 'inspection_report':
          vectorStore.reportIndex.set(chunk.metadata.id, chunk);
          break;
      }
    });
    
    console.log(`✅ Created ${chunks.length} document chunks`);
    return chunks;
    
  } catch (error) {
    console.error("❌ Error creating document chunks:", error);
    throw error;
  }
}

/**
 * ✅ Enhanced search with conversation context
 */
async function searchChunks(query, sessionData, limit = 7) {
  const queryLower = query.toLowerCase();
  const keywords = extractKeywords(query);
  
  console.log(`🔍 Searching for: "${query}"`);
  console.log(`📝 Keywords:`, keywords);
  
  const results = {
    restaurants: [],
    inspection_reports: [],
    complaints: [],
    inspectors: [],
    statistics: [],
    other: []
  };
  
  // If we have a last restaurant in memory and query is vague, prioritize it
  if (sessionData.lastRestaurant && (keywords.length === 0 || queryLower.includes('it') || queryLower.includes('that'))) {
    console.log(`🎯 Using remembered restaurant: ${sessionData.lastRestaurant.name}`);
    
    // Search for the remembered restaurant
    vectorStore.documents
      .filter(doc => doc.metadata.type === 'restaurant' || doc.metadata.type === 'contact')
      .filter(doc => doc.metadata.name === sessionData.lastRestaurant.name || 
                     doc.metadata.restaurantName === sessionData.lastRestaurant.name)
      .forEach(doc => {
        results.restaurants.push({
          ...doc,
          similarity: 1.0 // High similarity for remembered restaurant
        });
      });
    
    // Search for inspection reports for the remembered restaurant
    vectorStore.documents
      .filter(doc => doc.metadata.type === 'inspection_report')
      .filter(doc => doc.metadata.restaurantName === sessionData.lastRestaurant.name)
      .forEach(doc => {
        results.inspection_reports.push({
          ...doc,
          similarity: 1.0
        });
      });
  }
  
  // Regular search for other documents
  vectorStore.documents.forEach(doc => {
    let similarity = calculateSimilarity(query, doc.content);
    
    const keywordMatch = keywords.filter(kw => 
      doc.content.toLowerCase().includes(kw) || 
      (doc.keywords && doc.keywords.some(dk => dk.includes(kw) || kw.includes(dk)))
    ).length;
    
    similarity += (keywordMatch * 0.2);
    
    if (doc.content.toLowerCase().includes(queryLower) || 
        queryLower.includes(doc.metadata.name?.toLowerCase() || '') ||
        queryLower.includes(doc.metadata.restaurantName?.toLowerCase() || '')) {
      similarity += 0.3;
    }
    
    if (similarity > 0.15) {
      const result = { ...doc, similarity };
      
      switch (doc.metadata.type) {
        case 'restaurant':
        case 'contact':
          results.restaurants.push(result);
          break;
        case 'inspection_report':
          results.inspection_reports.push(result);
          break;
        case 'inspector':
          results.inspectors.push(result);
          break;
        case 'complaint':
          results.complaints.push(result);
          break;
        case 'statistics':
          results.statistics.push(result);
          break;
        default:
          results.other.push(result);
      }
    }
  });
  
  // Sort by similarity and limit results
  Object.keys(results).forEach(key => {
    results[key].sort((a, b) => b.similarity - a.similarity);
    results[key] = results[key].slice(0, limit);
  });
  
  return results;
}

/**
 * ✅ Update conversation memory with new information
 */
function updateConversationMemory(sessionId, userQuery, botResponse, searchResults) {
  if (!conversationMemory.has(sessionId)) {
    conversationMemory.set(sessionId, {
      context: [],
      lastRestaurant: null,
      lastQuery: null,
      timestamp: Date.now()
    });
  }
  
  const sessionData = conversationMemory.get(sessionId);
  
  // Add to conversation history (keep last 5 exchanges)
  sessionData.context.push({
    user: userQuery,
    bot: botResponse.substring(0, 200) + (botResponse.length > 200 ? '...' : ''),
    timestamp: new Date().toISOString()
  });
  
  if (sessionData.context.length > 5) {
    sessionData.context = sessionData.context.slice(-5);
  }
  
  // Update last restaurant if found in results
  if (searchResults.restaurants.length > 0) {
    const restaurant = searchResults.restaurants[0];
    sessionData.lastRestaurant = {
      name: restaurant.metadata.name || restaurant.metadata.restaurantName,
      id: restaurant.metadata.id || restaurant.metadata.restaurantId,
      timestamp: Date.now()
    };
  }
  
  // Update last query
  sessionData.lastQuery = userQuery;
  sessionData.timestamp = Date.now();
  
  // Clean up old sessions (older than 30 minutes)
  const now = Date.now();
  for (const [sid, data] of conversationMemory.entries()) {
    if (now - data.timestamp > 30 * 60 * 1000) {
      conversationMemory.delete(sid);
    }
  }
  
  console.log(`💾 Updated memory for session ${sessionId.substring(0, 8)}...`);
  console.log(`   Last restaurant: ${sessionData.lastRestaurant?.name || 'None'}`);
  console.log(`   Conversation length: ${sessionData.context.length}`);
}

/**
 * ✅ Format conversation context for prompt
 */
function formatConversationContext(sessionData) {
  if (!sessionData || sessionData.context.length === 0) {
    return "No previous conversation context.";
  }
  
  let context = "PREVIOUS CONVERSATION:\n";
  sessionData.context.forEach((exchange, index) => {
    context += `\n${index + 1}. User: ${exchange.user}\n   Bot: ${exchange.bot}\n`;
  });
  
  if (sessionData.lastRestaurant) {
    context += `\nCURRENT CONTEXT: We were discussing "${sessionData.lastRestaurant.name}".`;
  }
  
  return context;
}

/**
 * ✅ Generate response with Gemini using memory
 */
async function generateRAGResponse(query, searchResults, sessionData) {
  try {
    const conversationContext = formatConversationContext(sessionData);
    const systemPromptWithMemory = SYSTEM_PROMPT.replace('{{CONVERSATION_CONTEXT}}', conversationContext);
    
    const context = formatSearchResults(searchResults);
    
    const augmentedPrompt = `${systemPromptWithMemory}

RETRIEVED DATABASE CONTEXT:
${context}

USER QUESTION: ${query}

CRITICAL INSTRUCTIONS:
1. Use BOTH conversation context and database context
2. If user says "it", "that", "the restaurant", refer to the last mentioned restaurant
3. If contact information is available, provide it
4. Be conversational and helpful
5. If no relevant info, suggest what else you can help with`;

    console.log("🚀 Sending to Gemini with memory...");
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: augmentedPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error("❌ Gemini error:", data.error);
      throw new Error(data.error.message);
    }

    return data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response based on the available information.";

  } catch (error) {
    console.error("❌ RAG response generation error:", error);
    throw error;
  }
}

/**
 * ✅ Format search results for context
 */
function formatSearchResults(results) {
  let context = "=== RETRIEVED CONTEXT ===\n\n";
  
  const sections = [
    { key: 'restaurants', title: '🏢 RESTAURANTS' },
    { key: 'inspection_reports', title: '📋 INSPECTION REPORTS' },
    { key: 'inspectors', title: '👨‍💼 INSPECTORS' },
    { key: 'complaints', title: '⚠️ COMPLAINTS' },
    { key: 'statistics', title: '📊 STATISTICS' },
    { key: 'other', title: '📄 OTHER INFORMATION' }
  ];
  
  let totalResults = 0;
  
  sections.forEach(section => {
    if (results[section.key].length > 0) {
      context += `${section.title}:\n`;
      results[section.key].forEach((result, i) => {
        context += `\n[${i + 1}] ${result.content}\n`;
      });
      context += "\n";
      totalResults += results[section.key].length;
    }
  });
  
  if (totalResults === 0) {
    context += "No relevant information found in the database.\n";
  }
  
  return context;
}

// ✅ Main RAG chatbot endpoint WITH MEMORY
router.post("/food-chatbot", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ response: "No prompt provided." });

  const sessionId = getSessionId(req);
  console.log(`\n🎯 SESSION ${sessionId.substring(0, 8)}...: "${prompt}"`);
  
  try {
    // Initialize vector store if empty
    if (vectorStore.documents.length === 0) {
      console.log("🔄 Initializing document store...");
      await createDocumentChunks();
    }
    
    // Get or create session data
    if (!conversationMemory.has(sessionId)) {
      conversationMemory.set(sessionId, {
        context: [],
        lastRestaurant: null,
        lastQuery: null,
        timestamp: Date.now()
      });
    }
    
    const sessionData = conversationMemory.get(sessionId);
    
    // Enhance query with conversation context
    const enhancedQuery = understandQueryWithContext(prompt, sessionData);
    
    // Perform semantic search with context
    console.log("🔍 Performing semantic search with memory...");
    let searchResults = await searchChunks(enhancedQuery, sessionData);
    
    // Check if we got meaningful results
    const totalResults = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);
    
    // Fallback to direct database search if no results
    if (totalResults === 0) {
      console.log("⚠️ No semantic results, trying fallback...");
      
      // Try to use last restaurant from memory
      if (sessionData.lastRestaurant) {
        const [restaurant] = await pool.query(
          `SELECT name, address, phone, email, hygiene_score FROM restaurants 
           WHERE id = ? OR LOWER(name) LIKE ?`,
          [sessionData.lastRestaurant.id, `%${sessionData.lastRestaurant.name.toLowerCase()}%`]
        );
        
        if (restaurant.length > 0) {
          const r = restaurant[0];
          searchResults.restaurants.push({
            id: `memory_${r.id}`,
            content: `RESTAURANT: ${r.name}\nADDRESS: ${r.address}\nPHONE: ${r.phone || 'N/A'}\nEMAIL: ${r.email || 'N/A'}\nSCORE: ${r.hygiene_score || 'N/A'}/5.0`,
            metadata: { type: 'restaurant', name: r.name },
            similarity: 1.0
          });
        }
      }
    }
    
    // Generate RAG response with memory
    console.log("🤖 Generating RAG response with memory...");
    const botReply = await generateRAGResponse(prompt, searchResults, sessionData);
    
    // Update conversation memory
    updateConversationMemory(sessionId, prompt, botReply, searchResults);
    
    console.log("✅ Response generated with memory");
    return res.json({ 
      response: botReply,
      memory: {
        hasContext: sessionData.context.length > 0,
        lastRestaurant: sessionData.lastRestaurant?.name
      }
    });
    
  } catch (err) {
    console.error("❌ RAG chatbot error:", err);
    
    // Ultimate fallback
    try {
      const sessionData = conversationMemory.get(sessionId) || {};
      
      // Try to use remembered restaurant
      if (sessionData.lastRestaurant) {
        const [fallback] = await pool.query(
          `SELECT name, address, phone, email, hygiene_score FROM restaurants 
           WHERE id = ?`,
          [sessionData.lastRestaurant.id]
        );
        
        if (fallback.length > 0) {
          const r = fallback[0];
          const response = `Based on our previous conversation about **${r.name}**:\n\n` +
                          `📍 Address: ${r.address}\n` +
                          (r.phone ? `📞 Phone: ${r.phone}\n` : '') +
                          (r.email ? `📧 Email: ${r.email}\n` : '') +
                          (r.hygiene_score ? `⭐ Hygiene Score: ${r.hygiene_score}/5.0` : '');
          
          return res.json({ response });
        }
      }
      
      return res.json({ 
        response: "I'm having trouble accessing the information. Could you please specify which restaurant you're asking about?"
      });
      
    } catch (fallbackErr) {
      console.error("❌ Fallback error:", fallbackErr);
      return res.status(500).json({ 
        response: "System error. Please try again later." 
      });
    }
  }
});

// ✅ Memory debugging endpoint
router.get("/food-chatbot/memory", async (req, res) => {
  const sessionId = getSessionId(req);
  const sessionData = conversationMemory.get(sessionId);
  
  res.json({
    sessionId: sessionId.substring(0, 12) + '...',
    hasMemory: !!sessionData,
    memory: sessionData || null,
    totalSessions: conversationMemory.size,
    vectorStoreDocuments: vectorStore.documents.length
  });
});

// ✅ Clear memory endpoint (for testing)
router.post("/food-chatbot/clear-memory", async (req, res) => {
  const sessionId = getSessionId(req);
  conversationMemory.delete(sessionId);
  
  res.json({
    status: "✅ Memory cleared",
    sessionId: sessionId.substring(0, 12) + '...'
  });
});

// ✅ Initialize endpoint
router.get("/food-chatbot/init", async (req, res) => {
  try {
    await createDocumentChunks();
    
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM restaurants) as restaurants,
        (SELECT COUNT(*) FROM inspection_reports) as reports,
        (SELECT COUNT(*) FROM complaints) as complaints,
        (SELECT COUNT(*) FROM inspectors) as inspectors
    `);
    
    res.json({
      status: "✅ Document store initialized",
      documents: vectorStore.documents.length,
      memory_sessions: conversationMemory.size,
      database_stats: stats[0],
      indexes: {
        restaurants: vectorStore.restaurantIndex.size,
        reports: vectorStore.reportIndex.size
      }
    });
  } catch (err) {
    console.error("Init error:", err);
    res.status(500).json({ 
      status: "❌ Initialization failed", 
      error: err.message
    });
  }
});

// ✅ Test endpoint
router.get("/food-chatbot/test", async (req, res) => {
  try {
    const [restaurants] = await pool.query("SELECT COUNT(*) as count FROM restaurants");
    const [reports] = await pool.query("SELECT COUNT(*) as count FROM inspection_reports");
    const [inspectors] = await pool.query("SELECT COUNT(*) as count FROM inspectors");

    res.json({
      status: "✅ Connected",
      rag_system: vectorStore.documents.length > 0 ? "Initialized" : "Not initialized",
      memory_enabled: true,
      document_count: vectorStore.documents.length,
      active_sessions: conversationMemory.size,
      data: {
        restaurants: restaurants[0].count,
        inspection_reports: reports[0].count,
        inspectors: inspectors[0].count
      },
    });
  } catch (err) {
    console.error("Test error:", err);
    res.status(500).json({ 
      status: "❌ Failed", 
      error: err.message
    });
  }
});

// ✅ Simple memory test
router.post("/food-chatbot/test-memory", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt provided." });

  const sessionId = getSessionId(req);
  const sessionData = conversationMemory.get(sessionId);
  
  res.json({
    prompt,
    sessionId: sessionId.substring(0, 12) + '...',
    hasMemory: !!sessionData,
    lastRestaurant: sessionData?.lastRestaurant,
    conversationHistory: sessionData?.context || []
  });
});

module.exports = router;