# Services API

## Overview:
This is a RESTful API for managing services and their versions. It is built using Node.js, NestJS, TypeScript, TypeORM, and PostgreSQL.

##Features:
- **List Services**: Get a list of all available services with support for filtering, sorting, and pagination.
- **Get a Service**: Retrieve detailed information of a specific service, including versions.
- **CRUD Operations**: Create, update, and delete services.
- **Authentication/Authorization**: Implemented simple RBAC with JWT for different levels of access.

## Tech Stack:
- PostgreSQL
- Node.js
- NestJS
- TypeORM
- TypeScript

## Design Considerations, Assumptions, and Trade-offs

### Versions and Security Updates
- **Package Versions**: Versions of the packages and tech stack were upgraded after confirming that it's flexible for security purposes and for newer features. The trade-off is potential compatibility issues with existing systems, especially those in Kong, if they rely on specific older versions.

### Filtering and Sorting
- **Sorting Options**: Sorting was added for fields like `name`, `createdAt`, and `updatedAt`. The decision to support these fields was made based on relevance since, during requirements gathering, the interviewer mentioned it was up to me.

### Search Capability
- **Fuzzy Search**: For search functionality, a simple `ILIKE` clause was used for name and description fields. More advanced solutions like semantic search or Elasticsearch were considered, but not implemented given the limited dataset.

### Authentication and Authorization
- **Simple RBAC with JWT**: Used Passport and JWT to implement role-based access control (RBAC). This can be improved further to include OAuth for third-party integrations or more complex access scenarios.

### Testing
- **Unit Tests**: Unit tests have been added to cover controller and service logic.
- **No Integration Tests**: Due to time constraints, integration tests were not implemented. These are planned as a future enhancement.

### Pagination Strategy
- **Page-Based Pagination**: Implemented page-based pagination. A potential improvement could be using cursor-based pagination, which is more efficient for large and continuously changing datasets, but page-based is enough for now given the scope.

### Future Improvements

#### Logging and Traceability
- Adding structured logging will help track requests and debug issues more efficiently.
- Traceability is crucial for following the flow of user actions throughout the application and will enhance observability and support auditing.

#### Instrumentation
- Adding instrumentation will help capture key metrics like latency, error rates, and throughput. This data will assist in identifying bottlenecks and ensuring the application meets performance goals. Tools like Prometheus or OpenTelemetry can be used for this purpose.

#### Integration Tests
- Integration tests are essential to ensure end-to-end coverage, particularly interactions between the service and the database.

#### Improved Authentication
- Enhance authentication by adding OAuth and more advanced RBAC, providing a more secure approach to user roles and permissions.

#### Pagination
- Switch to cursor-based pagination for improved performance, particularly for large and frequently changing datasets.

#### Advanced Search
- Implement a more advanced search mechanism like Elasticsearch for semantic and full-text search capabilities.

## Running the Application

### Step 1: Run Pending migrations

```bash
npm run migration:run
```

### Step 2: Run the app
Ensure you have Docker and Docker Compose installed. Use the following commands to run the services locally:

```bash
docker-compose up --build
```
This will spin up the application and a PostgreSQL database.

## Running Tests:

Run unit tests using Jest:

```bash
npm run test
```

## API Documentation:
API documentation is available through Swagger. Once the server is up and running, you can access the documentation at:
http://localhost:3000/api-docs
