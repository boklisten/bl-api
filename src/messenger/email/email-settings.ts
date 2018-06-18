

export const EMAIL_SETTINGS = {
	types: {
		receipt: {
			fromEmail: 'noreply@boklisten.co',
			subject: 'Receipt from Boklisten.co'
		},
		emailConfirmation: {
			fromEmail: 'noreply@boklisten.co',
			subject: 'Confirm your email at Boklisten.co',
			path: 'auth/email/confirm/'
		},
		passwordReset: {
			fromEmail: 'noreply@boklisten.co',
			subject: 'Reset your password at Boklisten.co',
			path: 'auth/reset/'
		}
	}
};