// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Load API keys from .env
const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN;
const QUICKNODE_RPC = process.env.QUICKNODE_RPC;

// In-memory database (replace with real DB for production)
const balances = {};
const referralLogs = [];

// --- ROUTES ---

// Get balance
app.get("/balance", (req, res) => {
  const ref = req.query.ref;
  res.json({ balance: balances[ref] || 0 });
});

// Log referral
app.post("/log-referral", (req, res) => {
  const { ref, amount } = req.body;
  if (!ref || !amount) return res.json({ success: false, error: "Missing parameters" });

  balances[ref] = (balances[ref] || 0) + parseFloat(amount);
  referralLogs.push({ ref, amount, timestamp: Date.now() });
  res.json({ success: true });
});

// Log messages (for blogger/debugging)
app.post("/log", (req, res) => {
  const { entry } = req.body;
  console.log("LOG:", entry);
  res.json({ success: true });
});

// Withdraw Bitcoin (mainnet)
app.post("/withdraw", async (req, res) => {
  const { type, amount, address } = req.body;

  if (!type || !amount || !address) return res.json({ success: false, error: "Missing parameters" });

  try {
    if (type === "BTC") {
      // BlockCypher create transaction
      const url = `https://api.blockcypher.com/v1/btc/main/txs/new?token=${BLOCKCYPHER_TOKEN}`;
      // Build minimal unsigned TX (simplified)
      const txBody = {
        inputs: [{ addresses: [process.env.BTC_ADDRESS] }],
        outputs: [{ addresses: [address], value: Math.floor(parseFloat(amount) * 1e8) }]
      };
      const response = await fetch(url, { method: "POST", body: JSON.stringify(txBody), headers: { "Content-Type": "application/json" } });
      const data = await response.json();
      // Sign & send would require private key (omitted for security)
      res.json({ success: true, tx: data });
    } else if (type === "BEP20") {
      // Example BEP20 transfer using QuickNode
      res.json({ success: true, tx: "BEP20 transfer simulated (implement web3/ethers.js)" });
    } else {
      res.json({ success: false, error: "Unknown withdrawal type" });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
