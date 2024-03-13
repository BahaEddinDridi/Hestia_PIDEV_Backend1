const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
    internshipTitle : {
        type: String,
       
    },
    internshipCompany : {
        type: String,
       
    },
    internshipDescription : {
        type: String,
      
    },
    internshipLocation: {
        type: String,
       
    },
    internshipDuration: {
        type: Number,
       
    },
});

const Internship = mongoose.model('Internship', internshipSchema);
module.exports = Internship;