import { SlashCommandBuilder } from "@discordjs/builders";
import * as database from "../v4-database/prisma.js";
import { Unclaim } from "../v4-database/staff_actions.js";

export default {
	data: {
		meta: new SlashCommandBuilder()
			.setName("unclaim")
			.setDescription("Unclaim entity (Staff)")
			.addStringOption((option) =>
				option
					.setName("bot")
					.setDescription("What bot are you wanting to unclaim?")
					.setAutocomplete(true)
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("reason")
					.setDescription("Why are you unclaiming this bot?")
					.setRequired(true)
			),
		permissionRequired: "bots.unclaim",
	},
	async execute(client, interaction) {
		const bot = interaction.options.getString("bot");
		const reason = interaction.options.getString("reason");
		const data = await database.Bots.get({
			botid: bot,
		});

		if (data) {
			let action = await Unclaim(bot, interaction.user.id, reason);

			if (action === true)
				await interaction.reply({
					content: "Bot approved!",
				});
		}
	},
	async autocomplete(client, interaction) {
		const focusedValue = interaction.options.getFocused();

		let choices: {
			name: string;
			value: string;
		}[] = [];

		const bots = await database.Bots.find({
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
