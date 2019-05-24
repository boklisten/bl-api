import {Hook} from '../../../hook/hook';
import {AccessToken, Message, BlError} from '@wizardcoder/bl-model';
import {isNullOrUndefined} from 'util';
import {MessengerReminder} from '../../../messenger/reminder/messenger-reminder';
import {PermissionService} from '../../../auth/permission/permission.service';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import {messageSchema} from '../message.schema';
import {MessageHelper} from '../helper/message-helper';
import {logger} from '../../../logger/logger';

export class MessagePostHook implements Hook {
  private messengerReminder: MessengerReminder;
  private messageStorage: BlDocumentStorage<Message>;
  private permissionService: PermissionService;
  private messageHelper: MessageHelper;

  constructor(
    messengerReminder?: MessengerReminder,
    messageStorage?: BlDocumentStorage<Message>,
    messageHelper?: MessageHelper,
  ) {
    this.messengerReminder = messengerReminder
      ? messengerReminder
      : new MessengerReminder();
    this.messageStorage = messageStorage
      ? messageStorage
      : new BlDocumentStorage('messages', messageSchema);
    this.permissionService = new PermissionService();
    this.messageHelper = messageHelper
      ? messageHelper
      : new MessageHelper(this.messageStorage);
  }

  async before(
    message: Message,
    accessToken: AccessToken,
    id?: string,
  ): Promise<boolean> {
    if (typeof message.messageType === 'undefined' || !message.messageType) {
      throw new BlError('messageType is not defined').code(701);
    }

    if (
      typeof message.messageSubtype === 'undefined' ||
      !message.messageSubtype
    ) {
      throw new BlError('messageSubtype is not defined').code(701);
    }

    if (message.messageType === 'reminder') {
      if (
        !this.permissionService.isPermissionEqualOrOver(
          accessToken.permission,
          'admin',
        )
      ) {
        throw new BlError('no permission').code(904);
      }
    }

    let alreadyAdded;

    try {
      alreadyAdded = await this.messageHelper.isAdded(message);
    } catch (e) {
      throw new BlError('could not check if message was already added');
    }

    if (alreadyAdded) {
      throw new BlError(
        `message is already added: type: ${message.messageType}, subtype: ${
          message.messageSubtype
        }, seq: ${message.sequenceNumber}, customer: "${message.customerId}"`,
      ).code(701);
    }

    return true;
  }

  async after(
    messages: Message[],
    accessToken: AccessToken,
  ): Promise<Message[]> {
    if (isNullOrUndefined(messages) || messages.length <= 0) {
      throw new BlError('no messages provided');
    }

    const message = messages[0];

    switch (message.messageType) {
      case 'reminder':
        return await this.onRemind(message);
      default:
        throw new BlError(
          `MessageType "${message.messageType}" is not supported`,
        );
    }
  }

  private async onRemind(message: Message): Promise<Message[]> {
    try {
      await this.messengerReminder.remindCustomer(message);
      return [message];
    } catch (e) {
      /*
      await this.messageStorage.remove(message.id, {
        id: 'SYSTEM',
        permission: 'admin',
      });
       */
      throw e;
    }
  }
}
