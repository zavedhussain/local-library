const BookInstance = require("../models/BookInstance");
const Book = require("../models/Book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allbookInstances = await BookInstance.find({}).populate("book").exec();
  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allbookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();
  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").exec();
  res.render("bookinstance_form", {
    title: "Create BookInstance",
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  //Middleware 1 book
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),

  //Middleware 2 imprint
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  //Middleware 3 status
  body("status").escape(),

  //Middleware 4 due date
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const { book, imprint, status, due_back } = req.body;
    const bookInstance = new BookInstance({ book, imprint, status, due_back });
    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").exec();

      return res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        bookinstance: bookInstance,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();
  if (!bookInstance) {
    res.redirect("/catalog/bookinstances");
  }
  res.render("bookinstance_delete", {
    title: "Delete Copy",
    bookinstance: bookInstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = [
  //Middleware 1 bookinstance id
  body("bookinstanceid", "Book Instance is required")
    .trim()
    .isLength({ min: 1 }),

  //Middleware for handling request
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.redirect("/catalog/bookinstances");
    }
    await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
    res.redirect("/catalog/bookinstances");
  }),
];

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate("book").exec(),
    Book.find({}, "title").exec(),
  ]);
  if (!bookInstance) {
    const err = new Error("No Book Instance Found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_form", {
    title: "Update BookInstance",
    book_list: allBooks,
    bookinstance: bookInstance,
  });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  //Middleware 1 book
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),

  //Middleware 2 imprint
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  //Middleware 3 status
  body("status").escape(),

  //Middleware 4 due date
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const { book, imprint, status, due_back } = req.body;
    const bookInstance = new BookInstance({
      book,
      imprint,
      status,
      due_back,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").exec();

      return res.render("bookinstance_form", {
        title: "Update BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        bookinstance: bookInstance,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid
      const theBookInstance = await BookInstance.findByIdAndUpdate(
        req.params.id,
        bookInstance
      );
      res.redirect(theBookInstance.url);
    }
  }),
];
