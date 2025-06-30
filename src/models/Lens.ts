import mongoose, { Schema, InferSchemaType } from 'mongoose';

const LensSchema = new Schema({
  brand: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  description: { type: String },
  imageUrl: { type: String },
}, {
  timestamps: true,
});

type Lens = InferSchemaType<typeof LensSchema>;

export default mongoose.model('Lens', LensSchema);
export type { Lens };