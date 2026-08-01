/**
 * bookController.js
 * ------------------
 * Business logic for Book operations:
 * - Fetch books with pagination and search
 * - Create a new book
 * - Update an existing book
 * - Delete a book
 */

const Book = require("../models/Book");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// GET ALL BOOKS
exports.getAllBooks = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 5, 1);
    const search = req.query.search?.trim() || "";
    const skip = (page - 1) * limit;

    const filter = search
      ? {
          $or: [
            { title: { $regex: escapeRegex(search), $options: "i" } },
            { author: { $regex: escapeRegex(search), $options: "i" } }
          ]
        }
      : {};

    const [books, totalBooks] = await Promise.all([
      Book.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Book.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: books,
      page,
      limit,
      totalPages: Math.max(Math.ceil(totalBooks / limit), 1),
      totalItems: totalBooks
    });
  } catch (err) {
    console.error("GET BOOKS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch books"
    });
  }
};

// CREATE BOOK
exports.createBook = async (req, res) => {
  try {
    let { title, author, year } = req.body;

    title = title?.trim();
    author = author?.trim();

    if (!title || !author || year === undefined || year === null) {
      return res.status(400).json({
        success: false,
        message: "Title, author, and year are required"
      });
    }

    const book = new Book({
      title,
      author,
      year
    });

    const savedBook = await book.save();

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: savedBook
    });
  } catch (err) {
    console.error("CREATE BOOK ERROR:", err);
    res.status(400).json({
      success: false,
      message: "Invalid book data"
    });
  }
};

// UPDATE BOOK
exports.updateBook = async (req, res) => {
  try {
    const { title, author, year } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (author !== undefined) updateData.author = author.trim();
    if (year !== undefined) updateData.year = year;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required for update"
      });
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook
    });
  } catch (err) {
    console.error("UPDATE BOOK ERROR:", err);
    res.status(400).json({
      success: false,
      message: "Invalid ID or update data"
    });
  }
};

// DELETE BOOK
exports.deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully"
    });
  } catch (err) {
    console.error("DELETE BOOK ERROR:", err);
    res.status(400).json({
      success: false,
      message: "Invalid ID"
    });
  }
};