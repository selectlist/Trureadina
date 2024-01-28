// Packages
import { Client } from "revolt.js";
import * as logger from "./logger.js";
import "dotenv/config";

// Create Revolt Client
const client: Client = new Client();

// Ready Event
client.on("ready", () => {
	logger.success("Revolt", "Logged in.");
});

// Error Event
client.on("error", (p) => {
	logger.error("Revolt", p.toString());
});

// Login to Revolt
client.loginBot(process.env.REVOLT_TOKEN);
