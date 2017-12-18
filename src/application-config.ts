
export const APP_CONFIG = {
	dev: {
		server: {
			host: 'localhost',
			port: 1337,
			path: 'api',
			version: 'v1'
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
	test: true
};