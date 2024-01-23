// Packages
import fs from "fs";
import path from "path";
import * as database from "./v4-database/prisma.js";
import { hasPerm } from "./perms.js";
import {
	Client,
	GatewayIntentBits,
	Events,
	ActivityType,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	EmbedBuilder,
	codeBlock,
	ModalSubmitInteraction,
	AutocompleteInteraction,
	GuildMember,
	Presence,
} from "discord.js";
import { debug, info, error } from "./logger.js";
import "dotenv/config";
import { botstatus } from "@prisma/client";

// Config
let DISCORD_SERVER_URI: String = "https://discord.gg/XdGs8WFFtK";

// Create Discord Client
const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
	],
});

// Get files from directory
const getFilesInDirectory = (dir: string) => {
	let files: string[] = [];
	const filesInDir = fs.readdirSync(dir);

	for (const file of filesInDir) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory())
			files = files.concat(getFilesInDirectory(filePath));
		else files.push(filePath);
	}

	return files;
};

// Add Commands
const commands: Map<
	string,
	{
		data: {
			meta: SlashCommandBuilder;
			permissionRequired: string | null;
		};
		execute: (
			client: Client,
			interaction: ChatInputCommandInteraction
		) => Promise<void>;
		autocomplete: (
			client: Client,
			interaction: AutocompleteInteraction
		) => Promise<void>;
	}
> = new Map();
const commandFiles = getFilesInDirectory("./dist/commands").filter((file) =>
	file.endsWith(".js")
);

for (const file of commandFiles) {
	import(`../${file}`)
		.then((module) => {
			const i = module.default;
			commands.set(i.data.meta.name, i);
		})
		.catch((error) => {
			console.error(`Error importing ${file}: ${error}`);
		});
}

// Add Modals
const modals: Map<
	string,
	{
		data: {
			name: string;
			permissionRequired: string | null;
		};
		execute: (
			client: Client,
			interaction: ModalSubmitInteraction
		) => Promise<void>;
	}
> = new Map();
const modalFiles = getFilesInDirectory("./dist/modals").filter((file) =>
	file.endsWith(".js")
);

for (const file of modalFiles) {
	import(`../${file}`)
		.then((module) => {
			const i = module.default;
			modals.set(i.data.name, i);
		})
		.catch((error) => {
			console.error(`Error importing ${file}: ${error}`);
		});
}

// Debug Event
client.on("debug", (info) => {
	debug("Discord", info);
});

// Error Event
client.on("error", (p) => {
	error("Discord", p.toString());
});

// Ready Event
client.on(Events.ClientReady, () => {
	info("Discord", `Logged in as ${client.user?.tag}!`);
	client.user?.setStatus("dnd");
	client.user?.setActivity("SL V4", { type: ActivityType.Watching });
});

// Interaction Event
client.on(Events.InteractionCreate, async (interaction) => {
	// Slash Command
	if (interaction.isChatInputCommand()) {
		const command = commands.get(interaction.commandName);
		if (!command) return;

		try {
			if (command.data.permissionRequired) {
				const user = await database.Users.get({
					userid: interaction.user.id,
				});

				if (user) {
					if (
						hasPerm(
							user.staff_perms,
							command.data.permissionRequired
						)
					)
						await command?.execute(client, interaction);
					else
						await interaction.reply({
							embeds: [
								new EmbedBuilder()
									.setTitle("Oops! Missing Permissions!")
									.setDescription(
										`You do not have enough permissions to execute this command.\nPermissions Provided: **${user.staff_perms.join(", ") || "None"}**\n Permission Required: **${command.data.permissionRequired}**.`
									)
									.setColor("Random"),
							],
						});
				} else
					await interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setTitle("Oops! Missing Permissions!")
								.setDescription(
									`You do not have enough permissions to execute this command. Permission Required: **${command.data.permissionRequired}**.`
								)
								.setColor("Random"),
						],
					});
			} else await command?.execute(client, interaction);
		} catch (p) {
			error("Discord", p.toString());

			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Oops! We had an issue.")
						.setDescription(
							`This issue has been reported to our developers. If you continue to having issues with our bot, you may join our [Discord Server](${DISCORD_SERVER_URI})`
						)
						.setColor("Random")
						.addFields({
							name: "Error",
							value: codeBlock("javascript", p),
							inline: false,
						}),
				],
			});
		}
	}

	// Modal
	if (interaction.isModalSubmit()) {
		const modal = modals.get(interaction.customId);
		if (!modal) return;

		try {
			if (modal.data.permissionRequired) {
				const user = await database.Users.get({
					userid: interaction.user.id,
				});

				if (user) {
					if (
						hasPerm(user.staff_perms, modal.data.permissionRequired)
					)
						await modal?.execute(client, interaction);
					else
						await interaction.reply({
							embeds: [
								new EmbedBuilder()
									.setTitle("Oops! Missing Permissions!")
									.setDescription(
										`You do not have enough permissions to execute this command.\nPermissions Provided: **${user.staff_perms.join(", ") || "None"}**\n Permission Required: **${modal.data.permissionRequired}**.`
									)
									.setColor("Random"),
							],
						});
				} else
					await interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setTitle("Oops! Missing Permissions!")
								.setDescription(
									`You do not have enough permissions to execute this command. Permission Required: **${modal.data.permissionRequired}**.`
								)
								.setColor("Random"),
						],
					});
			} else await modal?.execute(client, interaction);
		} catch (p) {
			error("Discord", p.toString());

			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Oops! We had an issue.")
						.setDescription(
							`This issue has been reported to our developers. If you continue to having issues with our bot, you may join our [Discord Server](${DISCORD_SERVER_URI})`
						)
						.setColor("Random")
						.addFields({
							name: "Error",
							value: codeBlock("javascript", p),
							inline: false,
						}),
				],
			});
		}
	}

	// Autocomplete
	if (interaction.isAutocomplete()) {
		const command = commands.get(interaction.commandName);
		if (!command) return;

		try {
			if (command.data.permissionRequired) {
				const user = await database.Users.get({
					userid: interaction.user.id,
				});

				if (user) {
					if (
						hasPerm(
							user.staff_perms,
							command.data.permissionRequired
						)
					)
						await command?.autocomplete(client, interaction);
					else return;
				} else return;
			} else await command?.autocomplete(client, interaction);
		} catch (p) {
			error("Discord", p.toString());
			return;
		}
	}
});

client.on("guildMemberAdd", async (member: GuildMember) => {
	if (member.user.bot) {
		let presence: botstatus;

		switch (member.presence.status) {
			case "online":
				presence = "ONLINE";
				break;
			case "idle":
				presence = "IDLE";
				break;
			case "dnd":
				presence = "DND";
				break;
			case "invisible":
				presence = "OFFLINE";
				break;
			default:
				presence = "OFFLINE";
				break;
		}

		let bot = await database.Prisma.discordbots.findUnique({
			where: {
				botid: member.user.id,
			},
		});

		if (bot) {
			bot.name = member.user.username;
			bot.avatar = member.user.displayAvatarURL();
			bot.status = presence;

			await database.Bots.update(member.user.id, bot);
		}
	} else {
		let user = await database.Prisma.users.findUnique({
			where: {
				userid: member.user.id,
			},
		});

		if (user) {
			user.username = member.user.username;
			user.avatar = member.user.displayAvatarURL();

			await database.Users.update(member.user.id, user);
		}
	}
});

client.on("guildMemberUpdate", async (member: GuildMember) => {
	if (member.user.bot) {
		let presence: botstatus;

		switch (member.presence.status) {
			case "online":
				presence = "ONLINE";
				break;
			case "idle":
				presence = "IDLE";
				break;
			case "dnd":
				presence = "DND";
				break;
			case "invisible":
				presence = "OFFLINE";
				break;
			default:
				presence = "OFFLINE";
				break;
		}

		let bot = await database.Prisma.discordbots.findUnique({
			where: {
				botid: member.user.id,
			},
		});

		if (bot) {
			bot.name = member.user.username;
			bot.avatar = member.user.displayAvatarURL();
			bot.status = presence;

			await database.Bots.update(member.user.id, bot);
		}
	} else {
		let user = await database.Prisma.users.findUnique({
			where: {
				userid: member.user.id,
			},
		});

		if (user) {
			user.username = member.user.username;
			user.avatar = member.user.displayAvatarURL();

			await database.Users.update(member.user.id, user);
		}
	}
});

client.on(
	"presenceUpdate",
	async (oldPresence: Presence, newPresence: Presence) => {
		if (oldPresence.user.bot) {
			let presence: botstatus;

			switch (newPresence.member.presence.status) {
				case "online":
					presence = "ONLINE";
					break;
				case "idle":
					presence = "IDLE";
					break;
				case "dnd":
					presence = "DND";
					break;
				case "invisible":
					presence = "OFFLINE";
					break;
				default:
					presence = "OFFLINE";
					break;
			}

			let bot = await database.Prisma.discordbots.findUnique({
				where: {
					botid: oldPresence.user.id,
				},
			});

			if (bot) {
				bot.name = oldPresence.user.username;
				bot.avatar = oldPresence.user.displayAvatarURL();
				bot.status = presence;

				await database.Bots.update(oldPresence.user.id, bot);
			}
		} else {
			let user = await database.Prisma.users.findUnique({
				where: {
					userid: oldPresence.user.id,
				},
			});

			if (user) {
				user.username = oldPresence.user.username;
				user.avatar = oldPresence.user.displayAvatarURL();

				await database.Users.update(oldPresence.user.id, user);
			}
		}
	}
);

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
