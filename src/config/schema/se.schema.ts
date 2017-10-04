
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

            console.log('the index ', value.name, value.index);
            if (!value.index) {
                value.index = false;
            }
            mschema[value.name] = {
                type: value.type,
                required: value.required,
                index: value.index,
                text: value.text
            }
        }
        console.log('schema',  mschema);
        let s = new mongoose.Schema(mschema);
        //s.index({title: 1});
        return s;
    }
}