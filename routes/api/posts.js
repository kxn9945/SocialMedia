//Create route to posts
const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");

// post api/posts
//private route
//create post
router.post('/',[auth, [check('text','Text is required')]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }



  try{
    const user = await User.findById(req.user.id).select('-password');

    const newPost = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    }

    const post = await newPost.save();
    res.json(post);

  }catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
  }

})

// get api/posts
//private get all posts
//get all posts
router.get('/',auth, async(req,res) => {
  try{
    const posts = await Post.find().sort({date: -1});
    res.json(posts);
  }catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

// get api/posts:/:id
//private
//get post by id
router.get('/:id',auth, async(req,res) => {
  try{
    const post = await Post.findById(req.params.id);

    if(!post){
      return res.status(404).json({msg: 'Post not found'})
    }

    res.json(post);
  }catch(err){
    console.error(err.message);
    if(err.kind === 'ObjectId'){
      return res.status(404).json({msg: 'Post not found'})
    }
    res.status(500).send('Server Error');
  }
})

// delete api/posts/:id
//private
//delete post by id
router.delete('/:id',auth, async(req,res) => {
  try{
    const post = await Post.findById(req.params.id);

    if(!post){
      return res.status(404).json({msg: 'Post not found'})
    }

    //Check if user create the posts
    if(post.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'User is not authorized'});
    }

    await post.remove();

    res.json({msg: 'Post removed'});
  }catch(err){
    console.error(err.message);
    if(err.kind === 'ObjectId'){
      return res.status(404).json({msg: 'Post not found'})
    }
    res.status(500).send('Server Error');
  }
})

// put api/posts/like/:id
//private
//like post
router.put('/like/:id', auth, async(req,res) => {
  try{
    const post = await Post.findById(req.params.id);

    //check if user already like the posts
    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
      return res.json(400).json({msg:'Post already like'});
    }

    post.likes.unshift({user: req.user.id});

    await post.save();
    res.json(post.likes);

  }catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})


// put api/posts/unlike/:id
//private
//unlike post
router.put('/like/:id', auth, async(req,res) => {
  try{
    const post = await Post.findById(req.params.id);

    //check if user already like the posts
    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
      return res.json(400).json({msg:'You haven\'t like the post yet'});
    }

    //get remove index
    const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);

  }catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

// post api/posts/comment/:id
//private
//comment on a post
router.post('/comment/:id',[auth, [check('text','Text is required')]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }



  try{
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);

    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    }

    post.comments.unshift(newComment);

    await post.save();
    res.json(post.comments);

  }catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
  }

})

// delete api/posts/comment/:id/:comment_id
//private
//delete comments
router.delete('/comment/:id/:comment_id',auth, async(req,res) => {
  try{
    const post = await Post.findById(req.params.id);

    //Pull out comment
    const comment = post.comments.find(comment => comment.id === req.params.comment_id);

    //check if comment exists
    if(!comment){
      return res.status(404).json({msg: 'Comment does not exist'});
    }

    //Check users
    if(comment.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'User not authorized'});
    }
    //get remove index
    const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();
    res.json(post.comments);

  }catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

module.exports = router;
