# WebAPI Assignment 5 API

**Author:** Elijah Heimsoth
**Class:** CSCI 3916 Web API
**Date:** 04/17/26

## Description

REST API powering the HW5 React Single Page Application. Extends Assignment 4 with MongoDB aggregation pipelines that compute an `avgRating` server-side, a sorted list endpoint, conditional review inclusion on the detail endpoint, and an `imageUrl` field on the Movie schema for poster images.

- `GET /movies` - aggregates each movie with its reviews via `$lookup`, adds `avgRating` via `$avg`, strips the raw reviews array via `$project`, and sorts descending by `avgRating`.
- `GET /movies/:id` - same aggregation for a single movie. When `?reviews=true` is passed, the reviews array is retained in the response; otherwise it is projected out.
- All `/movies` and `/reviews` routes remain JWT-protected.

**React frontend companion repo:** [WebAPI-HW5-React](https://github.com/heimsothe/WebAPI-HW5-React)

## Installation

```bash
git clone https://github.com/heimsothe/WebAPI-HW5.git
cd WebAPI-HW5
npm install
```

Create a `.env` file in the project root:

```
DB=<your MongoDB Atlas connection string>
SECRET_KEY=<your JWT signing secret>
PORT=8080
```

## Usage

Start the server:

```bash
npm start
```

Run tests:

```bash
npm test
```

### Authentication

1. `POST /signup` with `{ name, username, password }` to create an account
2. `POST /signin` with `{ username, password }` to receive a JWT token
3. Include the token in the `Authorization` header for all subsequent requests

## Deployed Endpoints

- **API:** [https://webapi-hw5-heimsoth.onrender.com](https://webapi-hw5-heimsoth.onrender.com)
- **React App:** [https://webapi-hw5-react-heimsoth.onrender.com](https://webapi-hw5-react-heimsoth.onrender.com)

> **Note:** The first request after an idle period may take up to 60 seconds due to Render free-tier cold starts.

## API Routes


| Route       | GET                                                          | POST                | PUT           | DELETE        |
| ----------- | ------------------------------------------------------------ | ------------------- | ------------- | ------------- |
| /movies     | Return all movies with `avgRating`, sorted desc              | Save a single movie | Not supported | Not supported |
| /movies/:id | Return movie with `avgRating` (+ reviews if `?reviews=true`) | Not supported       | Update movie  | Delete movie  |
| /reviews    |                                                              | Create a review     |               |               |


All routes require JWT authentication. Obtain a token via `POST /signin`.

## Postman Collection

- [Collection JSON](Postman/CSCI3916_HW5.postman_collection.json)
- [Collection Postman Link](https://www.postman.com/elijah-heimsoth-6556435/csci-3916-web-api-spring-2026/collection/49915090-6544b16b-d3ef-498c-be02-268583bc990d/?action=share&creator=0)
- [Environment JSON](Postman/HEIMSOTH%20-%20HW5.postman_environment.json)
- [Environment Postman Link](https://www.postman.com/elijah-heimsoth-6556435/csci-3916-web-api-spring-2026/environment/49915090-65dc4442-3de9-486d-89fb-a8dac58e45a9/heimsoth-hw5?action=share&creator=0)

### Collection Details


| #   | Request                                     | Method                       | Expected Status |
| --- | ------------------------------------------- | ---------------------------- | --------------- |
| 1   | Signup (random user)                        | POST /signup                 | 200             |
| 2   | Signin (get JWT token)                      | POST /signin                 | 200             |
| 3   | Save a movie                                | POST /movies                 | 200             |
| 4   | Get all movies (sorted by `avgRating` desc) | GET /movies                  | 200             |
| 5   | Get movie (without `?reviews=true`)         | GET /movies/:id              | 200             |
| 6   | Update a movie                              | PUT /movies/:id              | 200             |
| 7   | Error: Duplicate signup                     | POST /signup                 | 409             |
| 8   | Error: Missing movie fields                 | POST /movies                 | 400             |
| 9   | Error: Too few actors                       | POST /movies                 | 400             |
| 10  | Error: Nonexistent movie                    | GET /movies/:id              | 404             |
| 11  | Error: No auth                              | GET /movies                  | 401             |
| 12  | Post a review                               | POST /reviews                | 200             |
| 13  | Get movie with reviews                      | GET /movies/:id?reviews=true | 200             |
| 14  | Error: Review nonexistent movie             | POST /reviews                | 404             |
| 15  | Delete a movie                              | DELETE /movies/:id           | 200             |


### How to Run

1. Import the Collection JSON and Environment JSON into Postman
2. Select the **HEIMSOTH - HW5** environment
3. Run the collection - all 15 requests should pass

