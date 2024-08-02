import express from "express";
import { faker } from "@faker-js/faker";
import KcAdminClient from "@keycloak/keycloak-admin-client";
// import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import cors from "cors";

// dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 4000;

app.use(cors());

// Initialize Keycloak Admin Client
const kcAdminClient = new KcAdminClient({
	baseUrl: "http://127.0.0.1:8080",
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
		});
		next();
	} catch (err) {
		console.error("Error authenticating with Keycloak:", err);
		res.status(500).json({ error: "Failed to authenticate with Keycloak" });
	}
};

app.get("/users", authenticate, async (req, res) => {
	try {
		const users = await kcAdminClient.users.find();
		res.json(users);
	} catch (err) {
		console.error("Error fetching users:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

app.post("/users", authenticate, async (req, res) => {
	try {
		const user = await kcAdminClient.users.create({
			username: req.body.username || faker.internet.userName(),
			email: req.body.email || faker.internet.email(),
			emailVerified: true,
			enabled: true,
			attributes: {
				key: "value",
			},
		});
		res.json(user);
	} catch (err) {
		console.error("Error creating user:", err);
		res.status(500).json({ error: "Failed to create user" });
	}
});

app.get("/users/:id", authenticate, async (req, res) => {
	try {
		const user = await kcAdminClient.users.findOne({ id: req.params.id });
		res.json(user);
	} catch (err) {
		console.error("Error fetching user:", err);
		res.status(500).json({ error: "Failed to fetch user" });
	}
});

app.put("/users/:id", authenticate, async (req, res) => {
	try {
		await kcAdminClient.users.update(
			{ id: req.params.id },
			{
				firstName: req.body.firstName || "UpdatedFirstName",
				lastName: req.body.lastName || "UpdatedLastName",
				emailVerified:
					req.body.emailVerified !== undefined ? req.body.emailVerified : true,
			}
		);
		const updatedUser = await kcAdminClient.users.findOne({
			id: req.params.id,
		});
		res.json(updatedUser);
	} catch (err) {
		console.error("Error updating user:", err);
		res.status(500).json({ error: "Failed to update user" });
	}
});

app.delete("/users/:id", authenticate, async (req, res) => {
	try {
		await kcAdminClient.users.del({ id: req.params.id });
		res.json({ message: "User deleted successfully" });
	} catch (err) {
		console.error("Error deleting user:", err);
		res.status(500).json({ error: "Failed to delete user" });
	}
});

app.post("/users/:id/reset-password", authenticate, async (req, res) => {
	try {
		await kcAdminClient.users.resetPassword({
			id: req.params.id,
			credential: {
				temporary: false,
				type: "password",
				value: req.body.password || "newPassword",
			},
		});
		res.json({ message: "Password reset successfully" });
	} catch (err) {
		console.error("Error resetting password:", err);
		res.status(500).json({ error: "Failed to reset password" });
	}
});

app.get("/users/:id/credentials", authenticate, async (req, res) => {
	try {
		const credentials = await kcAdminClient.users.getCredentials({
			id: req.params.id,
		});
		res.json(credentials);
	} catch (err) {
		console.error("Error fetching credentials:", err);
		res.status(500).json({ error: "Failed to fetch credentials" });
	}
});

app.delete(
	"/users/:id/credentials/:credentialId",
	authenticate,
	async (req, res) => {
		try {
			await kcAdminClient.users.removeCredential({
				id: req.params.id,
				credentialId: req.params.credentialId,
			});
			res.json({ message: "Credential deleted successfully" });
		} catch (err) {
			console.error("Error deleting credential:", err);
			res.status(500).json({ error: "Failed to delete credential" });
		}
	}
);

app.post("/users/:id/roles/realm", authenticate, async (req, res) => {
	try {
		const role = await kcAdminClient.roles.findOneByName({
			name: req.body.roleName,
		});
		await kcAdminClient.users.addRealmRoleMappings({
			id: req.params.id,
			roles: [{ id: role.id, name: role.name }],
		});
		res.json({ message: "Realm role added to user successfully" });
	} catch (err) {
		console.error("Error adding realm role to user:", err);
		res.status(500).json({ error: "Failed to add realm role to user" });
	}
});

app.delete("/users/:id/roles/realm", authenticate, async (req, res) => {
	try {
		const role = await kcAdminClient.roles.findOneByName({
			name: req.body.roleName,
		});
		await kcAdminClient.users.delRealmRoleMappings({
			id: req.params.id,
			roles: [{ id: role.id, name: role.name }],
		});
		res.json({ message: "Realm role removed from user successfully" });
	} catch (err) {
		console.error("Error removing realm role from user:", err);
		res.status(500).json({ error: "Failed to remove realm role from user" });
	}
});

app.post("/users/:id/roles/client", authenticate, async (req, res) => {
	try {
		const client = await kcAdminClient.clients.findOne({
			clientId: req.body.clientId,
		});
		const role = await kcAdminClient.clients.findRole({
			id: client.id,
			roleName: req.body.roleName,
		});
		await kcAdminClient.users.addClientRoleMappings({
			id: req.params.id,
			clientUniqueId: client.id,
			roles: [{ id: role.id, name: role.name }],
		});
		res.json({ message: "Client role added to user successfully" });
	} catch (err) {
		console.error("Error adding client role to user:", err);
		res.status(500).json({ error: "Failed to add client role to user" });
	}
});

app.delete("/users/:id/roles/client", authenticate, async (req, res) => {
	try {
		const client = await kcAdminClient.clients.findOne({
			clientId: req.body.clientId,
		});
		const role = await kcAdminClient.clients.findRole({
			id: client.id,
			roleName: req.body.roleName,
		});
		await kcAdminClient.users.delClientRoleMappings({
			id: req.params.id,
			clientUniqueId: client.id,
			roles: [{ id: role.id, name: role.name }],
		});
		res.json({ message: "Client role removed from user successfully" });
	} catch (err) {
		console.error("Error removing client role from user:", err);
		res.status(500).json({ error: "Failed to remove client role from user" });
	}
});

app.get("/users/:id/groups", authenticate, async (req, res) => {
	try {
		const groups = await kcAdminClient.users.listGroups({ id: req.params.id });
		res.json(groups);
	} catch (err) {
		console.error("Error listing user groups:", err);
		res.status(500).json({ error: "Failed to list user groups" });
	}
});

app.post("/realms", authenticate, async (req, res) => {
	try {
		const realm = await kcAdminClient.realms.create({
			realm: faker.internet.domainWord(),
		});
		res.json(realm);
	} catch (err) {
		console.error("Error creating realm:", err);
		res.status(500).json({ error: "Failed to create realm" });
	}
});

app.delete("/realms/:realm", authenticate, async (req, res) => {
	try {
		await kcAdminClient.realms.del({ realm: req.params.realm });
		res.json({ message: "Realm deleted successfully" });
	} catch (err) {
		console.error("Error deleting realm:", err);
		res.status(500).json({ error: "Failed to delete realm" });
	}
});

app.get("/users/:id/attributes", authenticate, async (req, res) => {
	try {
		const user = await kcAdminClient.users.findOne({ id: req.params.id });
		res.json(user.attributes || {});
	} catch (err) {
		console.error("Error fetching user attributes:", err);
		res.status(500).json({ error: "Failed to fetch user attributes" });
	}
});

app.put("/users/:id/attributes", authenticate, async (req, res) => {
	try {
		const { attributes } = req.body;
		console.log(attributes, "attttt");
		if (!attributes || typeof attributes !== "object") {
			return res.status(400).json({ error: "Valid attributes are required" });
		}

		await kcAdminClient.users.update({ id: req.params.id }, { attributes });
		res.json({ attributes });
	} catch (err) {
		console.error("Error updating user attributes:", err);
		res.status(500).json({ error: "Failed to update user attributes" });
	}
});

// Start the Express server
app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
