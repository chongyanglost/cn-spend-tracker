import React, { useState, useEffect, useRef } from 'react';
import { parseExpenseFromText, parseExpensesFromFile } from '../services/geminiService';
import { Expense, ExpenseType } from '../types';

// Define types for Web Speech API since they are not standard in all TS environments
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: any;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface ExpenseInputProps {
  onAddExpense: (expense: Expense) => void;
  isProcessing: boolean;
  setIsProcessing: (loading: boolean) => void;
}

const ExpenseInput: React.FC<ExpenseInputProps> = ({ onAddExpense, isProcessing, setIsProcessing }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const speechRec = new SpeechRecognition();
      speechRec.continuous = false;
      speechRec.lang = 'zh-CN';
      speechRec.interimResults = false;

      speechRec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleAnalyzeText(transcript);
      };

      speechRec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      speechRec.onend = () => {
        setIsListening(false);
      };

      setRecognition(speechRec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("您的浏览器不支持语音识别，请使用 Chrome 或 Edge。");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  const handleAnalyzeText = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) return;

    setIsProcessing(true);
    try {
      const parsedData = await parseExpenseFromText(textToAnalyze);
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        ...parsedData
      };
      onAddExpense(newExpense);
      setInputText(''); // Clear on success
    } catch (error) {
      alert("无法识别账单信息，请确保包含金额和描述 (例如: '吃午饭20元')");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again if needed
    event.target.value = '';

    setIsProcessing(true);
    try {
      const expenses = await parseExpensesFromFile(file);
      
      let count = 0;
      expenses.forEach(exp => {
        const newExpense: Expense = {
          id: crypto.randomUUID(),
          ...exp
        };
        onAddExpense(newExpense);
        count++;
      });
      
      alert(`成功识别并导入 ${count} 条记录！`);
    } catch (error) {
      console.error(error);
      alert("无法识别文件内容，请上传清晰的账单截图或 PDF。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyzeText(inputText);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <i className="fas fa-plus-circle text-primary"></i> 记一笔
      </h2>
      
      <div className="flex flex-col gap-4">
        <div className="relative">
            <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入消费内容，或上传账单截图/PDF..."
            className="w-full p-4 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-700 resize-none h-24"
            disabled={isProcessing}
            />
            
             {/* Microphone Button */}
             <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`absolute right-3 bottom-3 p-2.5 rounded-full transition-all duration-300 ${
                isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-red-300 shadow-lg' 
                    : 'bg-gray-200 text-gray-500 hover:bg-primary hover:text-white'
                }`}
                title="点击开始语音输入"
            >
                <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
            </button>
        </div>

        <div className="flex gap-3">
          {/* File Upload Hidden Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*,application/pdf" 
            className="hidden" 
          />
          
          {/* File Upload Button */}
          <button
            onClick={handleTriggerFileUpload}
            disabled={isProcessing}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all shadow-sm border border-gray-200 flex justify-center items-center gap-2 ${
                isProcessing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
             <i className="fas fa-camera text-blue-500"></i> 上传照片/PDF
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all shadow-md flex justify-center items-center gap-2 ${
              !inputText.trim() || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-emerald-600 hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
               <><i className="fas fa-spinner fa-spin"></i> 处理中...</>
            ) : (
               <><i className="fas fa-paper-plane"></i> 记录</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseInput;
