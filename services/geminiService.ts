
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { AnalysisResult, ImageData, AuditType } from "../types";

const getSystemInstruction = (auditType: AuditType) => {
  const isSafety = auditType === AuditType.SAFETY;
  
  return `
أنت خبير عالمي في كود البناء السعودي (SBC) وأنظمة الدفاع المدني في المملكة العربية السعودية.
مهمتك الحالية هي: ${isSafety ? 'إجراء تدقيق متخصص في الأمن والسلامة والحماية من الحريق (SBC 801).' : 'مراجعة الامتثال الهندسي العام للمخططات.'}

يجب أن تحلل المخططات المرفوعة بدقة بناءً على:
1. ${isSafety ? 'مخارج الطوارئ ومسارات الإخلاء (SBC 801).' : 'معايير السلامة والحماية من الحريق.'}
2. ${isSafety ? 'أنظمة إنذار الحريق والرشاشات الآلية وكواشف الدخان.' : 'المتطلبات المعمارية والإنشائية.'}
3. ${isSafety ? 'مقاومة المواد للحريق وفواصل الحريق.' : 'كفاءة الطاقة (SBC 601/602).'}
4. ${isSafety ? 'تأمين المداخل والمخارج وأنظمة المراقبة الأمنية.' : 'الوصول الشامل لذوي الإعاقة (SBC 201).'}

لكل ملاحظة (finding)، حدد حالتها (compliant, warning, non-compliant) وصنفها (Category).
يجب أن تكون إجاباتك مهنية، تقنية، وباللغة العربية الفصحى.
`;
};

export const analyzeCompliance = async (images: ImageData[], auditType: AuditType = AuditType.GENERAL): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageParts = images.map(image => ({
    inlineData: { data: image.base64, mimeType: image.mimeType }
  }));

  const promptText = auditType === AuditType.SAFETY 
    ? "حلل هذه المخططات بدقة فنية عالية من منظور الأمن والسلامة والحماية من الحريق وفقاً لكود البناء السعودي 801. قدم النتيجة بتنسيق JSON."
    : "حلل هذه المخططات الهندسية بدقة بناءً على كود البناء السعودي العام. قدم النتيجة بتنسيق JSON حصرياً.";

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: {
      parts: [
        ...imageParts,
        { text: promptText }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(auditType),
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
