const User = require('../Models/user');

//ajouter un project 
const Addproject = async (req, res) =>{
try{
    const username=req.params.username;
    const { title, startDate, endDate,description}=req.body;
    const updatedUser = await User.findOneAndUpdate(
        { username: username },
        {
            $push: {
                project: {
                    title,
                    description,
                    startDate,
                    endDate,
                  
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
    Addproject,
}