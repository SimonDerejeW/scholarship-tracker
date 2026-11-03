# One invite-only circle per deployment

Each deployment serves exactly one circle of Members sharing one Catalog; there are no groups or multi-tenancy inside the app. Joining is invite-only, controlled by the Admin, because an open sign-up would let strangers write to a shared, wiki-editable Catalog. Supporting several circles later would mean scoping every Catalog query and permission by group, a deliberate no for a handful of friends.
