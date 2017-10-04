




import * as mongoose from 'mongoose';

export let ItemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            lowercase: true,
            required: true
        },
        info: mongoose.Schema.Types.Mixed,
        desc: String,
        price: {
            type: Number,
            required: true
        },
        sell: {
            type: Boolean,
            required: true
        },
        sellPrice: {
            type: Number,
            required: true
        },
        rent: {
            type: Boolean,
            required: true
        },
        buy: {
            type: Number,
            required: true
        },
        active: {
            type: Boolean,
            required: true
        },
        creationTime: {
            type: String,
            required: true
        },
        lastUpdated: String

    }
);
