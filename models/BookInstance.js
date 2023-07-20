const { DateTime } = require("luxon");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
  book: {
    //Book model ref
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  imprint: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["Available", "Maintenance", "Loaned", "Reserved"],
    default: "Maintenance",
  },
  due_back: {
    type: Date,
    default: Date.now(),
  },
});

// Virtual for bookinstance's URL
BookInstanceSchema.virtual("url").get(function () {
  return `/catalog/bookinstance/${this._id}`;
});

//Virtual for bookinstance's date in format :Apr 10th, 2023
BookInstanceSchema.virtual("due_back_formatted").get(function () {
  return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

BookInstanceSchema.virtual("due_back_yyyy_mm_dd").get(function () {
  return DateTime.fromJSDate(this.due_back).toISODate(); // format 'YYYY-MM-DD'
});

module.exports = mongoose.model("BookInstance", BookInstanceSchema);
