"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileUpload from "@/components/file-upload";
import styles from './page.module.css';
// import Loading from "./loading";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const handleFileChange = (file: any) => {
    console.log(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className=" bg-[#09090b] text-white border border-white/10">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold text-center">
          Welcome to MIDS
        </DialogTitle>
      </DialogHeader>
    <div className={styles.container} >
     {/* <Loading /> */}
      <Card className={styles.card}>
        <CardContent>
     
          <CardDescription className={styles.description}>
            Upload your file below:
          </CardDescription>
          <FileUpload 
            onChange={handleFileChange} 
            endpoint={"https://sitnovate-production.up.railway.app/upload_file"} 
          />
        </CardContent>
      </Card>
    </div>
    </DialogContent>
    </Dialog>
  );
}
