import { FastifyReply, FastifyRequest } from "fastify";
import * as database from "../../v4-database/prisma.js";

export default {
	url: "/bots/get",
	method: "GET",
	schema: {
		summary: "Get Bot",
		description: "Gets a bot.",
		tags: ["bots"],
		querystring: {
			type: "object",
			properties: {
				botid: { type: "string" },
			},
			required: ["botid"],
		},
	},
	handler: async (request: FastifyRequest, reply: FastifyReply) => {
		const data: any = request.query;

		let user = await database.Bots.get({ botid: data.botid });

		if (user) return reply.send(user);
		else
			return reply.status(404).send({
				message:
					"We couldn't fetch any information about this bot in our database",
				error: true,
			});
	},
};
