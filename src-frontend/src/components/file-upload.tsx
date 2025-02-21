"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, File as FileIcon, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface FileUploadProps {
  onChange: (file?: File) => void;
  endpoint: string;
}

const FileUpload = ({ onChange, endpoint }: FileUploadProps) => {
  const [file, setFile] = useState<File | null | undefined>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || undefined;
    setFile(selectedFile);
    onChange(selectedFile);
  };

  const handleClearFile = () => {
    setFile(null);
    onChange(undefined);
    setProgress(0);
    // Reset the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(endpoint, {
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
      
      setFile(null);
      
      setProgress(0);
      const { id } = await response.json();
      
      router.push(`/summary/${id}`);

    } catch (error) {
      toast({
        title: "Error",
        description: "File upload failed",
        variant: "destructive",
      });
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-5 rounded-lg hover:border-gray-400 transition-colors">
        <Button
          variant="ghost"
          className="w-full h-full p-6 flex items-center justify-center"
          disabled={loading}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          {!file ? (
            <>
              <Upload className="scale-125 mr-2" />
              <span className="text-xl">Select File</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <FileIcon className="scale-75" />
              <span className="text-sm">{file.name}</span>
            </div>
          )}
        </Button>
        
        {file && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-secondary hover:bg-secondary/80"
            onClick={(e) => {
              e.stopPropagation();
              handleClearFile();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {file && (
        <div className="space-y-2">
          {progress > 0 && <Progress value={progress} />}
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;