# Role Permissions Quick Reference

## 🔐 Three User Roles

### 1. **Admin** (System-Wide View-All)
```
✓ View all organizations
✓ View all projects
✓ View all tasks
✓ View all documents
✗ Cannot create, update, or delete anything
```

### 2. **Owner** (Full Control)
```
Organizations:
✓ View their organization
✓ Add users to organization
✓ Remove users from organization
✓ Update organization settings
✓ Delete organization (if org owner)

Projects:
✓ Create projects (in their org or personal)
✓ Update their projects
✓ Delete their projects
✓ View projects in their org

Tasks:
✓ Create tasks (in their projects)
✓ Update tasks (in their projects)
✓ Delete tasks (in their projects)
✓ View tasks in their org

Documents:
✓ Create documents (in their projects or personal)
✓ Update their documents
✓ Delete their documents
✓ View documents in their org
```

### 3. **Member** (View-Only)
```
Organizations:
✓ View their organization
✗ Cannot add or remove users

Projects:
✓ View projects in their organization
✗ Cannot create, update, or delete projects

Tasks:
✓ View tasks in their organization
✗ Cannot create, update, or delete tasks

Documents:
✓ View documents in their organization
✗ Cannot create, update, or delete documents
```

---

## 📊 Permission Matrix

| Action | Admin | Owner | Member |
|--------|-------|-------|--------|
| **Organizations** |
| View all orgs | ✓ | ✗ | ✗ |
| View own org | ✓ | ✓ | ✓ |
| Create org | ✗ | ✓ | ✗ |
| Update org | ✗ | ✓* | ✗ |
| Delete org | ✗ | ✓* | ✗ |
| Add users | ✗ | ✓* | ✗ |
| Remove users | ✗ | ✓* | ✗ |
| **Projects** |
| View all projects | ✓ | ✗ | ✗ |
| View org projects | ✓ | ✓ | ✓ |
| Create project | ✗ | ✓ | ✗ |
| Update project | ✗ | ✓** | ✗ |
| Delete project | ✗ | ✓** | ✗ |
| **Tasks** |
| View all tasks | ✓ | ✗ | ✗ |
| View org tasks | ✓ | ✓ | ✓ |
| Create task | ✗ | ✓** | ✗ |
| Update task | ✗ | ✓** | ✗ |
| Delete task | ✗ | ✓** | ✗ |
| **Documents** |
| View all docs | ✓ | ✗ | ✗ |
| View org docs | ✓ | ✓ | ✓ |
| Create doc | ✗ | ✓** | ✗ |
| Update doc | ✗ | ✓** | ✗ |
| Delete doc | ✗ | ✓** | ✗ |

\* Only for their own organization
\** Only for their own resources or if they're org owner

---

## 🎯 Common Scenarios

### Scenario 1: Creating a Project
```
✓ User with role="owner" → Can create
✗ User with role="member" → Cannot create
✓ User with role="admin" → Cannot create (view-only)
```

### Scenario 2: Viewing Tasks
```
✓ Admin → Can view ALL tasks
✓ Owner → Can view tasks in their org/projects
✓ Member → Can view tasks in their org
```

### Scenario 3: Deleting a Document
```
✗ Admin → Cannot delete (view-only)
✓ Document owner → Can delete
✓ Organization owner (if doc in their org project) → Can delete
✗ Member → Cannot delete
```

### Scenario 4: Adding Users to Organization
```
✗ Admin → Cannot add (view-only)
✓ Organization owner → Can add
✓ Organization admin → Can add
✗ Organization member → Cannot add
```

---

## 💡 Important Notes

1. **Admin is view-only**: The admin role can see everything but cannot create, update, or delete anything
2. **Owner can manage their resources**: Owners have full control over resources they create or organizations they own
3. **Members are read-only**: Members can only view resources in their organization
4. **Organization hierarchy**: If a project belongs to an organization, the organization owner can manage it
5. **System vs Organization roles**: 
   - System roles: admin, owner, member (in User model)
   - Organization roles: owner, admin, member (within organization context)

---

## 🔄 Role Assignment

### System Roles (User Model)
Set when user registers or is updated by system admin:
```javascript
user.role = 'admin' | 'owner' | 'member'
```

### Organization Roles
Set when user joins organization:
```javascript
organization.members = [{
  user: userId,
  role: 'owner' | 'admin' | 'member',
  joinedAt: Date
}]
```

---

## ⚠️ Error Messages

- **403**: "Only owners can create projects"
- **403**: "Only owners can create tasks"
- **403**: "Only owners can edit/delete tasks"
- **403**: "Only document owner can edit this document"
- **403**: "Not authorized to view this project"
