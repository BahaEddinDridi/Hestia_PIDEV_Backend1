const authController = require("../Controllers/controller.auth");
const User = require('../Models/user');
const passport = require("../Config/passport");
const express = require("express");
const router = express.Router();
const loginLimiter = require("../Middlewares/loginLimiter")

router.post('/google/callback',authController.callBackFromGoogle);

router.post('/login',loginLimiter , authController.loginUser);
router.get('/refresh', authController.refresh);
router.post('/logout',authController.logout);
router.get('/protected-route' ,authController.protectedRoute);

router.post('/linkedin/callback', (req, res) => {
    res.json({ accessToken: 'your_access_token' });
});
router.post('/updatePassword', authController.updatePassword);
router.post('/send-email', authController.emailVerif);
router.post('/Reset_Passwords_Mail/:_id/:token', authController.resetPassword);
router.post('/addRecoveryMail', authController.addRecoveryMail);
router.post('/SecurityQuestion', authController.SecurityQuestion);
router.post('/verifySecurityQuestion', authController.verifySecurityQuestion);
router.post('/receiveMail', authController.receiveMail);







module.exports = router;