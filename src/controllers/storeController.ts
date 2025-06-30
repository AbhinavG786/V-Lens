
import { Request, Response } from 'express';
import Store from '../models/storeModel';

export const findNearby = async (req: Request, res: Response) => {
  const { lat, lng, radius = 5000 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'Provide lat and lng' });

  const nearby = await Store.find({
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
        $maxDistance: parseInt(radius as string),
      }
    }
  })
  .limit(20);

  res.json(nearby);
};
