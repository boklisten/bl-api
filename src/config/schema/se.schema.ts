
import {SESchemaConfig} from "./se.schema.config";
import * as mongoose from 'mongoose';

export class SESchema {

    title: string;
    mongooseSchema: mongoose.Schema;
    mongooseModel: mongoose.Model<mongoose.Document>;
    schemaConfig: SESchemaConfig;

    constructor(schemaConfig: SESchemaConfig) {
        this.schemaConfig = schemaConfig;
        this.mongooseSchema = this.createMongooseSchema(this.schemaConfig);
        this.mongooseModel = this.createMongooseModel(this.mongooseSchema);
        this.title = schemaConfig.name;
        console.log('created the schema')
    }

    validateSchema(schemaConfig: SESchemaConfig): boolean {
       return true;
    }

    createMongooseModel(mongooseSchema: mongoose.Schema) {
        console.log('creating the mongoose model');
        return mongoose.model<mongoose.Document>(this.schemaConfig.name, mongooseSchema);
    }

    createMongooseSchema(schemaConfig: SESchemaConfig) {
        let mschema: any = {};

        for (let value of schemaConfig.values) {
            mschema[value.name] = {
                type: value.type,
                required: value.required
            }
        }
        return new mongoose.Schema(mschema);
    }
}