const express =require('express');
const User =require('../Models/user');
const bcrypt = require('bcrypt');



//statistiques

//count all users
const countUsers = async (req, res) => {
    try {
        const count = await User.countDocuments({ role: { $ne: 'admin' } });
        res.status(200).json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



//Nombre total d'utilisateurs par statut de profil
const getUserStatusStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            { $match: { role: { $ne: 'admin' } } }, // Exclure les utilisateurs avec le rôle 'admin'
            { $group: { _id: "$ProfileStatus", count: { $sum: 1 } } }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//Nombre total d'utilisateurs par genre
const getUserGenderStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            { $match: { role: { $ne: 'admin' } } }, // Exclure les utilisateurs avec le rôle 'admin'
            { $group: { _id: "$gender", count: { $sum: 1 } } }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


//Nombre total d'utilisateurs par rôle
const getUserRoleStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            { $match: { role: { $ne: 'admin' } } }, // Exclure les utilisateurs avec le rôle 'admin'
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
//Nombre total d'utilisateurs par tranche d'âge
const getUserAgeGroupStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            { $match: { role: { $ne: 'admin' } } }, // Exclure les utilisateurs avec le rôle 'admin'
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $gte: ["$birthDate", new Date("2000-01-01")] }, then: "18-24" },
                                { case: { $gte: ["$birthDate", new Date("1995-01-01")] }, then: "25-34" },
                                { case: { $gte: ["$birthDate", new Date("1985-01-01")] }, then: "35-44" },
                                { case: { $gte: ["$birthDate", new Date("1975-01-01")] }, then: "45-54" },
                                { case: { $gte: ["$birthDate", new Date("1965-01-01")] }, then: "55-64" },
                                { case: { $lt: ["$birthDate", new Date("1965-01-01")] }, then: "65+" }
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
//Évolution du nombre d'utilisateurs au fil du temps :
const getUserRegistrationStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $match: {
                    role: { $ne: "admin" } 
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//nbre de users par month
const getNewUsersPerMonthStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $match: { role: { $ne: 'admin' } } // Exclure les utilisateurs avec le rôle "admin"
            },
            {
                $group: {
                    _id: { $month: "$createdAt" }, // Grouper par mois de création
                    count: { $sum: 1 } // Compter le nombre d'utilisateurs dans chaque groupe
                }
            }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};








  


module.exports ={
    getUserStatusStats,
    getUserGenderStats,
    getUserRoleStats,
    getUserAgeGroupStats,
    countUsers,
    getUserRegistrationStats,
    getNewUsersPerMonthStats,
    
    
};