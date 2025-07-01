import express from 'express';
import Store from '../models/storeModel';

export const findNearby = async (req: express.Request, res: express.Response) => {
  const { lat, lng, radius = 5000 } = req.query;
  if (!lat || !lng) { res.status(400).json({ error: 'Provide lat and lng' });
  return}

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
