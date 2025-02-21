"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePathname } from "next/navigation"

export default function Processing() {
  const router = useRouter()
  const [_, setStatus] = useState("processing")
  const { toast } = useToast();
  const pathname = usePathname();
  const id = pathname.split("/").pop();



  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status/${id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch status")
        }

        const data = await response.json()

        if (data.status === "completed") {
          router.push(`/summary/${id}`)
        } else {
          setStatus(data.status)
          setTimeout(checkStatus, 2000) // Check again after 2 seconds
        }
      } catch (error) {
        console.error("Error checking status:", error)
        setStatus("error")
        toast({
          title: "Error",
          description: "Failed to check processing status. Please try again later.",
          variant: "destructive",
        })
      }
    }

    checkStatus()
  }, [id, router, toast])

  return (
    <div className="flex flex-col items-center text-white/80 justify-center min-h-screen">
      <Loader2 className="h-16 w-16 animate-spin " />
      <p className="mt-4 text-lg font-medium ">Processing your file...</p>
      {/* <p className="text-sm text-muted-foreground">Current status: {status}</p> */}
    </div>
  )
}

