# Thunderstorm

This boilerplate is a unification of both frontend and backend in one repo.. 

---

## First things first...

 * First and foremost you need [**bash** (4.4 and higher)](https://www.google.com/search?q=how+to+install+bash) if you don't have/use it..  grow up and install it..
 * You would need to install **EXACTLY** [**npm** (6.4.1) and **node** (8.15.0)](https://www.google.com/search?q=how+to+install+node+and+npm)

### What is in the repo:
 
 Right after you've cloned the repo you will see:
  * **app-backend** - Contains all the backend files.
  * **app-frontend** - Contains all the frontend files.
  * **app-shared** - where all the shared types between the frontend and backend are stored.
  * **ts-common** - Typescript infra that should have been a part of Typescript release but isn't.
  * **testelot** - A scenario building infra for testing.
  * **thunderstorm** - The Typescript & React Frontend along side a Typescript & Express Backend framework with core components you can use.
  * **bug-report** - A bug report infra that you can attach to your web app
  * **db-api-generator** - A generic db to api middleware
  * **firebase** - A full blown api to most of Firebase tools
  * **live-docs** - A neat tool to manage application tooltips
  * **permissions** - A permissions management system for restricting users
  * **push-pub-sub** - A generic push pub sub for your web app
  * **storm** - A bunch of tools.. 
  * **user-account** - A user password or SAML auth infra
  
 **NOTE:** These should always be aligned and compiling together with this repo!!
  
# Start Using Thunderstorm: 
  To start using Thunderstorm go to the [boilerplate app](https://github.com/nu-art-js/thunderstorm-app) and follow up on the how to fork Thunderstorm section

 
### Set Environment
 Before you can run the project you need to set it up...
 
 You can setup **dev** environment using this command: `bash build-and-install.sh --install --set-env=dev` 
 
**NOTE:** Install whatever other node packages the script asks and re-run the script
 
  * Finally (if you have configured everything correctly) you can launch the "Hello World" sample from your own firebase project by executing: `bash build-and-install.sh --launch-frontend --launch-backend`


### Run your app locally  
 Once you have configured everything correctly, you can launch the "Hello World" sample from your own firebase project by executing: 
 
 `bash build-and-install.sh --launch=app-frontend --launch=app-backend`

**NOTE:** you can run each individually


### Deploy your app to firebase

 Once you have configured everything correctly, executing the following command would deploy the frontend and backend to the firebase function: 

`bash build-and-install.sh  --set-env=${env} --deploy=app-frontend --deploy=app-backend`

**NOTE:** you can deploy each individually


# More stuff...

For now I am not sure what is missing in terms of the script.. you can run `bash build-and-install.sh --help` to see the full 
capabilities of the script!

The script was designed and tested MOSTLY on MacOS, so guys with Linux forgive me.. and please ping me with issues so I may fix them!!

If you have found a bug or think there is a feature missing, don't be a stranger.. open a ticket.. 
I promise I will take it seriously and try to assist as soon as possible...

Have a good one... :)
