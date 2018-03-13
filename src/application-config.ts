
export const APP_CONFIG = {
	server: {
		basePath: 'http://localhost:1337/api/v1/'
	},
	dev: {
		server: {
			host: 'https://localhost',
			port: 1337,
			path: 'api',
			version: 'v1'
		},
		client: {
			base: 'https://localhost:4200/#/'
		},
		mongoDb: {
			basePath: 'mongodb://',
			host: 'localhost',
			port: 27017,
			dbName: 'bl_dev_environment'
		},
		redis: {
			basePath: '',
			host: '',
			port: 0,
			dbName: ''
		}
	},
	prod: {
		server: {
			host: '',
			port: 0,
			path: '',
			version: ''
		},
		mongoDb: {
			basePath: '',
			host: '',
			port: 0,
			dbName: ''
		},
		redis: {
			basePath: '',
			host: '',
			port: 0,
			dbName: ''
		}
	},
	test: true,
	login: {
		google: {
			name: 'google'
		},
		facebook: {
			name: 'facebook'
		},
		local: {
			name: 'local'
		}
	},
	token: {
		refresh: {
			iss: 'boklisten.co',
			aud: 'boklisten.co',
			expiresIn: "100 years"
		},
		access: {
			iss: 'boklisten.co',
			aud: 'boklisten.co',
			expiresIn: "100 years"
		}
	},
	date: {
		cancelDays: 14
	}
};