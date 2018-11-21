import { Hook } from '../../../hook/hook';
import { AccessToken, Message, BlError } from "@wizardcoder/bl-model";
import { isNullOrUndefined } from 'util';
import { MessengerReminder } from '../../../messenger/reminder/messenger-reminder';
import { PermissionService } from '../../../auth/permission/permission.service';

export class MessagePostHook implements Hook {
  private messengerReminder: MessengerReminder;
  private permissionService: PermissionService;

  constructor(messengerReminder?: MessengerReminder) {
    this.messengerReminder = (messengerReminder) ? messengerReminder : new MessengerReminder();
    this.permissionService = new PermissionService();
  }

  async before(message: Message, accessToken: AccessToken, id?: string): Promise<boolean> {
    if (typeof message.messageType === 'undefined' || !message.messageType) {
      throw new BlError('messageType is not defined').code(701);
    }

    if (message.messageType === 'reminder') {
      if (!this.permissionService.isPermissionEqualOrOver(accessToken.permission, 'admin')) {
        throw new BlError('no permission').code(904);
      }
    }

    return true;
  }

  async after(messages: Message[], accessToken: AccessToken): Promise<Message[]> {
    if (isNullOrUndefined(messages) || messages.length <= 0) {
      throw new BlError('no messages provided');
    }

    const message = messages[0];

    switch(message.messageType) {
      case 'reminder':
        return await this.onRemind(message);
      default:
        throw new BlError(`MessageType "${message.messageType}" is not supported`);
    }
  }

  private async onRemind(message: Message): Promise<Message[]> {
    try {
      await this.messengerReminder.remindCustomer(message);
      return [message];
    } catch (e) {
      throw e;
    }
  }
  

}
