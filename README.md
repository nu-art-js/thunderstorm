# Typescript & React - Frontend & Backend

This boilerplate is a unification of both frontend and backend in one repo.. 

blah blah blah...

---

# Getting Started

 * First and foremost you need [**bash** (4.4 and higher)](https://www.google.com/search?q=how+to+install+bash) if you don't have it.. please grow up and get it..
 * You would need to install [**npm** (6.4.1) and **node** (8.15.0)](https://www.google.com/search?q=how+to+install+node+and+npm)

 
### To fork this repo to your private (or public) repo: 
 * Prepare an empty repo and acquire the repo remote tracking url `(e.g. git@github.com:${username}/${my-project}.git)`
 * Clone this repo locally `git clone --recursive git@github.com:nu-art-js/typescript-boilerplate.git my-project && cd my-project`
 * Then run from within this cloned repo: `bash ./dev-tools/scripts/git/git-fork.sh --to=git@github.com:${username}/${my-project}.git --output=../my-project`
 * and you are ready to go...
 * To merge latest boilerplate changes run in your cloned repo: `bash build-and-install.sh --merge-origin`

### What is in the repo:

Right after you've cloned the repo you will see:
 * Nu-Art libs - these are the infra the project is based on.
 * app-frontend - contains all the frontend files.
 * app-backend - contains all the backend files.
 * app-shared - where all the shared types between the frontend and backend are stored.
 
**NOTE:** Unless I have made a stupid mistake.. these should always be aligned and compiling together with this repo!!
**NOTE:** You can delete the Nu-Art libs, and the project should compile just the same.


### Environments
You should pay attention to the `./.config`, `./app-frontend/.config` and `./app-backend/.config` folders, these hold your environment configuration.

**NOTE:** This repo comes with a few envs built in, you can add as many environments as you'd like just follow
the file name pattern. Keep in mind though that some of your backend configuration would contain sensitive data therefor should not
be added to your git repo!!


### First time setup
This project requires a few things to happen in order to run:

  * You would need to [create an empty Firebase project](https://console.firebase.google.com/).
  * Create a realtime Database (**NOT firestore**).
  * Take the content of `.stuff/initial-config.json` update the url for the CORS origin and import the content to the root of the database.
  * Update the ALL the config files with your function project name and urls.
  * You will need to install [firebase tools](https://firebase.google.com/docs/cli) `npm i -g firebase-tools`.
  * Run `bash build-and-install.sh --setup --set-env=dev` (* Install whatever other node packages the script asks and re-run the script)
  
### What just happened
At this point the project should be compiling properly and you should see:

 * `./app-frontend/src/main/config.ts`
 * `./app-frontend/src/main/app-shared`
 * `./app-backend/src/main/config.ts`
 * `./app-backend/src/main/app-shared`
 
*(the above all ignored by git)*

**NOTE:** There is no point in editing the `config.ts` files, you SHOULD only edit the env config files within the .config 
folder and running `bash build-and-install.sh --set-env=${env}` would override the `config.ts` with the 
content of the env config respectively.

 
# Running

If you have configured the project properly, executing the following command would launch the frontend and backend: 

`bash build-and-install.sh --launch-frontend --launch-backend`

**NOTE:** you can run each individually


# Deploying

If you have configured the project properly, executing the following command would deploy the frontend and backend to the firebase function: 

`bash build-and-install.sh  --set-env=${env} --deploy-frontend --deploy-backend`

**NOTE:** you can run each individually


# More stuff...

For now I am not sure what is missing in terms of the script.. you can run `bash build-and-install.sh --help` to see the full 
capabilities of the script!

The script was designed and tested MOSTLY on MacOS, so guys with Linux forgive me.. and please ping me with issues so I may fix them!!

If you have found a bug or think there is a feature missing, don't be a stranger.. open a ticket.. 
I promise I will take it seriously and try to assist as soon as possible...

Have a good one... :)

