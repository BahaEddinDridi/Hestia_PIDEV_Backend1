const express =require('express');
const User =require('../Models/user');
const bcrypt = require('bcrypt');


//exportation DATA
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');






//affichage users
const affichageUsers =async(req,res)=>{
    try{
        const foundUsers =await User.find({role:{$ne:'admin'}});
        res.status(200).json(foundUsers);
    }catch(error){
        console.error(error);
        res.status(500).json({error:'Internal Server Error'});
    }
};
//ajout user
const ajoutUser=async(req,res)=>{
    try{
        const{firstName,lastName,birthDate,username,email,password,role,image,status,gender,location,phoneNumber,title,experience,education,project}=req.body;
        const hashedPassword=await bcrypt.hash(password,10);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const newUser = new User({
            firstName,
            lastName,
            birthDate,
            username,                                  
            email,
            password:hashedPassword,
            role,
            image,
            status,
            gender,
            location,
            phoneNumber,
            title,
            experience,
            education,
            project,
        });
        await newUser.save();
        res.status(201).json({message:'User added successfully'});
    }catch (error){
        console.error(error);
        res.status(500).json({error:'Internal Server Error'});
    }
};
//get user by ID
const getuserById= async(req,res)=>{
    try{
        const userId =req.params.id;
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({error:'User not found'});

        }
        return res.status(200).json(user);
    }catch(error){
        console.error(error);
        res.status(500).json({error:'Internal Server Error'});
    }
};

//suppression d'un user 
const deleteUserById = async (req,res)=>{
    try{
        const userId =req.params.id;
        const user =await User.findById(userId);

        if(!user){
            return res.status(404).json({ error:'User not Found'});
        }
        await User.findByIdAndDelete(userId);
        return res.status(200).json({message:'User deleted successfuly'});
    }catch(error){
        console.error(error);
        res.status(500).json({error:'Internal Server Error'});
    }
};
//update user by Id 
const updateUserRoleById = async(req,res)=>{
    try{
        const userId=req.params.id;;
        const{role}=req.body;

        if(!role || !['jobSeeker','professional','teacher'].includes(role)){
            return res.status(400).json({error:'Invalid role'});
        }
        const user =await User.findByIdAndUpdate(userId,{role},{new:true});

        if(!user){
            return res.status(404).json({error:'User not Found'});
        }
        return res.status(200).json(user);
    }catch (error){
        console.error(error);
        res.status(500).json({error:'Internal Server Error'});
    }
};



//exportation data EXCEL 
const exportExcel = async (req, res) => {
    try {
        const users = await User.find();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Users');
        worksheet.columns = [
            { header: 'First Name', key: 'firstName', width: 20 },
            { header: 'Last Name', key: 'lastName', width: 20 },
            { header: 'BirthDate', key: 'birthDate', width: 20 },
            { header: 'UserName', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 20 },
            { header: 'Role', key: 'role', width: 20 },
            { header: 'Image', key: 'image', width: 20 },
            { header: 'Gender', key: 'gender', width: 20 },
            { header: 'ProfileStatus', key: 'ProfileStatus', width: 20 },

            
        ];
        users.forEach(user => {
            worksheet.addRow(user.toJSON());
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

//exportation data to pdf
const exportPDF =  async (req, res) => {
    try {
        const users = await User.find();
        const pdf = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=users.pdf');
        pdf.pipe(res);
        users.forEach(user => {
            pdf.text(`First Name: ${user.firstName}`);
            pdf.text(`Last Name: ${user.lastName}`);
            pdf.text(`BirthDate: ${user.birthDate}`);
            pdf.text(`User Name: ${user.username}`);
            pdf.text(`Email: ${user.email}`);
            pdf.text(`Role: ${user.role}`);
            pdf.text(`Image: ${user.image}`);
            pdf.text(`Gender: ${user.gender}`);
            pdf.text(`Profile Status: ${user.ProfileStatus}`);

            pdf.moveDown();
        });
        pdf.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

//desactivation du compte 
const desactiveProfilById =async (req, res) => {
    const userId = req.params.id;
    const { newStatus } = req.body;
  
    try {
      // Vérifiez si l'utilisateur existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      // Vérifiez les conditions pour changer le ProfileStatus
      if (user.ProfileStatus === 'active' && (newStatus === 'deactivated' || newStatus === 'banned')) {
        user.ProfileStatus = newStatus;
      } else if (user.ProfileStatus === 'deactivated' && (newStatus === 'active' || newStatus === 'banned')) {
        user.ProfileStatus = newStatus;
      } else {
        return res.status(400).json({ message: 'Impossible de changer le ProfileStatus' });
      }
  
      // Sauvegardez les modifications dans la base de données
      await user.save({ runValidators: false });
      return res.status(200).json({ message: 'ProfileStatus modifié avec succès', user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  };

//count all users
const countUsers =async(req,res)=>{
    try{
        const count =await User.countDocuments();
        res.status(200).json({count});
    }catch(error){
        console.error(error);
        res.status(500).json({error:'Internal Server Error'});
    }
};
//get profilAdmin 
const getUserByUsernameAdmin = async (req, res) => {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username, role: 'admin' });
  
      if (!user) {
        return res.status(404).json({ error: 'Admin not found' });
      }
  
      res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  //update profil Admin 
 const updateByusernameAdmin= async (req, res) => {
    try {
      const username = req.params.username;
      const updatedAdmin = req.body; // Nouvelles informations de l'admin à mettre à jour
  
      // Mettre à jour l'admin dans la base de données
      const result = await User.findOneAndUpdate({ username: username }, updatedAdmin, { new: true });
  
      if (!result) {
        return res.status(404).json({ message: "Admin not found" });
      }
  
      return res.status(200).json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  


  


module.exports ={
    affichageUsers,
    ajoutUser,
    getuserById,
    deleteUserById,
    updateUserRoleById,
    exportExcel,
    exportPDF,
    desactiveProfilById,
    countUsers,
    getUserByUsernameAdmin,
    updateByusernameAdmin,

    
};