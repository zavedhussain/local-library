const { DateTime } = require("luxon");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: {
    type: String,
    required: true,
    maxLength: 100,
  },
  family_name: {
    type: String,
    required: true,
    maxLength: 100,
  },
  date_of_birth: {
    type: Date,
  },
  date_of_death: {
    type: Date,
  },
});

//In Mongoose, a virtual is a property that is not stored in MongoDB. Virtuals are typically used for computed properties on documents.

//Virtual for author's name
AuthorSchema.virtual("name").get(function () {
  // We don't use an arrow function as we'll need the this object
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname += this.first_name + " " + this.family_name;
  }

  return fullname;
});

AuthorSchema.virtual("url").get(function () {
  //Declaring our URLs as a virtual in the schema is a good idea
  // because then the URL for an item only ever needs to be
  // changed in one place.
  return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual("birth_date").get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : "";
});

AuthorSchema.virtual("death_date").get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : "";
});

AuthorSchema.virtual("birth_date_yyyy_mm_dd").get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toISODate()
    : ""; // format 'YYYY-MM-DD'
});

AuthorSchema.virtual("death_date_yyyy_mm_dd").get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toISODate()
    : ""; // format 'YYYY-MM-DD'
});

module.exports = mongoose.model("Author", AuthorSchema);
