import { Request, Response } from "express";
import { Product } from "../models/productModel";

class SearchController {
  searchProducts = async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
        res.status(400).json({ message: "Search query is required" });
        return;
    }

    try {
      const results = await Product.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { brand: { $regex: query, $options: "i" } },
          { type: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ],
      });

      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ message: "Error searching products", error });
    }
  };
}

export default new SearchController();