import {
  BlCollection,
  BlDocumentPermission,
  BlEndpoint,
  BlEndpointRestriction,
} from '../bl-collection';
import {userDetailSchema} from './user-detail.schema';
import {Schema} from 'mongoose';
import {UserDetailValidOperation} from './operations/user-detail-valid.operation';

export class UserDetailCollection implements BlCollection {
  collectionName = 'userdetails';
  mongooseSchema = userDetailSchema;
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
      operations: [
        {
          name: 'valid',
          operation: new UserDetailValidOperation(),
          restriction: {
            permissions: ['customer', 'employee', 'manager', 'admin', 'super'],
            restricted: true,
          },
        },
      ],
    },
    {
      method: 'patch',
      restriction: {
        permissions: ['customer', 'employee', 'manager', 'admin', 'super'],
      },
    },
    {
      method: 'getAll',
      validQueryParams: [
        {
          fieldName: 'email',
          type: 'string',
        },
        {
          fieldName: 'branch',
          type: 'object-id',
        },
        {
          fieldName: 'name',
          type: 'string',
        },
        {
          fieldName: 'phone',
          type: 'string',
        },
        {
          fieldName: 'address',
          type: 'string',
        },
        {
          fieldName: 'postCity',
          type: 'string',
        },
        {
          fieldName: 'postCode',
          type: 'string',
        },
        {
          fieldName: '_id',
          type: 'object-id',
        },
      ],
      restriction: {
        permissions: ['employee', 'manager', 'admin', 'super'],
      },
    },
  ];
}
