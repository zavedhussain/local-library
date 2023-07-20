const Author = require("../models/Author");
const Book = require("../models/Book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort("first_name").exec();
  res.render("author_list", { title: "Author List", author_list: allAuthors });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);
  if (!author) {
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }
  res.render("author_detail", {
    title: "Author Detail",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
  //Middleware 1 for first_name validation
  body("first_name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),

  //Middleware 2 for family_name validation
  body("family_name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),

  //Middleware 3 for date_of_birth validation
  //allow empty value, check ISO format, convert to JS Date type
  body("date_of_birth").optional({ values: "falsy" }).isISO8601().toDate(),

  //Middleware 4 for date_of_death validation
  body("date_of_death").optional({ values: "falsy" }).isISO8601().toDate(),

  //Middleware 5 for processing request
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const { first_name, family_name, date_of_birth, date_of_death } = req.body;
    const author = new Author({
      first_name,
      family_name,
      date_of_birth,
      date_of_death,
    });

    if (!errors.isEmpty()) {
      return res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
    } else {
      const authorExists = await Author.findOne({
        first_name,
        family_name,
      }).exec();

      if (authorExists) {
        // author exists, redirect to its detail page.
        res.redirect(authorExists.url);
      } else {
        // New author saved. Redirect to author detail page.
        await author.save();
        res.redirect(author.url);
      }
    }
  }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);
  if (!author) {
    // No results.
    res.redirect("/catalog/authors");
  }
  res.render("author_delete", {
    title: "Delete Author",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Handle Author delete on POST.
exports.author_delete_post = [
  //Middleware 1 authorid
  body("authorid", "Author Id is required").trim().isLength({ min: 1 }),

  asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (allBooksByAuthor.length > 0) {
      // Author has books. Render in same way as for GET route.
      return res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor,
      });
    } else {
      // Author has no books. Delete object and redirect to the list of authors.
      await Author.findByIdAndRemove(req.body.authorid);
      res.redirect("/catalog/authors");
    }
  }),
];

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id);
  if (!author) {
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }
  res.render("author_form", { title: "Update Author", author });
});

// Handle Author update on POST.
exports.author_update_post = [
  //Middleware 1 for first_name validation
  body("first_name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),

  //Middleware 2 for family_name validation
  body("family_name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),

  //Middleware 3 for date_of_birth validation
  //allow empty value, check ISO format, convert to JS Date type
  body("date_of_birth").optional({ values: "falsy" }).isISO8601().toDate(),

  //Middleware 4 for date_of_death validation
  body("date_of_death").optional({ values: "falsy" }).isISO8601().toDate(),

  //Middleware 5 for processing request
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const { first_name, family_name, date_of_birth, date_of_death } = req.body;
    const author = new Author({
      first_name,
      family_name,
      date_of_birth,
      date_of_death,
      _id: req.params.id, //Required to update this specific author
    });

    if (!errors.isEmpty()) {
      return res.render("author_form", {
        title: "Update Author",
        author: author,
        errors: errors.array(),
      });
    } else {
      // New author saved. Redirect to author detail page.
      const theAuthor = await Author.findByIdAndUpdate(req.params.id, author);
      res.redirect(theAuthor.url);
    }
  }),
];
