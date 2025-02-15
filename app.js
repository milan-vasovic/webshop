import dotenv from "dotenv";
dotenv.config();
import path, { join } from "path";
import { fileURLToPath } from "url";
import express from "express";
import bodyParser from "body-parser";
const { json, urlencoded } = bodyParser;
import session from "express-session";
import connectMongoDbSession from "connect-mongodb-session";
const MongoDbStore = connectMongoDbSession(session);
import { csrfSync } from "csrf-sync";
import { connect } from "mongoose";
import ErrorMiddleware from './middleware/error.js';
import multerConfig from "./middleware/multerConfig.js";
import helmet from 'helmet';
import crypto from "crypto";
import mongoSanitize from 'express-mongo-sanitize';
import methodOverride from 'method-override';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@odeca.coqqp.mongodb.net/${process.env.MONGO_DEFAULT_DB}`;

const app = express();
const store = new MongoDbStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req) => req.body["CSRFToken"],
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));

app.use(mongoSanitize());
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64"); // Generiše nonce
  next();
});

app.use(
  helmet({
      contentSecurityPolicy: {
          directives: {
              "default-src": ["'self'"],
              "script-src": ["'self'"], 
              "style-src": ["'self'", "'unsafe-inline'"],
              frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"],
          },
      },
  })
);
app.use(methodOverride('_method'));

import authRoutes from "./routes/auth.js";
import defaultRoutes from "./routes/default.js";
import shopRoutes from "./routes/shop.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from './routes/user.js';

import UserService from "./service/userService.js";

app.use(json({limit:'1gb'}));
app.use(urlencoded({ limit:'1gb', extended: true }));

app.use(multerConfig.fields([
  { name: "featureImage", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "variationImages", maxCount: 100 },
]));

app.use(express.static(join(__dirname, "public")));
app.use('/images', express.static(join(__dirname, 'data', 'images')));
app.use('/videos', express.static(join(__dirname, 'data', 'videos')));

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: store,
    })
);
  
app.use(csrfSynchronisedProtection);

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.role = req.session?.user?.role || "guest";
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(async (req, res, next) => {
  if (!req.session.user) {
    req.session.guest = true;
    if (!req.session.cart) {
      req.session.cart = [];
    }
    req.session.cart = req.session.cart;
    req.session.user = null;
    return next();
  }

  try {
    const user = await UserService.findUserForSession(req.session.user._id);

    if (!user) {
      req.session.guest = true;
      req.session.user = null;
    } else {
      req.session.guest = false;
      req.session.user = user;
    }
  } catch (error) {
    console.error("Greška pri dobavljanju korisnika:", error);
    req.session.guest = true;
    req.session.user = null;
  }

  next();
});

app.use(authRoutes);
app.use(defaultRoutes);
app.use("/prodavnica", shopRoutes);
app.use(userRoutes);
app.use("/admin", adminRoutes);

app.use(ErrorMiddleware);

connect(MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log("Server is running...");
    });
  })
  .catch((err) => {
    console.log(err);
});