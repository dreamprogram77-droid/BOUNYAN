
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { AnalysisResult, ImageData, AuditType } from "../types";

const getSystemInstruction = (auditType: AuditType) => {
  const isSafety = auditType === AuditType.SAFETY;
  
  if (isSafety) {
    return `
أنت خبير فني أول في كود البناء السعودي (SBC 801) وأنظمة الإطفاء والسلامة المعتمدة من المديرية العامة للدفاع المدني بالمملكة العربية السعودية.
مهمتك: إجراء تدقيق هندسي دقيق لسلامة الأرواح والحماية من الحريق (Fire Life Safety).

يجب أن تركز في تحليلك على:
1. مخارج الطوارئ (Egress): عددها، سعتها، المسافات المقطوعة، واللوحات الإرشادية (SBC 801).
2. أنظمة الإطفاء: الرشاشات الآلية، كبائن الحريق، وطفايات الحريق اليدوية.
3. أنظمة الإنذار: كواشف الدخان والحرارة، كواسر الزجاج، ولوحة التحكم الرئيسية.
4. فصل الحريق (Fire Separation): جدران الحريق، الأبواب المقاومة للحريق (UL/FM)، وتسكير الفتحات الفنية.
5. المتطلبات الإنشائية للحماية من الحريق (SBC 201).

لكل ملاحظة (finding)، حدد البند بدقة من الكود السعودي وحالتها (compliant, warning, non-compliant).
`;
  }

  return `
أنت مستشار هندسي خبير في كود البناء السعودي (SBC) للمباني السكنية والتجارية.
مهمتك: مراجعة الامتثال العام للمخططات الهندسية المعروضة.

يجب أن تحلل المخططات بناءً على:
1. المتطلبات المعمارية: الفراغات، التهوية، الارتدادات، والوصول الشامل (SBC 201).
2. المتطلبات الإنشائية: الأحمال، التسليح، والأساسات (SBC 301-304).
3. كفاءة الطاقة: العزل الحراري (SBC 601/602).
4. السباكة والكهرباء (SBC 701/401).

لكل ملاحظة، حدد الحالة وصنفها حسب القسم الهندسي.
يجب أن تكون الإجابات مهنية جداً وباللغة العربية الفصحى.
`;
};

export const analyzeCompliance = async (images: ImageData[], auditType: AuditType = AuditType.GENERAL): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageParts = images.map(image => ({
    inlineData: { data: image.base64, mimeType: image.mimeType }
  }));

  const promptText = auditType === AuditType.SAFETY 
    ? "قم بإجراء فحص عميق وشامل لمتطلبات السلامة والحماية من الحريق (Fire Safety Audit) لهذه المخططات. استخرج كل الثغرات التقنية بناءً على SBC 801. قدم النتيجة بتنسيق JSON."
    : "حلل هذه المخططات الهندسية بدقة بناءً على كود البناء السعودي العام. قدم النتيجة بتنسيق JSON حصرياً.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
