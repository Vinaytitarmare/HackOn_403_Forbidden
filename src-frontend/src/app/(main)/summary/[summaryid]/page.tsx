"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { History, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Home, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from 'date-fns';

export default function Result() {
  interface SummaryData {
    filename: string;
    status: string;
    summary: {
      image_analysis: Array<{
        description: string;
        relevance: string;
        confidence?: number;
      }>;
      document_summary: string;
      section_summaries: { section_title: string; summary: string }[];
      key_information: {
        key_points: string[];
        key_concepts: string[];
      };
      conclusion: string;
    };
  }
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const id = pathname.split("/").pop();
  const { toast } = useToast();
  const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/result/${id}`,
          { next: { revalidate: 0 } }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch result");
        }
        const result = await response.json();
        console.log(result);
        setData(result);
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately then set up polling every 1 second
    fetchData();
  }, [id]);

  interface FileHistory {
    id: string;
    filename: string;
    created_at: string;
  }

  const [history, setHistory] = useState<FileHistory[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files`);
      if (!response.ok) throw new Error("Failed to fetch history");
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
  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        duration: 0.8,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const loadingVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  if (!data) {
    return <div>Error loading data</div>;
  }

  const { filename, status, summary } = data;

  if (status === "processing" || loading) {
    return (
      <motion.div
        className="flex flex-col relative text-white items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="fixed top-0 left=0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-4 py-4"></div>
        </div>
        <div className="flex flex-row items-center justify-center w-full mb-6">
          <Link href="/" passHref>
            <Button
              className="absolute top-6 left-20 text-black"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
        <motion.div variants={loadingVariants} animate="animate">
          <Loader2 className="size-16 animate-spin" />
        </motion.div>
        <motion.p
          className="mt-4 text-lg font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Processing your file...
        </motion.p>
      </motion.div>
    );
  }

  if (!loading && data && status === "completed") {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center w-full mb-8">
            <Link href="/" passHref>
              <Button
                className="bg-white/10 hover:bg-white/80 text-white border-gray-700"
                variant="outline"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white/10 hover:bg-white/80 text-white border-gray-700 transition-colors"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-[#09090b] border border-white/10 text-white/80 overflow-auto">
                  <SheetHeader>
                    <SheetTitle className="text-white">
                      Recent Uploads
                    </SheetTitle>
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
              <Button
                onClick={() =>
                  window.open(
                    `${process.env.NEXT_PUBLIC_API_URL}/download/${id}`,
                    "_blank"
                  )
                }
                rel="noopener noreferrer"
                className="bg-rose-500 py-3 hover:bg-rose-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="text-base">Download Summary as PDF</span>
              </Button>
            </div>
          </div>

          <motion.div
            className="flex flex-col items-center space-y-6"
            variants={itemVariants}
          >
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-300 mb-2">
              Document Summary
            </h1>
            <p className="text-gray-400 text-lg mb-8">Document: {filename}</p>

            {/* Full Document Summary */}
            <motion.div className="w-full" variants={itemVariants}>
              <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader className="border-b border-gray-700/50">
                  <CardTitle className="text-2xl text-rose-400">
                    Overview
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete summary of the document
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-300 leading-relaxed">
                    {summary?.document_summary}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section Summaries */}
            <motion.div className="w-full" variants={itemVariants}>
              <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader className="border-b border-gray-700/50">
                  <CardTitle className="text-2xl text-rose-400">
                    Section Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {summary?.section_summaries?.map((section, index) => (
                    <motion.div
                      key={index}
                      className="p-4 rounded-lg bg-gray-900/50 border border-gray-700 hover:border-gray-600 transition-all"
                      variants={itemVariants}
                    >
                      <h3 className="text-lg font-semibold text-orange-300 mb-2">
                        {section.section_title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {section.summary}
                      </p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Key Information */}
            <motion.div
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={itemVariants}
            >
              <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader className="border-b border-gray-700/50">
                  <CardTitle className="text-xl text-rose-400">
                    Key Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {summary.key_information.key_points.map((point, index) => (
                      <motion.li
                        key={index}
                        className="flex items-start space-x-2 text-gray-300"
                        variants={itemVariants}
                      >
                        <span className="text-orange-300 mt-1">•</span>
                        <span>{point}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader className="border-b border-gray-700/50">
                  <CardTitle className="text-xl text-rose-400">
                    Key Concepts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {summary.key_information.key_concepts.map(
                      (concept, index) => (
                        <motion.li
                          key={index}
                          className="flex items-start space-x-2 text-gray-300"
                          variants={itemVariants}
                        >
                          <span className="text-orange-300 mt-1">•</span>
                          <span>{concept}</span>
                        </motion.li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
            {summary.image_analysis && summary.image_analysis.length > 0 && (
              <motion.div className="w-full" variants={itemVariants}>
                <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-colors">
                  <CardHeader className="border-b border-gray-700/50">
                    <CardTitle className="text-2xl text-rose-400 flex items-center gap-2">
                      Image Analysis
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      AI analysis of images found in the document
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {summary.image_analysis.map((image, index) => (
                      <motion.div
                        key={index}
                        className="p-4 rounded-lg bg-gray-900/50 border border-gray-700 hover:border-gray-600 transition-all"
                        variants={itemVariants}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-rose-400 font-medium whitespace-nowrap">
                              Description:
                            </span>
                            <span className="text-gray-300">
                              {image.description}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-rose-400 font-medium whitespace-nowrap">
                              Relevance:
                            </span>
                            <span className="text-gray-300">
                              {image.relevance}
                            </span>
                          </div>
                          {image.confidence && (
                            <div className="flex items-start gap-2">
                              <span className="text-rose-400 font-medium whitespace-nowrap">
                                Confidence:
                              </span>
                              <span className="text-gray-300">
                                {Math.round(image.confidence * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Conclusion */}
            <motion.div className="w-full" variants={itemVariants}>
              <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader className="border-b border-gray-700/50">
                  <CardTitle className="text-2xl text-rose-400">
                    Conclusion
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-300 leading-relaxed">
                    {summary?.conclusion}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Image Analysis */}
          </motion.div>
        </div>
      </motion.div>
    );
  }
}
