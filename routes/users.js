const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config/db');


//Register
router.post('/register', (req, res, next) => {
  let newUser = new User({
    name: req.body.name,
    username: req.body.username,
    password: req.body.password,
    info: req.body.info
  });

  User.addUser(newUser, (err, user) => {
    if(err){
      res.json({success: false, msg:'Failed to register a new user. Username is taken!'});
    } else {
      res.json({success: true, msg:'New user registered'});
    }
  });
});

//Authenticate
router.post('/authenticate', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  User.getUserByUsername(username, (err, user) => {
    if(err) throw err;
    if(!user){
      return res.json({success: false, msg: 'User is not found'});
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if(err) throw err;
      if(isMatch){
        const token = jwt.sign(user.toJSON(), config.secret, {
          expiresIn: 86400 //Expires after 24 hours (or 86400 seconds)
        });

        res.json({
          success: true,
          token: 'JWT '+token,
          user: {
            id: user._id,
            name: user.name,
            username: user.username,
            info: user.info
          }
        });
      } else{
        return res.json({success: false, msg: 'Wrong password! Please try again'});
      }
    });
  });
});

//Details
router.get('/details', passport.authenticate('jwt', {session: false}), (req, res, next) => {
  res.json({user: req.user});
});


//Update user info
router.put('/update', passport.authenticate('jwt', {session: false}), (req, res, next) => {
  User.getUserByUsername(req.user.username, (err, user) => {
    if(err) throw err;
    if(!user){
      return res.json({success: false, msg: 'User is not found'});
    }
    if (req.body.info) user.info = req.body.info;
    //Save the user
    user.save(function(err) {
      if (err){
        return res.json({success: false, msg: 'Unable to update'});
      }
      //Return a message
      res.json({success: true, msg: 'List of Keys updated' });
    });
  });
});

module.exports = router;
