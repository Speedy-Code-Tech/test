import express from "express";
import pool from "../components/database-connection.js";
import bcypt from "bcrypt";
import checkAuth from "../middleware/authCheck.js";
const app = express.Router();

const QUESTION = [
  "Send me Anonymous Message!",
  "Ask me anything!",
  "What's on your mind?",
  "Hit me with Questions! ^_^",
  "Your Question my answer!",
];

app.get("/send", checkAuth, async (req, res) => {
  const { user } = req.query;
  const result = await pool.query("SELECT * FROM users");
  console.log("Sending", req.user);
  let receiver_id = 0;
  let sender_id = 0;
  for (const item of result.rows) {
    const hashedUser = await bcypt.compare(item.displayName, user);
    if (hashedUser) receiver_id = item.id;

    if (item.displayName === req.user.displayName) sender_id = item.id;

    if (receiver_id !== 0 && sender_id !== 0)
      console.log(receiver_id, sender_id);
  }
  const hashedUser = await bcypt.hash(req.user.displayName, 10);
  if (receiver_id !== 0 && sender_id !== 0) {
    return res.render("anonymous.ejs", {
      user: req.user.displayName,
      url: `http://localhost:3000/send?user=${hashedUser}`,
      sender: sender_id,
      receiver: receiver_id,
    });
  }
});

app.get("/dashboard/message", checkAuth, async (req, res) => {
  const hashedUser = await bcypt.hash(req.user.displayName, 10);
  const result = await pool.query("SELECT * FROM users");

  let receiver_id = 0;

  for (const item of result.rows) {
    const hashedUser = req.user.displayName === item.displayName;

    if (hashedUser) {
      receiver_id = item.id;
      break;
    }
  }
  const inboxMessages = await pool.query(
    `
     SELECT DISTINCT ON (sender_id) sender_id, message, status, time 
      FROM message 
      WHERE receiver_id = $1 OR sender_id = $1
      ORDER BY sender_id, id DESC
    `,
    [receiver_id   ]
  );
  const conversation = await pool.query(
    `
    SELECT * 
    FROM message 
    WHERE receiver_id = $1 OR sender_id = $1 
    ORDER BY time ASC
    `,
    [receiver_id]
  );
  return res.render("dashboardMessage.ejs", {
    user: req.user.displayName,
    url: `http://localhost:3000/send?user=${hashedUser}`,
    messages: inboxMessages.rows,
    conversation: conversation.rows,
    
  });
});

app.post("/reply", checkAuth, async (req, res) => {
  const { message, sender, receiver } = req.body;
  const values = [sender, receiver, message, "sent", new Date()];

  const response = await pool.query(
    "INSERT INTO message (sender_id, receiver_id, message,status,time) VALUES($1, $2, $3,$4,$5) RETURNING *",
    values
  );
  return res.redirect('/dashboard?status=send')
});

app.get("/message", checkAuth, async (req, res) => {
  try {
    const { view: sender_id } = req.query; // Correctly extract 'view' from the query string
    if (!sender_id) {
      return res.status(400).json({ error: "Sender ID is required" });
    }
    const result = await pool.query("SELECT * FROM users");

    let receiver_id = 0;

    for (const item of result.rows) {
      const hashedUser = req.user.displayName === item.displayName;
      if (hashedUser) {
        receiver_id = item.id;
        break;
      }
    }

    const messages = await pool.query(
      `
      SELECT * 
      FROM message 
      WHERE receiver_id = $1 OR sender_id = $1
      ORDER BY time ASC
      `,
      [receiver_id]
    );
    console.log(sender_id, receiver_id)

    return res.json(messages.rows); // Return the messages as JSON
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/sendMSG", checkAuth, async (req, res) => {
  try {
    const { receiver, message } = req.body;
    const sender = req.user.id;
    for (const item of result.rows) {
      const hashedUser = req.user.displayName === item.displayName;
      if (hashedUser) {
        sender = item.id;
        break;
      }
    }
    const result = await pool.query(
      `
      INSERT INTO message (sender_id, receiver_id, message, status, time) 
      VALUES ($1, $2, $3, 'sent', NOW()) RETURNING *
      `,
      [sender, receiver, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error sending message:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

export default app;
