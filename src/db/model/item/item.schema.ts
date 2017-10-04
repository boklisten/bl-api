




import * as mongoose from 'mongoose';

export let ItemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            lowercase: true
        },
        info: mongoose.Schema.Types.Mixed,
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
