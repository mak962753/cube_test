export function generateUUID() {
    return [1e7,1e3,4e3,8e3,1e11].join('-').replace(/[018]/g, s => {
        const c = parseInt(s);
        return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
    });
}