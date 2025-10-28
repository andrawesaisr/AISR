# Role-Based Access Control (RBAC) Documentation

This document outlines the role permissions and authorization logic implemented across the application.

## System-Wide User Roles

The application has three system-wide user roles (defined in User model):
- **Admin**: System administrator with view-all permissions
- **Owner**: Can create and manage their own resources
- **Member**: View-only access to resources they're part of

## Role Permissions Summary

### Admin (System-Wide)
- ✓ View all organizations
- ✓ View all projects
- ✓ View all tasks
- ✓ View all documents
- ✗ Cannot create/edit/delete (view-only)

### Owner (Organization Owner / Resource Owner)
- ✓ View their organization
- ✓ Add users to organization
- ✓ Remove users from organization
- ✓ Create projects
- ✓ Delete projects
- ✓ Create tasks
- ✓ Update tasks
- ✓ Delete tasks
- ✓ Create documents
- ✓ Update documents
- ✓ Delete documents

### Member (Organization Member)
- ✓ View their organization
- ✓ View projects in their organization
- ✓ View tasks in their organization
- ✓ View documents in their organization
- ✗ Cannot create, update, or delete anything

## Organization Roles

Organizations have member roles within the organization context:
- **Owner**: Full control over the organization
- **Admin**: Can manage members and invite users
- **Member**: View-only access

### Organization Permissions

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View organization | ✓ | ✓ | ✓ |
| Update organization settings | ✓ | ✓ | ✗ |
| Delete organization | ✓ | ✗ | ✗ |
| Invite members | ✓ | ✓ | ✓* |
| Remove members | ✓ | ✓ | ✗ |
| Change member roles | ✓ | ✗ | ✗ |
| Cancel invitations | ✓ | ✓ | ✗ |

*Members can invite only if `settings.allowMemberInvite` is enabled

## Project Permissions

Projects are owned by users with "owner" role. Access is determined by:
- **System Admin**: Can view all projects
- **Project Owner**: User who created the project (full control)
- **Organization Owner**: If project belongs to an org (full control)
- **Organization Members**: View-only access

### Project Permissions Table

| Action | System Admin | Project Owner | Org Owner | Org Admin | Org Member |
|--------|--------------|---------------|-----------|-----------|------------|
| View all projects | ✓ | ✗ | ✗ | ✗ | ✗ |
| View project | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create project | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ |
| Update project | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ |
| Delete project | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ |

## Task Permissions

Tasks inherit permissions from their parent project. Only owners can create/update/delete tasks.

### Task Permissions Table

| Action | System Admin | Project Owner | Org Owner | Org Admin | Org Member |
|--------|--------------|---------------|-----------|-----------|------------|
| View all tasks | ✓ | ✗ | ✗ | ✗ | ✗ |
| View task | ✓ | ✓ | ✓ | ✓ | ✓ (in their org) |
| View project tasks | ✓ | ✓ | ✓ | ✓ | ✓ (in their org) |
| Create task | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ |
| Update task | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ |
| Delete task | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ |

### Task Access Rules

1. **View Task**: Admin can view all, others must be project/org member
2. **Create Task**: Only project owner or organization owner
3. **Update Task**: Only project owner or organization owner
4. **Delete Task**: Only project owner or organization owner

### Task Endpoints

- `GET /tasks/project/:projectId` - Get all tasks for a project
  - **Auth**: Admin or project/org member
  
- `GET /tasks/:id` - Get single task
  - **Auth**: Admin or project/org member
  
- `POST /tasks` - Create task
  - **Auth**: Project owner or org owner only
  - **Body**: Must include `project` field
  
- `PATCH /tasks/:id` - Update task
  - **Auth**: Project owner or org owner only
  
- `DELETE /tasks/:id` - Delete task
  - **Auth**: Project owner or org owner only

## Document Permissions

Documents can be:
- **Personal**: Owned by a user
- **Project-based**: Linked to a project
- **Public**: Accessible by anyone (if `isPublic` is true)

### Document Permissions Table

| Action | System Admin | Doc Owner | Org Owner | Org Admin | Org Member | Public |
|--------|--------------|-----------|-----------|-----------|------------|--------|
| View all documents | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View document | ✓ | ✓ | ✓ | ✓ | ✓ (in their org) | ✓ (if public) |
| Create document | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ | ✗ |
| Update document | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ | ✗ |
| Delete document | ✗ | ✓ | ✓ (in their org) | ✗ | ✗ | ✗ |

### Document Access Rules

1. **View Document**: Admin can view all, owner can view their docs, org members can view docs in their org projects, public docs accessible to all
2. **Create Document**: Only document owner or organization owner (if in org project)
3. **Update Document**: Only document owner or organization owner (if in org project)
4. **Delete Document**: Only document owner or organization owner (if in org project)

### Document Endpoints

- `GET /documents` - Get all accessible documents
  - **Auth**: Returns documents based on ownership, org membership, and project access
  
- `GET /documents/:id` - Get single document
  - **Auth**: Admin, owner, org member, or public (if document is public)
  
- `POST /documents` - Create document
  - **Auth**: Owner role only (validates org owner if project specified)
  
- `PATCH /documents/:id` - Update document
  - **Auth**: Document owner or org owner only
  
- `DELETE /documents/:id` - Delete document
  - **Auth**: Document owner or org owner only

## Middleware Functions

### Organization Middleware (`/middleware/roles.ts`)
- `isAdmin` - System admin role check
- `isOwner` - Organization owner check (uses org ID from params)
- `isMember` - Organization member check (uses org ID from params)

### Project Middleware (`/middleware/checkProjectAuth.ts`)
- `isProjectMember` - Check if user can view project
- `isProjectOwner` - Check if user owns project
- `validateProjectOrganization` - Validate org membership when creating project

### Task Middleware (`/middleware/checkTaskAuth.ts`)
- `isTaskMember` - Check if user can view task (via project membership)
- `canEditTask` - Check if user can edit/delete task (project owner or org admin)
- `canCreateTask` - Check if user can create task in project
- `canViewProjectTasks` - Check if user can view all project tasks

### Document Middleware (`/middleware/checkDocumentAuth.ts`)
- `canViewDocument` - Check if user can view document
- `canEditDocument` - Check if user can edit document
- `canDeleteDocument` - Check if user can delete document
- `validateDocumentProject` - Validate project membership when creating document

## Authorization Flow

1. **Authentication** (`auth` middleware)
   - Validates JWT token
   - Attaches `userId` and `user` to request

2. **Resource-Specific Authorization**
   - Checks if user has permission to access/modify resource
   - Validates relationships (project → organization → members)
   - Returns 403 if unauthorized, 404 if resource not found

3. **Action Execution**
   - If authorized, proceed with the requested operation
   - Return appropriate response

## Best Practices

1. **Always use appropriate middleware**: Don't use organization middleware for project/task routes
2. **Validate relationships**: Check project → organization membership chain
3. **Filter null references**: Organization members can be null (deleted users)
4. **Clear error messages**: Return specific error messages for different auth failures
5. **Consistent status codes**: 
   - 401: Not authenticated
   - 403: Not authorized (authenticated but no permission)
   - 404: Resource not found

## Common Issues Fixed

1. ✅ **ObjectId casting errors**: Removed incorrect organization middleware from project/task/document routes
2. ✅ **Task loading**: Fixed middleware to allow project members to view tasks
3. ✅ **Role validation**: Proper role checks for each resource type
4. ✅ **Organization membership**: Validates org membership when creating projects with organization
