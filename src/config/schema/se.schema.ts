
import {SESchemaConfig} from "./se.schema.config";
import * as mongoose from 'mongoose';

export class SESchema {
    title: string;
    mongooseSchema: mongoose.Schema;
    mongooseModel: mongoose.Model<mongoose.Document>;
    schemaConfig: SESchemaConfig;
    schema: any;

    constructor(schemaConfig: SESchemaConfig, schema: any) {
        this.schemaConfig = schemaConfig;
        this.schema = schema;
        this.mongooseSchema = this.createMongooseSchema(this.schema);
        this.mongooseModel = this.createMongooseModel(this.mongooseSchema);
        this.title = schemaConfig.name;
    }

    validateSchema(schemaConfig: SESchemaConfig): boolean {
       return true;
    }

    createMongooseModel(mongooseSchema: mongoose.Schema) {
        return mongoose.model<mongoose.Document>(this.schemaConfig.name, mongooseSchema);
    }

    createMongooseSchema(mschema: any) {

        mschema['lastUpdated'] = {
        	type: mongoose.Schema.Types.Date,
			default: Date.now()
		};

        mschema['creationTime'] = {
        	type: mongoose.Schema.Types.Date,
			default: Date.now()
		};

        mschema['active'] = {
        	type: mongoose.Schema.Types.Boolean,
			default: true
		};

        return new mongoose.Schema(mschema);
    }
}