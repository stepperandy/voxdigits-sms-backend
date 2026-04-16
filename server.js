const express = require("express");
const twilio = require("twilio");

const app = express();

// Twilio sends webhook data as application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 10000;

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  BASE_URL
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error("Missing required environment variables.");
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("VoxDigits SMS backend is running ✅");
});

// Optional simple GET test
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "voxdigits-sms",
    baseUrl: BASE_URL || null
  });
});

// OUTBOUND SMS
app.post("/send-sms", async (req, res) => {
  try {
    const { to, body } = req.body;

    if (!to || !body) {
      return res.status(400).json({
        success: false,
        error: "Both 'to' and 'body' are required."
      });
    }

    const payload = {
      from: TWILIO_PHONE_NUMBER,
      to,
      body
    };

    // Add status callback only if BASE_URL is set
    if (BASE_URL) {
      payload.statusCallback = `${BASE_URL}/sms-status`;
    }

    const message = await client.messages.create(payload);

    return res.status(200).json({
      success: true,
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body
    });
  } catch (error) {
    console.error("SEND SMS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to send SMS"
    });
  }
});

// INBOUND SMS WEBHOOK
app.post("/sms", (req, res) => {
  try {
    const from = req.body.From;
    const to = req.body.To;
    const body = req.body.Body;
    const messageSid = req.body.MessageSid;

    console.log("INBOUND SMS RECEIVED:", {
      from,
      to,
      body,
      messageSid
    });

    // Reply with empty TwiML if you do not want an auto-response
    const twiml = new twilio.twiml.MessagingResponse();

    // Uncomment this if you want auto-reply:
    // twiml.message("Hello from VoxDigits. We received your message.");

    res.type("text/xml");
    return res.send(twiml.toString());
  } catch (error) {
    console.error("INBOUND SMS WEBHOOK ERROR:", error);
    return res.status(500).send("Webhook processing failed");
  }
});

// OUTBOUND STATUS CALLBACK
app.post("/sms-status", (req, res) => {
  try {
    const statusData = {
      MessageSid: req.body.MessageSid,
      MessageStatus: req.body.MessageStatus,
      To: req.body.To,
      From: req.body.From,
      ErrorCode: req.body.ErrorCode,
      ErrorMessage: req.body.ErrorMessage
    };

    console.log("SMS STATUS CALLBACK:", statusData);
    return res.sendStatus(200);
  } catch (error) {
    console.error("STATUS CALLBACK ERROR:", error);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
