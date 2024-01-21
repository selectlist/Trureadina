import { FastifyReply, FastifyRequest } from "fastify";
import * as database from "../../v4-database/prisma.js";

export default {
	url: "/users/get",
	method: "GET",
	schema: {
		summary: "Get user",
		description: "Gets a user.",
		tags: ["users"],
		querystring: {
			type: "object",
			properties: {
				userid: { type: "string" },
			},
			required: ["userid"],
		},
	},
	handler: async (request: FastifyRequest, reply: FastifyReply) => {
		const data: any = request.query;

		let user = await database.Users.get({ userid: data.userid });

		if (user) return reply.send(user);
		else
			return reply.status(404).send({
				message:
					"We couldn't fetch any information about this user in our database",
				error: true,
			});
	},
};
