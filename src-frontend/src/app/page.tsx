"use client";

import { useState } from "react";
import ShinyText from "@/components/shiny-text";
import { Button } from "@/components/ui/button";
import UploadDialog from "@/components/upload-dialog";
import { motion } from "framer-motion";
import { ArrowUpRight, FileText, Zap, Brain } from "lucide-react";
import RotatingText from "@/components/rotating-text";
import Aurora from "@/components/aurora";


import { useRouter } from "next/navigation";



const Home = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter()

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Smart Document Analysis",
      description:
        "Instant processing of lengthy documents with AI-powered intelligence",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Quick Summaries",
      description: "Get concise, accurate summaries in seconds, not hours",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Context Preservation",
      description:
        "Maintains critical context while extracting key information",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative">
      <span className="absolute top-0 left-0 w-full h-full">
        <Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} speed={0.5} />
      </span>
      <span className="relative z-10">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="px-4 py-2 rounded-full bg-white/30 text-sm font-medium inline-block mb-6">
              <ShinyText
                text="Intelligent Document Processing"
                disabled={false}
                speed={1.6}
                className="text-white/50"
              />
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight flex gap-4 flex-wrap justify-center items-center">
              Transform
              <RotatingText
                texts={["Documents", "Images", "Long Texts"]}
                mainClassName="px-2 sm:px-2 md:px-3 overflow-hidden py-0.5 sm:py-1 md:py-2 items-center justify-center rounded-lg"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2000}
              />
              into
              <span className="block">Actionable Insights</span>
            </h1>
            <ShinyText
              text="Our AI-powered tool automatically generates concise and accurate
            summaries of lengthy documents, preserving context while extracting
            key information."
              disabled={false}
              speed={1.6}
              className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8"
            />
            <br />
            <Button
              onClick={() => router.push('/upload')}
              className="bg-white text-black hover:bg-white/90 transition-all duration-300 rounded-full px-8 py-6 text-lg font-medium group"
            >
              Try Now
              <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="bg-white/10 p-3 rounded-xl w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <UploadDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </span>
    </div>
  );
};

export default Home;
