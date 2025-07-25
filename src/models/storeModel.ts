import mongoose, { Schema, InferSchemaType } from 'mongoose';

const StoreSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
}, { timestamps: true });

StoreSchema.index({ location: '2dsphere' });

type Store = InferSchemaType<typeof StoreSchema>;
export default mongoose.model<Store>('Store', StoreSchema);
