export function b64ToFile(fileB64: string, fileName?: string): File {
    const [data, b64] = fileB64.split(',');
    if (!data) {
        throw Error('Data part is missing');
    }
    if (!b64) {
        throw Error('Buffer part is missing');
    }
    const mimetype = data.split(':')[1]?.split(';')[0];
    if (!mimetype) {
        throw Error('Mimetype is missing');
    }
    return new File(
        [Buffer.from(b64, 'base64')],
        fileName || `temp.${mimetype.split('/')[1]}`,
        {
            type: mimetype,
        },
    );
}
