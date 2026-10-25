# QuickNotes API Design

## 1. Overview

The QuickNotes API allows authenticated users to create, view, update, search and delete their notes. It also supports tags so users can organize their notes.

This document describes the proposed production API that a backend team would build. It is separate from the JSONPlaceholder API currently used for frontend practice.

## 2. Base URL

Production base URL:

    https://api.quicknotes.example.com/api/v1

All endpoints in this document are relative to the base URL.

The domain is illustrative and would need to be registered or replaced with the actual production domain before deployment.

## 3. Authentication

Endpoints that access or modify private user data require authentication.

Clients send an access token in the Authorization header.

Example:

    Authorization: Bearer <access_token>

The backend identifies the user from the token. Users can access or modify only resources they are authorized to use.

## 4. REST Endpoint Reference

| Method | Path | Description | Success Status |
|---|---|---|---|
| GET | `/notes` | List the authenticated user's notes, with optional pagination and filtering. | 200 OK |
| GET | `/notes/{noteId}` | Retrieve one note by its ID. | 200 OK |
| POST | `/notes` | Create a note for the authenticated user. | 201 Created |
| PATCH | `/notes/{noteId}` | Update selected fields of an existing note. | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note owned by the authenticated user. | 204 No Content |
| GET | `/tags` | List tags available to the authenticated user. | 200 OK |
| POST | `/notes/{noteId}/tags` | Attach an existing tag to a note. | 201 Created |
| DELETE | `/notes/{noteId}/tags/{tagId}` | Remove a tag from a note without deleting the tag itself. | 204 No Content |

## 5. List Notes

### Request

    GET /api/v1/notes?page=1&limit=10
    Authorization: Bearer <access_token>

The optional `page` and `limit` query parameters control pagination.

The API may also support a `search` query parameter for searching note titles and bodies.

### Successful Response

Status: `200 OK`

    {
      "data": [
        {
          "id": 42,
          "title": "Study database systems",
          "body": "Review primary keys and foreign keys.",
          "userId": 7,
          "tags": [
            {
              "id": 3,
              "name": "study"
            }
          ],
          "createdAt": "2026-10-20T10:00:00Z",
          "updatedAt": "2026-10-20T10:00:00Z"
        },
        {
          "id": 43,
          "title": "Buy groceries",
          "body": "Milk, bread and fruit.",
          "userId": 7,
          "tags": [],
          "createdAt": "2026-10-20T11:00:00Z",
          "updatedAt": "2026-10-20T11:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 2
      }
    }

The `data` array contains the notes returned by the API. The `pagination` object describes the requested page and the total number of matching notes.

If the user has no notes, the API returns `200 OK` with an empty `data` array rather than treating the request as an error.

## 6. Retrieve One Note

### Request

    GET /api/v1/notes/42
    Authorization: Bearer <access_token>

### Successful Response

Status: `200 OK`

    {
      "id": 42,
      "title": "Study database systems",
      "body": "Review primary keys and foreign keys.",
      "userId": 7,
      "tags": [],
      "createdAt": "2026-10-20T10:00:00Z",
      "updatedAt": "2026-10-20T10:00:00Z"
    }

The backend returns the note only if it exists and the authenticated user is authorized to access it.

## 7. Create a Note

### Request

    POST /api/v1/notes
    Authorization: Bearer <access_token>
    Content-Type: application/json

Request body:

    {
      "title": "Learn REST APIs",
      "body": "Practice GET, POST, PATCH and DELETE."
    }

The title is required and must contain between 1 and 100 characters after trimming whitespace. The body is optional.

The backend obtains the owner's user ID from the authenticated session or token rather than trusting a user ID supplied by the client.

### Successful Response

Status: `201 Created`

    {
      "id": 101,
      "title": "Learn REST APIs",
      "body": "Practice GET, POST, PATCH and DELETE.",
      "userId": 7,
      "tags": [],
      "createdAt": "2026-10-20T12:00:00Z",
      "updatedAt": "2026-10-20T12:00:00Z"
    }

The backend creates the note, assigns its ID and records its owner and timestamps. The response contains the newly created resource.

## 8. Update a Note

### Request

    PATCH /api/v1/notes/101
    Authorization: Bearer <access_token>
    Content-Type: application/json

Request body:

    {
      "title": "Learn REST APIs properly"
    }

### Successful Response

Status: `200 OK`

    {
      "id": 101,
      "title": "Learn REST APIs properly",
      "body": "Practice GET, POST, PATCH and DELETE.",
      "userId": 7,
      "tags": [],
      "createdAt": "2026-10-20T12:00:00Z",
      "updatedAt": "2026-10-20T12:30:00Z"
    }

PATCH updates only the supplied fields. Fields that are omitted remain unchanged.

## 9. Delete a Note

### Request

    DELETE /api/v1/notes/101
    Authorization: Bearer <access_token>

### Successful Response

Status: `204 No Content`

A successful delete returns no response body. The backend removes the note owned by the authenticated user and handles its associated tag relationships according to the database rules.

## 10. List Tags

### Request

    GET /api/v1/tags
    Authorization: Bearer <access_token>

### Successful Response

Status: `200 OK`

    {
      "data": [
        {
          "id": 1,
          "name": "work"
        },
        {
          "id": 2,
          "name": "personal"
        },
        {
          "id": 3,
          "name": "study"
        }
      ]
    }

This endpoint returns the tags available to the authenticated user.

## 11. Attach a Tag to a Note

### Request

    POST /api/v1/notes/101/tags
    Authorization: Bearer <access_token>
    Content-Type: application/json

Request body:

    {
      "tagId": 3
    }

### Successful Response

Status: `201 Created`

    {
      "noteId": 101,
      "tagId": 3,
      "tagName": "study"
    }

The backend creates a relationship between the note and the existing tag. It should prevent duplicate relationships between the same note and tag.

## 12. Remove a Tag from a Note

### Request

    DELETE /api/v1/notes/101/tags/3
    Authorization: Bearer <access_token>

### Successful Response

Status: `204 No Content`

The relationship between the note and tag is removed. The tag itself remains available for other notes.

## 13. Error Status Codes

| Status | Name | Meaning | Example |
|---|---|---|---|
| 400 | Bad Request | The request is malformed or contains invalid data. | A title is empty or longer than 100 characters. |
| 401 | Unauthorized | The client has not provided valid authentication credentials. | The access token is missing, expired or invalid. |
| 403 | Forbidden | The user is authenticated but is not permitted to perform the requested action. | A user tries to modify a resource they are not allowed to access. |
| 404 | Not Found | The requested resource does not exist or is not available to the user. | A request asks for a note with an unknown ID. |
| 500 | Internal Server Error | An unexpected server-side failure occurred. | The server encounters an unhandled database or application error. |

## 14. Example Error Response

Status: `400 Bad Request`

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "The request contains invalid data.",
        "details": [
          {
            "field": "title",
            "message": "Title is required and must not exceed 100 characters."
          }
        ]
      }
    }

Error responses use a consistent structure so that clients can display helpful messages without exposing internal server details.

A `401` response indicates an authentication problem, while a `403` response indicates an authorization problem. These statuses should not be treated as interchangeable.

## 15. API Design Principles

- Use nouns such as `/notes` and `/tags` to identify resources.
- Use HTTP methods to describe actions: GET reads, POST creates, PATCH partially updates, and DELETE removes.
- Use JSON for request and response bodies.
- Use appropriate HTTP status codes to communicate success and failure.
- Validate request data on the server even when the frontend also validates it.
- Authenticate requests and enforce ownership and permissions on the server.
- Use parameterized SQL queries in the backend to help prevent SQL injection.
- Return consistent error objects without exposing passwords, tokens or internal implementation details.
- Use pagination for collection endpoints so that clients do not need to retrieve every note in one request.
- Use HTTPS in production to protect data while it travels between clients and the API.

## 16. JSONPlaceholder Versus the Production API

The frontend practice client currently communicates with JSONPlaceholder, which simulates GET, POST and DELETE operations for learning and testing.

The production QuickNotes API described in this document is a proposed design. It would require a real backend, persistent database, authentication, authorization and validation.

JSONPlaceholder does not permanently store notes created by the practice client. A production QuickNotes service would persist successfully created notes and apply updates and deletions to its database.