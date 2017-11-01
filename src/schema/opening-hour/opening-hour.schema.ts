import {Schema} from "mongoose";

export let OpeningHourSchema = {
	from: {
		type: Schema.Types.Date,
		required: true
	},
	to: {
		type: Schema.Types.Date,
		required: true
	},
	branch: {
		type: Schema.Types.ObjectId,
		required: true
	}
};