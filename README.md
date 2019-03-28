# Typescript & React - Frontend & Backend

This boilerplate is a unification of both frontend and backend in one repo.. 

blah blah blah...

---

## A word about boilerplate...

I think this entire concept suck... it is problematic! there are literally hundreds of examples out there
each looks completely different than the other and just getting started can be the worst pain in the butt not
to mention staying up to date with latest versions of infra components!!

SO... I debated this question for three days and I think that the best way to keep up to date with a boilerplate 
is to actually to fork a repo and get the latest updates whenever you can/want... but all these online gits services 
(github, bitbucket, ...) do not allow you to fork a public repo privately and then companies and private people 
need to Google how to do that and how to merge the latest changes in order to stay up to date.

This boilerplate saves you that headache.. 

**NOTE:**
You don't need to stick with the architecture I choose.. you can do whatever the hell you want... but it is always 
easier to change a working example then to bash your head when things never worked before.

# Getting Started

First and foremost you need **bash** if you don't have it.. please grow up and get it.. 

### If you just want to give this repo a go:
```bash
git clone --recursive git@github.com:nu-art-js/typescript-boilerplate.git my-project
cd my-project
bash build-and-install.sh --set-env=dev --setup --launch-frontend --launch-backend
```


### If you want to work like a pro (use libraries sources):

```bash
git clone --recursive git@github.com:nu-art-js/typescript-boilerplate.git my-project
cd my-project
bash build-and-install.sh --nu-art --set-env=dev --setup --launch-frontend --launch-backend
```

(unless I have made a stupid mistake.. these should always be aligned and compiling together!!)
 

### To fork this repo to your private (or public) repo: 
 * Prepare an empty repo and acquire the repo remote tracking url `(e.g. git@github.com:${username}/${my-project}.git)`
 * clone this repo locally
 * Then run from within this cloned repo: `bash ./dev-tools/git/git-fork.sh --to=git@github.com:${username}/${my-project}.git --output=../my-project`
 * and you are ready to go...


### To merge latest changes from this repo onto your forked repo run: (in your cloned repo)
```bash
bash build-and-install.sh --merge-origin
```
# Environment

Both frontend and backend needs to have the same environment to work.. for various reasons.

Right after you've cloned the repo you will see:
 * In the frontend you can see two files `config-dev.ts` *(not ignored)* and `config-prod.ts` *(not ignored)*
 * In the backend you can see only `.example-config.json` *(not ignored)* file
 
After you would run `bash build-and-install.sh --set-env=dev` for the first time you will see:
 * In the frontend you can see same two files as before, and a new `config.ts` *(ignored)*
 * In the backend the `.example-config.json` would be deleted, and you'd see these new files:
  `.config.json`, `.config-dev.json`, `.config-prod.json` and `.runtimeconfig.json` (all ignored)

There is no point in editing the `.config.json` or the `config.ts`, you SHOULD only edit the dev and prod files and 
running `bash build-and-install.sh --set-env=dev` would override the `.config.json` or the `config.ts` with the 
content of the dev config respectively.

**NOTE:** Because this boilerplate uses firebase functions, and firebase functions config is stupidly limited and annoying to set.. 
the solution I came up with to avoid the hustle is that the backend config json would be encoded into base64 string, set as one
entry to firebase, and would be decoded and use at runtime, this is what the `.runtimeconfig.json` file is for.

# Setting up

 * In order to start using the repo you would need to run `npm install` on each of the repos.. whether you use the library sources or not:
`bash build-and-install.sh --setup` will do the trick.
 * You would need to setup which environment to runs... to use dev environment run: `bash build-and-install.sh --set-env=dev`

**NOTE:** this repo comes with *dev* env built in, you can add as many as you'd like, though keep in mind that some of your backend configuration would 
contain sensitive data therefor should not be added to your git repo!!

**NOTE:** You can replace *dev* with anything you'd like... just need to make sure the config files are there to back it up
 
 
# Running

To run the frontend and backend respectively run:
`bash build-and-install.sh --launch-frontend --launch-backend`

**NOTE:** you can run each individually

# Deploying

While personally I would prefer to pay for a dedicated server and manage my own server resources and runtime, 
for the sake of simplicity, current implementation uses firebase project for both frontend and backend.

Before deploying there is always this pesky thing of configuring your backend environment with all the private keys... 
(That is where the Environment section above is coming in)

 * We might want to deploy our local working config to the firebase function: `bash build-and-install.sh --set-config-backend`
   this command will **set the current** Environment config file to your firebase function.
 * Next we would want to deploy our code: `bash build-and-install.sh --deploy-frontend --deploy-backend`
  **NOTE:** you can run each individually



