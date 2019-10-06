//Create route to Profile
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const request = require('request');
const config = require('config');

//public route
//doesn't need token
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
  res.send("Profile route");
});

//post to api/profile
//private
//create update user profile
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required")
        .not()
        .isEmpty(),
      check("skills", "Skill is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    //create profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    }

    // create social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = Profile.findOne({ user: req.user.id });
      if (profile) {
        //update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      //create
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//post to api/profile
//public
//get all profile
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error("err.message");
    res.status(500).send("Server Error");
  }
});

//post to api/profile/user/:user_id
//public
//get profile by user id
router.get("/user/:user_id", async (req, res) => {
  try {
    const profiles = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);

    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    res.json(profiles);
  } catch (err) {
    console.error("err.message");
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

//delete to api/profile
//private
//delete profile user and post
router.delete("/", async (req, res) => {
  try {
    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error("err.message");
    res.status(500).send("Server Error");
  }
});

//put to api/profile/experience
//private
//add profile exp
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required")
        .not()
        .isEmpty(),
      check("company", "Company is required")
        .not()
        .isEmpty(),
      check("from", "from Date is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({erros: errors.array()})
    }

    const {title,company,location,from,to,current,description} = req.body;

    const newExp = {title,company,location,from,to,current,description}

    try{
      const profile = await Profile.findOne({user: req.user.id});

      profile.experience.unshift(newExp);
      await profile.save();

      res.json(profile);

    } catch (err) {
      console.error("err.message");
      res.status(500).send("Server Error");
    }
  }
);

//delete to api/profile/experience/exp_id
//private
//delete experience
router.delete('/experience/:exp_id',auth, async (req,res) => {
  try{
    const profile = await Profile.findOne({user: req.user.id});

    //get remove index
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

    //remove the experience
    profile.experience.splice(removeIndex,1);
    await profile.save();
    res.json(profile);

  }catch (err) {
    console.error("err.message");
    res.status(500).send("Server Error");
  }
})


//put to api/profile/education
//private
//add profile education
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'Field of study is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//delete to api/profile/education/edu_id
//private
//delete education
router.delete('/education/:edu_id',auth, async (req,res) => {
  try{
    const profile = await Profile.findOne({user: req.user.id});

    //get remove index
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

    //remove the experience
    profile.education.splice(removeIndex,1);
    await profile.save();
    res.json(profile);

  }catch (err) {
    console.error("err.message");
    res.status(500).send("Server Error");
  }
})

//get to api/profile/github/:username
//public
//get user repo from github
router.get('/github/:username', (req,res) => {
  try{
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: {'user-agent': 'node.js'}
    };

    request(options, (error,response,body) => {
      if(error) {
        console.error(error);
      }
      if(response.statusCode !== 200){
        return res.status(404).json({msg: 'No Github profile found'});
      }
      res.json(JSON.parse(body));
    })

  }catch (err) {
    console.error("err.message");
    res.status(500).send("Server Error");
  }
})

module.exports = router;
