
import {SESchema} from "../../config/schema/se.schema";
import {SESchemaConfig} from "../../config/schema/se.schema.config";
import {Schema} from 'mongoose';

export class ItemSchemaConfig implements SESchemaConfig {
    name = 'item';
    permissionLevel = 0;
    values = [
        {
            name: 'title',
            type: Schema.Types.String,
            required: true,
            index: true,
            text: true
        },
        {
            name: 'type',
            type: Schema.Types.String,
            required: true
        },
        {
            name: 'info',
            type: Schema.Types.Mixed,
            required: true
        },
        {
            name: 'desc',
            type: Schema.Types.String,
            required: false
        },
        {
            name: 'price',
            type: Schema.Types.Number,
            required: true
        },
        {
            name: 'sell',
            type: Schema.Types.Boolean,
            required: true
        },
        {
            name: 'sellPrice',
            type: Schema.Types.Number,
            required: true,
        },
        {
            name: 'rent',
            type: Schema.Types.Boolean,
            required: true
        },
        {
            name: 'buy',
            type: Schema.Types.Boolean,
            required: true
        },
        {
            name: 'active',
            type: Schema.Types.Boolean,
            required: true
        },
        {
            name: 'creationTime',
            type: Schema.Types.String,
            required: true
        }
    ]

}