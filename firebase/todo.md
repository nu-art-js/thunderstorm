# Continue breaking Database monolite

## To understand:
### Map and understand Firestore Data flows
* a new document
* multiple new documents
* update to a document
* update to multiple documents
* delete document

### Isolate common DB infra behaviors and challenge it
 * What are the current apis, and hooks we have, how do they integrate into the infra flow and applicative flow
 * switching to a new database (Redis), would this interface be still valid
 * switching to a new database (Mongo), would this interface be still valid
 * switching to a new database (SQL), would this interface be still valid
 * switching to a new database (Postgres), would this interface be still valid

## Actions:
### Define a concise interface for databases (Wrapper)
 * Must be compatible with current Firestore requirements
 * Must be a single interface, and not complicated mixup of hooks, configs, inheritance
 * Usage should be simple and decoupled from the db api module infra

### Implement Databases Wrapper Packages
 * Build a package (follow the package and workspace rules) per database (Redis, Postgres, Firestore)
 * Each package would expose the wrapper interface we have defined

### Testing the Database Wrappers
 * Since all the interfaces are the same, and since the expected input and output remain the same, we need a testing strategy that will be across packages.
 * We must test all the data flows possible, happy paths and failures.. of ALL sorts!
 * 