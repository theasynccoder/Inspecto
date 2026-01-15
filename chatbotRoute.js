// // const express = require('express');
// // const router = express.Router();
// // require('dotenv').config();
// // const fetch = require('node-fetch');

// // // Gemini API endpoint and key from .env
// // const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
// // const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// // // System prompt for Gemini context
// // const SYSTEM_PROMPT = "Answer only questions related to food hygiene inspections, restaurant hygiene, inspection reports, and inspectors. If asked anything else, politely refuse.";

// // router.post('/food-chatbot', async (req, res) => {
// //   const { prompt } = req.body;
// //   if (!prompt) return res.status(400).json({ response: 'No prompt provided.' });
// //   try {
// //     // Use only the user prompt and system prompt in a single part for compatibility
// //     const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
// //       method: 'POST',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify({
// //         contents: [
// //           { parts: [{ text: `${SYSTEM_PROMPT}\n${prompt}` }] }
// //         ]
// //       })
// //     });
// //     const data = await response.json();
// //     console.log('Gemini API response:', data); // Log full response for debugging
// //     const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not get a response.';
// //     res.json({ response: botReply });
// //   } catch (err) {
// //     res.status(500).json({ response: 'Error connecting to Gemini API.' });
// //   }
// // });

// // module.exports = router;

// const express = require("express");
// const router = express.Router();
// const mysql = require("mysql2/promise");
// require("dotenv").config();
// const fetch = require("node-fetch");

// // Gemini API Configuration
// const GEMINI_API_URL =
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// // ✅ MySQL Connection Pool
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
//   database: process.env.DB_NAME || "fssai",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// // Debug log (no password)
// console.log("📊 Database Config:", {
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   database: process.env.DB_NAME || "fssai",
//   passwordProvided: !!(process.env.DB_PASSWORD || process.env.DB_PASS),
// });

// // ✅ Checklist Schema for Report Explanation
// const checklistSchema = {
//   personalHygiene: {
//     handsClean: "Staff hands are clean and washed regularly",
//     uniformClean: "Staff uniforms are clean and appropriate",
//     hairCovered: "Hair is properly covered during food handling",
//     noJewelry: "No jewelry worn during food preparation",
//   },
//   premisesCleanliness: {
//     floorsClean: "Floors are clean and well-maintained",
//     wallsClean: "Walls are clean and free from stains",
//     ceilingsClean: "Ceilings are clean and well-maintained",
//     tablesClean: "Tables and surfaces are properly sanitized",
//   },
//   foodStorage: {
//     temperatureControlled: "Food stored at appropriate temperatures",
//     separateRawCooked: "Raw and cooked foods stored separately",
//     properLabeling: "Food items are properly labeled with dates",
//     noExpiredItems: "No expired food items found",
//   },
//   equipment: {
//     cleanUtensils: "Utensils are clean and properly stored",
//     workingRefrigeration: "Refrigeration equipment working properly",
//     properSanitization: "Equipment is properly sanitized",
//     maintenanceUpToDate: "Equipment maintenance is up to date",
//   },
//   wasteManagement: {
//     properDisposal: "Waste is disposed of properly",
//     coveredBins: "Waste bins are covered and clean",
//     regularCollection: "Regular waste collection schedule followed",
//     pestControl: "Effective pest control measures in place",
//   },
// };

// // ✅ System prompt for RAG
// const SYSTEM_PROMPT = `You are a Food Hygiene Inspection Assistant.

// You answer ONLY questions related to:
// - food hygiene inspections
// - restaurants
// - hygiene ratings
// - inspection reports and checklist
// - inspectors
// - complaints and favorites

// RULES:
// 1) Use the DATABASE CONTEXT provided.
// 2) If the user asks "where is it located", answer using address/zone/region.
// 3) If restaurant not found, suggest searching using name OR zone OR region OR address keywords.
// 4) Be short, user-friendly, and factual.
// 5) If asked unrelated questions, politely refuse.`;

// // ✅ Helps remove junk words
// // function extractSearchTerm(query) {
// //   const q = query.toLowerCase();

// //   return q
// //     .replace(/^(what|where|can|tell|show|find|about|is|the|me|you|give|get|provide)\s+/gi, "")
// //     .replace(/\b(inspection|inspections|report|reports|rating|score|hygiene|located|location|address)\b/gi, "")
// //     .replace(/\b(restaurant|hotel|cafe|eatery|place|hub|near)\b/gi, "")
// //     .trim();
// // }


// function extractSearchTerm(query) {
//   return query
//     .toLowerCase()
//     // remove question words ANYWHERE not only at start
//     .replace(/\b(what|where|can|tell|show|find|about|is|the|me|you|give|get|provide|located|location|address)\b/gi, "")
//     .replace(/\b(inspection|inspections|report|reports|rating|score|hygiene|restaurant|hotel|cafe|eatery|place|hub|near)\b/gi, "")
//     .replace(/\s+/g, " ")
//     .trim();
// }


// // ✅ Utility: Convert report_json to human readable issues
// function summarizeChecklistIssues(reportJson) {
//   if (!reportJson) return "No checklist data available.";

//   let issues = [];
//   for (const section in reportJson) {
//     if (!reportJson[section]) continue;

//     for (const key in reportJson[section]) {
//       const value = reportJson[section][key];
//       if (value === false) {
//         const label = checklistSchema?.[section]?.[key] || `${section}.${key}`;
//         issues.push(label);
//       }
//     }
//   }

//   return issues.length > 0
//     ? `Issues found:\n- ${issues.join("\n- ")}`
//     : "✅ No checklist violations found (all items passed).";
// }

// // ✅ Main retrieval logic
// async function retrieveRelevantData(userQuery) {
//   const queryLower = userQuery.toLowerCase();
//   const term = extractSearchTerm(userQuery);

//   let context = "";
//   let dataFound = false;

//   try {
//     console.log("🔍 Processing query:", userQuery);
//     console.log("📝 Extracted term:", term);

//     // ✅ 1) Restaurant search (name/address/zone/region)
//     if (term.length > 2) {
//       const [restaurants] = await pool.query(
//         `
//         SELECT 
//           r.id, r.name, r.address, r.zone, r.region, r.phone, r.email,
//           r.license_number, r.contact_person,
//           AVG(ir.hygiene_score) as avg_rating,
//           COUNT(ir.id) as report_count,
//           MAX(ir.submitted_at) as last_report_date
//         FROM restaurants r
//         LEFT JOIN inspection_reports ir 
//           ON r.id = ir.restaurant_id AND ir.status='approved'
//         WHERE LOWER(r.name) LIKE ?
//            OR LOWER(r.address) LIKE ?
//            OR LOWER(r.zone) LIKE ?
//            OR LOWER(r.region) LIKE ?
//         GROUP BY r.id
//         LIMIT 5
//         `,
//         [`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`]
//       );

//       if (restaurants.length > 0) {
//         dataFound = true;

//         context += "\n\n=== RESTAURANTS FOUND ===\n";
//         restaurants.forEach((r) => {
//           context += `\nRestaurant: ${r.name}\n`;
//           context += `Address: ${r.address}\n`;
//           context += `Zone: ${r.zone || "N/A"} | Region: ${r.region || "N/A"}\n`;
//           context += `Avg Hygiene Score: ${r.avg_rating ? Number(r.avg_rating).toFixed(1) : "Not rated"} / 5.0\n`;
//           context += `Inspection Reports: ${r.report_count}\n`;
//           context += `Last Report Date: ${r.last_report_date ? new Date(r.last_report_date).toLocaleDateString() : "N/A"}\n`;
//         });

//         // ✅ Detailed inspection reports for first match
//         const rid = restaurants[0].id;

//         const [reports] = await pool.query(
//           `
//           SELECT 
//             ir.id, ir.submitted_at, ir.hygiene_score, ir.status, ir.notes, ir.report_json,
//             i.name AS inspector_name
//           FROM inspection_reports ir
//           JOIN inspectors i ON ir.inspector_id = i.id
//           WHERE ir.restaurant_id = ?
//           ORDER BY ir.submitted_at DESC
//           LIMIT 3
//           `,
//           [rid]
//         );

//         if (reports.length > 0) {
//           context += "\n\n=== RECENT INSPECTION REPORTS (Top 3) ===\n";
//           reports.forEach((rep, idx) => {
//             context += `\n${idx + 1}) Date: ${new Date(rep.submitted_at).toLocaleDateString()}\n`;
//             context += `Score: ${rep.hygiene_score}/5.0 | Status: ${rep.status}\n`;
//             context += `Inspector: ${rep.inspector_name}\n`;
//             if (rep.notes) context += `Notes: ${rep.notes}\n`;

//             // ✅ Checklist issues summary
//             if (rep.report_json) {
//               let reportParsed;
//               try {
//                 reportParsed = typeof rep.report_json === "string" ? JSON.parse(rep.report_json) : rep.report_json;
//               } catch {
//                 reportParsed = null;
//               }
//               context += summarizeChecklistIssues(reportParsed) + "\n";
//             }
//           });
//         }
//       }
//     }

//     // ✅ 2) Location query (near/zone/region)
//     if (!dataFound && (queryLower.includes("near") || queryLower.includes("zone") || queryLower.includes("region"))) {
//       const [restaurantsByLocation] = await pool.query(
//         `
//         SELECT id, name, address, zone, region, hygiene_score
//         FROM restaurants
//         WHERE LOWER(zone) LIKE ? OR LOWER(region) LIKE ? OR LOWER(address) LIKE ?
//         LIMIT 10
//         `,
//         [`%${term}%`, `%${term}%`, `%${term}%`]
//       );

//       if (restaurantsByLocation.length > 0) {
//         dataFound = true;
//         context += "\n\n=== RESTAURANTS IN THIS LOCATION ===\n";
//         restaurantsByLocation.forEach((r, idx) => {
//           context += `${idx + 1}. ${r.name} | ${r.zone}/${r.region}\n`;
//           context += `   Address: ${r.address}\n`;
//           context += `   Current Hygiene Score: ${r.hygiene_score || "N/A"} / 5.0\n`;
//         });
//       }
//     }

//     // ✅ 3) Recent reports
//     if (!dataFound && (queryLower.includes("recent") || queryLower.includes("latest"))) {
//       const [recent] = await pool.query(`
//         SELECT 
//           ir.submitted_at, ir.hygiene_score,
//           r.name as restaurant_name, r.zone, r.region, r.address,
//           i.name as inspector_name
//         FROM inspection_reports ir
//         JOIN restaurants r ON ir.restaurant_id = r.id
//         JOIN inspectors i ON ir.inspector_id = i.id
//         ORDER BY ir.submitted_at DESC
//         LIMIT 5
//       `);

//       if (recent.length > 0) {
//         dataFound = true;
//         context += "\n\n=== LATEST INSPECTION REPORTS ===\n";
//         recent.forEach((r, idx) => {
//           context += `\n${idx + 1}) ${r.restaurant_name}\n`;
//           context += `Address: ${r.address}\n`;
//           context += `Zone: ${r.zone} | Region: ${r.region}\n`;
//           context += `Score: ${r.hygiene_score}/5.0 | Date: ${new Date(r.submitted_at).toLocaleDateString()}\n`;
//           context += `Inspector: ${r.inspector_name}\n`;
//         });
//       }
//     }

//     // ✅ 4) Stats
//     if (!dataFound && (queryLower.includes("stats") || queryLower.includes("total") || queryLower.includes("how many"))) {
//       const [stats] = await pool.query(`
//         SELECT
//           (SELECT COUNT(*) FROM restaurants) as total_restaurants,
//           (SELECT COUNT(*) FROM inspectors) as total_inspectors,
//           (SELECT COUNT(*) FROM inspection_reports) as total_reports,
//           (SELECT AVG(hygiene_score) FROM inspection_reports WHERE status='approved') as avg_score
//       `);

//       if (stats.length > 0) {
//         dataFound = true;
//         const s = stats[0];
//         context += "\n\n=== PLATFORM STATISTICS ===\n";
//         context += `Total Restaurants: ${s.total_restaurants}\n`;
//         context += `Total Inspectors: ${s.total_inspectors}\n`;
//         context += `Total Reports: ${s.total_reports}\n`;
//         context += `Average Approved Hygiene Score: ${s.avg_score ? Number(s.avg_score).toFixed(1) : "N/A"} / 5.0\n`;
//       }
//     }

//     // ✅ 5) Complaints
//     if (!dataFound && queryLower.includes("complaint")) {
//       const [complaints] = await pool.query(`
//         SELECT c.subject, c.message, c.status, c.created_at, r.name as restaurant_name
//         FROM complaints c
//         JOIN restaurants r ON c.restaurant_id = r.id
//         ORDER BY c.created_at DESC
//         LIMIT 5
//       `);

//       if (complaints.length > 0) {
//         dataFound = true;
//         context += "\n\n=== RECENT COMPLAINTS ===\n";
//         complaints.forEach((c, idx) => {
//           context += `${idx + 1}. ${c.restaurant_name}\n`;
//           context += `Subject: ${c.subject}\n`;
//           context += `Status: ${c.status} | Date: ${new Date(c.created_at).toLocaleDateString()}\n`;
//           context += `Message: ${c.message.substring(0, 120)}...\n\n`;
//         });
//       }
//     }

//     // ✅ If no data
//     if (!dataFound) {
//       context =
//         "\n\nNo specific data found. Try searching by restaurant name OR zone OR region OR address.\nExample: 'Spice Hub', 'Kengeri', 'Bangalore South'.";
//     }
//   } catch (error) {
//     console.error("❌ Database retrieval error:", error);
//     context = "\n\n[Database Error] " + error.message;
//   }

//   console.log("📦 Context length:", context.length);
//   return context;
// }

// // ✅ Main chatbot endpoint
// router.post("/food-chatbot", async (req, res) => {
//   const { prompt } = req.body;

//   if (!prompt) return res.status(400).json({ response: "No prompt provided." });

//   try {
//     const relevantData = await retrieveRelevantData(prompt);

//     const augmentedPrompt = `${SYSTEM_PROMPT}

// DATABASE CONTEXT:
// ${relevantData}

// USER QUESTION: ${prompt}

// Answer using DATABASE CONTEXT.
// If the user asks checklist-related question, summarize report_json using checklistSchema.`;

//     const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: augmentedPrompt }] }],
//       }),
//     });

//     const data = await response.json();
//     console.log("🔴 Gemini Raw Response:", JSON.stringify(data, null, 2));
//     console.log("🔴 GEMINI HTTP STATUS:", response.status);

// // ✅ If error exists print only error
// if (data?.error) {
//   console.log("❌ GEMINI ERROR CODE:", data.error.code);
//   console.log("❌ GEMINI ERROR STATUS:", data.error.status);
//   console.log("❌ GEMINI ERROR MESSAGE:", data.error.message);
// }
//     const botReply =
//       data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//       "Sorry, I could not generate a response.";

//     return res.json({ response: botReply });
//   } catch (err) {
//     console.error("❌ Chatbot error:", err);
//     return res.status(500).json({
//       response: "Error while processing chatbot request.",
//     });
//   }
// });

// // ✅ Test endpoint
// router.get("/food-chatbot/test", async (req, res) => {
//   try {
//     const [restaurants] = await pool.query("SELECT COUNT(*) as count FROM restaurants");
//     const [reports] = await pool.query("SELECT COUNT(*) as count FROM inspection_reports");
//     const [inspectors] = await pool.query("SELECT COUNT(*) as count FROM inspectors");
//     const [complaints] = await pool.query("SELECT COUNT(*) as count FROM complaints");

//     res.json({
//       status: "✅ Connected",
//       data: {
//         restaurants: restaurants[0].count,
//         inspection_reports: reports[0].count,
//         inspectors: inspectors[0].count,
//         complaints: complaints[0].count,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ status: "❌ Failed", error: err.message });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");
require("dotenv").config();
const fetch = require("node-fetch");

// ✅ Gemini API Configuration
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
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

// Debug log (no password)
console.log("📊 Database Config:", {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  database: process.env.DB_NAME || "fssai",
  passwordProvided: !!(process.env.DB_PASSWORD || process.env.DB_PASS),
});

// ✅ Checklist Schema
const checklistSchema = {
  personalHygiene: {
    handsClean: "Staff hands are clean and washed regularly",
    uniformClean: "Staff uniforms are clean and appropriate",
    hairCovered: "Hair is properly covered during food handling",
    noJewelry: "No jewelry worn during food preparation",
  },
  premisesCleanliness: {
    floorsClean: "Floors are clean and well-maintained",
    wallsClean: "Walls are clean and free from stains",
    ceilingsClean: "Ceilings are clean and well-maintained",
    tablesClean: "Tables and surfaces are properly sanitized",
  },
  foodStorage: {
    temperatureControlled: "Food stored at appropriate temperatures",
    separateRawCooked: "Raw and cooked foods stored separately",
    properLabeling: "Food items are properly labeled with dates",
    noExpiredItems: "No expired food items found",
  },
  equipment: {
    cleanUtensils: "Utensils are clean and properly stored",
    workingRefrigeration: "Refrigeration equipment working properly",
    properSanitization: "Equipment is properly sanitized",
    maintenanceUpToDate: "Equipment maintenance is up to date",
  },
  wasteManagement: {
    properDisposal: "Waste is disposed of properly",
    coveredBins: "Waste bins are covered and clean",
    regularCollection: "Regular waste collection schedule followed",
    pestControl: "Effective pest control measures in place",
  },
};

// ✅ System prompt
const SYSTEM_PROMPT = `You are a Food Hygiene Inspection Assistant.

You answer ONLY questions related to:
- food hygiene inspections
- restaurants
- hygiene ratings
- inspection reports and checklist
- inspectors
- complaints and favorites

RULES:
1) Use the DATABASE CONTEXT provided.
2) If the user asks "where is it located", answer using address/zone/region.
3) If restaurant not found, suggest searching using name OR zone OR region OR address keywords.
4) Be short, user-friendly, and factual.
5) If asked unrelated questions, politely refuse.`;

/**
 * ✅ Extract restaurant search term (SUPER IMPORTANT FIX)
 * Removes: gmail/email/id/phone/contact/number etc.
 */
// function extractSearchTerm(query) {
//   return query
//     .toLowerCase()
//     // remove question words
//     .replace(/\b(what|where|can|tell|show|find|about|is|the|me|you|give|get|provide|located|location)\b/gi, "")
//     // remove food hygiene words
//     .replace(/\b(inspection|inspections|report|reports|rating|score|hygiene|restaurant|hotel|cafe|eatery|place|hub|near)\b/gi, "")
//     // ✅ remove contact words
//     .replace(/\b(email|mail|gmail|id|phone|contact|number|mobile)\b/gi, "")
//     // extra cleanup
//     .replace(/\s+/g, " ")
//     .trim();
// }

function extractSearchTerm(query) {
  let q = query.toLowerCase();

  // ✅ remove all common filler words
  q = q.replace(
    /\b(what|where|who|when|why|how|can|could|tell|show|find|about|is|are|was|were|the|a|an|me|you|give|get|provide|please|of|this|that|these|those)\b/gi,
    ""
  );

  // ✅ remove inspection/hygiene words
  q = q.replace(
    /\b(inspection|inspections|report|reports|rating|score|hygiene|details|detail|review|reviews)\b/gi,
    ""
  );

  // ✅ remove restaurant/location words
  q = q.replace(
    /\b(restaurant|hotel|cafe|eatery|place|hub|near|located|location|address)\b/gi,
    ""
  );

  // ✅ remove email/contact words
  q = q.replace(/\b(gmail|mail|email|id|contact|phone|number)\b/gi, "");

  // ✅ clean extra spaces
  q = q.replace(/\s+/g, " ").trim();

  return q;
}


/**
 * ✅ Convert report_json false values to readable issues list
 */
function summarizeChecklistIssues(reportJson) {
  if (!reportJson) return "No checklist data available.";

  let issues = [];
  for (const section in reportJson) {
    if (!reportJson[section]) continue;

    for (const key in reportJson[section]) {
      const value = reportJson[section][key];
      if (value === false) {
        const label = checklistSchema?.[section]?.[key] || `${section}.${key}`;
        issues.push(label);
      }
    }
  }

  return issues.length > 0
    ? `Issues found:\n- ${issues.join("\n- ")}`
    : "✅ No checklist violations found (all items passed).";
}

/**
 * ✅ Main Retrieval Logic
 */
async function retrieveRelevantData(userQuery) {
  const queryLower = userQuery.toLowerCase();
  const term = extractSearchTerm(userQuery);

  let context = "";
  let dataFound = false;

  try {
    console.log("🔍 Processing query:", userQuery);
    console.log("📝 Extracted term:", term);

    // ✅ 0) If user asks EMAIL / PHONE / CONTACT → directly fetch from restaurants table
    if (
      queryLower.includes("email") ||
      queryLower.includes("gmail") ||
      queryLower.includes("mail") ||
      queryLower.includes("phone") ||
      queryLower.includes("contact") ||
      queryLower.includes("number")
    ) {
      const [contactRows] = await pool.query(
        `
        SELECT name, email, phone, address, zone, region
        FROM restaurants
        WHERE LOWER(name) LIKE ? OR LOWER(address) LIKE ?
        LIMIT 1
        `,
        [`%${term}%`, `%${term}%`]
      );

      if (contactRows.length > 0) {
        dataFound = true;
        const r = contactRows[0];
        context += "\n\n=== CONTACT DETAILS ===\n";
        context += `Restaurant: ${r.name}\n`;
        context += `Email: ${r.email || "Not available"}\n`;
        context += `Phone: ${r.phone || "Not available"}\n`;
        context += `Address: ${r.address || "N/A"}\n`;
        context += `Zone: ${r.zone || "N/A"} | Region: ${r.region || "N/A"}\n`;
        return context;
      }
    }

    // ✅ 1) If user asks location "where is it located"
    if (
      queryLower.includes("where") ||
      queryLower.includes("located") ||
      queryLower.includes("location") ||
      queryLower.includes("address")
    ) {
      const [locRows] = await pool.query(
        `
        SELECT name, address, zone, region
        FROM restaurants
        WHERE LOWER(name) LIKE ? OR LOWER(address) LIKE ?
        LIMIT 1
        `,
        [`%${term}%`, `%${term}%`]
      );

      if (locRows.length > 0) {
        dataFound = true;
        const r = locRows[0];
        context += "\n\n=== LOCATION DETAILS ===\n";
        context += `Restaurant: ${r.name}\n`;
        context += `Address: ${r.address || "N/A"}\n`;
        context += `Zone: ${r.zone || "N/A"} | Region: ${r.region || "N/A"}\n`;
        return context;
      }
    }

    // ✅ 2) Normal Restaurant search
    if (term.length > 2) {
      const [restaurants] = await pool.query(
        `
        SELECT 
          r.id, r.name, r.address, r.zone, r.region, r.phone, r.email,
          r.license_number, r.contact_person,
          AVG(ir.hygiene_score) as avg_rating,
          COUNT(ir.id) as report_count,
          MAX(ir.submitted_at) as last_report_date
        FROM restaurants r
        LEFT JOIN inspection_reports ir 
          ON r.id = ir.restaurant_id AND ir.status='approved'
        WHERE LOWER(r.name) LIKE ?
           OR LOWER(r.address) LIKE ?
           OR LOWER(r.zone) LIKE ?
           OR LOWER(r.region) LIKE ?
        GROUP BY r.id
        LIMIT 5
        `,
        [`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`]
      );

      if (restaurants.length > 0) {
        dataFound = true;

        context += "\n\n=== RESTAURANTS FOUND ===\n";
        restaurants.forEach((r) => {
          context += `\nRestaurant: ${r.name}\n`;
          context += `Address: ${r.address}\n`;
          context += `Zone: ${r.zone || "N/A"} | Region: ${r.region || "N/A"}\n`;
          context += `Email: ${r.email || "N/A"} | Phone: ${r.phone || "N/A"}\n`;
          context += `Avg Hygiene Score: ${
            r.avg_rating ? Number(r.avg_rating).toFixed(1) : "Not rated"
          } / 5.0\n`;
          context += `Inspection Reports: ${r.report_count}\n`;
          context += `Last Report Date: ${
            r.last_report_date
              ? new Date(r.last_report_date).toLocaleDateString()
              : "N/A"
          }\n`;
        });

        const rid = restaurants[0].id;

        // ✅ Inspection report details
        const [reports] = await pool.query(
          `
          SELECT 
            ir.id, ir.submitted_at, ir.hygiene_score, ir.status, ir.notes, ir.report_json,
            i.name AS inspector_name
          FROM inspection_reports ir
          JOIN inspectors i ON ir.inspector_id = i.id
          WHERE ir.restaurant_id = ?
          ORDER BY ir.submitted_at DESC
          LIMIT 3
          `,
          [rid]
        );

        if (reports.length > 0) {
          context += "\n\n=== RECENT INSPECTION REPORTS (Top 3) ===\n";
          reports.forEach((rep, idx) => {
            context += `\n${idx + 1}) Date: ${new Date(rep.submitted_at).toLocaleDateString()}\n`;
            context += `Score: ${rep.hygiene_score}/5.0 | Status: ${rep.status}\n`;
            context += `Inspector: ${rep.inspector_name}\n`;
            if (rep.notes) context += `Notes: ${rep.notes}\n`;

            // ✅ Checklist summary
            if (rep.report_json) {
              let parsed;
              try {
                parsed =
                  typeof rep.report_json === "string"
                    ? JSON.parse(rep.report_json)
                    : rep.report_json;
              } catch {
                parsed = null;
              }
              context += summarizeChecklistIssues(parsed) + "\n";
            }
          });
        }
      }
    }

    // ✅ 3) Recent reports
    if (!dataFound && (queryLower.includes("recent") || queryLower.includes("latest"))) {
      const [recent] = await pool.query(`
        SELECT 
          ir.submitted_at, ir.hygiene_score,
          r.name as restaurant_name, r.zone, r.region, r.address,
          i.name as inspector_name
        FROM inspection_reports ir
        JOIN restaurants r ON ir.restaurant_id = r.id
        JOIN inspectors i ON ir.inspector_id = i.id
        ORDER BY ir.submitted_at DESC
        LIMIT 5
      `);

      if (recent.length > 0) {
        dataFound = true;
        context += "\n\n=== LATEST INSPECTION REPORTS ===\n";
        recent.forEach((r, idx) => {
          context += `\n${idx + 1}) ${r.restaurant_name}\n`;
          context += `Address: ${r.address}\n`;
          context += `Zone: ${r.zone} | Region: ${r.region}\n`;
          context += `Score: ${r.hygiene_score}/5.0 | Date: ${new Date(
            r.submitted_at
          ).toLocaleDateString()}\n`;
          context += `Inspector: ${r.inspector_name}\n`;
        });
      }
    }

    // ✅ 4) Stats
    if (!dataFound && (queryLower.includes("stats") || queryLower.includes("total") || queryLower.includes("how many"))) {
      const [stats] = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM restaurants) as total_restaurants,
          (SELECT COUNT(*) FROM inspectors) as total_inspectors,
          (SELECT COUNT(*) FROM inspection_reports) as total_reports,
          (SELECT AVG(hygiene_score) FROM inspection_reports WHERE status='approved') as avg_score
      `);

      if (stats.length > 0) {
        dataFound = true;
        const s = stats[0];
        context += "\n\n=== PLATFORM STATISTICS ===\n";
        context += `Total Restaurants: ${s.total_restaurants}\n`;
        context += `Total Inspectors: ${s.total_inspectors}\n`;
        context += `Total Reports: ${s.total_reports}\n`;
        context += `Average Approved Hygiene Score: ${
          s.avg_score ? Number(s.avg_score).toFixed(1) : "N/A"
        } / 5.0\n`;
      }
    }

    // ✅ 5) Complaints
    if (!dataFound && queryLower.includes("complaint")) {
      const [complaints] = await pool.query(`
        SELECT c.subject, c.message, c.status, c.created_at, r.name as restaurant_name
        FROM complaints c
        JOIN restaurants r ON c.restaurant_id = r.id
        ORDER BY c.created_at DESC
        LIMIT 5
      `);

      if (complaints.length > 0) {
        dataFound = true;
        context += "\n\n=== RECENT COMPLAINTS ===\n";
        complaints.forEach((c, idx) => {
          context += `${idx + 1}. ${c.restaurant_name}\n`;
          context += `Subject: ${c.subject}\n`;
          context += `Status: ${c.status} | Date: ${new Date(
            c.created_at
          ).toLocaleDateString()}\n`;
          context += `Message: ${c.message.substring(0, 120)}...\n\n`;
        });
      }
    }

    // ✅ No data
    if (!dataFound) {
      context =
        "\n\nNo specific data found. Try searching by restaurant name OR zone OR region OR address.\nExample: 'Spice Hub', 'Kengeri', 'Bangalore South'.";
    }
  } catch (error) {
    console.error("❌ Database retrieval error:", error);
    context = "\n\n[Database Error] " + error.message;
  }

  console.log("📦 Context length:", context.length);
  return context;
}

// ✅ Main chatbot endpoint
router.post("/food-chatbot", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ response: "No prompt provided." });

  try {
    const relevantData = await retrieveRelevantData(prompt);

    const augmentedPrompt = `${SYSTEM_PROMPT}

DATABASE CONTEXT:
${relevantData}

USER QUESTION: ${prompt}

Answer ONLY using DATABASE CONTEXT.
If the user asks checklist-related question, summarize report_json using checklistSchema.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: augmentedPrompt }] }],
      }),
    });

    const data = await response.json();

    console.log("🔴 GEMINI HTTP STATUS:", response.status);
    if (data?.error) {
      console.log("❌ GEMINI ERROR CODE:", data.error.code);
      console.log("❌ GEMINI ERROR STATUS:", data.error.status);
      console.log("❌ GEMINI ERROR MESSAGE:", data.error.message);
    }

    const botReply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response.";

    return res.json({ response: botReply });
  } catch (err) {
    console.error("❌ Chatbot error:", err);
    return res.status(500).json({
      response: "Error while processing chatbot request.",
    });
  }
});

// ✅ Test endpoint
router.get("/food-chatbot/test", async (req, res) => {
  try {
    const [restaurants] = await pool.query("SELECT COUNT(*) as count FROM restaurants");
    const [reports] = await pool.query("SELECT COUNT(*) as count FROM inspection_reports");
    const [inspectors] = await pool.query("SELECT COUNT(*) as count FROM inspectors");
    const [complaints] = await pool.query("SELECT COUNT(*) as count FROM complaints");

    res.json({
      status: "✅ Connected",
      data: {
        restaurants: restaurants[0].count,
        inspection_reports: reports[0].count,
        inspectors: inspectors[0].count,
        complaints: complaints[0].count,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "❌ Failed", error: err.message });
  }
});

module.exports = router;
