
import {SESchemaConfig} from "./se.schema.config";
import * as mongoose from 'mongoose';

export class SESchema {
    title: string;
    mongooseSchema: mongoose.Schema;
    mongooseModel: mongoose.Model<mongoose.Document>;
    schema: any;

    constructor(title: string, schema: any) {
		this.title = title;
		this.schema = schema;
		this.mongooseSchema = this.createMongooseSchema(this.schema);
		this.mongooseModel = this.createMongooseModel(this.mongooseSchema);

    }

    validateSchema(schemaConfig: SESchemaConfig): boolean {
       return true;
    }

    createMongooseModel(mongooseSchema: mongoose.Schema) {
    	try {
    		if (mongoose.model(this.title)) return mongoose.model(this.title);
		} catch (e) {
    		if (e.name === 'MissingSchemaError') {
    			return mongoose.model(this.title, mongooseSchema);
			}
		}
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

    getValidParamsForType(type: "String" | "Number" | "Date"): string[] {
    	let validParamsForType: string[] = [];
    	for (let value of this.schema) {
    		console.log(value);
    		if (value.type.schemaName === type) {
    			validParamsForType.push(value[0]);
		    }
	    }
	    console.log('valid values', validParamsForType);

	    return [];
    }
}