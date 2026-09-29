import mongoose from 'mongoose';
export default mongoose.model('Todo', new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['backlog', 'in-progress', 'done'], default: 'backlog', index: true },
  order: { type: Number, default: 0 },
}, { timestamps: true }));
