import express from "express";
import { faker } from "@faker-js/faker";
import KcAdminClient from "@keycloak/keycloak-admin-client";
// import dotenv from "dotenv";

// dotenv.config();

const app = express();
const port = 4000;

// Initialize Keycloak Admin Client
const kcAdminClient = new KcAdminClient({
	baseUrl: "http://127.0.0.1:8080", // Ensure this is your Keycloak server URL
	realmName: "NHAI",
});

// Middleware to authenticate with Keycloak
const authenticate = async (req, res, next) => {
	console.log(kcAdminClient, "kcccccccccccccc");
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

/**
 * @api {get} /users List all users
 * @apiName ListUsers
 * @apiGroup Users
 * @apiDescription This endpoint lists all users in the realm.
 */
app.get("/users", authenticate, async (req, res) => {
	try {
		const users = await kcAdminClient.users.find();
		res.json(users);
	} catch (err) {
		console.error("Error fetching users:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

/**
 * @api {post} /users Create a new user
 * @apiName CreateUser
 * @apiGroup Users
 * @apiDescription This endpoint creates a new user in the realm.
 */
app.post("/users", authenticate, async (req, res) => {
	console.log("i was called");
	try {
		const user = await kcAdminClient.users.create({
			username: faker.internet.userName(),
			email: faker.internet.email(),
			emailVerified: true,
			enabled: true,
			attributes: {
				key: "value",
			},
		});
		console.log(user, "ussssseeeee");
		res.json(user);
	} catch (err) {
		console.error("Error creating user:", err);
		res.status(500).json({ error: "Failed to create user" });
	}
});

/**
 * @api {get} /users/:id Get user by ID
 * @apiName GetUserById
 * @apiGroup Users
 * @apiDescription This endpoint retrieves a user by their ID.
 */
app.get("/users/:id", authenticate, async (req, res) => {
	try {
		const user = await kcAdminClient.users.findOne({ id: req.params.id });
		res.json(user);
	} catch (err) {
		console.error("Error fetching user:", err);
		res.status(500).json({ error: "Failed to fetch user" });
	}
});

/**
 * @api {put} /users/:id Update user by ID
 * @apiName UpdateUserById
 * @apiGroup Users
 * @apiDescription This endpoint updates a user by their ID.
 */
app.put("/users/:id", authenticate, async (req, res) => {
	try {
		await kcAdminClient.users.update(
			{ id: req.params.id },
			{
				firstName: "UpdatedFirstName",
				lastName: "UpdatedLastName",
				emailVerified: true,
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

/**
 * @api {delete} /users/:id Delete user by ID
 * @apiName DeleteUserById
 * @apiGroup Users
 * @apiDescription This endpoint deletes a user by their ID.
 */
app.delete("/users/:id", authenticate, async (req, res) => {
	try {
		await kcAdminClient.users.del({ id: req.params.id });
		res.json({ message: "User deleted successfully" });
	} catch (err) {
		console.error("Error deleting user:", err);
		res.status(500).json({ error: "Failed to delete user" });
	}
});

/**
 * @api {post} /users/:id/reset-password Reset user password
 * @apiName ResetUserPassword
 * @apiGroup Users
 * @apiDescription This endpoint resets the password for a user by their ID.
 */
app.post("/users/:id/reset-password", authenticate, async (req, res) => {
	try {
		await kcAdminClient.users.resetPassword({
			id: req.params.id,
			credential: {
				temporary: false,
				type: "password",
				value: "newPassword",
			},
		});
		res.json({ message: "Password reset successfully" });
	} catch (err) {
		console.error("Error resetting password:", err);
		res.status(500).json({ error: "Failed to reset password" });
	}
});

/**
 * @api {get} /users/:id/credentials Get user credentials
 * @apiName GetUserCredentials
 * @apiGroup Users
 * @apiDescription This endpoint retrieves the credentials for a user by their ID.
 */
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

/**
 * @api {delete} /users/:id/credentials/:credentialId Delete user credential
 * @apiName DeleteUserCredential
 * @apiGroup Users
 * @apiDescription This endpoint deletes a credential for a user by their ID and credential ID.
 */
app.delete(
	"/users/:id/credentials/:credentialId",
	authenticate,
	async (req, res) => {
		try {
			await kcAdminClient.users.deleteCredential({
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

/**
 * @api {put} /users/:id/credentials/:credentialId Update user credential label
 * @apiName UpdateUserCredentialLabel
 * @apiGroup Users
 * @apiDescription This endpoint updates the label for a credential for a user by their ID and credential ID.
 */
app.put(
	"/users/:id/credentials/:credentialId",
	authenticate,
	async (req, res) => {
		try {
			await kcAdminClient.users.updateCredentialLabel(
				{ id: req.params.id, credentialId: req.params.credentialId },
				"New Label"
			);
			const credentials = await kcAdminClient.users.getCredentials({
				id: req.params.id,
			});
			res.json(credentials);
		} catch (err) {
			console.error("Error updating credential label:", err);
			res.status(500).json({ error: "Failed to update credential label" });
		}
	}
);

/**
 * @api {post} /users/:id/groups/:groupId Add user to group
 * @apiName AddUserToGroup
 * @apiGroup Users
 * @apiDescription This endpoint adds a user to a group by their ID and group ID.
 */
app.post("/users/:id/groups/:groupId", authenticate, async (req, res) => {
	try {
		await kcAdminClient.users.addToGroup({
			id: req.params.id,
			groupId: req.params.groupId,
		});
		res.json({ message: "User added to group successfully" });
	} catch (err) {
		console.error("Error adding user to group:", err);
		res.status(500).json({ error: "Failed to add user to group" });
	}
});

/**
 * @api {delete} /users/:id/groups/:groupId Remove user from group
 * @apiName RemoveUserFromGroup
 * @apiGroup Users
 * @apiDescription This endpoint removes a user from a group by their ID and group ID.
 */
app.delete("/users/:id/groups/:groupId", authenticate, async (req, res) => {
	try {
		await kcAdminClient.users.delFromGroup({
			id: req.params.id,
			groupId: req.params.groupId,
		});
		res.json({ message: "User removed from group successfully" });
	} catch (err) {
		console.error("Error removing user from group:", err);
		res.status(500).json({ error: "Failed to remove user from group" });
	}
});

/**
 * @api {post} /users/:id/roles/realm Add realm role to user
 * @apiName AddRealmRoleToUser
 * @apiGroup Users
 * @apiDescription This endpoint adds a realm role to a user by their ID.
 */
app.post("/users/:id/roles/realm", authenticate, async (req, res) => {
	try {
		const role = await kcAdminClient.roles.findOneByName({ name: "roleName" });
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

/**
 * @api {delete} /users/:id/roles/realm Remove realm role from user
 * @apiName RemoveRealmRoleFromUser
 * @apiGroup Users
 * @apiDescription This endpoint removes a realm role from a user by their ID.
 */
app.delete("/users/:id/roles/realm", authenticate, async (req, res) => {
	try {
		const role = await kcAdminClient.roles.findOneByName({ name: "roleName" });
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

/**
 * @api {post} /users/:id/roles/client Add client role to user
 * @apiName AddClientRoleToUser
 * @apiGroup Users
 * @apiDescription This endpoint adds a client role to a user by their ID and client ID.
 */
app.post("/users/:id/roles/client", authenticate, async (req, res) => {
	try {
		const client = await kcAdminClient.clients.findOne({
			clientId: "client-id",
		});
		const role = await kcAdminClient.clients.findRole({
			id: client.id,
			roleName: "roleName",
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

/**
 * @api {delete} /users/:id/roles/client Remove client role from user
 * @apiName RemoveClientRoleFromUser
 * @apiGroup Users
 * @apiDescription This endpoint removes a client role from a user by their ID and client ID.
 */
app.delete("/users/:id/roles/client", authenticate, async (req, res) => {
	try {
		const client = await kcAdminClient.clients.findOne({
			clientId: "client-id",
		});
		const role = await kcAdminClient.clients.findRole({
			id: client.id,
			roleName: "roleName",
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

/**
 * @api {get} /users/:id/groups List user's groups
 * @apiName ListUserGroups
 * @apiGroup Users
 * @apiDescription This endpoint lists all groups a user belongs to by their ID.
 */
app.get("/users/:id/groups", authenticate, async (req, res) => {
	try {
		const groups = await kcAdminClient.users.listGroups({ id: req.params.id });
		res.json(groups);
	} catch (err) {
		console.error("Error listing user groups:", err);
		res.status(500).json({ error: "Failed to list user groups" });
	}
});

/**
 * @api {post} /realms Create a new realm
 * @apiName CreateRealm
 * @apiGroup Realms
 * @apiDescription This endpoint creates a new realm with a random name.
 */
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

/**
 * @api {delete} /realms/:realm Delete a realm
 * @apiName DeleteRealm
 * @apiGroup Realms
 * @apiDescription This endpoint deletes a realm by its name.
 */
app.delete("/realms/:realm", authenticate, async (req, res) => {
	try {
		await kcAdminClient.realms.del({ realm: req.params.realm });
		res.json({ message: "Realm deleted successfully" });
	} catch (err) {
		console.error("Error deleting realm:", err);
		res.status(500).json({ error: "Failed to delete realm" });
	}
});

// Start the Express server
app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
