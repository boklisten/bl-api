import {BlCollection, BlDocumentPermission, BlEndpoint} from '../bl-collection';
import {customerItemSchema} from './customer-item.schema';
import {Schema} from 'mongoose';
import {CustomerItemPostHook} from './hooks/customer-item-post.hook';
import {userDetailSchema} from '../../collections/user-detail/user-detail.schema';
import {itemSchema} from '../../collections/item/item.schema';

export class CustomerItemCollection implements BlCollection {
  collectionName = 'customeritems';
  mongooseSchema = customerItemSchema;
  documentPermission: BlDocumentPermission = {
    viewableForPermission: 'employee',
  };
  endpoints: BlEndpoint[] = [
    {
      method: 'getId',
      restriction: {
        permissions: ['customer', 'employee', 'manager', 'admin', 'super'],
        restricted: true,
      },
    },
    {
      method: 'patch',
      restriction: {
        permissions: ['customer', 'employee', 'manager', 'admin', 'super'],
        restricted: true,
      },
    },
    {
      method: 'post',
      hook: new CustomerItemPostHook(),
      restriction: {
        permissions: ['employee', 'manager', 'admin', 'super'],
      },
    },
    {
      method: 'getAll',
      restriction: {
        permissions: ['admin', 'super'],
      },
      nestedDocuments: [
        {
          field: 'customer',
          collection: 'userdetails',
          mongooseSchema: userDetailSchema,
        },
        {
          field: 'item',
          collection: 'items',
          mongooseSchema: itemSchema,
        },
      ],
      validQueryParams: [
        {
          fieldName: 'creationTime',
          type: 'date',
        },
        {
          fieldName: 'deadline',
          type: 'date',
        },
        {
          fieldName: 'item',
          type: 'string',
        },
        {
          fieldName: 'customer',
          type: 'string',
        },
        {
          fieldName: 'handout',
          type: 'boolean',
        },
        {
          fieldName: 'handoutInfo.handoutEmployee',
          type: 'string',
        },
        {
          fieldName: 'handoutInfo.handoutById',
          type: 'string',
        },
        {
          fieldName: 'returned',
          type: 'boolean',
        },
        {
          fieldName: 'match',
          type: 'boolean',
        },
        {
          fieldName: 'type',
          type: 'string',
        },
        {
          fieldName: 'buyout',
          type: 'boolean',
        },
        {
          fieldName: 'returnInfo.returnEmployee',
          type: 'string',
        },
        {
          fieldName: 'customer',
          type: 'expand',
        },
        {
          fieldName: 'item',
          type: 'expand',
        },
      ],
    },
  ];
}
