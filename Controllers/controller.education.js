const User = require('../Models/user');


const AddEducation = async (req, res) =>{
try{
    const username=req.params.username;
    const { school, degree, startDate, endDate}=req.body;
    const updatedUser = await User.findOneAndUpdate(
        { username: username },
        {
            $push: {
                education: {
                    school,
                    degree,
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
    AddEducation,
}