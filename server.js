const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("VOXDIGITS RENDER BACKEND OK");
});

// ===== HEALTH =====
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ===== TOKEN (VOICE) =====
app.get("/generateToken", (req, res) => {
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity: process.env.TWILIO_CLIENT_IDENTITY || "voxdigits_user" }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWIML_APP_SID,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);

  res.json({ token: token.toJwt() });
});

// ===== VOICE ROUTE =====
app.post("/voice", (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const to = req.body.To;

  const dial = twiml.dial({
    callerId: process.env.TWILIO_CALLER_ID
  });

  if (to) {
    dial.number(to);
  } else {
    twiml.say("No destination number provided");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// ==========================
// ✅ SMS SEND (OUTBOUND)
// ==========================
app.post("/send-sms", async (req, res) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const { to, body } = req.body;

    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_CALLER_ID,
      to: to,
    });

    res.json({ success: true, sid: message.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// ✅ SMS RECEIVE (INBOUND)
// ==========================
app.post("/sms", (req, res) => {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  const incomingMsg = req.body.Body;

  console.log("Incoming SMS:", incomingMsg);

  twiml.message("Message received on VoxDigits ✅");

  res.type("text/xml");
  res.send(twiml.toString());
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
})
