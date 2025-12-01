import { GoogleGenAI, Type } from "@google/genai";
import { Expense, ExpenseType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to Base64 for Gemini
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // FileReader returns "data:mime/type;base64,..."
      // We only need the base64 part.
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Parse raw text into structured expense data (Single item)
export const parseExpenseFromText = async (text: string): Promise<Omit<Expense, 'id' | 'date'>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `分析以下文本，提取账单信息。判断该消费是 "Need" (必须) 还是 "Want" (想要)。
      文本: "${text}"
      
      请注意：
      1. 假如没有明确货币单位，默认为人民币(CNY)。
      2. 类别(Category)请用中文简短描述 (如: 餐饮, 交通, 娱乐, 购物, 住房, 医疗, 其他)。
      3. 金额必须是数字。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "消费内容的简短描述" },
            amount: { type: Type.NUMBER, description: "金额" },
            category: { type: Type.STRING, description: "消费类别" },
            type: { type: Type.STRING, enum: ["Need", "Want"], description: "消费性质" }
          },
          required: ["description", "amount", "category", "type"],
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Validate output slightly to be safe
    if (!result.amount || !result.description) {
      throw new Error("无法解析该文本，请重试。");
    }

    return {
      description: result.description,
      amount: result.amount,
      category: result.category,
      type: result.type as ExpenseType,
    };

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

// Parse expenses from Image or PDF (Multiple items possible)
export const parseExpensesFromFile = async (file: File): Promise<Omit<Expense, 'id'>[]> => {
  try {
    const filePart = await fileToPart(file);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          filePart,
          {
            text: `分析这张图片或PDF文档，提取其中所有的消费/支出记录。
            
            对于每一条记录：
            1. 提取描述 (description)。
            2. 提取金额 (amount)，纯数字。
            3. 分类 (category)，如：餐饮, 交通, 购物, 娱乐, 居家, 医疗等。
            4. 判断性质 (type): "Need" (必须) 或 "Want" (想要)。
            5. 提取日期 (date): 格式为 YYYY-MM-DD。如果图片中没有明确年份，默认为当年。如果找不到具体日期，留空。
            
            请忽略收入记录，只提取支出。忽略余额信息。
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["Need", "Want"] },
              date: { type: Type.STRING, description: "YYYY-MM-DD format or null/empty" }
            },
            required: ["description", "amount", "category", "type"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("未能在文件中识别到有效的支出记录。");
    }

    // Post-process to ensure valid data structure
    return results.map((item: any) => ({
      description: item.description,
      amount: item.amount,
      category: item.category,
      type: item.type as ExpenseType,
      date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(), // Fallback to now if date missing
    }));

  } catch (error) {
    console.error("Gemini File Parse Error:", error);
    throw error;
  }
};


// Generate financial advice based on history
export const generateFinancialAdvice = async (expenses: Expense[]): Promise<string> => {
  if (expenses.length === 0) return "暂无数据，无法分析。";

  const expenseSummary = expenses.map(e => 
    `- ${e.date.split('T')[0]}: ${e.description} (${e.category}) - ¥${e.amount} [${e.type}]`
  ).join("\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `作为一位专业的理财顾问，请根据以下用户的近期消费记录进行深度分析并给出建议。
      
      消费记录:
      ${expenseSummary}
      
      请按以下结构生成一份中文 Markdown 报告:
      1. **消费概览**: 总支出，以及 "Need" vs "Want" 的比例。
      2. **消费习惯分析**: 识别哪些是不必要的开支 (Want)，哪些习惯可以改进。
      3. **省钱与投资建议**: 具体建议可以省下多少钱，这些钱如果用于投资（如指数基金、理财产品）可能带来的长远收益。
      4. **鼓励**: 鼓励用户养成更好的理财习惯。
      
      语气要专业、诚恳且具有鼓励性。`,
    });

    return response.text || "生成建议失败，请稍后重试。";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "生成建议时发生错误，请检查网络或稍后重试。";
  }
};
