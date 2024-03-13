const express = require('express');
const router = express.Router();
const User = require('../Models/user');
const statsController = require('../Controllers/controller.statistiques')

// Route pour obtenir les statistiques du statut du profil
router.get('/user-status', statsController.getUserStatusStats);

// Route pour obtenir les statistiques du genre des utilisateurs
router.get('/user-gender', statsController.getUserGenderStats);

// Route pour obtenir les statistiques du rôle des utilisateurs
router.get('/user-role', statsController.getUserRoleStats);

// Route pour obtenir les statistiques de la tranche d'âge des utilisateurs
router.get('/user-age-group', statsController.getUserAgeGroupStats);

//count all users 
router.get('/count',statsController.countUsers);

router.get('/user-registration-stats', statsController.getUserRegistrationStats);

//new users par month
 router.get('/new-users-per-month', statsController.getNewUsersPerMonthStats);









module.exports = router;