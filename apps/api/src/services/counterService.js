import Counter from '../models/Counter.js';

/** Generates human-friendly order numbers: SIS-2026-00042 (atomic $inc). */
export async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const doc = await Counter.findOneAndUpdate(
    { _id: `orderNumber-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `SIS-${year}-${String(doc.seq).padStart(5, '0')}`;
}
