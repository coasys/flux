subject_class("Task", pvwrkd).
constructor(pvwrkd, '[{action: "addLink", source: "this", predicate: "rdf://name", target: "literal://json:%7B%22author%22%3A%22did%3Akey%3AzQ3shWhAZydqDE1s5Ka3gJTDpjdYg1Ajw6PFywSP7QJD8x8ki%22%2C%22timestamp%22%3A%222023-07-06T16%3A25%3A41.597Z%22%2C%22data%22%3A%22New%20task%22%2C%22proof%22%3A%7B%22key%22%3A%22%23zQ3shWhAZydqDE1s5Ka3gJTDpjdYg1Ajw6PFywSP7QJD8x8ki%22%2C%22signature%22%3A%2281a4f1b56d73e3069cd0a35addc31bd418c2d15a336110de3c1c8639bcc01c857a888846e5cd0714f6a0457bcef609a7cd23ecb578dcf00a25f848951013de3d%22%2C%22valid%22%3Atrue%2C%22invalid%22%3Afalse%7D%7D"},{action: "addLink", source: "this", predicate: "rdf://status", target: "task://todo"}]').
instance(pvwrkd, Base) :- triple(Base, "rdf://name", _),triple(Base, "rdf://status", _).

property(pvwrkd, "name").
property_resolve(pvwrkd, "name").
property_resolve_language(pvwrkd, "name", "literal").
property_getter(pvwrkd, Base, "name", Value) :- triple(Base, "rdf://name", Value).
property_setter(pvwrkd, "name", '[{action: "setSingleTarget", source: "this", predicate: "rdf://name", target: "value"}]').

property(pvwrkd, "status").
property_getter(pvwrkd, Base, "status", Value) :- triple(Base, "rdf://status", Value).
property_setter(pvwrkd, "status", '[{action: "setSingleTarget", source: "this", predicate: "rdf://status", target: "value"}]').
property_named_option(pvwrkd, "status", "task://todo", "todo").
property_named_option(pvwrkd, "status", "task://doing", "doing").
property_named_option(pvwrkd, "status", "task://done", "done").

collection(pvwrkd, "assignees").
collection_getter(pvwrkd, Base, "assignees", List) :- findall(C, triple(Base, "rdf://has_assignee", C), List).
collection_adder(pvwrkd, "assigneess", '[{action: "addLink", source: "this", predicate: "rdf://has_assignee", target: "value"}]').
collection_remover(pvwrkd, "assigneess", '[{action: "removeLink", source: "this", predicate: "rdf://has_assignee", target: "value"}]').
collection_setter(pvwrkd, "assigneess", '[{action: "collectionSetter", source: "this", predicate: "rdf://has_assignee", target: "value"}]').