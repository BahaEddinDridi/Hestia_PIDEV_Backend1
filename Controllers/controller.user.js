const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('../Config/passport');
const User = require('../Models/user');
const asyncHandler = require('express-async-handler')

const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, birthDate, username, email, password, gender , location, phoneNumber,accountVisibility, project,title,experience,education,role,CompanyLink,Country } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            birthDate,
            username,
            email,
            gender,
            password: hashedPassword,
            location: '',
            phoneNumber,
            title:'',
            image:'',
            accountVisibility:'public',
            coverimage:'',
            experience:[],
            education:[],
            project:[],
            role,
            CompanyLink,
            Country,
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



///update profil
const updateprofile = async(req,res) =>{
    try{
      
        const{firstName,lastName,birthDate,username,email,location,phoneNumber,title,accountVisibility}=req.body;
        const userToUpdate = await User.findOne({ username: req.params.username });
        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }
        userToUpdate.firstName=firstName;
        userToUpdate.lastName=lastName;
        userToUpdate.birthDate=birthDate;
        userToUpdate.username=username;
        userToUpdate.email=email;
        userToUpdate.location=location;
        userToUpdate.phoneNumber=phoneNumber;
        userToUpdate.accountVisibility=accountVisibility;
        userToUpdate.title=title;
        await userToUpdate.save();
        res.json({message: 'Profile updated successfully',userToUpdate});
    }catch(error){
        console.error(error);
        res.status(500).json({error:'Internal server Error'});
    }
}
// view other profil
const getinfouser = async(req,res) =>{
    try {
        const { username } = req.params;
        console.log('Username:', username);
        const userProfile = await User.findOne({ username });
    
        if (!userProfile) {
          return res.status(404).json({ message: 'User profile not found' });
        }
    
        res.json(userProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
////upload photo profile 
const uploadimage= async (req,res)=>{
    const { username, imageUrl } = req.body;
    try{
        await User.findOneAndUpdate({username},{image: imageUrl});
        res.status(200).json({ message: 'Image URL saved successfully.' });
    }catch (error) {
        console.error('Error saving image URL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}
// modifier coverphot
const uploadcoverimage= async (req,res)=>{
    const { username, coverimageUrl } = req.body;
    try{
        await User.findOneAndUpdate({username},{coverimage: coverimageUrl});
        res.status(200).json({ message: 'Image URL saved successfully.' });
    }catch (error) {
        console.error('Error saving image URL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}
//ajouter education 

module.exports = {
    registerUser,
    updateprofile,
    getinfouser,
    uploadimage,
    uploadcoverimage,
};