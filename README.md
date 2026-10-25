# QuickNotes System Design

QuickNotes System Design is a project that demonstrates how a browser-based note-taking application can communicate with an API and how a production version could be designed to support one million registered users.

The project combines a working frontend API client with documentation for the proposed REST API, relational database model and scalable system architecture.

The frontend uses HTML, CSS and JavaScript to load notes, create notes and delete notes through the JSONPlaceholder practice API. The documentation describes how a real QuickNotes backend could provide persistent storage, authentication, authorization and scalable infrastructure.

## Features

- Load the first 10 notes from JSONPlaceholder using GET.
- Display each note's title and body.
- Create notes using POST requests.
- Validate that note titles are required and do not exceed 100 characters.
- Allow an optional note body.
- Delete displayed notes using DELETE requests.
- Display loading, success, error and empty states.
- Handle failed HTTP requests using a reusable asynchronous request function.
- Display API-provided text safely using `textContent`.
- Document a proposed production REST API with appropriate HTTP methods and status codes.
- Design a relational database containing users, notes, tags and note-tag relationships.
- Propose a scalable architecture with caching, database replication, load balancing and background processing.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Fetch API
- JSON
- HTTP methods and status codes
- Git and GitHub
- SQL and SQLite concepts
- REST API design
- System architecture and scalability concepts

## Project Structure

    quicknotes-system-design/
    ├── index.html
    ├── api.js
    ├── style.css
    ├── README.md
    └── docs/
        ├── api-design.md
        ├── data-model.md
        └── architecture.md

## How to Run the API Client

### 1. Clone the Repository

    git clone https://github.com/llavvy-design/quicknotes-system-design.git

### 2. Open the Project

Open the cloned `quicknotes-system-design` folder in Visual Studio Code.

### 3. Start the Local Web Server

Open `index.html` and use the Live Server extension to launch the application in your browser.

You can also use another local web server that serves the project files.

### 4. Load Notes

Click **Load notes** to request the first 10 posts from JSONPlaceholder. The application displays the returned titles and bodies.

### 5. Create a Note

Enter a title and an optional body, then click **Create note**. The application sends a POST request and displays the returned note at the top of the list.

Titles are required and must not exceed 100 characters.

### 6. Delete a Note

Click **Delete** beneath a displayed note. The application sends a DELETE request and removes the note from the current displayed list after a successful response.

An internet connection is required because the frontend communicates with the external JSONPlaceholder API.

## Important Note About JSONPlaceholder

JSONPlaceholder is a practice API used to demonstrate HTTP requests. It simulates creating and deleting resources but does not permanently save those changes.

Consequently, a newly created note may disappear after refreshing the page, and a previously deleted sample note may reappear when the notes are loaded again.

The production API described in the design documents would use a real backend and persistent database to store user data.

## System Design Documentation

The three design documents describe how the production QuickNotes service could be implemented.

### 1. API Design

[Read the API Design Document](docs/api-design.md)

Describes the proposed REST endpoints, request and response formats, authentication, authorization, validation and HTTP error status codes.

### 2. Data Model

[Read the Data Model Document](docs/data-model.md)

Defines the users, notes, tags and note_tags entities, including their columns, primary keys, foreign keys, relationships, SQL table definitions, example queries and indexes.

### 3. Architecture

[Read the Architecture Document](docs/architecture.md)

Explains the functional and non-functional requirements, load estimates for one million registered users, proposed architecture, GET and POST request flows, scaling strategies and reliability trade-offs.

## What I Learned

- I learned how to use the Fetch API with asynchronous JavaScript to communicate with an API using GET, POST and DELETE requests.
- I learned how to create a reusable request function, check `response.ok` and handle errors with `try`, `catch` and `finally`.
- I learned how to validate form inputs, display request status messages and update the DOM safely using `createElement` and `textContent`.
- I learned how REST APIs use resources, HTTP methods, JSON request bodies and status codes to communicate between clients and servers.
- I learned how relational databases use primary keys, foreign keys and join tables to represent one-to-many and many-to-many relationships.
- I learned how indexes can improve read performance and how SQL constraints help maintain data integrity.
- I learned how load balancers, caches, read replicas, content delivery networks and background queues can support a scalable application.
- I learned how to estimate request rates and storage requirements using explicit assumptions.
- I learned how to use Git and GitHub to track meaningful development milestones and maintain a project history.

## Future Improvements

- Replace JSONPlaceholder with a real backend API.
- Add authentication and authorization.
- Persist notes in a production database.
- Implement pagination and note search.
- Add tag management and filtering.
- Introduce automated tests and continuous integration.
- Add monitoring, backups and production deployment.
- Improve accessibility and responsive styling.

## Author

Lavine Lornah

GitHub: [llavvy-design](https://github.com/llavvy-design)

Project Repository: [quicknotes-system-design](https://github.com/llavvy-design/quicknotes-system-design)