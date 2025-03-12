/**
 * Patterns for matching local IP address ranges
 */
const LOCAL_IP_RANGES = [
    // 10.0.0.0 - 10.255.255.255
    /^(::f{4}:)?10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
    // 127.0.0.0 - 127.255.255.255
    /^(::f{4}:)?127\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
    // 169.254.1.0 - 169.254.254.255
    /^(::f{4}:)?169\.254\.([1-9]|1?\d\d|2[0-4]\d|25[0-4])\.\d{1,3}/,
    // 172.16.0.0 - 172.31.255.255
    /^(::f{4}:)?(172\.1[6-9]|172\.2\d|172\.3[0-1])\.\d{1,3}\.\d{1,3}/,
    // 192.168.0.0 - 192.168.255.255
    /^(::f{4}:)?192\.168\.\d{1,3}\.\d{1,3}/,
    // fc00::/7 - Unique local addresses
    /^f[c-d][0-9a-f]{2}(::1$|:[0-9a-f]{1,4}){1,7}/,
    // fe80::/10 - Link-local addresses
    /^fe[89ab][0-9a-f](::1$|:[0-9a-f]{1,4}){1,7}/
];

/**
 * Checks if an IP address is local
 * @param address - The IP address to check
 * @returns Boolean indicating if the address is local
 */
function isLocalIp(address: string): boolean {
    return (
        address === '::' ||
        address === '::1' ||
        address === '0.0.0.0' ||
        LOCAL_IP_RANGES.some(pattern => pattern.test(address))
    );
}

/**
 * Checks if a URL is connecting to a local address
 * @param url - The URL to check
 * @returns Boolean indicating if the URL is connecting to a local address
 */
function isLocalUrl(url: string): boolean {
    try {
        console.log("URL:", url);
        // Asume HTTP protocol if missing
        if (!url.includes('://')) {
            url = 'http://' + url;
        }
        console.log("Modified URL:", url);

        const parsedUrl = new URL(url);
        console.log("Parsed URL:", parsedUrl);
        const hostname = parsedUrl.hostname.toLowerCase();

        // Check for localhost domain
        if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
            return true;
        }

        // Remove brackets from IPv6 addresses
        const cleanHostname = hostname.replace(/^\[|\]$/g, '');

        return isLocalIp(cleanHostname);
    } catch (error) {
        console.error('Invalid URL:', error);
        return false;
    }
}

export { isLocalUrl, isLocalIp };