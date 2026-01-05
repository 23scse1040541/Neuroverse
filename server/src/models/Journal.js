import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  contentEnc: { type: String, required: true },
  iv: { type: String, required: true },
  tag: { type: String, required: true },
  emotion: { type: String, enum: ['Happy','Sad','Angry','Anxious','Neutral'], required: true },
  stress: { type: Number, min: 0, max: 100, required: true },
  moodScore: { type: Number, min: 0, max: 100, default: 50 },
  date: { type: Date, default: Date.now },
  tags: { type: [String], default: [] },
  editedAt: { type: Date },
  attachments: { type: [{ type: { type: String }, data: { type: String } }], default: [] }
}, { timestamps: true });

export default mongoose.model('Journal', JournalSchema);
