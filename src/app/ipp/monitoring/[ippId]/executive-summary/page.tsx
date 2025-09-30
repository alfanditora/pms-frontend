"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExecutiveSummary, ExecutiveSummaryType } from "@/components/executive-summary/executiveSummary";
import { LogoutButton } from "@/components/navbar/logout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ArrowLeft } from "lucide-react";


export default function ExecutiveSummaryPage() {
  const { ippId } = useParams<{ ippId: string }>();
  const [data, setData] = useState<ExecutiveSummaryType | null>(null);

  const router = useRouter()

  const getToken = () => {
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("token="));
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  useEffect(() => {
    async function fetchData() {
      const token = getToken();
      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await fetch(`https://pms-database.vercel.app/api/ipp/${ippId}/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error("Failed to fetch executive summary");
      }
    }
    fetchData();
  }, [ippId]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("exec-summary");
    if (!element) return;

    // ⬇️ tandai sedang render PDF
    element.setAttribute("data-pdf", "true");

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    const imgHeight = pageWidth / ratio;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
    pdf.save(`executive-summary-${ippId}.pdf`);

    // ⬇️ balikin ke normal UI
    element.removeAttribute("data-pdf");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>Main Menu</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>IPP</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/ipp/monitoring">IPP Monitoring</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/ipp/monitoring/${ippId}`}>{ippId}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Executive Summary</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <LogoutButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min">
            {!data ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-lg text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                <div className="flex w-full items-center justify-between py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleDownloadPDF}>
                    Download as PDF
                  </Button>
                </div>
                <div id="exec-summary">
                  <ExecutiveSummary data={data} isPdf={true} />
                </div>
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
