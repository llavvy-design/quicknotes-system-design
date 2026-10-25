# QuickNotes System Architecture

## 1. Overview

QuickNotes is a note-taking application that is moving from a browser-only application to an online service designed to support one million registered users.

Users should be able to create, read, update, delete and organize their notes. The service needs to remain responsive as demand grows while protecting private user data and preventing the database from becoming a bottleneck.

The proposed architecture separates the client, application servers, cache, database, background processing and content delivery infrastructure. Individual components can scale independently as the service grows.

## 2. Functional Requirements

The system must support the following functions:

- Allow users to register, sign in and authenticate securely.
- Allow authenticated users to create notes with a required title and an optional body.
- Allow users to retrieve their notes, view individual notes, update them and delete them.
- Allow users to organize notes with tags.
- Allow users to search their notes and retrieve them in a useful order.
- Support pagination when retrieving large collections of notes.
- Ensure users can access and modify only notes they are authorized to use.
- Return appropriate success messages and error responses.
- Maintain note data when users refresh the browser or sign in on another device.
- Perform appropriate background tasks without unnecessarily delaying user requests.

## 3. Non-Functional Requirements

### Performance

- Aim for common note-reading requests to complete within 300 milliseconds under normal operating conditions.
- Use caching and database read replicas to reduce repeated database work.
- Avoid making users wait for non-essential background processing.

The 300-millisecond target is a proposed service objective, not a measured performance result.

### Availability

- Aim for 99.9% service availability.
- Run multiple application-server instances.
- Use health checks, automated recovery and redundant infrastructure to reduce downtime.

### Scalability

- Support increasing numbers of users and requests by adding application-server instances and scaling supporting services.
- Scale the database, cache and background workers according to their individual workloads.

### Security

- Use HTTPS to protect data in transit.
- Authenticate users and authorize access to individual notes.
- Validate user input on the server.
- Use parameterized SQL queries to help prevent SQL injection.
- Store password hashes rather than plain-text passwords.
- Avoid exposing private notes through publicly cached responses.

### Reliability and Durability

- Commit important note changes to the primary database before confirming successful writes.
- Back up the database and test restoration procedures.
- Use database replication and appropriate failover procedures.
- Make background jobs durable and retry recoverable failures safely.

### Maintainability and Observability

- Keep application code separate from database operations and background workers.
- Record application errors and relevant operational events without logging passwords or access tokens.
- Monitor latency, request rates, error rates, cache hit rates, database health, queue depth and worker failures.

## 4. Load Estimates for One Million Users

The assignment does not specify the percentage of active users or how frequently each person creates and reads notes. The following planning assumptions are therefore used.

### Assumptions

- Total registered users: 1,000,000.
- Daily active users: 10% of registered users.
- Each daily active user makes 20 read requests per day.
- Each daily active user makes 2 write requests per day.
- Each daily active user creates 1 new note per day on average.
- An average stored note, including its basic metadata, occupies approximately 2 KB.
- A day contains 86,400 seconds.
- A year contains 365 days.
- Peak request rates are estimated at five times the average rate.
- Storage estimates use decimal units: 1 GB = 1,000,000 KB.
- The storage estimate excludes indexes, backups, replicas, logs and database overhead.
- Note attachments and photos are not included in the storage estimate.

These assumptions provide a simple baseline. Actual usage should be measured and the estimates revised as the product grows.

### Daily Active Users

Daily active users = Registered users × Daily active percentage

Daily active users = 1,000,000 × 0.10

**Daily active users = 100,000**

### Read Requests Per Day

Each active user makes 20 read requests per day.

Daily reads = 100,000 × 20

**Daily reads = 2,000,000 requests**

### Average Reads Per Second

Average reads per second = Daily reads ÷ Seconds per day

Average reads per second = 2,000,000 ÷ 86,400

**Average read rate ≈ 23.15 requests per second**

### Peak Reads Per Second

Using the five-times peak factor:

Peak reads per second = 23.15 × 5

**Peak read rate ≈ 116 requests per second**

### Write Requests Per Day

Each active user makes two write requests per day. These may include creating or modifying notes.

Daily writes = 100,000 × 2

**Daily writes = 200,000 requests**

### Average Writes Per Second

Average writes per second = 200,000 ÷ 86,400

**Average write rate ≈ 2.31 requests per second**

### Peak Writes Per Second

Peak writes per second = 2.31 × 5

**Peak write rate ≈ 12 requests per second**

### Annual Note Storage

For storage growth, assume each daily active user creates one new note per day.

Daily new notes = 100,000 × 1

Daily new notes = 100,000

Annual new notes = 100,000 × 365

**Annual new notes = 36,500,000**

At an average of 2 KB per note:

Annual storage = 36,500,000 × 2 KB

Annual storage = 73,000,000 KB

**Estimated storage growth = 73 GB per year**

This estimates the additional size of new note records only. Actual database storage will be higher after accounting for indexes, database overhead, backups and replicas. If users retain notes over multiple years, total retained storage will continue to grow.

### Summary of Estimates

| Metric | Daily or Average Estimate | Peak or Annual Estimate |
|---|---:|---:|
| Registered users | 1,000,000 | — |
| Daily active users | 100,000 | — |
| Read requests per day | 2,000,000 | — |
| Average read rate | 23.15 requests/second | 116 requests/second at peak |
| Write requests per day | 200,000 | — |
| Average write rate | 2.31 requests/second | 12 requests/second at peak |
| New note records | 100,000 per day | 36.5 million per year |
| Note storage growth | Approximately 0.2 GB per day | 73 GB per year |

## 5. Proposed Architecture Diagram

The architecture separates static content delivery, API processing, database reads and writes, and background work.

    +--------------------------------------------------+
    |                 CLIENT DEVICES                   |
    |           Web browsers and mobile apps           |
    +--------------------------------------------------+
                          |
                          v
    +--------------------------------------------------+
    |                       DNS                        |
    |          Resolves application and API hosts      |
    +--------------------------------------------------+
                          |
                          v
    +--------------------------------------------------+
    |                        CDN                       |
    |           Delivers cached public assets          |
    |        HTML, CSS, JavaScript and images           |
    +--------------------------------------------------+
             |                          |
             | Static assets            | API requests
             v                          v
        Return to client       +-------------------------+
                               |      LOAD BALANCER      |
                               | Routes API traffic and  |
                               | checks server health    |
                               +-------------------------+
                                             |
                         +-------------------+-------------------+
                         |                   |                   |
                         v                   v                   v
                 +---------------+   +---------------+   +---------------+
                 | APP SERVER A  |   | APP SERVER B  |   | APP SERVER N  |
                 | API logic     |   | API logic     |   | API logic     |
                 +---------------+   +---------------+   +---------------+
                         |                   |
                         +---------+---------+
                                   |
                     +-------------+-------------+
                     |                           |
                     v                           v
             +---------------+           +------------------+
             | CACHE         |           | PRIMARY DATABASE |
             | User-scoped   |           | Authoritative    |
             | cached data   |           | note records     |
             +---------------+           +------------------+
                     |                           |
                     | Cache miss                | Replication
                     v                           v
             +----------------+          +------------------+
             | READ REPLICA   |          | Database replica |
             | Read queries   |          | synchronization  |
             +----------------+          +------------------+

    BACKGROUND PROCESSING:

    APP SERVER
         |
         | Enqueue asynchronous job
         v
    +-------------------+
    | DURABLE JOB QUEUE |
    +-------------------+
         |
         v
    +-------------------+       +-------------------+
    | WORKER A          |       | WORKER B          |
    | Background jobs   |       | Background jobs   |
    +-------------------+       +-------------------+
                 |                       |
                 +-----------+-----------+
                             |
                             v
                 Notifications, search indexing
                       and other background work

For private QuickNotes API responses, the CDN must not publicly cache user-specific data. Authenticated API requests are forwarded to the application layer and use appropriate authorization checks and private caching rules.

The diagram is logical rather than a fixed deployment. Application servers and workers can be deployed across multiple availability zones, and managed services can provide additional redundancy.

## 6. Architecture Components

### 1. Client

The browser or mobile application allows users to interact with QuickNotes and sends authenticated API requests to retrieve or modify their notes.

### 2. DNS

DNS resolves the application's domain names to the appropriate CDN or API entry points so clients can locate the service.

### 3. Content Delivery Network

The CDN delivers cached public static files from nearby locations, reducing download latency and unnecessary traffic to the origin servers.

### 4. Load Balancer

The load balancer distributes API requests among healthy application servers so that a single server does not have to process all incoming requests.

### 5. Application Servers

Application servers authenticate users, authorize note access, validate requests, execute application logic and coordinate reads, writes and background jobs.

### 6. Cache

The cache stores frequently requested note data or derived results so the application can avoid repeatedly querying the database for the same information.

Cached private data must be partitioned by user and handled with appropriate expiration and invalidation rules.

### 7. Primary Database

The primary database stores authoritative user, note, tag and relationship records and processes writes that change persistent data.

### 8. Read Replica

The read replica receives database changes from the primary and serves suitable read queries, reducing the read workload on the primary database.

Replication can lag, so the application must account for the possibility that a recent write is not immediately visible on the replica.

### 9. Durable Job Queue

The queue stores background tasks until workers can process them, allowing non-essential work to happen asynchronously instead of delaying API responses.

### 10. Background Workers

Workers process queued tasks such as search indexing, notifications or exports, and can be scaled independently when the queue grows.

## 7. Step-by-Step Flow: GET /notes

The GET flow retrieves a user's notes without changing stored data.

1. The user opens QuickNotes in a browser or mobile application.

2. DNS resolves the application domain. The CDN delivers cached public frontend assets such as HTML, CSS and JavaScript.

3. The client sends an authenticated request to GET `/api/v1/notes?page=1&limit=10`.

4. The load balancer checks the available application servers and routes the request to a healthy server.

5. The application server validates the user's authentication token and verifies that the user may access the requested notes.

6. The application checks the cache using a key that includes the authenticated user and relevant pagination or filtering parameters.

7. If a suitable cache entry exists, the application returns the cached result. Otherwise, the application queries the database read replica for the user's notes.

8. The application applies pagination and ordering, creates the JSON response and may store a suitable result in the cache for later requests.

9. The application returns a successful response with the notes and pagination metadata.

10. The client renders the notes using the returned data.

If a read-after-write operation requires the latest committed state, the application can direct that read to the primary database rather than depending on a potentially delayed replica.

## 8. Step-by-Step Flow: POST /notes

The POST flow creates a persistent note.

1. The user enters a title and optional body and submits the form.

2. The client performs basic validation and sends a POST request to `/api/v1/notes`, including the authentication token and a JSON body.

3. The load balancer forwards the request to a healthy application server.

4. The application server validates the token, identifies the user and checks that the title satisfies the required validation rules.

5. The application uses a parameterized database operation to insert the note into the primary database.

6. The database commits the new note and returns its assigned ID and stored values.

7. After the database commit succeeds, the application invalidates or updates relevant cached note lists so later reads do not continue showing stale data.

8. The application places any required asynchronous work, such as search indexing or notifications, into the durable job queue.

9. The application returns `201 Created` with the new note's ID, title, body and timestamps.

10. A background worker processes the queued job independently. If processing fails temporarily, the job can be retried according to the queue's retry policy.

11. The client displays the created note and a success message.

The application should not report a successful note creation before the primary database has committed the note. A failure in non-essential background processing should not automatically undo a successfully committed note.

## 9. Scaling Strategy

### Scale Application Servers Horizontally

Run multiple application-server instances behind the load balancer. Add instances as request volume increases, and remove unhealthy instances from rotation.

Application servers should be as stateless as practical so any healthy server can process a request from an authenticated client.

### Use Caching for Repeated Reads

Cache suitable, frequently requested results and use clear invalidation or expiration rules after changes. This reduces duplicate database queries and can improve response times.

### Separate Database Reads and Writes

Send authoritative writes to the primary database and route suitable read queries to the replica. Add database capacity based on measured CPU, memory, storage, connection and query-performance needs.

### Process Non-Essential Work Asynchronously

Use a durable queue for tasks that do not need to finish before the API responds. Scale worker concurrency according to the queue's backlog and processing time.

### Monitor Before Scaling

Track average and peak request rates, p95 and p99 latency, error rates, cache performance, database replication lag and queue depth. These metrics help identify the component that actually needs additional capacity.

## 10. Trade-Offs

### Trade-Off 1: Cache Performance Versus Data Freshness

Caching reduces repeated database work and can make reads faster, but cached notes can become stale after a user creates, updates or deletes a note.

The system needs short, appropriate expiration times and cache invalidation after successful writes. Private cache keys must include the user and relevant query parameters to prevent one user's data being returned to another user.

### Trade-Off 2: Read Replicas Versus Immediate Consistency

Read replicas increase read capacity and reduce the load on the primary database.

However, replication can lag, so a user may not immediately see a recent change if the next read is served by the replica. The application can use the primary for selected read-after-write operations, while accepting eventual consistency for other reads.

### Trade-Off 3: Asynchronous Processing Versus Immediate Completion

A queue lets the API return after a note is safely stored without waiting for search indexing or notification tasks.

However, background results may be delayed, and jobs can fail or be delivered more than once. Workers need retry policies, error monitoring and idempotent processing so repeated attempts do not produce duplicate effects.

### Trade-Off 4: Redundancy Versus Operational Complexity

Multiple application servers, database replicas and worker instances reduce dependence on individual machines.

However, redundant components increase operating cost and require monitoring, deployment coordination, failover testing and more complex troubleshooting.

## 11. Avoiding Single Points of Failure

A single point of failure is a component whose failure can make the entire service unavailable or prevent an essential operation.

QuickNotes will reduce these risks through the following measures.

### Application Servers

Run at least two independent application-server instances behind a load balancer. Use health checks and deploy instances across separate availability zones so an individual server or zone failure does not stop all API processing.

### Load Balancer

Use a managed or redundant load-balancing service rather than depending on a single manually maintained load-balancer machine.

### DNS and CDN

Use reliable managed DNS and CDN services with their provider's redundancy mechanisms. Keep the origin infrastructure available in case cached content is unavailable or cannot satisfy a request.

### Database

Use a database deployment that supports primary failover and maintain an up-to-date replica. Configure automated backups, point-in-time recovery where available and regularly tested restoration procedures.

A replica is not a substitute for a backup because accidental deletions and corrupted data can also be replicated.

### Cache

Treat the cache as an optimization rather than the sole copy of authoritative note data. If the cache fails, the application should be able to use the database, although it may respond more slowly during recovery.

### Job Queue and Workers

Use a durable queue with redundancy appropriate to the selected queue service. Run multiple workers so a single worker failure does not stop all background processing. Monitor queue depth and failed jobs, and make jobs safe to retry.

### Deployment and Monitoring

Use health checks, alerts and controlled deployments. Monitor dependencies and test failure scenarios so the team understands how the service behaves when an application server, replica, cache or worker becomes unavailable.

No architecture can eliminate every possible failure, but these measures remove many single-machine dependencies and support recovery from common failures.

## 12. Conclusion

The proposed QuickNotes architecture separates frontend delivery, API processing, caching, persistent storage and background jobs so each component can scale according to demand.

Under the stated assumptions, one million registered users produce approximately 23 average read requests per second and 2.3 average write requests per second, with planning peaks of approximately 116 reads per second and 12 writes per second. New note storage is estimated at 73 GB per year before database overhead and operational copies are included.

A CDN reduces the cost and latency of static asset delivery. The load balancer distributes traffic across application servers. The cache and read replica improve read capacity, while the primary database preserves authoritative changes. A durable queue and multiple background workers keep non-essential processing separate from the user-facing request path.

The design combines horizontal scaling, appropriate caching, database replication, monitoring, backups and redundancy to support future growth without making a single application server responsible for the entire service.