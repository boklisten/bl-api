


import {IDocument} from "../document.interface";

export interface IItem extends IDocument{
    title: string,
    type: string
    info: any,
    desc: string,
    price: number,
    sell: boolean,
    sellPrice: number,
    rent: boolean,
    buy: number,
    active: boolean,
    creationTime: string,
    lastUpdated: string
}
