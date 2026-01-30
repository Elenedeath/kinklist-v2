export const uploadImageToImgbb = async (canvas: HTMLCanvasElement, apiKey: string, imageName: string): Promise<string> => {
    // Convert canvas to base64
    const base64 = canvas.toDataURL('image/png').split(',')[1];

    const formdata = new FormData();
    formdata.append('image', base64);
    formdata.append('name', imageName);  // Set image name from parameter
    formdata.append('title', imageName.charAt(0).toUpperCase() + imageName.slice(1));  // Title with capitalized first letter

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formdata
        });

        // eslint-disable-next-line no-console
        console.log('ImgBB response status:', response.status);
        // eslint-disable-next-line no-console
        const json = await response.json();
        // eslint-disable-next-line no-console
        console.log('ImgBB response:', json);

        if (!json.success) {
            // eslint-disable-next-line no-console
            console.error('ImgBB error response:', { response, json });
            throw new Error(`ImgBB upload failed: ${json.error?.message || 'Unknown error'}`);
        }

        // ImgBB returns the image data with url
        const url = json.data?.url;
        if (!url) {
            // eslint-disable-next-line no-console
            console.error('No URL in ImgBB response:', json);
            throw new Error('No URL in ImgBB response');
        }
        // eslint-disable-next-line no-console
        console.log('ImgBB URL:', url);
        // eslint-disable-next-line no-console
        console.log('ImgBB Image ID:', json.data?.id);
        // eslint-disable-next-line no-console
        console.log('Full ImgBB response data:', json.data);
        // Return the full URL - it will be used as uploadId
        return url;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('ImgBB upload error:', error);
        throw error;
    }
}