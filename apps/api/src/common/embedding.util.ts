/** pgvector column dimension in this project */
export const EMBEDDING_DIM = 1536;

/** Pad/truncate and L2-normalize so vectors fit `vector(1536)` (Ollama embeds may be 768, etc.). */
export function normalizeEmbeddingVector(vec: number[], dim = EMBEDDING_DIM): number[] {
  if (!vec.length) {
    const zeros = new Array(dim).fill(0);
    zeros[0] = 1;
    return zeros;
  }
  if (vec.length === dim) {
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
  if (vec.length > dim) {
    const sliced = vec.slice(0, dim);
    const norm = Math.sqrt(sliced.reduce((s, v) => s + v * v, 0)) || 1;
    return sliced.map((v) => v / norm);
  }
  const padded = [...vec];
  while (padded.length < dim) padded.push(0);
  const norm = Math.sqrt(padded.reduce((s, v) => s + v * v, 0)) || 1;
  return padded.map((v) => v / norm);
}
