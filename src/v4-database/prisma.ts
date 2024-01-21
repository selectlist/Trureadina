// Modules
import { PrismaClient, discordbots, users } from "@prisma/client";
const Prisma = new PrismaClient();

// Users
class Users {
	static async create(data: users) {
		try {
			await Prisma.users.create({
				data: data,
			});

			return true;
		} catch (error) {
			return error;
		}
	}

	static async update(id: string, data: users) {
		try {
			await Prisma.users.update({
				where: {
					userid: id,
				},
				data: data,
			});

			return true;
		} catch (err) {
			return err;
		}
	}

	static async get(data: any) {
		const doc = await Prisma.users.findUnique({
			where: data,
			include: {
				discordbots: true,
				botcomments: false,
			},
		});

		if (!doc) return null;
		else return doc;
	}

	static async find(data: any) {
		const docs = await Prisma.users.findMany({
			where: data,
			include: {
				discordbots: true,
				botcomments: false,
			},
		});

		return docs;
	}

	static async delete(userid: string) {
		try {
			await Prisma.users.delete({
				where: {
					userid: userid,
				},
			});

			return true;
		} catch (err) {
			return err;
		}
	}
}

// Bots
class Bots {
	static async create(data: discordbots) {
		try {
			await Prisma.discordbots.create({
				data: data,
			});

			return true;
		} catch (error) {
			return error;
		}
	}

	static async update(id: string, data: discordbots) {
		try {
			await Prisma.discordbots.update({
				where: {
					botid: id,
				},
				data: data,
			});

			return true;
		} catch (err) {
			return err;
		}
	}

	static async get(data: any) {
		const doc = await Prisma.discordbots.findUnique({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		if (!doc) return null;
		else return doc;
	}

	static async find(data: any) {
		const docs = await Prisma.discordbots.findMany({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		return docs;
	}

	static async delete(botid: string) {
		try {
			await Prisma.discordbots.delete({
				where: {
					botid: botid,
				},
			});

			return true;
		} catch (err) {
			return err;
		}
	}

	static async comment(
		BotID: string,
		UserID: string,
		Caption: string,
		Image: string
	) {
		try {
			await Prisma.botcomments.create({
				data: {
					botid: BotID,
					commentid: crypto.randomUUID().toString(),
					creatorid: UserID,
					caption: Caption,
					image: Image,
				},
			});

			return true;
		} catch (err) {
			return err;
		}
	}
}

// Export Classes
export { Users, Bots, Prisma };
