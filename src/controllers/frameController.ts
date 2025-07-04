import { Request, Response } from "express";
import { Frame } from "../models/frameModel";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import cloudinary from "../utils/cloudinary";

class FrameController {
    createFrame = async (req: Request, res: Response) => {
        const { name, shape, material, color, size, gender, folder="frame" } = req.body;
        const folderType = req.body.folder || req.query.folder || "others";

        if (!name || !shape || !material || !color || !size || !gender) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        if(!req.file){
            res.status(400).json({ message: "Image file is required" });
            return;
        }

        try {
             const uploaded = await uploadBufferToCloudinary(
      req.file.buffer,
      req.file.originalname,
      folderType
    );

    if (!uploaded) {
       res.status(500).json({ message: "Failed to upload image" });
       return
    }
        const frame = await Frame.create({
            name,
            shape,
            material,
            color,
            size,
            gender,
            imageUrl: uploaded.secure_url,
            imagePublicId: uploaded.public_id,
        });

        res.status(201).json(frame);
        } catch (error) {
            res.status(500).json({ message: "Error creating frame", error });
            return;
        }
    };

    getAllFrames = async (_req: Request, res: Response) => {
        try {
            const frames = await Frame.find().sort({ createdAt: -1 });
            res.status(200).json(frames);
            return;
        } catch (error) {
            res.status(500).json({ message: "Error fetching frames", error });
            return;
        }
    };

    getFrameById = async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ message: "Missing ID parameter" });
            return;
        }

        try{
            const frame = await Frame.findById(id);
            if (!frame) {
                res.status(404).json({ message: "Frame not found" });
                return;
            }
            res.status(200).json(frame);
        } catch (error) {
            res.status(500).json({ message: "Error fetching frame", error });
            return;
        }
    };

    updateFrame = async (req: Request, res: Response) => {
        const { id } = req.params;
        const { name, shape, material, color, size, gender, folder="frame" } = req.body;
        const folderType = req.body.folder || req.query.folder || "others";

        if (!id) {
            res.status(400).json({ message: "Missing ID parameter" });
            return;
        }

        const frame = await Frame.findById(id);
        if (!frame) {
            res.status(404).json({ message: "Frame not found" });
            return;
        }

        try {
            const updatedData: any = {}
            if (name) updatedData.name = name;
            if (shape) updatedData.shape = shape;
            if (material) updatedData.material = material;
            if (color) updatedData.color = color;
            if (size) updatedData.size = size;
              if (gender) {
                    const allowedTypes = (Frame.schema.path("type") as any).enumValues;
                    if (allowedTypes.includes(gender)) {
                      updatedData.gender = gender;
                    } else {
                      res.status(400).json({ message: `Invalid gender value.` });
                      return;
                    }
                  }
                  if(req.file){
            if (frame.imagePublicId) {
                await cloudinary.uploader.destroy(frame.imagePublicId);    
                   }
                    const uploaded = await uploadBufferToCloudinary(
      req.file.buffer,
      req.file.originalname,
      folderType
    );

    if (!uploaded) {
       res.status(500).json({ message: "Failed to upload image" });
       return
    }
            updatedData.imageUrl = uploaded.secure_url;
            updatedData.imagePublicId = uploaded.public_id;
                  }
        Object.assign(frame, updatedData);
        const updated = await frame.save();

        if (!updated) {
            res.status(404).json({ message: "Frame not found" });
            return;
        }

            res.status(200).json(updated);
        } catch (error) {
            res.status(500).json({ message: "Error updating frame", error });
            return;
        }
    };

    deleteFrame = async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ message: "Missing ID parameter" });
            return;
        }

        const frame = await Frame.findById(id);
        if (!frame) {
            res.status(404).json({ message: "Frame not found" });
            return;
        }

        try {
            if (frame.imagePublicId) {
                await cloudinary.uploader.destroy(frame.imagePublicId);
            }
            await frame.deleteOne();

            res.status(204).json({ message: "Frame deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting frame", error });
            return;
        }
    };
}

export default new FrameController();
