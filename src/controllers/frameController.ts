import { Request, Response } from "express";
import { Frame } from "../models/frameModel";

class FrameController {
    createFrame = async (req: Request, res: Response) => {
        const { name, shape, material, color, size, gender, image } = req.body;

        if (!name || !shape || !material) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        try {
        const frame = await Frame.create({
            name,
            shape,
            material,
            color,
            size,
            gender,
            image,
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
        const { name, shape, material, color, size, gender, image } = req.body;

        if (!id) {
            res.status(400).json({ message: "Missing ID parameter" });
            return;
        }

        try {
        const updated = await Frame.findByIdAndUpdate(
            id,
            { name, shape, material, color, size, gender, image },
            { new: true }
        );

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

        try {
        const deleted = await Frame.findByIdAndDelete(id);
            if (!deleted) {
                res.status(404).json({ message: "Frame not found" });
                return;
            }

            res.status(200).json({ message: "Frame deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting frame", error });
            return;
        }
    };
}

export default new FrameController();
