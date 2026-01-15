const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");
require("dotenv").config();
const fetch = require("node-fetch");

// ✅ Gemini Config
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ MySQL Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  database: process.env.DB_NAME || "fssai",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Checklist schema (your schema)
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

// ✅ System prompt for Gemini
const SYSTEM_PROMPT = `
You are a Food Hygiene Inspection Assistant.

You answer ONLY questions related to:
- restaurants
- restaurant location (address / zone / region)
- inspections and inspection reports
- hygiene scores
- checklist / report_json findings
- inspectors
- complaints & favorites

RULES:
1) Use the DATABASE CONTEXT provided.
2) If user asks "where located", ALWAYS provide restaurant address + zone + region.
3) If restaurant not found, suggest searching using name OR zone OR region OR address area.
4) Be short, friendly, factual.
5) If asked unrelated questions, politely refuse.
`;

// ✅ Extract clean search term
// function extractSearchTerm(query) {
//   return query
//     .toLowerCase()
//     .replace(/[^\w\s]/g, "") // remove symbols
//     .replace(
//       /\b(what|where|can|tell|show|find|about|is|the|me|you|give|get|provide|located|location|address|near|in|at|of)\b/gi,
//       ""
//     )
//     .replace(/\b(it|this|that|there|here)\b/gi, "")
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


// ✅ Convert report_json -> issues list
function summarizeChecklistIssues(reportJson) {
  if (!reportJson) return "No checklist data available.";

  let issues = [];

  for (const section in reportJson) {
    const sectionObj = reportJson[section];
    if (!sectionObj) continue;

    for (const key in sectionObj) {
      const val = sectionObj[key];
      if (val === false) {
        const readable =
          checklistSchema?.[section]?.[key] || `${section}.${key}`;
        issues.push(readable);
      }
    }
  }

  return issues.length > 0
    ? `Checklist Violations:\n- ${issues.join("\n- ")}`
    : "✅ No checklist violations found (all items passed).";
}

// ✅ Retrieve DB context based on query
async function retrieveRelevantData(userQuery) {
  const queryLower = userQuery.toLowerCase();
  const term = extractSearchTerm(userQuery);
  const termNoSpace = term.replace(/\s+/g, ""); // 🔥 important fix

  let context = "";
  let dataFound = false;

  try {
    console.log("🔍 Processing query:", userQuery);
    console.log("📝 Extracted term:", term);

    // ✅ 1) Restaurant Search (name/address/zone/region)
    if (term.length > 1) {
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
        WHERE 
          REPLACE(LOWER(r.name),' ','') LIKE ?
          OR REPLACE(LOWER(r.address),' ','') LIKE ?
          OR REPLACE(LOWER(r.zone),' ','') LIKE ?
          OR REPLACE(LOWER(r.region),' ','') LIKE ?
        GROUP BY r.id
        LIMIT 5
        `,
        [
          `%${termNoSpace}%`,
          `%${termNoSpace}%`,
          `%${termNoSpace}%`,
          `%${termNoSpace}%`,
        ]
      );

      if (restaurants.length > 0) {
        dataFound = true;

        context += "\n\n=== RESTAURANTS FOUND ===\n";
        restaurants.forEach((r) => {
          context += `\nRestaurant: ${r.name}\n`;
          context += `Address: ${r.address}\n`;
          context += `Zone: ${r.zone || "N/A"} | Region: ${r.region || "N/A"}\n`;
          context += `Phone: ${r.phone || "N/A"} | Email: ${r.email || "N/A"}\n`;
          context += `Avg Hygiene Score: ${
            r.avg_rating ? Number(r.avg_rating).toFixed(1) : "Not Rated"
          } / 5.0\n`;
          context += `Inspection Reports: ${r.report_count}\n`;
          context += `Last Report: ${
            r.last_report_date
              ? new Date(r.last_report_date).toLocaleDateString()
              : "N/A"
          }\n`;
        });

        // ✅ Reports for top restaurant
        const rid = restaurants[0].id;
        const [reports] = await pool.query(
          `
          SELECT 
            ir.submitted_at, ir.hygiene_score, ir.status, ir.notes, ir.report_json,
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
          context += "\n\n=== LAST 3 INSPECTION REPORTS ===\n";
          reports.forEach((rep, idx) => {
            context += `\n${idx + 1}) Date: ${new Date(
              rep.submitted_at
            ).toLocaleDateString()}\n`;
            context += `Score: ${rep.hygiene_score}/5.0 | Status: ${rep.status}\n`;
            context += `Inspector: ${rep.inspector_name}\n`;
            if (rep.notes) context += `Notes: ${rep.notes}\n`;

            if (rep.report_json) {
              let parsed = rep.report_json;
              if (typeof parsed === "string") {
                try {
                  parsed = JSON.parse(parsed);
                } catch {
                  parsed = null;
                }
              }
              context += summarizeChecklistIssues(parsed) + "\n";
            }
          });
        }
      }
    }

    // ✅ 2) Recent reports
    if (!dataFound && (queryLower.includes("recent") || queryLower.includes("latest"))) {
      const [recent] = await pool.query(`
        SELECT 
          ir.submitted_at, ir.hygiene_score,
          r.name as restaurant_name, r.zone, r.region, r.address,
          i.name as inspector_name
        FROM inspection_reports ir
        JOIN restaurants r ON ir.restaurant_id = r.id
        JOIN inspectors i ON ir.inspector_id = i.id
        WHERE ir.status='approved'
        ORDER BY ir.submitted_at DESC
        LIMIT 5
      `);

      if (recent.length > 0) {
        dataFound = true;
        context += "\n\n=== RECENT REPORTS ===\n";
        recent.forEach((r, idx) => {
          context += `\n${idx + 1}) ${r.restaurant_name}\n`;
          context += `Address: ${r.address}\n`;
          context += `Zone: ${r.zone} | Region: ${r.region}\n`;
          context += `Score: ${r.hygiene_score}/5.0\n`;
          context += `Inspector: ${r.inspector_name}\n`;
        });
      }
    }

    // ✅ 3) Stats
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
        context += "\n\n=== PLATFORM STATS ===\n";
        context += `Restaurants: ${s.total_restaurants}\n`;
        context += `Inspectors: ${s.total_inspectors}\n`;
        context += `Reports: ${s.total_reports}\n`;
        context += `Avg Hygiene Score: ${s.avg_score ? Number(s.avg_score).toFixed(1) : "N/A"} / 5.0\n`;
      }
    }

    // ✅ No data
    if (!dataFound) {
      context =
        "\n\nNo specific data found. Try searching by restaurant name OR zone OR region OR address.\nExample: 'Spice Hub', 'Kengeri', 'Bangalore South'.";
    }
  } catch (err) {
    console.log("❌ DB Error:", err.message);
    context = "\n\n[Database Error] " + err.message;
  }

  console.log("📦 Context length:", context.length);
  return context;
}

// ✅ Main endpoint
router.post("/food-chatbot", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ response: "No prompt provided." });

  try {
    const relevantData = await retrieveRelevantData(prompt);

    const augmentedPrompt = `${SYSTEM_PROMPT}

DATABASE CONTEXT:
${relevantData}

USER QUESTION: ${prompt}

Answer using DATABASE CONTEXT only.
`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: augmentedPrompt }] }],
      }),
    });

    const data = await response.json();
    console.log("🔴 GEMINI HTTP STATUS:", response.status);

    // ✅ Handle Gemini error
    if (data?.error) {
      console.log("❌ GEMINI ERROR:", data.error.message);
      return res.json({
        response: "Gemini is overloaded right now (503). Please try again in a minute.",
      });
    }

    // ✅ Clean bot reply text only (avoid huge signature)
    const botReply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response.";

    return res.json({ response: botReply });
  } catch (err) {
    console.error("❌ Chatbot error:", err.message);
    return res.status(500).json({ response: "Server error in chatbot." });
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
      data: {
        restaurants: restaurants[0].count,
        inspection_reports: reports[0].count,
        inspectors: inspectors[0].count,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "❌ Failed", error: err.message });
  }
});

module.exports = router;
