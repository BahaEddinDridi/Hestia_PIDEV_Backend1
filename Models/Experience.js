const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    title: {
        type: String,
        
    },
    company: {
        type: String,
       
    },
    startDate: {
        type: Date,
       
    },
    endDate: {
        type: Date,
    },
    description: {
        type: String,
    },

});
const Experience = mongoose.model('Experience', experienceSchema);

module.exports = Experience;