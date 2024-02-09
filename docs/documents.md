## Documents data model
A Document is composed of metadata fields, along with a DocumentVersion array.

#### Permissioning
Permissioning is done on the DocumentVersion level. Each DocumentVersion contains references to the list of users that can access it.
When a new document version is created, the current admins of that document will be automatically added to the newly created DocumentVersion. When someone is removed as admin, we remove them as admin from all DocumentVersions. All other types of permissions (Reviewer, etc) are not synced across DocumentVersions, only admins.