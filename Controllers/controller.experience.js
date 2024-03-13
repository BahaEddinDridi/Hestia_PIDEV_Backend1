const User = require('../Models/user');

//ajouter un experience 
const AddExperience = async (req, res) =>{
try{
    const username=req.params.username;
    const { title, company, startDate, endDate,description}=req.body;
    const updatedUser = await User.findOneAndUpdate(
        { username: username },
        {
            $push: {
                experience: {
                    title,
                    company,
                    startDate,
                    endDate,
                    description,
                },
            },
        },
        { new: true }
    );
res.json({ success: true, data: updatedUser });
} catch (error) {
    console.error('Erreur :', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
}
}
module.exports={
    AddExperience,
}