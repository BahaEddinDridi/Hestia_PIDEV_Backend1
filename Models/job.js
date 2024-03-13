const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobTitle : {
        type: String,
        required: true,
    },
    jobCompany : {
        type: String,
        required: true,
    },
    jobDescription : {
        type: String,
        required: true,
    },
    salary: {
        type: Number,
        required: true,
        min: 0,
    },
    jobType: {
        type: String,
        required: true,
    },
    jobApplicationDeadline: {
        type: Date,
        required: true,
    },
    jobRequirement: {
        type: String,
        required: true,
    },
});

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;