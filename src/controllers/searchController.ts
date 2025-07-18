import { Request, Response } from "express";
import { Product } from "../models/productModel";

class SearchController {
  searchProducts = async (req: Request, res: Response) => {
    try {
      const { skip, take } = req.pagination!;
      const query = req.query.query as string;

      if (!query || typeof query !== "string") {
        res.status(400).json({ message: "Search query is required" });
        return;
      }

      const regex = new RegExp(query, "i");

      const filter = {
        $or: [
          { name: { $regex: regex } },
          { type: { $regex: regex } },
          { tags: { $in: [regex] } },
        ],
      };

      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef")
          .skip(Number(skip))
          .limit(Number(take)),
        Product.countDocuments(filter),
      ]);

      res.status(200).json({
        data: products,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ message: "Error searching products", error });
      return;
    }
  };
}

export default new SearchController();
