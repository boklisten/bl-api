

import {CollectionDocument} from "../db/document/collection-document";
import {IDocument} from "../db/model/document.interface";

export interface Endpoint {
    collectionName: string;

    handleRequest(req: Request, data: any): Promise<any>;

    //gets the whole collection filtered by filter
    get(filter: any): Promise<IDocument[]>

    post(document: IDocument): Promise<IDocument>

    //gets a document based on the id
    getById(id: string): Promise<IDocument>

    put(id: string): Promise<IDocument>

    patch(id: string): Promise<IDocument>

    deleteById(id: string): Promise<IDocument>
}
