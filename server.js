const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// =============================
// ✅ ROOT TEST
// =============================
app.get("/", (req, res) => {
  res.send("VoxDigits Backend Running ✅");
});

// =============================
// ✅ SEND SMS (OUTBOUND)
// =============================
app.post("/send-sms", async (req, res) => {
  try {
    const { to, message } = req.body;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    res.json({ success: true, sid: response.sid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================
// ✅ RECEIVE SMS (INBOUND)
// =============================
app.post("/sms", (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();

  const incomingMsg = req.body.Body;
  const from = req.body.From;

  console.log(SMS from ${from}: ${incomingMsg});

  // Auto-reply (you can remove later)
  twiml.message("Message received on VoxDigits ✅");

  res.type("text/xml");
  res.send(twiml.toString());
});

// =============================
// ✅ STATUS WEBHOOK (IMPORTANT)
// =============================
app.post("/status", (req, res) => {
  console.log("Status:", req.body);
  res.sendStatus(200);
});

// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(Server running on port ${PORT});
});
