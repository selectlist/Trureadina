import { SlashCommandBuilder } from "@discordjs/builders";
import * as database from "../../Serendipity/prisma.js";
import { Query } from "../../Serendipity/rpc.js";

export default {
	data: {
		meta: new SlashCommandBuilder()
			.setName("claim")
			.setDescription("Claim entity (Staff)")
			.addStringOption((option) =>
				option
					.setName("bot")
					.setDescription("What bot are you wanting to claim?")
					.setAutocomplete(true)
					.setRequired(true)
			),
		permissionRequired: "bots.claim",
	},
	async execute(client, interaction) {
		const bot = interaction.options.getString("bot");
		const data = await database.Discord.get({
			botid: bot,
		});

		if (data) {
			let action = await Query("bots.claim", {
				bot_id: data.botid,
				staff_id: interaction.user.id,
				platform: "Discord",
			});
			console.log(action);
			if (action === true)
				await interaction.reply({
					content: "Bot claimed!",
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
			state: "PENDING",
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
