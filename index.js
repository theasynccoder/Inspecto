// const path = require('path');
// const express = require('express');
// const app = express();
// const db = require('./src/config/dbConnect');
// const session = require('express-session');
    
// app.use(session({
//   secret: 'kldsfjbvkaelugivdbsbvhi',
//   resave: false,
//   saveUninitialized: true
// }));

// const cors = require('cors');
// require('dotenv').config();
// app.use(cors())


// // Middleware
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'src', 'view'));
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// app.use('/chatbot', express.static(path.join(__dirname, 'public/chatbot')));


// const blogsRoute = require('./chatbotRoute');
// app.use('/api', blogsRoute);

// app.get('/show-chatbot', (req, res) => {
//   res.render('chatbot'); // This refers to src/view/chatbot.ejs
// });



// const adminRoutes = require("./src/routes/adminRoutes");
// app.use(adminRoutes);

// const inspectorRoutes = require("./src/routes/inspectorRoutes");
// app.use(inspectorRoutes);


// const userRoutes = require("./src/routes/userRoutes");
// app.use(userRoutes);

// const superAdminRoutes = require("./src/routes/superAdminRoutes");
// app.use( superAdminRoutes);

// // Routes
// app.get('/', (req, res) => res.render('home1'));



// app.get('/logout', (req, res) => {
//   req.session.destroy(err => {
//     if (err) console.error(err);
//     res.redirect('/');
//   });
// });

// app.get('/getGeoLocation', (req, res) => res.render('geoLocation'));
// app.locals.formatLabel = function(key) {
//   return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
// };
// // app.use('/uploads', express.static('D:/images'));



// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).render('error', { message: 'Something broke!' });
// });

// // Start server
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });


// const path = require("path");
// const express = require("express");
// const app = express();
// const db = require("./src/config/dbConnect");
// const session = require("express-session");
// const cors = require("cors");
// require("dotenv").config();

// // ✅ Middlewares
// app.use(cors());

// app.use(
//   session({
//     secret: "kldsfjbvkaelugivdbsbvhi",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // ✅ EJS setup
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "src", "view"));

// // ✅ Static files
// app.use(express.static(path.join(__dirname, "public")));
// app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// // ✅ Chatbot static files (image/css/js)
// app.use("/chatbot", express.static(path.join(__dirname, "public/chatbot")));

// // ✅ Utility for label formatting
// app.locals.formatLabel = function (key) {
//   return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
// };

// // =====================================================
// // ✅ CHATBOT ROUTE (IMPORTANT FIX)
// // =====================================================
// const chatbotRoute = require("./chatbotRoute");

// // ✅ Make chatbot endpoint direct (NO /api confusion)
// // Now endpoint is: POST http://localhost:5000/food-chatbot
// app.use("/", chatbotRoute);

// // ✅ Optional test page for chatbot if you need
// app.get("/show-chatbot", (req, res) => {
//   res.render("chatbot"); // src/view/chatbot.ejs
// });

// // =====================================================
// // ✅ MAIN ROUTES
// // =====================================================
// const adminRoutes = require("./src/routes/adminRoutes");
// app.use(adminRoutes);

// const inspectorRoutes = require("./src/routes/inspectorRoutes");
// app.use(inspectorRoutes);

// const userRoutes = require("./src/routes/userRoutes");
// app.use(userRoutes);

// const superAdminRoutes = require("./src/routes/superAdminRoutes");
// app.use(superAdminRoutes);

// // ✅ Home
// app.get("/", (req, res) => res.render("home1"));

// // ✅ Logout
// app.get("/logout", (req, res) => {
//   req.session.destroy((err) => {
//     if (err) console.error(err);
//     res.redirect("/");
//   });
// });

// // ✅ Geolocation page
// app.get("/getGeoLocation", (req, res) => res.render("geoLocation"));

// // =====================================================
// // ✅ ERROR HANDLING FIX
// // =====================================================

// // ✅ 404 handler
// app.use((req, res) => {
//   res.status(404).send("404 Not Found");
// });

// // ✅ Error middleware (no error.ejs required)
// app.use((err, req, res, next) => {
//   console.error("❌ SERVER ERROR:", err.stack);
//   res.status(500).json({
//     error: true,
//     message: "Something broke on server!",
//     details: err.message,
//   });
// });

// // =====================================================
// // ✅ SERVER START
// // =====================================================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

const path = require("path");
const express = require("express");
const app = express();
const db = require("./src/config/dbConnect");

const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

// ✅ CORS (allow cookies/session)
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);

// ✅ Session setup
app.use(
  session({
    secret: "kldsfjbvkaelugivdbsbvhi",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // keep false for localhost
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  })
);

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "view"));

// ✅ Static folders
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/chatbot", express.static(path.join(__dirname, "public/chatbot")));

// =====================================================
// ✅ IMPORTANT: CHATBOT ROUTE MUST COME FIRST (PUBLIC)
// =====================================================
const chatbotRoute = require("./chatbotRoute");

// ✅ chatbotRoute contains: router.post("/food-chatbot", ...)
// so we mount it at "/"
app.use("/", chatbotRoute);

// Optional test render
app.get("/show-chatbot", (req, res) => {
  res.render("chatbot"); // src/view/chatbot.ejs
});

// =====================================================
// ✅ PROTECTED ROUTES BELOW
// =====================================================
const adminRoutes = require("./src/routes/adminRoutes");
app.use(adminRoutes);

const inspectorRoutes = require("./src/routes/inspectorRoutes");
app.use(inspectorRoutes);

const userRoutes = require("./src/routes/userRoutes");
app.use(userRoutes);

const superAdminRoutes = require("./src/routes/superAdminRoutes");
app.use(superAdminRoutes);

// =====================================================
// ✅ HOME ROUTE
// =====================================================
app.get("/", (req, res) => res.render("home1"));

// =====================================================
// ✅ LOGOUT
// =====================================================
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/");
  });
});

// =====================================================
// ✅ Geo route
// =====================================================
app.get("/getGeoLocation", (req, res) => res.render("geoLocation"));

// Helper function in EJS
app.locals.formatLabel = function (key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
};

// =====================================================
// ✅ ERROR HANDLING (NO CRASH even if error.ejs missing)
// =====================================================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.stack);

  // ✅ if error.ejs exists render, else send plain text
  try {
    res.status(500).render("error", { message: "Something broke!" });
  } catch (e) {
    res.status(500).send("Something broke!");
  }
});

// =====================================================
// ✅ Start server
// =====================================================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
