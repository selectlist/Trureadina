import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import Pagination from "../pagination.js";
import * as database from "../v4-database/prisma.js";

export default {
	data: {
		meta: new SlashCommandBuilder()
			.setName("queue")
			.setDescription("View Queue"),
		permissionRequired: null,
	},
	async execute(client, interaction) {
		const bots = await database.Bots.find({
			state: "PENDING",
		});

		const pages = bots.map((p) => {
			return new EmbedBuilder()
				.setTitle(`${p.name} [${p.botid}]`)
				.setDescription(p.description)
                .setColor("Random")
				.setAuthor({
					name: p.owner.username,
					iconURL:
						p.owner.avatar === "/logo.png"
							? "https://sparkyflight.xyz/logo.png"
							: p.owner.avatar,
				})
				.setTimestamp();
		});

		if (pages.length === 0)
			return await interaction.reply({
				content: "Sorry, there are no bots to show.",
			});
		else
			return await Pagination(interaction, pages, [
				new ButtonBuilder()
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("prev")
					.setLabel("Previous"),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Primary)
					.setCustomId("next")
					.setLabel("Next"),
			]);
	},
};
