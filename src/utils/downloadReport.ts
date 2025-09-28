import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const downloadReport = async (res: Response) => {
    if (typeof window === "undefined") return;
    
    const data: { html: string, title: string } = await res.json();
    const { html: htmlContent, title: reportTitle } = data;

    if (!htmlContent) {
        console.error("No HTML content received from API.");
        return;
    }

    const printElement = document.createElement('div');
    printElement.innerHTML = htmlContent;
    
    printElement.style.position = 'absolute';
    printElement.style.left = '-9999px';
    printElement.style.width = '800px'; 
    
    document.body.appendChild(printElement);

    const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        logging: false,
    });
    
    document.body.removeChild(printElement);

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    const pdf = new jsPDF('p', 'pt', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth(); 
    const pdfHeight = pdf.internal.pageSize.getHeight(); 
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = pdfWidth / imgWidth;
    const finalHeight = imgHeight * ratio;

    if (finalHeight > pdfHeight) {
        let heightLeft = finalHeight;
        let position = 0; 
        
        while (heightLeft > 0) {
            if (position !== 0) {
                pdf.addPage();
            }
           
            pdf.addImage(
                imgData, 
                'JPEG', 
                0, 
                -position, 
                pdfWidth, 
                finalHeight 
            );
            
            heightLeft -= pdfHeight;
            position += pdfHeight; 
        }
    } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, finalHeight);
    }

    const safeTitle = reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    pdf.save(`${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`);
};