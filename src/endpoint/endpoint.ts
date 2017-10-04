

import {CollectionDocument} from "../db/document/collection-document";

export interface Endpoint {
    collectionName: string;

    //gets the whole collection
    get(): Promise<CollectionDocument[]>

    post(): Promise<CollectionDocument>

    //gets a document based on the id
    getById(id: string): Promise<CollectionDocument>

    put(id: string): Promise<CollectionDocument>

    patch(id: string): Promise<CollectionDocument>

    deleteById(id: string): Promise<CollectionDocument>
}
