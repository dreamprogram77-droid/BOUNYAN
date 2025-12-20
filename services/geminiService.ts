
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { AnalysisResult, ImageData } from "../types";

const SBC_SYSTEM_INSTRUCTION = `
أنت خبير في كود البناء السعودي (SBC) والأنظمة الهندسية في المملكة العربية السعودية.
مهمتك هي مراجعة المخططات الهندسية والتحقق من امتثالها للمعايير.
يجب أن تكون إجاباتك دقيقة، مهنية، وباللغة العربية الفصحى.
حلل المخططات المرفوعة بناءً على:
1. معايير السلامة والحماية من الحريق.
2. المتطلبات المعمارية والإنشائية.
3. كفاءة الطاقة.
4. الوصول الشامل لذوي الإعاقة.
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
        { text: "حلل هذه المخططات الهندسية بدقة بناءً على كود البناء السعودي. قدم النتيجة بتنسيق JSON حصرياً." }
      ]
    },
    config: {
      systemInstruction: SBC_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, description: "compliant, warning, or non-compliant" },
          score: { type: Type.NUMBER, description: "Overall compliance score 0-100" },
          executiveSummary: { type: Type.STRING, description: "A high-level overview of the compliance status and key findings" },
          details: { type: Type.STRING, description: "Detailed analysis of findings" },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          references: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific SBC sections referenced" }
        },
        required: ["status", "score", "executiveSummary", "details", "recommendations", "references"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse compliance response", error);
    throw new Error("حدث خطأ أثناء تحليل البيانات.");
  }
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

/**
 * تحويل النص إلى كلام مسموع باستخدام نموذج TTS
 */
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
