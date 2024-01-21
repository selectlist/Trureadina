import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";
import Pagination from "../pagination.js";
import * as database from "../v4-database/prisma.js";

export default {
	data: {
		meta: new SlashCommandBuilder()
			.setName("list_bots")
			.setDescription("List all Bots."),
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
				.setAuthor({
					name: p.owner.username,
					iconURL:
						p.owner.avatar === "/logo.png"
							? "https://sparkyflight.xyz/logo.png"
							: p.owner.avatar,
				})
				.setTimestamp();
		});

		await new Pagination(
			interaction,
			pages,
			"Page",
			[],
			0,
			interaction.user,
			[],
			0
		).paginate();
	},
};
