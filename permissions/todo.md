# Permissions Management

## Review
* we need to review current implementation and discuss the good the bad and the ugly
* we need to review the limitation of this approach and see how we can utilize decorators and bind dedicated permissions types to a function call rather then an api
* we need to think about how we do this across projects and apps, like a centralized identity provider
* we need to think big and not limit ourselves to current implementation
* we need to keep the relation to the user account id
* we need to make sure that when a new user is introduced, we create a dedicated permissions user and a dedicated permissions group
  * both dedicated permissions user and group will have the account id
  * permissions user serves as a user groups holder
  * permissions group serves as a user dedicated overrides and permissions.. (no one else can see or assign it to another user)
  * permissions groups needs to have a type
* permissions may and will be used to gate permissions granting and changing
* we need to think about assertions, and how permissions will assert themselves
* we need to consider how queries can be manipulated using permissions
* we need to consider how we manage "user groups" (multiple accounts associated with a context, team, companies, organizations, 3rd party clients users, etc..)

### Tests

* needless to say we have to test the mother of this package! 

thoughts:

what if, we define a decorator that takes a object, that defines permissions scopes.. we can brand it that it must be or a specific type and only allow that, for example:

Pathway ={ key:"pathway",
values:["read", "write", "delete", "admin"]
}

I would like to generate a const from it, but that is for later, let's say I must create exactly the same const..

we then have a decorator that must take a type P that is of this kind of brand, must provide the key and one of the values.

in runtime, in the decorators initialization (which can be scattered over the code), we collect all, md5 and unique on them all, assert uniqueness by merging the keys and options.. and on server load create the permissions domains and access levels..

removed ones should be marked as such and cleaned up at a later time, new ones will be added and not used until assigned, basically blocking operations.

I am still debating whether to say that write means you also have read, or keep these discreate, it does mean that due to human errors we can have a situation where read and write of the same entity have differenct keys

it also means we can create a wider brand, where
type Permissions = {"pathway": ["options"], "other" :["other", "options"]}

but the question stands.. is that later means you also grant the former?


---
another question is, given that I have an infra, for example db interface, and I want to gate that by permissions.. I will need to create an intermediate entity that holds these permissions and swap the functions instances without the class knowing. 
is also means that if I want to restrict access across orgs some apis will need multiple decoratos and multiple layers of intermediate entity, aimed at a different security aspect handling..

---
another thing we didn't discuss and that is sort of the same like the organization issue, is that if a user create an entity, he is technically the owner of that entity.. that also means that given a condition, an org/team of that user gets permissions to view that entity, not necessarily edit it 
I am saying it is similar because its an entity based query, can "user B" see a db entity that "user A" create if they don't share the same team?  
if we find a common pattern that answer both of these cases I think we can solve this.. 

for reference, this is how we have solved it so far, but the granularity is tough, what do you think we can improve here?

---

I think that we are now ready to implement the decorator.. let's give it a try:
we need to Brand a type as a permissions type, and assert that brand like in the decorator
we will have to strict the params passing to the decorator to match the permission on that brand
each decorator will register itself onto a global place that once the app is fully loaded to the memory will hold all the permission used in the system
on application launch (I will add such a hook) we will register all the new permissions their respectful modules

