import express from "express";
import KcAdminClient from "@keycloak/keycloak-admin-client";

// Initialize Express
const app = express();
const port = 3000;

// Initialize Keycloak Admin Client
const kcAdminClient = new KcAdminClient({
	baseUrl: "http://127.0.0.1:8080", // Ensure this is your Keycloak server URL
	realmName: "master",
});

// Middleware to authenticate with Keycloak
const authenticate = async (req, res, next) => {
	try {
		await kcAdminClient.auth({
			username: "admin",
			password: "admin",
			grantType: "password",
			clientId: "admin-cli",
			// totp: '123456', // Uncomment if OTP is required
		});
		next();
	} catch (err) {
		console.error("Error authenticating with Keycloak:", err);
		res.status(500).json({ error: "Failed to authenticate with Keycloak" });
	}
};

// Endpoint to list users
app.get("/users", authenticate, async (req, res) => {
	try {
		const users = await kcAdminClient.users.find();
		res.json(users);
	} catch (err) {
		console.error("Error fetching users:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

app.get("/users_create", authenticate, async (req, res) => {
	try {
		const users = await kcAdminClient.users.create({
			realm: "NHAI",
			username: "username",
			email: "user@example.com",
		});
		res.json(users);
	} catch (err) {
		console.error("Error fetching users:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

app.get("/create_realm", authenticate, async (req, res) => {
	try {
		const users = await kcAdminClient.realms.create({
			id: "created_realm",
			realm: "realmName",
		});
		res.json(users);
	} catch (err) {
		console.error("Error fetching users:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

// Start the Express server
app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
