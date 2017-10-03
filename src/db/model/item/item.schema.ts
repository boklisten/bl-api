



import {Schema} from "mongoose";

export let itemSchema: Schema = new Schema(
    {
        title: String,
        type: {
            type: String,
            lowercase: true
        },
        info: Schema.Types.Mixed,
        desc: String,
        price: Number,
        sell: Boolean,
        sellPrice: Number,
        rent: Boolean,
        buy: Number,
        active: Boolean,
        creationTime: String,
        lastUpdated: String

    }
);
