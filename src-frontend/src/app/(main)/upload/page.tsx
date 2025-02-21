"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, ArrowLeft, X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
interface FileHistory {
  id: string;
  filename: string;
  created_at: string;
}

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isTextTooShort = rawText.length < 1000;
  const MAX_CHARS = 100000;
  const isTextTooLong = rawText.length >= MAX_CHARS;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [history, setHistory] = useState<FileHistory[]>([]);

  useEffect(() => {
    fetchHistory();
  },);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Error",
        description: "Failed to load file history",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload_file`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast({
        title: "Success",
        description: "File uploaded successfully",
        variant: "default",
      });
      
      const { id } = await response.json();
      
      // Small delay before clearing to show completion
      setTimeout(() => {
        setFile(null);
        setIsUploading(false);
        router.push(`/processing/${id}`);
      }, 500);

    } catch (error) {
      toast({
        title: "Error",
        description: "File upload failed",
        variant: "destructive",
      });
      console.log(error);
      setIsUploading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!rawText.trim() || isTextTooShort) return;

    setLoading(true);
    setIsUploading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload_text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: rawText }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast({
        title: "Success",
        description: "Text uploaded successfully",
        variant: "default",
      });
      
      const { id } = await response.json();
      
      setTimeout(() => {
        setRawText("");
        setIsUploading(false);
        router.push(`/processing/${id}`);
      }, 500);

    } catch (error) {
      toast({
        title: "Error",
        description: "Text upload failed",
        variant: "destructive",
      });
      console.error(error)
      setIsUploading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length < MAX_CHARS) {
      setRawText(text);
    }
  };

  return (
    <div className=" bg-[#09090b] text-white overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right=0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/50 transition-all"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="fixed top-0 left=0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
        
      
          <Sheet>
            <SheetTrigger asChild>
              <div className="cursor-pointer p-2 hover:bg-white/10 rounded-md transition-colors">
                <History className="h-4 w-4 text-white" />
              </div>
            </SheetTrigger>
            <SheetContent className="bg-[#09090b] border border-white/10 text-white/80 overflow-auto">
              <SheetHeader>
                <SheetTitle className="text-white">Recent Uploads</SheetTitle>
                <SheetDescription className="text-white/60">
                  Your previously analyzed documents
                </SheetDescription>
              </SheetHeader>
             <div className="mt-6 space-y-2">
                               {history.map((file) => (
                                 <button
                                   key={file.id}
                                   onClick={() => router.push(`/processing/${file.id}`)}
                                   className="w-full p-3 flex items-center gap-3 rounded-lg hover:bg-white/10 transition-colors group text-left"
                                 >
                                   <div className="p-2 rounded-md bg-white/5 group-hover:bg-white/20 transition-colors">
                                     <FileText className="h-4 w-4" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <p className="text-sm font-medium text-white truncate">
                                       {file.filename}
                                     </p>
                                     <div className="flex items-center gap-2 text-xs text-white/40">
                                    
                                       <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                                     </div>
                                   </div>
                                 </button>
                               ))}
                               {history.length === 0 && (
                                 <div className="text-center py-8 text-white/40">
                                   <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                   <p className="text-sm">No files uploaded yet</p>
                                 </div>
                               )}
                             </div>
            </SheetContent>
          </Sheet>
        
        </div>
      </div>
     

      {/* Main Content with proper spacing */}
      <div className="container mx-auto px-4 pt-20 pb-5 h-full">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-300">
              DocSight AI
            </h1>
            <p className="text-white/80 text-lg">
              Upload your documents for instant AI-powered analysis
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 mb-8"
          >
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="file">File Upload</TabsTrigger>
                <TabsTrigger value="text">Raw Text</TabsTrigger>
              </TabsList>

              <TabsContent value="file">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="relative border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-white/40 transition-all"
                >
                  <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                    {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                  </div>
                  
                  {file ? (
                    <>
                      <h3 className="text-xl font-medium mb-2">{file.name}</h3>
                      {!isUploading && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
                          onClick={handleClearFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-medium mb-2">Drag and drop your files here</h3>
                      <p className="text-white/60 mb-6">or</p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-black hover:bg-white/90"
                      >
                        Browse Files
                        <FileText className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="application/pdf, image/*, text/*"
                  />
                  
                  {!file && (
                    <p className="text-sm text-white/40 mt-6">
                      Supported formats: PDF, images, text files(.json, .txt, .yaml, .yml, .csv, etc.) 
                    </p>
                  )}
                </div>

                {file && (
                  <div className="mt-6 space-y-4">
                    {isUploading && (
                      <div className="space-y-2">
                        <Progress 
                          value={100} 
                          className="h-2 bg-white/10"
                          // Add indeterminate animation
                          style={{
                            background: 'linear-gradient(to right, transparent 0%, #ffffff20 50%, transparent 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'loading 1.5s infinite'
                          }}
                        />
                        <style jsx global>{`
                          @keyframes loading {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                          }
                        `}</style>
                      </div>
                    )}
                    <Button
                      className="w-full bg-white text-black hover:bg-white/90 relative"
                      onClick={handleUpload}
                      disabled={loading || isUploading}
                    >
                      {loading ? "Uploading..." : "Upload File"}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text">
                <div className="space-y-4">
                  <Textarea
                    placeholder={`Enter your text here (minimum 1000, maximum ${MAX_CHARS.toLocaleString()} characters)...`}
                    className="min-h-[200px] bg-white/5 border-white/20"
                    value={rawText}
                    onChange={handleTextChange}
                    maxLength={MAX_CHARS}
                  />
                  <div className="flex justify-between text-sm">
                    <span className={rawText.length >= MAX_CHARS ? "text-red-400" : "text-white/60"}>
                      {rawText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                    </span>
                    {isTextTooShort && rawText.length > 0 && (
                      <span className="text-red-400">
                        Minimum 1000 characters required
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full bg-white text-black hover:bg-white/90 relative"
                    onClick={handleTextUpload}
                    disabled={loading || isUploading || isTextTooShort || isTextTooLong}
                  >
                    {loading ? "Uploading..." : "Upload Text"}
                  </Button>
                  {isUploading && (
                    <div className="space-y-2">
                      <Progress 
                        value={100} 
                        className="h-2 bg-white/10"
                        style={{
                          background: 'linear-gradient(to right, transparent 0%, #ffffff20 50%, transparent 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'loading 1.5s infinite'
                        }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="font-medium mb-2">Smart Analysis</h4>
                <p className="text-sm text-white/60">AI-powered document processing for quick insights</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="font-medium mb-2">Accurate Summaries</h4>
                <p className="text-sm text-white/60">Get concise summaries while preserving context</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="font-medium mb-2">Multiple Formats</h4>
                <p className="text-sm text-white/60">Support for various document types</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;