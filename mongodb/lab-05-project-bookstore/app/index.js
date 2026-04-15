const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());

// --- MongoDB Connection ---
const MONGO_URL =
  process.env.MONGO_URL ||
  "mongodb://admin:secret@localhost:27017/bookstore?authSource=admin";
const DB_NAME = "bookstore";

let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("Connected to MongoDB");
}

// --- Helper: สร้าง ObjectId อย่างปลอดภัย ---
function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// =============================================================
// GET /books -- รายการหนังสือ (filter, search, pagination)
// =============================================================
app.get("/books", async (req, res) => {
  try {
    const {
      author,
      genre,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // สร้าง filter
    const filter = {};

    if (author) {
      filter.author = author;
    }

    if (genre) {
      filter.genre = genre;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    // Query
    const [books, total] = await Promise.all([
      db
        .collection("books")
        .find(filter, { projection: { reviews: 0 } })
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      db.collection("books").countDocuments(filter),
    ]);

    res.json({
      data: books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// GET /books/:id -- รายละเอียดหนังสือพร้อม reviews
// =============================================================
app.get("/books/:id", async (req, res) => {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const book = await db.collection("books").findOne({ _id });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ data: book });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// POST /books -- เพิ่มหนังสือใหม่
// =============================================================
app.post("/books", async (req, res) => {
  try {
    const { title, author, genre, price, pages, isbn, description, publishedYear } =
      req.body;

    // Validation
    if (!title || !author) {
      return res.status(400).json({ error: "title and author are required" });
    }

    const newBook = {
      title,
      author,
      genre: genre || "uncategorized",
      price: Number(price) || 0,
      pages: Number(pages) || 0,
      isbn: isbn || null,
      description: description || "",
      publishedYear: Number(publishedYear) || null,
      inStock: true,
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("books").insertOne(newBook);

    res.status(201).json({
      message: "Book created",
      data: { _id: result.insertedId, ...newBook },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// PUT /books/:id -- แก้ไขหนังสือ
// =============================================================
app.put("/books/:id", async (req, res) => {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const { title, author, genre, price, pages, isbn, description, publishedYear, inStock } =
      req.body;

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (author !== undefined) updateFields.author = author;
    if (genre !== undefined) updateFields.genre = genre;
    if (price !== undefined) updateFields.price = Number(price);
    if (pages !== undefined) updateFields.pages = Number(pages);
    if (isbn !== undefined) updateFields.isbn = isbn;
    if (description !== undefined) updateFields.description = description;
    if (publishedYear !== undefined) updateFields.publishedYear = Number(publishedYear);
    if (inStock !== undefined) updateFields.inStock = Boolean(inStock);
    updateFields.updatedAt = new Date();

    const result = await db
      .collection("books")
      .findOneAndUpdate(
        { _id },
        { $set: updateFields },
        { returnDocument: "after" }
      );

    if (!result) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book updated", data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// DELETE /books/:id -- ลบหนังสือ
// =============================================================
app.delete("/books/:id", async (req, res) => {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const result = await db
      .collection("books")
      .findOneAndDelete({ _id });

    if (!result) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book deleted", data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// POST /books/:id/reviews -- เพิ่ม review (embedded subdocument)
// =============================================================
app.post("/books/:id/reviews", async (req, res) => {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const { user, rating, comment } = req.body;

    if (!user || !rating) {
      return res.status(400).json({ error: "user and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    const review = {
      user,
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date(),
    };

    const result = await db
      .collection("books")
      .findOneAndUpdate(
        { _id },
        {
          $push: { reviews: review },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );

    if (!result) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(201).json({ message: "Review added", data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// Start Server
// =============================================================
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Bookstore API running on http://localhost:${PORT}`);
  });
});
