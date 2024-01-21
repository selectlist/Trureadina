// Packages
import fs from "fs";
import path from "path";
import * as database from "./v4-database/prisma.js";
import * as perms from "./perms.js";
import cors from "@fastify/cors";
import ratelimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import ui from "@fastify/swagger-ui";
import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";

// Middleware
const app: FastifyInstance = Fastify({
	logger: true,
});

app.register(cors, {
	origin: "*",
	allowedHeaders: [
		"secret",
		"userid",
		"Authorization",
		"Authorization",
		"Content-Type",
		"Content-Disposition",
		"Content-Length",
	],
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	credentials: true,
	optionsSuccessStatus: 200,
	preflight: true,
	strictPreflight: false,
});

app.register(swagger, {
	swagger: {
		info: {
			title: "Select List",
			description:
				"Enhance your Discord Server with unparalleled versatility through our curated selection.",
			version: "4.0.0",
		},
		host:
			process.env.ENV === "production"
				? "api.select-list.xyz"
				: `localhost:${process.env.PORT}`,
		schemes: ["http"],
		consumes: ["application/json"],
		produces: ["application/json"],
		tags: [
			{
				name: "users",
				description: "Endpoints related to our users database.",
			},
			{
				name: "bots",
				description: "Endpoints related to our bots database.",
			}
		],
		securityDefinitions: {
			apiKey: {
				type: "apiKey",
				name: "Authorization",
				in: "header",
			},
		},
	},
	hideUntagged: false,
});

app.register(ui, {
	routePrefix: "/docs",
	uiConfig: {
		docExpansion: "full",
		deepLinking: true,
	},
	uiHooks: {
		onRequest: (request, reply, next) => {
			next();
		},
		preHandler: (request, reply, next) => {
			next();
		},
	},
	staticCSP: true,
	transformStaticCSP: (header) => header,
	transformSpecification: (swaggerObject, request, reply) => {
		return swaggerObject;
	},
	transformSpecificationClone: true,
});

app.register(ratelimit, {
	global: true,
	max: 50,
	timeWindow: 1000,
});

app.addHook("preHandler", (req, res, done) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "*");
	res.header("Access-Control-Allow-Methods", "*");
	res.header("Access-Control-Allow-Credentials", "true");

	done();
});

// API Endpoints Map
const getFilesInDirectory = (dir: string) => {
	let files: string[] = [];
	const filesInDir = fs.readdirSync(dir);

	for (const file of filesInDir) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory())
			files = files.concat(getFilesInDirectory(filePath));
		else files.push(filePath);
	}

	return files;
};

// API Endpoints
const apiEndpointsFiles = getFilesInDirectory("./dist/endpoints").filter(
	(file) => file.endsWith(".js")
);

for (const file of apiEndpointsFiles) {
	import(`../${file}`)
		.then(async (module) => {
			await app.route(module.default);
		})
		.catch((error) => {
			console.error(`Error importing ${file}: ${error}`);
		});
}

setTimeout(() => {
	// Swagger
	app.ready(() => {
		app.swagger();
	});

	// Start Server
	app.listen({ port: Number(process.env.PORT) }, (err) => {
		if (err) throw err;
	});
}, 5000);
