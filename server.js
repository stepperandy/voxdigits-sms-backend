const express = require("express");
const twilio = require("twilio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SMS_NUMBER = process.env.TWILIO_SMS_NUMBER;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

const smsClient = twilio(ACCOUNT_SID, AUTH_TOKEN);

app.use(cors({
  origin: FRONTEND_URL === "*" ? true : FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.status(200).json({
    ok: true,
    message: "VoxDigits SMS backend live"
  });
});

app.get("/health", function (req, res) {
  res.status(200).send("ok");
});

app.post("/sms/send", async function (req, res) {
  try {
    const to = req.body.to;
    const message = req.body.message;

    if (!to || !message) {
      return res.status(400).json({
        ok: false,
        error: "Missing to or message"
      });
    }

    if (!ACCOUNT_SID || !AUTH_TOKEN || !SMS_NUMBER) {
      return res.status(500).json({
        ok: false,
        error: "Missing SMS environment variables"
      });
    }

    const sms = await smsClient.messages.create({
      body: message,
      from: SMS_NUMBER,
      to: to
    });

    return res.status(200).json({
      ok: true,
      sid: sms.sid,
      status: sms.status
    });
  } catch (err) {
    console.error("SMS send error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to send SMS",
      details: err.message
    });
  }
});

app.post("/sms/incoming", function (req, res) {
  const from = req.body.From;
  const to = req.body.To;
  const body = req.body.Body;

  console.log("Incoming SMS:");
  console.log("From:", from);
  console.log("To:", to);
  console.log("Body:", body);

  return res.sendStatus(200);
});

app.post("/sms/status", function (req, res) {
  console.log("SMS status callback:", req.body);
  return res.sendStatus(200);
});

app.listen(PORT, "0.0.0.0", function () {
  console.log("VoxDigits SMS backend live on port " + PORT);
});
