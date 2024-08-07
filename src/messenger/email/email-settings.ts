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
      templateId: "d-8734d0fdf5fc4d99bf22553c3a0c724a",
    },
    passwordReset: {
      fromEmail: "ikkesvar@boklisten.no",
      subject: "Tilbakestill passordet hos Boklisten.no",
      path: "auth/reset/",
    },
    guardianSignature: {
      fromEmail: "ikkesvar@boklisten.no",
      subject: "Signer låneavtale hos Boklisten.no",
      path: "u/sign-agreement/",
    },
    deliveryInformation: {
      fromEmail: "ikkesvar@boklisten.no",
      subject: "Dine bøker er på vei",
    },
  },
};
