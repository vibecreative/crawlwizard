import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let extractor: any = null;
let isLoading = false;

// Initialize the model (lazy loading)
const initializeExtractor = async () => {
  if (extractor) return extractor;
  if (isLoading) {
    // Wait for loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return extractor;
  }
  
  isLoading = true;
  try {
    console.log('Loading browser-based AI model...');
    extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { device: 'webgpu' }
    );
    console.log('Browser-based AI model loaded successfully');
    return extractor;
  } catch (error) {
    console.error('Failed to load browser-based AI model:', error);
    throw error;
  } finally {
    isLoading = false;
  }
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Get embedding for text
const getEmbedding = async (text: string): Promise<number[]> => {
  const model = await initializeExtractor();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};

export interface BrowserAnalysisResult {
  score: number;
  explanation: string;
  category: "high" | "medium" | "low";
}

export const analyzeRelevanceInBrowser = async (
  question: string,
  pageContent: string
): Promise<BrowserAnalysisResult> => {
  try {
    // Limit content to avoid memory issues
    const limitedContent = pageContent.substring(0, 3000);
    
    // Get embeddings for question and content
    const [questionEmbedding, contentEmbedding] = await Promise.all([
      getEmbedding(question),
      getEmbedding(limitedContent)
    ]);
    
    // Calculate similarity
    const similarity = cosineSimilarity(questionEmbedding, contentEmbedding);
    
    // Convert to 0-100 score (similarity is typically -1 to 1, but with normalized vectors it's 0-1)
    const score = Math.round(Math.max(0, Math.min(100, similarity * 100)));
    
    // Determine category
    let category: "high" | "medium" | "low";
    let explanation: string;
    
    if (score >= 50) {
      category = "high";
      explanation = `De vraag heeft een hoge semantische overeenkomst (${score}%) met de pagina-inhoud. De website zou waarschijnlijk relevant zijn voor dit type vraag.`;
    } else if (score >= 30) {
      category = "medium";
      explanation = `De vraag heeft een gemiddelde semantische overeenkomst (${score}%) met de pagina-inhoud. De website zou mogelijk genoemd worden, maar niet als eerste optie.`;
    } else {
      category = "low";
      explanation = `De vraag heeft een lage semantische overeenkomst (${score}%) met de pagina-inhoud. Overweeg de vraag te regenereren voor betere aansluiting.`;
    }
    
    return { score, explanation, category };
  } catch (error) {
    console.error('Browser AI analysis failed:', error);
    throw error;
  }
};

// Check if browser supports WebGPU
export const checkBrowserAiSupport = async (): Promise<boolean> => {
  try {
    if ('gpu' in navigator) {
      const gpu = await (navigator as any).gpu?.requestAdapter();
      return !!gpu;
    }
    return false;
  } catch {
    return false;
  }
};
