
import React, { useState, useRef } from 'react';
import { parseLegacyData } from '../services/importService';
import { Category, PaymentMethod, Transaction } from '../types';

interface ImportModalProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onImport: (data: { transactions: Transaction[], categories: Category[], paymentMethods: PaymentMethod[] }) => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ categories, paymentMethods, onImport, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("File is empty.");

        const result = parseLegacyData(text, categories, paymentMethods);
        
        if (result.transactions.length > 0) {
          onImport(result);
          onClose();
        } else {
          setError("No valid records found in the file. Ensure it's the correct format.");
        }
      } catch (err) {
        console.error("Import Error:", err);
        setError("Failed to parse the file. Please ensure it is a valid tab-separated export.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading the file.");
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Import Legacy Data</h2>
          <button onClick={onClose} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Select your exported file (tab-separated format) to import your historical transactions.
            </p>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                file ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-4xl mb-3">{file ? '📄' : '📤'}</div>
              <p className="text-sm font-bold text-slate-700">
                {file ? file.name : 'Click to select file'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports .txt, .tsv, .csv'}
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".txt,.tsv,.csv"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
              <span className="text-red-500">⚠️</span>
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-400 bg-slate-100 rounded-2xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className={`flex-1 py-4 font-bold text-white rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                !file || isProcessing ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-blue-600 shadow-blue-100'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : 'Start Import'}
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 text-[10px] text-slate-400 font-medium text-center uppercase tracking-widest">
          Secure Local Processing
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
