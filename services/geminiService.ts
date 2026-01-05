
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { AnalysisResult, ImageData } from "../types";

const SBC_SYSTEM_INSTRUCTION = `
أنت خبير في كود البناء السعودي (SBC) والأنظمة الهندسية في المملكة العربية السعودية.
مهمتك هي مراجعة المخططات الهندسية والتحقق من امتثالها للمعايير.
يجب أن تكون إجاباتك دقيقة، مهنية، وباللغة العربية الفصح الفصحى.
حلل المخططات المرفوعة بناءً على:
1. معايير السلامة والحماية من الحريق.
2. المتطلبات المعمارية والإنشائية.
3. كفاءة الطاقة.
4. الوصول الشامل لذوي الإعاقة.

لكل ملاحظة (finding)، حدد حالتها (compliant, warning, non-compliant) وصنفها (Category) مثل: "السلامة"، "التصميم الإنشائي"، "كفاءة الطاقة".
`;

export const analyzeCompliance = async (images: ImageData[]): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageParts = images.map(image => ({
    inlineData: { data: image.base64, mimeType: image.mimeType }
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        ...imageParts,
        { text: "حلل هذه المخططات الهندسية بدقة بناءً على كود البناء السعودي. قدم النتيجة بتنسيق JSON حصرياً مع تصنيف كل ملاحظة وحالتها." }
      ]
    },
    config: {
      systemInstruction: SBC_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          score: { type: Type.NUMBER },
          executiveSummary: { type: Type.STRING },
          details: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          references: { type: Type.ARRAY, items: { type: Type.STRING } },
          findings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['compliant', 'warning', 'non-compliant'] },
                category: { type: Type.STRING },
                imageIndex: { type: Type.INTEGER }
              },
              required: ["text", "status"]
            }
          }
        },
        required: ["status", "score", "executiveSummary", "details", "recommendations", "references"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as AnalysisResult;
};

export const searchSaudiRegulations = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "أنت مساعد قانوني هندسي تبحث في آخر التحديثات الرسمية لكود البناء السعودي والوزارات المعنية في السعودية."
    }
  });
  
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const getSiteRegulations = async (lat: number, lng: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "ما هي اشتراطات البناء البلدية والارتدادات المسموحة والارتفاعات في هذا الموقع الجغرافي حسب الأنظمة السعودية؟",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const editBlueprintImage = async (image: ImageData, prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `تحدث بوقار ووضوح: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};
