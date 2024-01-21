import * as database from "../../v4-database/prisma.js";
import { FastifyReply, FastifyRequest } from "fastify";

export default {
	url: "/bots/list",
	method: "GET",
	schema: {
		summary: "Get all bots",
		description: "Returns all bots.",
		tags: ["bots"],
	},
	handler: async (request: FastifyRequest, reply: FastifyReply) => {
		let bots = await database.Bots.find({});
		bots.reverse();

		return reply.send(bots);
	},
};
