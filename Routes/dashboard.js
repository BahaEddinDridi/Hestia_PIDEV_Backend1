const express = require('express');
const router = express.Router();
const User = require('../Models/user');
const dashboardController = require('../Controllers/controller.dashboard')



router.get('/users', dashboardController.affichageUsers);
router.post('/adduser', dashboardController.ajoutUser);
router.get('/user/:id', dashboardController.getuserById);
router.delete('/users/:id',dashboardController.deleteUserById);
router.put('/users/:id',dashboardController.updateUserRoleById);
router.get('/count',dashboardController.countUsers);
router.get('/export-excel',dashboardController.exportExcel);
router.get('/export-pdf',dashboardController.exportPDF);
router.put('/users/:id/change-status',dashboardController.desactiveProfilById);
router.get('/ProfilAdmin/:username', dashboardController.getUserByUsernameAdmin);
router.put('/ProfilAdmin/:username/update', dashboardController.updateByusernameAdmin);




module.exports = router;


