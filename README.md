# Full Stack JavaScript Techdegree Project 11: Express API by Alessandro Pepe

## Updates upon project review:

* Rearranged and refactored.
* Fixed deprecated Mongoose seeding; broke with Mongo update.
  * Because of this, running 'npm run seed' no longer necessary; integrated seeding into ./src/index.js.
* Fixed log out bug, should be working properly now.
* Fixed course updating bug, should be working properly now.
* Fixed review creation bug, should be working properly now.

### Routing

* /api/courses
  * GET - Returns a list of courses
  * POST - Creates a course

* /api/courses/:id
  * GET - Returns a single course
  * PUT - Updates a course

* /api/courses/:courseId/reviews
  * POST - Creates a review for the specified course

* /api/courses/:courseId/reviews/:id
  * DELETE - Deletes a review

* /api/users
  * POST - Creates a user

* /api/users/
  * GET - Returns the current user

## Getting Started

### Install
```
$ npm i
```
### Run App
```
$ npm start
```
### View application
```
http://localhost:5000
```
### Prerequisite
* [Node.js](https://nodejs.org/en/)
* [MongoDB](https://www.mongodb.com/)
* [Angular](https://angular.io/)
* Remaining dependencies listed in package.json.
