import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import axios from "axios";
import userRoute from "./router/user.route.js";
import brokerRouter from "./router/broker.route.js";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import "./auth/passport.js";
import nodemailer from 'nodemailer'
dotenv.config();

const app = express();
const port = 3000;
const URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({
  origin: process.env.VITE_FRONTEND_API, // Allow your frontend origin
  credentials: true, // Enable cookies to be sent cross-origin
}));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ dynamically secure only in prod
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/user", userRoute);
app.use("/broker", brokerRouter);

app.post('/contact', async(req, res)=>{
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or another service like 'Outlook', 'SendGrid', etc.
      auth: {
        user: process.env.EMAIL,         // replace with your email
        pass: process.env.EMAIL_PASSWORD // never expose real password in production
      }
    });

    const mailOptions = {
      from: email,
      to: process.env.EMAIL, // replace with the recipient email
      subject: `New Contact Form Message from ${name}`,
      text: message
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Message sent successfully." });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
});

// Google OAuth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback", passport.authenticate("google", {
  session: false,
  failureRedirect: "/login",
}), (req, res) => {
  const { username, email, token } = req.user;
  console.log("Redirecting with", {
  username: username,
  email: email,
  token: token,
  });
  const redirectUrl = `${process.env.VITE_FRONTEND_API}/auth/google/callback?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  res.redirect(redirectUrl);
});

// News route to fetch latest news
app.get("/news/Latestnews", async (req, res) => {
  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: "finance OR stock market OR business OR sports OR cricket",
        language: "en",
        sortBy: "publishedAt",
        pageSize: 20,
        page: 1,
        apiKey: process.env.NEWS_API,
      },
    });

    const articles = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name,
    }));

    res.status(200).json(articles);
  } catch (error) {
    console.error("News Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// Fetch Angel One Portfolio Endpoint
app.get("/broker/angelonefetchPortfolio", async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    console.log("username found !!")
    const db = mongoose.connection.db;
    const collection = db.collection("Holdings");
    console.log("Database collection found")
    // Find user holdings by username
    const userHoldings = await collection.find({ username }).toArray();

    if (!userHoldings || userHoldings.length === 0) {
      return res.status(404).json({ success: false, message: 'No holdings found for this user' });
    }
    console.log("angelone holdings found for user : ", username)
    // Fix the mapping to correctly access the 'holdings' field.
    const formatted = userHoldings.map(entry => {
      // Assuming 'entry.holdings' directly contains the array of holdings
      return {
        broker: entry.broker,
        holdings: entry.holdings || [], // Ensure 'holdings' is an array
      };
    });

    console.log("Holdings:", JSON.stringify(formatted, null, 2));
    console.log("angelone holdings fetched successfully, sending to frontend");

    return res.status(200).json({
      success: true,
      message: "Holdings fetched successfully",
      data: formatted,
    });
  } catch (err) {
    console.error("Error fetching portfolio:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the portfolio",
      error: err.message,
    });
  }
});
// Fetch Zerodha Holdings Endpoint
app.get("/broker/getZerodhaHoldings", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    console.log(`Fetching holdings for username: "${username}"`);

    const db = mongoose.connection.db;
    const collection = db.collection("holdings");

    // Find documents where username matches exactly
    const userHoldings = await collection.find({ username }).toArray();

    if (userHoldings.length === 0) {
      console.log(`No holdings found for username: "${username}"`);
      return res.status(404).json({ success: false, message: "No holdings found for this user" });
    }

    // Map and format holdings data
    const formatted = userHoldings.map((entry) => ({
      broker: entry.broker,
      holdings: Array.isArray(entry.holdings) ? entry.holdings : [],
    }));

    console.log(`Holdings found for username "${username}":`, formatted);

    return res.status(200).json({
      success: true,
      message: "Holdings fetched successfully",
      data: formatted,
    });
  } catch (err) {
    console.error("Error fetching Zerodha holdings:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the portfolio",
      error: err.message,
    });
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
