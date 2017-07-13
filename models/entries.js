var mongoose = require("mongoose");

mongoose.createConnection(process.env.MONGODB_URI || process.env.localDb);

mongoose.Promise = global.Promise;


var blogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    time: {
        type: Date
    },
    title: {
        type: String,
        required: true
    },
    bodytext: {
        type: String,
        required: true
    }
});


var Entries = mongoose.model("Entries", blogSchema);

module.exports.mongoose = mongoose;
module.exports.Entries = Entries;
