const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BookSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    // reference to Author model
    //Mongoose has a more powerful alternative called populate(),
    // which lets you reference documents in other collections
    type: Schema.Types.ObjectId,
    ref: "Author",
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  isbn: {
    type: String,
    required: true,
  },
  genre: [
    //can have ref to multiple genres, so we use an array
    {
      type: Schema.Types.ObjectId,
      ref: "Genre",
      required: true,
    },
  ],
});

BookSchema.virtual("url").get(function () {
  //Declaring our URLs as a virtual in the schema is a good idea
  // because then the URL for an item only ever needs to be
  // changed in one place.
  return `/catalog/book/${this._id}`;
});

module.exports = mongoose.model("Book", BookSchema);
