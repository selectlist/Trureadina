import { SlashCommandBuilder } from "@discordjs/builders";
import * as database from "../../Serendipity/prisma.js";
import { Query } from "../../Serendipity/rpc.js";

export default {
	data: {
		meta: new SlashCommandBuilder()
			.setName("deny")
			.setDescription("Deny entity (Staff)")
			.addStringOption((option) =>
				option
					.setName("bot")
					.setDescription("What bot are you wanting to deny?")
					.setAutocomplete(true)
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("reason")
					.setDescription("Why are you denying this bot?")
					.setRequired(true)
			),
		permissionRequired: "bots.deny",
	},
	async execute(client, interaction) {
		const bot = interaction.options.getString("bot");
		const reason = interaction.options.getString("reason");
		const data = await database.Discord.get({
			botid: bot,
		});

		if (data) {
			let action = await Query("bots.deny", {
				bot_id: data.botid,
				staff_id: interaction.user.id,
				platform: "Discord",
				reason: reason,
			});

			if (action === true)
				await interaction.reply({
					content: "Bot denied!",
				});
		}
	},
	async autocomplete(client, interaction) {
		const focusedValue = interaction.options.getFocused();

		let choices: {
			name: string;
			value: string;
		}[] = [];

		const bots = await database.Discord.find({
			state: "CLAIMED",
		});
		bots.map((o) =>
			choices.push({
				name: `${o.name} [${o.botid}]`,
				value: o.botid,
			})
		);

		const filtered = choices.filter((choice) =>
			choice.name.startsWith(focusedValue)
		);
		await interaction.respond(filtered);
	},
};
