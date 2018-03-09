

import * as mongoose from "mongoose";

export class MongooseModelCreator {
	
	constructor(private collectionName: string, private schema: any) {
    }
    
    create(): any{
		let mongooseSchema = this.createMongooseSchema(this.schema);
		
		//to remove the _id field and __v
		mongooseSchema.set('toJSON', {
			transform: function (doc, ret, options) {
				ret.id = ret._id;
				delete ret._id;
				delete ret.__v;
			}
		});
		
		return this.createMongooseModel(mongooseSchema);
		
	}

    createMongooseModel(mongooseSchema: mongoose.Schema): any {
    	try {
    		if (mongoose.model(this.collectionName)) return mongoose.model(this.collectionName);
		} catch (e) {
    		if (e.name === 'MissingSchemaError') {
    			return mongoose.model(this.collectionName, mongooseSchema);
			}
		}
    }

    createMongooseSchema(mschema: any): mongoose.Schema {

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
