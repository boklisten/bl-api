import {SESchema} from "../config/schema/se.schema";
import {SEDocument} from "../db/model/se.document";
import {SEDbQuery} from "../query/se.db-query";
import {BlapiErrorResponse} from 'bl-model';



export class EndpointMongodb {
	private schema: SESchema;

	constructor(schema: SESchema) {
		this.schema = schema;
	}

	public get(dbQuery: SEDbQuery): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel
				.find(dbQuery.getFilter(), dbQuery.getOgFilter())
				.limit(dbQuery.getLimitFilter())
				.skip(dbQuery.getSkipFilter())
				.sort(dbQuery.getSortFilter())
				.exec((error, docs) => {

					if (error) {
						reject(new BlapiErrorResponse(403, 'client error', error));
						return
					}

					let sdocs: SEDocument[] = [];

					for (let doc of docs) {
						sdocs.push(new SEDocument(this.schema.title, doc));
					}
					

					if (sdocs.length == 0) {
						reject(new BlapiErrorResponse(404));
						return
					}

					resolve(sdocs);
				})
		});
	}

	public exists(dbQuery: SEDbQuery): Promise<boolean> {
		return new Promise((resolve, reject) => {
		    this.schema.mongooseModel
			    .find(dbQuery.getFilter(), dbQuery.getOgFilter())
			    .exec((error, docs) => {
		    	    if (error) {
		    	    	console.log('error', error);
		    	    	reject(error);
			        }

			        if (docs.length > 0) resolve(true);
		    	    resolve(false);

			    })
		});
	}

	public post(document: SEDocument): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			document.data.creationTime = new Date().toISOString();
			let newDocument = new this.schema.mongooseModel(document.data);

			newDocument.save((error, doc) => {
				if (error) {
					reject(this.handleError(error));
					return
				}

				resolve([new SEDocument(this.schema.title, doc)]);
			});
		});
	}

	public getById(id: string): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel.findOne({_id: id}, (error, doc) => {
				if (error) {
					reject(this.handleError(error));
					return;
				}

				
				if (doc === null) {
					reject(new BlapiErrorResponse(404));
					return;
				}

				resolve([new SEDocument(this.schema.title, doc)]);
			});
		});
	}

	public put(): Promise<SEDocument> {
		return Promise.reject('')
	}

	
	
	
	
	public patch(id: string, doc: SEDocument): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel.findById(id, (error, document) => {
				if (error) {
					
					reject(new BlapiErrorResponse(403, 'client error', error));
					return
				}

				if (document === null) {
					reject(new BlapiErrorResponse(404));
					return
				}

				document.set(doc.data);
				document.set({lastUpdated: new Date().toISOString()});

				document.save((error, updatedDocument) => {
					if (error) {
						reject(this.handleError(error));
						return;
					}

					resolve([new SEDocument(this.schema.title, updatedDocument)]);
				});
			})
		});
	}

	public deleteById(id: string): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.schema.mongooseModel.findByIdAndRemove(id, (error, doc) => {
				if (error) {
					reject(new BlapiErrorResponse(500, 'server error', error));
					return;
				}

				if (doc === null) {
					reject(new BlapiErrorResponse(404));
					return;
				}
				resolve([new SEDocument(this.schema.title, doc)]);
			});
		});
	}

	public getAndValidateByUserBlid(objId: string, blid: string): Promise<SEDocument[]> {
		return new Promise((resolve, reject) => {
			this.getById(objId).then(
				(docs: SEDocument[]) => {
					let data = docs[0].data;

					if (data.user) {
						if (data.user.blid) {
							if (data.user.blid === blid) {
								resolve(docs);
								return;
							}
						}
					}

					reject(new BlapiErrorResponse(403));
				},
				(error: BlapiErrorResponse) => {
					reject(error);
				})
		});
	}

	
	
	private handleError(error: any): BlapiErrorResponse {
		if (error.name === 'CastError') {
			return new BlapiErrorResponse(404);
		} else if (error.name == 'ValidationError') {
			return new BlapiErrorResponse(400);
		} else {
			return new BlapiErrorResponse(500);
		}
	}
}
