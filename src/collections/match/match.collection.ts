import {BlCollection, BlEndpoint} from '../bl-collection';
import {matchSchema} from './match.schema';
import {Schema} from 'mongoose';

export class MatchCollection implements BlCollection {
  public collectionName = 'matches';
  public mongooseSchema = matchSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: 'post',
      restriction: {
        permissions: ['customer', 'admin', 'super'],
      },
    },
  ];
}
