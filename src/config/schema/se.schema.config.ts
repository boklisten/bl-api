
import {Schema} from 'mongoose';

export interface SESchemaConfig {
    name: string,
    permissionLevel: number,
    values: {
        name: string,
        type: any,
        required: boolean,
        permissionLevel: number
    }[];
}