// AUTO GENERATED FILE BY @kalissaac/prisma-typegen
// DO NOT EDIT

export enum botstatus {
	ONLINE = "ONLINE",
	IDLE = "IDLE",
	DND = "DND",
	OFFLINE = "OFFLINE",
}

export enum botstate {
	APPROVED = "APPROVED",
	DENIED = "DENIED",
	PENDING = "PENDING",
	BANNED = "BANNED",
}

export enum botaction {
	APPROVE = "APPROVE",
	DENY = "DENY",
	BAN = "BAN",
	VOTE_BAN = "VOTE_BAN",
	OTHER = "OTHER",
}

export interface botaudits {
	id: number;
	botid: string;
	bot: discordbots;
	staffid: string;
	action: botaction;
	reason: string;
}

export interface botcomments {
	commentid: string;
	creatorid: string;
	user: users;
	bot: discordbots;
	botid: string;
	caption: string;
	image?: string;
}

export interface discordbots {
	botid: string;
	name: string;
	description: string;
	longdescription: string;
	status: botstatus;
	state: botstate;
	auditlogs: botaudits[];
	upvotes: string[];
	downvotes: string[];
	comments: botcomments[];
	ownerid: string;
	owner: users;
}

export interface users {
	username?: string;
	userid: string;
	bio: string;
	avatar: string;
	badges: string[];
	staff_perms: string[];
	discordbots: discordbots[];
	botcomments: botcomments[];
}
