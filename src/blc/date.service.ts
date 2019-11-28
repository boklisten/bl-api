import moment = require('moment-timezone');

/*
 * DateService is a wrapper around momentjs to have a
 * single place for localization of time zones
 */
export class DateService {
  constructor() {
    //moment.tz.setDefault('Europe/Oslo');
  }

  public utcToLocalTimeString(
    utcDate: Date | string,
    location: 'Europe/Oslo' | string,
  ): string {
    return moment(utcDate)
      .tz(location)
      .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  }

  public toPrintFormat(date: Date | string): string {
    return moment(date).format('DD.MM.YY');
  }

  public toEndOfDay(date: Date | string): Date {
    return moment(date)
      .endOf('day')
      .toDate();
  }
}

export const dateService = new DateService();
