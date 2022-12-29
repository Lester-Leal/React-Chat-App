const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");
const expressValidator = require("express-validator");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const logger = require("./utils/logger");
const socket = require("socket.io");
const app = express();

// Load environment variables
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Successfully connected to MongoDB");
  })
  .catch((err) => {
    logger.error(`Error connecting to MongoDB: ${err.message}`);
  });

// Enable CORS
app.use(cors());

// Parse request body as JSON
app.use(express.json());

// Set security-related HTTP headers
app.use(helmet());

// Enable rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Enable request logging
app.use(morgan("combined"));

// Enable compression
app.use(compression());

// Validate and sanitize user input
app.use(expressValidator());

// Set up routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Set up socket.io
const server = app.listen(process.env.PORT, () =>
  logger.info(`Server started on port ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
