import {BlCollection, BlEndpoint} from '../bl-collection';
import {invoiceSchema} from './invoice.schema';
import {Schema} from 'mongoose';

export class InvoiceCollection implements BlCollection {
  collectionName = 'invoices';
  mongooseSchema = invoiceSchema;
  endpoints: BlEndpoint[] = [
    {
      method: 'getId',
      restriction: {
        permissions: ['admin', 'super'],
      },
    },
    {
      method: 'getAll',
      restriction: {
        permissions: ['admin', 'super'],
      },
    },
    {
      method: 'post',
      restriction: {
        permissions: ['admin', 'super'],
      },
    },
    {
      method: 'patch',
      restriction: {
        permissions: ['admin', 'super'],
      },
    },
  ];
}
