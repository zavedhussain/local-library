const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const connectdb = async (url) => {
  try {
    await mongoose.connect(url);
    console.log("DB connected...");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectdb;
