

import * as mongoose from "mongoose";

export class MongooseModelCreator {
	
	constructor(private collectionName: string, private schema: any) {
    }
    
    create(): any{
		let mongooseSchema = this.createMongooseSchema(this.schema);
		
		//remove fields that the client shall not see
		mongooseSchema.set('toJSON', {
			transform: function (doc, ret, options) {
				ret.id = ret._id;
				delete ret.user;
				delete ret._id;
				delete ret.__v;
				delete ret.viewableFor;
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

        mschema['comments'] = {
        	type: [
				{
					id: mongoose.Schema.Types.String,
					msg: mongoose.Schema.Types.String,
					creationTime: {
						type: mongoose.Schema.Types.Date,
						default: Date.now()
					},
					user: mongoose.Schema.Types.ObjectId
				}
			]
		};

        mschema['active'] = {
        	type: mongoose.Schema.Types.Boolean,
			default: true
		};

		mschema['user'] = {
			type: {
				id: mongoose.Schema.Types.String,
				permission: mongoose.Schema.Types.String
			}
		};

		mschema['viewableFor'] = {
			type: [mongoose.Schema.Types.String],
			default: []
		};

		mschema['viewableForPermission'] = {
			type: mongoose.Schema.Types.String
		};

		mschema['editableFor'] = {
			type: [mongoose.Schema.Types.String],
			default: []
		};

        mschema['archived'] = {
        	type: mongoose.Schema.Types.Boolean,
			default: false
		};

        return new mongoose.Schema(mschema);
    }
}
