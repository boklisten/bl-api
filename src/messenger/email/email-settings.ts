export const EMAIL_SETTINGS = {
  types: {
    receipt: {
      fromEmail: "ikkesvar@boklisten.no",
      subject: "Kvittering fra Boklisten.no",
    },
    emailConfirmation: {
      fromEmail: "ikkesvar@boklisten.no",
      subject: "Bekreft e-posten din hos Boklisten.no",
      path: "auth/email/confirm/",
    },
    passwordReset: {
      fromEmail: "ikkesvar@boklisten.no",
      subject: "Tilbakestill passordet hos Boklisten.no",
      path: "auth/reset/",
    },
    deliveryInformation: {
      fromEmail: "ikkesvar@boklisten.no",
      subject: "Dine bøker er på vei",
    },
  },
};
