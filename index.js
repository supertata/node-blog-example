const path = require("path");
const express = require("express");
const cors = require("cors");
const { database } = require("./database");

const server = express();
const port = 3001;

server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
server.use(express.json());
server.use(cors());

//Create a query which will give back all the posts based on one of the following:
// title starts with a given a string -> title
// body contains a given string -> body
// I also wish to limit the number of items ->limit
// Examples:

// /posts?body=the&limit=2 --> will return all posts which contain the 'the' in the body,
// but no more than 2 posts will be returned

// /posts?title=Student --> will return all posts whose title starts with 'Student'

// /posts?limit = 2 -->
//will return all posts, but the maximum 2

server.get("/posts", (req, res) => {
  const { title, body, limit } = req.query;
  let foundPosts = database.posts;
  if (title !== undefined) {
    foundPosts = database.posts.filter((post) => post.title.startsWith(title));
  }
  if (body !== undefined) {
    foundPosts = database.posts.filter((post) => post.body.includes(body));
  }
  if (limit !== undefined) {
    foundPosts = foundPosts.slice(0, Number(limit));
  }

  res.json(foundPosts);
});

server.get("/posts/:postId", (req, res) => {
  const { postId } = req.params;
  const post = database.posts.find((p) => p.id === parseInt(postId));
  if (post !== undefined) {
    res.json(post);
  } else {
    res.status(404).send();
  }
});

//1. retrieve all the posts of a given user

//What is the URL of this endpoint?
// Relation: The user has posts, and not another way around,
// and not just one it can be many (plural)
// so the endpoint will be: /users/{user_id}/posts

server.get("/users/:userId/posts", (req, res) => {
  const { userId } = req.params;
  const posts = database.posts.filter((p) => p.user_id === parseInt(userId));
  if (posts !== undefined && posts.length > 0) {
    res.json(posts);
  } else {
    res.status(404).send();
  }
});

//2. retrieve one single post of a given user

//What is the URL of this endpoint?
//Relation: The user has posts, and we need one of them (singular)
//so the endpoint will be: /users/{user_id}/posts/{post_id}

server.get("/users/:userId/posts/:postId", (req, res) => {
  const { userId, postId } = req.params;
  const posts = database.posts.filter((p) => p.user_id === parseInt(userId));
  const post = posts.find((p) => p.id === parseInt(postId));
  if (post !== undefined) {
    res.json(post);
  } else {
    res.status(404).send();
  }
});

//2. (Advanced) I wish to create a new post, the user_id has to be checked

//What is the URL of this endpoint?
server.post("/posts", (req, res) => {
  let newPost = {
    title: req.body.title,
    body: req.body.body,
    user_id: req.body.user_id,
    created_at: new Date().toISOString(),
  };

  if (validatePost(newPost)) {
    //if the user exists
    let newId = database.posts[database.posts.length - 1].id + 1; //create the new id
    newPost.id = newId; //set the new post's id
    database.posts.push(newPost); //store in the array
    res.status(200).send();
  } else {
    res.status(400).send();
  }
});

function validatePost(post) {
  if (
    post !== undefined &&
    post.title !== undefined &&
    post.title.length !== 0 &&
    post.body !== undefined &&
    post.body.length !== 0 &&
    post.user_id !== undefined &&
    database.users.find((u) => u.id === parseInt(post.user_id)) !== undefined
  )
    return true;
  return false;
}

//3. I wish to delete one single post based on its id

//What is the URL of this endpoint?

server.delete("/posts/:postId", (req, res) => {
  const { postId } = req.params;
  let index = database.posts.findIndex((post) => post.id === parseInt(postId));
  if (index !== -1) {
    database.posts.splice(index, 1);
    res.status(200).send();
  } else {
    res.status(404).send();
  }
});

//4. (Advanced) I wish to delete a user only if it doesn't have a post

//What is the URL of this endpoint?

// in order to be able to test it, you need to delete some posts first
server.delete("/users/:userId", (req, res) => {
  const { userId } = req.params;
  const userPosts = database.posts.filter(
    (post) => post.user_id === parseInt(userId)
  );
  if (userPosts.length === 0) {
    let index = database.users.findIndex(
      (user) => user.id === parseInt(userId)
    );
    database.users.splice(index, 1);
    res.status(200).send();
  } else {
    res.status(400).send();
  }
});

//This is the teacher led demo for the update/PUT
server.put("/posts/:postId", (req, res) => {
  const { postId } = req.params;
  let newPost = {
    title: req.body.title,
    body: req.body.body,
  };
  let post = database.posts.find((p) => p.id === parseInt(postId));
  if (post !== undefined) {
    if (newPost.title != undefined && newPost.body !== undefined) {
      post.title = newPost.title;
      post.body = newPost.body;
      post.updated_at = new Date().toISOString();
      res.json(post);
    } else {
      res.status(400).send();
    }
  } else {
    res.status(404).send();
  }
});

server.get("/users", (req, res) => {
  res.json(database.users);
});

//Exercise: based on the PUT above implement an update enpoint for the users
//Requirements:
// - 404 is the user doesn't exist
// - 400 if the data validation is failed
//1. URL ?
//2. Which fields can/should be updated?
//3. Possible validations?

server.listen(port, () =>
  console.log(`[MockServer] listening at http://localhost:${port}`)
);
