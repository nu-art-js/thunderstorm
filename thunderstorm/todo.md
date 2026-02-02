# Database feature refactoring

 - First we are not breaking current logic in thunderstorm package, we isolate, duplicate, recreate and test each feature separately in a dedicated package or library
 - Some requires cross domain handling, frontend and backend which will have a shared types (and perhaps logic)
 - Some will have a single domain (UI only features will only have UI)


## How we break a feature
 * we first agree what we separate from the monolite
 * we map the coupling base points
 * we map the used thunderstorm classes types and utils in that feature
 * we map the already decoupled libs and packages that we will be using in the new separated feature
 * we will need to decide if we are making that feature generic and hook it to a specific implementation in the feature or applicatively (for example, which database (redis/firestore) we are using or which bucket (gcp/firebase/S3))
 * we decide how we handle the coupling and dependencies
   * we might use or migrate to an already separated feature
   * we might create a stub
   * we might shallow recreate the function missing
   * we might inline use the util, and remove the dependency
   * we might decide we move two features together and separate them later
   * we might agree on another solution
 * the end goal is that this feature would be isolated and not use any @nu-art/thunderstorm-(fe/be/shared)


## Separation of concerns

* Shared package
  * Will ONLY hold content that is relevant to both frontend and backend
  * Will never know content ONLY dedicated to frontend or backend
  * Will never be dependent on any frontend or backend package
* Frontend package
  * Will ONLY hold content that is relevant to frontend
  * Will never know content ONLY dedicated to backend
  * Will never be dependent on any backend package
* Backend package
  * Will ONLY hold content that is relevant to backend
  * Will never know content ONLY dedicated to frontend
  * Will never be dependent on any frontend package


## Tests
* Once feature is separated, we will need to add tests  
  * Some tests will span only fe or be
  * we need to consider that some tests will span across the entire lib and will require an e2e testing of the feature
  * Test must be addressed properly according to the testing rule
  * Tests must cover the entire happy paths and unhappy paths
  


## What's left

### Sync Manager
 * Now that we've established the db-api library and the way it interacts, we will need a way to bring data from the backend to the frontend cache for quick access
 * current implementation is working well, we move it as is (fe/be/shared)
 * there are some integration points we will need to discuss and handle

### Backup database
 * Currently backup is coupled with thunderstorm backend and does not reflect in frontend
 * we keep it that way for now, but since going forward we will have a visual FE for it, it should have a shared/be packages
 * 
### Sync Env
 * Now that we've established the db-api library and the way it interacts, we will need a way to retrieve a backup data from one env bucket and push it to the database of our current env
 * current implementation is working well, we move it as is (fe/be/shared)
 * there are some integration points we will need to discuss and handle

### Editable item
 * already separated it in another branch, will bring it as reference

### Action Processor

### App config

### Archiving

### Routing

### UI

### MISC