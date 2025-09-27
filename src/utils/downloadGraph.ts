import html2canvas from 'html2canvas';

interface GraphData {
  datasets: { label: string }[];
}

export const downloadGraphAsPng = async (
  element: HTMLDivElement,
  data: GraphData,
  index: number
) => {
  if (!element) return;

  const clonedElement = element.cloneNode(true) as HTMLDivElement;
  
  clonedElement.className = ''; 
  clonedElement.style.cssText = 'background-color: #FFFFFF !important;'; 
  
  const svg = clonedElement.querySelector('svg');
  if (svg) {
      svg.style.backgroundColor = '#FFFFFF';
  }

  document.body.appendChild(clonedElement);
  clonedElement.style.position = 'absolute';
  clonedElement.style.top = '-9999px';
  clonedElement.style.zIndex = '-1';
  
  try {
    const canvas = await html2canvas(clonedElement, {
      scale: 2, 
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false, 
    });
    
    const link = document.createElement('a');
    const chartName = data.datasets.map(d => d.label).join('_') || `chart-${index}`;
    
    link.download = `${chartName}.png`;
    link.href = canvas.toDataURL('image/png');
    
    link.click();
    
  } catch (error) {
    console.error("Échec du téléchargement via html2canvas (vérifiez oklch/CSS):", error);
    alert("Le téléchargement a échoué. Problème de rendu du graphique.");
  } finally {
    document.body.removeChild(clonedElement);
  }
};