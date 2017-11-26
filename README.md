## bl-api
the backend system for boklisten

## how to use
#### To run the server
> 1. extract the bl-api-X.X.X.tgz file to a directory of your choice
> 2. cd into the extracted folder
> 2. run the app by typing code below into the terminal:
```bash
node index.js
```
#### To make random test data
When developing you probably want to test it with some data. This can easily be done by generating random data. To do this simply run this command inside the extracted bl-api folder:
```bash
node index.js generate-dev-environemt
```
<br>

### Configuration of the server (only if you absolutely need to)
To change what port and host the server should run on, simply edit the **application-config.ts** file in the *bl-api* folder.

To change port simply change the port field inside the *application-config.ts* file
```typescript
dev: {
	...
	server: {
		host: 'localhost',
		port: 1337, // <- change this line to change port
		path: 'api', 
		version: 'v1'
	},
	...
}
``` 
>**important to now**
if you change port or/and host name you will also have to change it in the bl-connect library if you use that in your application!


### Configuration of MongoDb

To change the mongoDb settings, edit the *application-config.ts* file
```typescript
dev: {
	...
	mongoDb: {
		basePath: 'mongodb://',
		host: 'localhost',
		port: 27017,
		dbName: 'bl_api_dev' // <- change this line to change name of mongo db database
	}
	...
}
```