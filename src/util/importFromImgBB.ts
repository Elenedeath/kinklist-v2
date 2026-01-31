import { InKinkCategory, ExKinkCategory, InKink } from "@/types/kinks";
import { Rating } from "@/types/ratings";
import { generateId } from './idGenerator';

interface DataFromImage {
  username: string;
  ratings: Rating[];
  categories: ExKinkCategory[];
  language?: 'en' | 'fr';
}

interface ParsedDataFromImage extends DataFromImage {
  categories: InKinkCategory[];
}

/**
 * Extracts or validates ImgBB image URL
 * Supports: 
 * - https://i.ibb.co/XXXXXX/filename.png (direct link - preferred)
 * - https://ibb.co/XXXXXX (short link - tries multiple URL patterns)
 */
const getImgBBDirectUrl = async (url: string, language: 'en' | 'fr' = 'en'): Promise<string> => {
  // If it's already a direct link, use it as-is
  if (url.includes('i.ibb.co') && url.endsWith('.png')) {
    return url;
  }
  
  // If it's a short link, try different URL patterns
  const match = url.match(/ibb\.co\/([a-zA-Z0-9]+)/);
  if (match) {
    const imageId = match[1];
    
    // List of common URL patterns to try
    const urlPatterns = [
      `https://i.ibb.co/${imageId}/image.png`,
      `https://i.ibb.co/${imageId}/file.png`,
      `https://i.ibb.co/${imageId}/kinklist.png`,
      `https://i.ibb.co/${imageId}/kinklist-v2-EN.png`,
      `https://i.ibb.co/${imageId}/kinklist-v2-FR.png`,
    ];
    
    // Try each pattern until we find a working one
    for (const urlPattern of urlPatterns) {
      try {
        const response = await fetch(urlPattern, { method: 'HEAD' });
        if (response.ok) {
          return urlPattern;
        }
      } catch (error) {
        // Continue to next pattern
      }
    }
    
    // If no pattern worked, throw error with helpful message
    const errorMsg = language === 'fr'
      ? `Impossible de trouver l'image pour le lien ImgBB ${url}. Veuillez utiliser le lien PNG direct a la place: https://i.ibb.co/${imageId}/FILENAME.png`
      : `Could not find image for ImgBB link ${url}. Please use the direct image link instead: https://i.ibb.co/${imageId}/FILENAME.png`;
    throw new Error(errorMsg);
  }
  
  const invalidFormatMsg = language === 'fr'
    ? 'Format d\'URL ImgBB invalide. Veuillez utiliser: https://i.ibb.co/XXXXXX/filename.png'
    : 'Invalid ImgBB URL format. Please use: https://ibb.co/XXXXXX or https://i.ibb.co/XXXXXX/filename.png';
  throw new Error(invalidFormatMsg);
};

const blobToImage = (blob: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error('Failed to load image'));
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.src = url;
  });
};

const imageToCanvas = (image: HTMLImageElement): { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D } => {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  context.drawImage(image, 0, 0, image.naturalWidth, canvas.height);
  return { canvas, context };
};

const tryReadImageData = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): string => {
  let json = "";
  for (let y = canvas.height - 1; y >= 0; y--) {
    for (let x = 0; x < canvas.width; x++) {
      const pixelData = context.getImageData(x, y, 1, 1).data;
      if (
        pixelData[0] === 255 &&
        pixelData[1] === 255 &&
        pixelData[2] === 255
      ) {
        return json;
      }
      const r = 254 - pixelData[0];
      const g = 254 - pixelData[1];
      const b = 254 - pixelData[2];
      const byteValue = r + (g << 3) + (b << 6);
      const char = String.fromCharCode(byteValue);
      json += char;
      
      // Safety check: stop if we've read too much garbage
      if (json.length > 1000000) return "";
    }
  }
  return "";
};

const extractJsonFromData = (rawData: string): string => {
  // Try to find valid JSON in the data by looking for the opening brace
  const jsonStart = rawData.indexOf('{');
  if (jsonStart === -1) {
    return "";
  }
  
  // Extract from the opening brace and try to find the closing brace
  const potentialJson = rawData.substring(jsonStart);
  const jsonMatch = potentialJson.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return "";
};

export const importDataFromImgBB = async (imgbbUrl: string, language: 'en' | 'fr' = 'en'): Promise<ParsedDataFromImage> => {
  try {
    const directUrl = await getImgBBDirectUrl(imgbbUrl, language);
    
    const response = await fetch(directUrl);
    if (!response.ok) {
      const errorMsg = language === 'fr' 
        ? `Echec de la recuperation de l'image: ${response.statusText}`
        : `Failed to fetch image: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    
    const imageBlob = await response.blob();
    const imageElement = await blobToImage(imageBlob);
    const { canvas, context } = imageToCanvas(imageElement);

    // Read data from image
    const rawImageData = tryReadImageData(canvas, context);
    if (!rawImageData) {
      const errorMsg = language === 'fr'
        ? 'Aucune donnee trouvee dans l\'image. Assurez-vous que "Encoder les donnees" est active lors de l\'export et que vous utilisez la bonne image.'
        : 'No data found in image. Make sure "Encode data" is enabled when exporting and that you\'re using the correct image.';
      throw new Error(errorMsg);
    }
    
    const imageJson = extractJsonFromData(rawImageData);
    if (!imageJson) {
      const errorMsg = language === 'fr'
        ? 'Impossible d\'extraire des donnees JSON valides de l\'image. ImgBB a peut-etre compresse l\'image. Essayez d\'utiliser le lien PNG direct a la place.'
        : 'Could not extract valid JSON from image data. ImgBB may have compressed the image. Try using the direct PNG link instead.';
      throw new Error(errorMsg);
    }
    
    let parsedData: DataFromImage;
    try {
      parsedData = JSON.parse(imageJson) as DataFromImage;
    } catch (parseError) {
      const errorMsg = language === 'fr'
        ? 'Les donnees d\'image ont ete corrompues lors du transfert. Cela se produit souvent lorsque ImgBB recompresse les fichiers PNG. Essayez de re-exporter avec "Encoder les donnees" active et telechargez directement sans utiliser la recompression d\'ImgBB.'
        : 'Image data was corrupted during transfer. This often happens when ImgBB recompresses PNG files. Try re-exporting with "Encode data" enabled and upload directly without using ImgBB\'s recompression.';
      throw new Error(errorMsg);
    }
    const { categories, ratings, username } = parsedData;
    
    const inCategories: InKinkCategory[] = categories.map((exCat): InKinkCategory => {
      const inCat: InKinkCategory = {
        ...exCat,
        id: generateId(),
        kinks: exCat.kinks.map((exKink): InKink => {
          return {
            ...exKink,
            id: generateId(),
          }
        }),
      };
      return inCat;
    });
    
    return { username, ratings, categories: inCategories };
  } catch (error) {
    throw new Error(`Failed to import from ImgBB: ${error instanceof Error ? error.message : String(error)}`);
  }
};
