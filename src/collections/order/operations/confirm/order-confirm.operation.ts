import {NextFunction, Request, Response} from 'express';
import {Operation} from '../../../../operation/operation';
import {BlApiRequest} from '../../../../request/bl-api-request';

export class OrderConfirmOperation implements Operation {
  public async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction,
  ): Promise<boolean> {
    throw 'not implemented';
  }
}
