import {Operation} from '../../../operation/operation';
import {BlApiRequest} from '../../../request/bl-api-request';
import {
  Message,
  BlError,
  BlapiResponse,
  SendgridEvent,
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import {messageSchema} from '../message.schema';
import {Request, Response, NextFunction} from 'express';
import {logger} from '../../../logger/logger';

export class SendgridEventOperation implements Operation {
  private _messageStorage: BlDocumentStorage<Message>;

  constructor(messageStorage?: BlDocumentStorage<Message>) {
    this._messageStorage = messageStorage
      ? messageStorage
      : new BlDocumentStorage<Message>('messages', messageSchema);
  }

  public async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction,
  ): Promise<BlapiResponse> {
    if (!blApiRequest.data || Object.keys(blApiRequest.data).length === 0) {
      throw new BlError('blApiRequest.data is empty').code(701);
    }

    if (!Array.isArray(blApiRequest.data)) {
      throw new BlError('blApiRequest.data is not an array').code(701);
    }

    for (let sendgridEvent of blApiRequest.data) {
      await this.parseSendgridEvent(sendgridEvent as SendgridEvent);
    }

    return {documentName: 'success', data: []};
  }

  private async parseSendgridEvent(sendgridEvent: SendgridEvent) {
    let blMessageId = sendgridEvent['unique_args']
      ? sendgridEvent['unique_args']['message_id']
      : null;

    let messageType = sendgridEvent['unique_args']
      ? sendgridEvent['unique_args']['type']
      : null;

    if (!blMessageId) {
      return true; // default is that the message dont have a blMessageId
    }

    if (messageType !== 'reminder') {
      // as of now, we only whant to collect the reminder emails
      return true;
    }

    try {
      let message = await this._messageStorage.get(blMessageId);
      await this.updateMessageWithSendgridEvent(message, sendgridEvent);
    } catch (e) {
      logger.warn(`could not update sendgrid event ${e}`);
      // if we dont find the message, there is no worries in not handling it
      // this is just for logging anyway, and we can handle some losses
      return true;
    }
  }

  private async updateMessageWithSendgridEvent(
    message: Message,
    sendgridEvent: SendgridEvent,
  ): Promise<boolean> {
    let newSendgridEvents =
      message.events && message.events.length > 0 ? message.events : [];

    newSendgridEvents.push(sendgridEvent);

    logger.info(`${JSON.stringify(newSendgridEvents)}`);

    await this._messageStorage.update(
      message.id,
      {events: newSendgridEvents},
      {id: 'SYSTEM', permission: 'admin'},
    );

    return true;
  }
}
