## bl-api
the backend system for boklisten

## Before you begin

#### This project requires:

```bash
	node v8
```
<br>
## How to use
#### To run the server
> 1. extract the bl-api-X.X.X.tgz file to a directory of your choice
> 2. cd into the extracted folder
> 2. run the app by typing code below into the terminal:

```bash
node bl-api-X.X.X.js 
```

This will start a server on: **localhost:1337**
 
#### To make random test data
When developing you probably want to test it with some data. This can easily be done by generating random data. To do this simply run the application with the --generate-dev-environment flag:

```bash
node bl-api-X.X.X.js --generate-dev-environment
```

**Beware** this will delete all previous data on the given database

This command will generate test data for a various of classes like "branch", "openingHour" and "items". After the process is done you can start the server like normal, and you will now be able to get test data from the api calls.