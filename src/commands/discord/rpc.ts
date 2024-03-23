import { SlashCommandBuilder } from "@discordjs/builders";
import * as database from "../../Serendipity/prisma.js";
import { Query, availableEntities } from "../../Serendipity/rpc.js";
import {
	APIActionRowComponent,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	ModalBuilder,
	ModalSubmitFields,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

export default {
	data: {
		meta: new SlashCommandBuilder()
			.setName("rpc")
			.setDescription("Access our RPC Query Protocol (Staff)")
			.addStringOption((option) =>
				option
					.setName("action")
					.setDescription("What action are you wanting to execute?")
					.setAutocomplete(true)
					.setRequired(true)
			),
		permissionRequired: null,
	},
	async execute(client, interaction) {
		const action = interaction.options.getString("action");

		const entity = availableEntities.find(
			(p) => p.namespace === action.split(".")[0]
		);
		const entityAction = entity.actions.find(
			(p) => p.name === action.split(".")[1]
		);

		const resp = await interaction.reply({
			content:
				"To continue, we have to ask for extra information. Click the button down below to continue!",
			embeds: [
				new EmbedBuilder()
					.setTitle("RPC Query Protocol")
					.setColor("Random")
					.addFields([
						{
							name: "Action",
							value: entityAction.name,
							inline: true,
						},
						{
							name: "Action Description",
							value: entityAction.description,
							inline: true,
						},
						{
							name: "Action Permission",
							value: entityAction.permissionRequired,
							inline: true,
						},
						{
							name: "Action Params",
							value: entityAction.params
								.filter((p) => p.name != "staff_id")
								.map((p) => {
									return `${p.name}: ${p.description}`;
								})
								.join("\n"),
							inline: true,
						},
						{
							name: "Entity",
							value: entity.namespace,
							inline: true,
						},
					]),
			],
			components: [
				new ActionRowBuilder().addComponents([
					new ButtonBuilder()
						.setStyle(ButtonStyle.Danger)
						.setCustomId("continue")
						.setLabel("Continue"),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("cancel")
						.setLabel("Cancel"),
				]),
			],
		});

		const filter = (i) => {
			if (i.customId === "continue") return true;
			if (i.customId === "cancel") return true;
			else return false;
		};

		const btn = await resp.createMessageComponentCollector({
			filter,
			time: 120000,
		});

		btn.on("collect", async (i) => {
			if (i.customId === "continue") {
				const modal = new ModalBuilder()
					.setCustomId("rpcql")
					.setTitle(`RPCQL Builder`);
				const fields: APIActionRowComponent<any>[] = entityAction.params
					.filter((p) => p.name != "staff_id")
					.map((p) => {
						return new ActionRowBuilder()
							.addComponents(
								new TextInputBuilder()
									.setCustomId(p.name)
									.setLabel(p.name)
									.setPlaceholder(p.description)
									.setStyle(TextInputStyle.Paragraph)
									.setMinLength(1)
									.setRequired(true)
							)
							.toJSON();
					});

				modal.addComponents(fields);
				await i.showModal(modal);

				const modalFilter = (interaction) =>
					interaction.customId === "rpcql";
				i.awaitModalSubmit({ time: 120000, modalFilter })
					.then(async (interaction) => {
						let data = {
							staff_id: interaction.user.id,
						};

						const modalFields: ModalSubmitFields =
							interaction.fields;
						modalFields.fields.map((p) => {
							data[p.customId] = p.value;
						});

						try {
							const ah = await Query(
								`${entity.namespace}.${entityAction.name}`,
								data
							);

							if (ah instanceof Error)
								await interaction.reply({
									embeds: [
										new EmbedBuilder()
											.setTitle("Error")
											.setColor("Red")
											.setDescription(
												`An error occured while executing this action: \`${ah.message}\``
											),
									],
								});

							if (ah === true)
								await interaction.reply(
									"The action has been completed. This has been recorded for auditing purposes."
								);
							else if (ah === false)
								await interaction.reply(
									"The action has failed due to an unknown reason."
								);
						} catch (err) {
							await interaction.reply({
								embeds: [
									new EmbedBuilder()
										.setTitle("Error")
										.setColor("Red")
										.setDescription(err.toString()),
								],
							});
						}
					})
					.catch((err) =>
						resp.edit({
							content:
								"This interaction has been cancelled. Please reexecute the command to complete this action.",
							embeds: [],
							components: [],
						})
					);
			} else if (i.customId === "cancel") {
				resp.edit({
					content:
						"This interaction has been cancelled. Please reexecute the command to complete this action.",
					embeds: [],
					components: [],
				});
			}
		});

		btn.on("end", (_, reason) => {
			if (reason !== "messageDelete") {
				resp.edit({
					content:
						"This interaction has expired. Please reexecute the command to complete this action.",
					embeds: [],
					components: [],
				});
			}
		});
	},
	async autocomplete(client, interaction) {
		const focusedValue = interaction.options.getFocused();

		let choices: {
			name: string;
			value: string;
		}[] = [];

		availableEntities.map((o) => {
			o.actions.map((action) => {
				choices.push({
					name: `${o.namespace}.${action.name}`,
					value: `${o.namespace}.${action.name}`,
				});
			});
		});

		const filtered = choices.filter((choice) =>
			choice.name.startsWith(focusedValue)
		);
		await interaction.respond(filtered);
	},
};
