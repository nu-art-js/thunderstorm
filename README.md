# Typescript & React - Frontend & Backend

This boilerplate is a unification of both frontend and backend in one repo.. 

blah blah blah...

---

## First things first...

 * First and foremost you need [**bash** (4.4 and higher)](https://www.google.com/search?q=how+to+install+bash) if you don't have/use it..  grow up and install it..
 * You would need to install **EXACTLY** [**npm** (6.4.1) and **node** (8.15.0)](https://www.google.com/search?q=how+to+install+node+and+npm)

### What is in the repo:
 
 Right after you've cloned the repo you will see:
  * Nu-Art libs - these are the infra the project is based on.
  * app-frontend - contains all the frontend files.
  * app-backend - contains all the backend files.
  * app-shared - where all the shared types between the frontend and backend are stored.
  
 **NOTE:** Unless I have made a stupid mistake.. these should always be aligned and compiling together with this repo!!
 
 **NOTE:** You can delete the Nu-Art libs, and the project should compile just the same.
 
# Fork this repo: 
 * Prepare an empty repo and acquire the repo remote tracking url `(e.g. git@github.com:${username}/${my-project}.git)`
 * Clone this repo locally `git clone --recursive git@github.com:nu-art-js/thunderstorm-boilerplate.git && cd thunderstorm-boilerplate`
 * Then run from within this cloned repo: `bash ./dev-tools/scripts/git/git-fork.sh --to=git@github.com:${username}/${my-project}.git --output=../${my-project}`
 
Now you have forked the boilerplate...

**NOTE:** To get latest boilerplate changes run in your cloned repo folder `(e.g. my-project)`: `bash build-and-install.sh --merge-origin`

**ATTENTION:** You should pay attention to the `./.config` folder it contains all the project configurations it is version controlled and MUST not contain sensitive data such as passwords or private keys. 
You should also note the `./app-frontend/.config` and `./app-backend/.config` files, these hold the projects environment configuration, and are NOT version controlled!

### Prepare your forked repo: 
After forking this repo.. there are a steps you MUST undergo in order to run it:

  * You would need to [create an empty Firebase project](https://console.firebase.google.com/).
  * Create a realtime Database (**NOT firestore**).
  * Edit the content of `.stuff/initial-config.json` and replace **ALL** of the boilerplate urls with your firebase project respectively.
  * Paste the edited content of the `.stuff/initial-config.json` file to the root of the database.
  * Update the ALL the config files with your function project name and urls.
  * You will need to install [firebase tools](https://firebase.google.com/docs/cli) `npm i -g firebase-tools`.
  * You will then have to **Login** using the firebase tools cli.
  
### Set Environment
 Before you can run the project you need to set the environment....
 
 You can setup **dev** environment using this command: `bash build-and-install.sh --setup --set-env=dev` 
 
**NOTE:** Install whatever other node packages the script asks and re-run the script
 
  * Finally (if you have configured everything correctly) you can launch the "Hello World" sample from your own firebase project by executing: `bash build-and-install.sh --launch-frontend --launch-backend`


### Run your app locally  
 Once you have configured everything correctly, you can launch the "Hello World" sample from your own firebase project by executing: 
 
 `bash build-and-install.sh --launch-frontend --launch-backend`

**NOTE:** you can run each individually


### Deploy your app to firebase

 Once you have configured everything correctly, executing the following command would deploy the frontend and backend to the firebase function: 

`bash build-and-install.sh  --set-env=${env} --deploy-frontend --deploy-backend`

**NOTE:** you can deploy each individually


# More stuff...

For now I am not sure what is missing in terms of the script.. you can run `bash build-and-install.sh --help` to see the full 
capabilities of the script!

The script was designed and tested MOSTLY on MacOS, so guys with Linux forgive me.. and please ping me with issues so I may fix them!!

If you have found a bug or think there is a feature missing, don't be a stranger.. open a ticket.. 
I promise I will take it seriously and try to assist as soon as possible...

Have a good one... :)
