const Book = require("../models/Book");
const BookInstance = require("../models/BookInstance");
const Genre = require("../models/Genre");
const Author = require("../models/Author");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.index = asyncHandler(async (req, res, next) => {
  const [
    numBooks,
    numGenres,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: "Available" }).exec(),
    Author.countDocuments({}).exec(),
  ]);
  res.render("index", {
    title: "Local Library Home",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  //projection -> select title and author
  //this will return _id and virtual fields(url here) as well
  //sort -> title ascending
  //populate -> author's ObjectIds with author values
  const allBooks = await Book.find({}, "title author")
    .sort("title")
    .populate("author")
    .exec();
  // console.log(allBooks[0].url);
  res.render("book_list", { title: "Book List", book_list: allBooks });
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({ book: req.params.id }).sort("status").exec(),
  ]);
  if (!book) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }
  res.render("book_detail", {
    title: book.title,
    book: book,
    book_instances: bookInstances,
  });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  // Get all authors and genres, which we can use for adding to our book.
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().exec(),
    Genre.find().exec(),
  ]);
  res.render("book_form", {
    title: "Create book",
    genres: allGenres,
    authors: allAuthors,
  });
});

// Handle book create on POST.
exports.book_create_post = [
  //Middleware 1 to convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate and sanitize fields.
  //Middleware 2 for handling "title"
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  //Middleware 3 for handling "author"
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  //Middleware 4 for handling "summary"
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  //Middleware 5 for handling "isbn"
  body("isbn", "ISBN must not be empty.").trim().isLength({ min: 1 }).escape(),

  //Middleware 6 for handling "genre"
  //apply to all genres in genres array using wildcard notation-> .*
  body("genre.*", "Genre must not be empty.").escape(),

  //Middleware 7 for processing request
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors that were attached by prev middleware
    // into the request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    const { title, author, summary, isbn, genre } = req.body;
    const book = new Book({ title, author, summary, isbn, genre });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec(),
      ]);

      // Mark our selected genres as checked.
      for (const genre of allGenres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      return res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
    } else {
      const bookExists = await Book.findOne({ title }).exec();
      if (bookExists) {
        res.redirect(bookExists.url);
      } else {
        await book.save();
        res.redirect(book.url);
      }
    }
  }),
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  if (!book) {
    //Book id does not exist
    res.redirect("/catalog/books");
  }

  res.render("book_delete", {
    title: "Delete Book",
    book: book,
    bookinstances: bookInstances,
  });
});

// Handle book delete on POST.
exports.book_delete_post = [
  //Middleware for book id
  body("bookid").trim().isLength({ min: 1 }),

  //Middleware for request processing
  asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
      Book.findById(req.params.id).exec(),
      BookInstance.find({ book: req.params.id }).exec(),
    ]);
    if (bookInstances.length > 0) {
      res.render("book_delete", {
        title: "Delete Book",
        book: book,
        bookinstances: bookInstances,
      });
    } else {
      //delete book and redirect
      await Book.findByIdAndRemove(req.body.bookid);
      res.redirect("/catalog/books");
    }
  }),
];

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  // Get book, authors and genres for form.
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    Author.find().exec(),
    Genre.find().exec(),
  ]);

  if (book === null) {
    // No results.
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  // Mark our selected genres as checked.
  for (const genre of allGenres) {
    for (const book_g of book.genre) {
      if (genre._id.toString() === book_g._id.toString()) {
        genre.checked = "true";
      }
    }
  }

  res.render("book_form", {
    title: "Update Book",
    authors: allAuthors,
    genres: allGenres,
    book: book,
  });
});

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec(),
      ]);

      // Mark our selected genres as checked.
      for (const genre of allGenres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      const thebook = await Book.findByIdAndUpdate(req.params.id, book);
      // Redirect to book detail page.
      res.redirect(thebook.url);
    }
  }),
];
