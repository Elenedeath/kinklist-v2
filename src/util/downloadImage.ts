export const downloadImage = (canvas: HTMLCanvasElement, filename: string = 'kinklist.png'): void => {
    const url = canvas.toDataURL();
    const linkEl = document.createElement('a');
    linkEl.setAttribute('href', url);
    linkEl.setAttribute('download', filename);
    document.body.appendChild(linkEl);
    linkEl.click();
    requestAnimationFrame(() => {
        document.body.removeChild(linkEl);
    })
}