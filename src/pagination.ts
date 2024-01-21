import {
	ButtonStyle,
	ActionRowBuilder,
	ButtonBuilder,
	AttachmentBuilder,
	EmbedBuilder,
	UserResolvable,
} from "discord.js";
import * as logger from "./logger.js";

const availableEmojis = ["⏮️", "◀️", "⏹️", "▶️", "⏭️"];

class Pagination {
	interaction: any;
	pages: EmbedBuilder[];
	footerText: String;
	buttons: ButtonBuilder[];
	defaultbuttons: ButtonBuilder[];
	timeout: Number;
	author: UserResolvable;
	files: AttachmentBuilder[];
	index: number;

	constructor(
		interaction: any,
		pages: EmbedBuilder[],
		footerText: String = "Page",
		buttons: ButtonBuilder[],
		timeout: Number,
		author: UserResolvable,
		files: AttachmentBuilder[],
		index: number = 0
	) {
		this.interaction = interaction;
		this.footerText = footerText;
		this.buttons = buttons;
		this.timeout = timeout;
		this.author = author;
		this.files = files;
		this.index = index;

		this.defaultbuttons = [
			new ButtonBuilder({
				emoji: "⏮️",
				style: ButtonStyle.Primary,
				type: 2,
				customId: "⏮️",
			}),
			new ButtonBuilder({
				emoji: "◀️",
				style: ButtonStyle.Primary,
				type: 2,
				customId: "◀️",
			}),
			new ButtonBuilder({
				style: ButtonStyle.Danger,
				emoji: "⏹️",
				type: 2,
				customId: "⏹️",
			}),
			new ButtonBuilder({
				emoji: "▶️",
				style: ButtonStyle.Primary,
				type: 2,
				customId: "▶️",
			}),
			new ButtonBuilder({
				emoji: "⏭️",
				style: ButtonStyle.Primary,
				type: 2,
				customId: "⏭️",
			}),
		];

		if (buttons && buttons.length > 5)
			throw new TypeError(
				"You have passed more than 5 buttons as buttons"
			);

		if (files) this.files = files;

		this.pages = pages.map((page, pageIndex) => {
			if (
				page.data.footer &&
				(page.data.footer.text || page.data.footer.icon_url)
			)
				return page;

			return page.setFooter({
				text: `Executed by ${interaction.user.tag} | ${footerText} ${
					pageIndex + 1
				}/${pages.length}`,
				iconURL: this.interaction.user.displayAvatarURL(),
			});
		});
	}

	/**
	 * Starts the pagination
	 */
	async paginate() {
		let collect = null;
		const extraButtons = this.buttons;

		if (!extraButtons)
			this.interaction = await this.interaction?.reply({
				embeds: [this.pages[this.index]],
				...(this.files && { files: [this.files[this.index]] }),
				components: [
					new ActionRowBuilder({
						components: [...this.buttons],
					}),
				],
			});
		else
			this.interaction = await this.interaction?.reply({
				embeds: [this.pages[this.index]],
				...(this.files && { files: [this.files[this.index]] }),
				components: [
					new ActionRowBuilder({
						components: this.buttons,
					}),
					new ActionRowBuilder({
						components: extraButtons,
					}),
				],
			});

		if (this.pages.length < 2) return;

		const author = this.author ? this.interaction.user : undefined;

		const interactionCollector =
			(collect = this.interaction) === null || collect === void 0
				? void 0
				: collect.createMessageComponentCollector({
						max: this.pages.length * 5,
						filter: (x) => {
							return !(author && x.user.id !== author.id);
						},
					});

		interactionCollector === null || interactionCollector === void 0
			? void 0
			: interactionCollector.on("collect", async (i) => {
					const { customId } = i;
					let newIndex =
						customId === availableEmojis[0]
							? 0 // Start
							: customId === availableEmojis[1]
								? this.index - 1 // Prev
								: customId === availableEmojis[2]
									? NaN // Stop
									: customId === availableEmojis[3]
										? this.index + 1 // Next
										: customId === availableEmojis[4]
											? this.pages.length - 1 // End
											: this.index;

					if (isNaN(newIndex)) {
						// Stop
						interactionCollector.stop("stopped by user");

						await i.update({
							content:
								"The interaction has expired due to Stop button being clicked by user.",
							embeds: [],
							components: [],
						});
					} else {
						if (newIndex < 0) newIndex = 0;
						if (newIndex >= this.pages.length)
							newIndex = this.pages.length - 1;

						this.index = newIndex;

						const buttons = this.buttons || this.defaultbuttons;

						if (
							this.buttons === undefined ||
							this.buttons === null ||
							this.buttons.length === 0
						) {
							await i.update({
								embeds: [this.pages[this.index]],
								...(this.files && {
									files: [this.files[this.index]],
								}),
								components: [
									new ActionRowBuilder({
										components: buttons,
									}),
								],
							});
						} else {
							await i.update({
								embeds: [this.pages[this.index]],
								...(this.files && {
									files: [this.files[this.index]],
								}),
								components: [
									new ActionRowBuilder({
										components: this.defaultbuttons,
									}),
									new ActionRowBuilder({
										components: this.buttons,
									}),
								],
							});
						}
					}
				});

		interactionCollector === null || interactionCollector === void 0
			? void 0
			: interactionCollector.on("end", async (msg) => {
					let collect = null;
					await ((collect =
						this === null || this === void 0
							? void 0
							: this.interaction) === null || collect === void 0
						? void 0
						: logger.info("Pagination (Interaction)", "Closed!"));
				});
	}
}

export default Pagination;
