const express = require('express');
const passport = require('../Config/passport');
const userController = require('../Controllers/controller.user');
const router = express.Router();
const verifyJWT = require('../Middlewares/verifyJWT')
const educationController=require('../Controllers/controller.education');
const experienceController=require('../Controllers/controller.experience');
const projectcontroller=require('../Controllers/controller.project');
router.post('/register', userController.registerUser);

router.put('/profile/update/:username',userController.updateprofile);
router.get('/profiles/:username',verifyJWT ,userController.getinfouser);
router.post('/upload-image',userController.uploadimage);
router.post('/upload-coverimage',userController.uploadcoverimage);
router.get('/Otherprofiles/:username' ,userController.getinfouser);

//education user
router.post('/neweducation/:username',educationController.AddEducation);
//experience user
router.post('/newexperience/:username',experienceController.AddExperience);
//project user
router.post('/newproject/:username',projectcontroller.Addproject);
module.exports = router;
