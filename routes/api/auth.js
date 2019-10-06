//Create route to Auth
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require("express-validator");
const jwt= require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
//public route
//doesn't need token
router.get('/',auth, async (req, res) => {
  try{
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  }catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Password is required"
    ).exists()
  ],
  async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }

    const {email, password} = req.body;

    try{

      //check if user exist
      let user = await User.findOne({email});

      if(!user){
        return res.status(400).json({errors: [{msg:'Invalid credentials'}]});
      }

      user = new User({
        name, email, avatar, password
      });
      //return jsonwebtoken

      const isMatch = await bcrypt.compare(password, user.password);

      if(!isMatch){
        return res.status(400).json({errors: [{msg:'Invalid credentials'}]});
      }

      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(payload, config.get('jwtSecret'),{expiresIn:360000}, (err, token) => {
        if(err) throw err;
        res.json({token});
      });

      res.send("User register");

    }catch(err){
      console.error('err.message');
      res.status(500).send('Server Error')
    }


  }
);

module.exports = router;
