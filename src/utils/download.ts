export function downloadDataUrl(dataUrl: string, filename: string): void {
    const element = document.createElement('a');
    element.setAttribute('style', 'height: 0px;');
    element.setAttribute('href', dataUrl);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
