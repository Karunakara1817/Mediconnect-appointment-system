require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { dispatchEmail } = require("./mailer");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        service: "mediconnect-notification-service",
        emailMode: (process.env.EMAIL_MODE || "console").toLowerCase(),
        timestamp: new Date().toISOString()
    });
});

app.post("/api/notifications/send", async (req, res) => {
    const { recipientEmail, recipientName, type, subject, message, metadata } = req.body || {};

    if (!recipientEmail || !subject || !message) {
        return res.status(400).json({
            error: "Bad Request",
            message: "recipientEmail, subject, and message are required"
        });
    }

    try {
        const result = await dispatchEmail({
            recipientEmail,
            recipientName,
            type,
            subject,
            message,
            metadata
        });

        return res.status(200).json({
            status: "SENT",
            recipientEmail,
            type: type || "GENERAL",
            deliveryMode: result.deliveryMode,
            messageId: result.messageId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Failed to dispatch notification:", error.message);
        return res.status(500).json({
            error: "Notification Dispatch Failed",
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`MediConnect Notification Service running on http://localhost:${PORT}`);
});