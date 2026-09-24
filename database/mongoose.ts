import dns from 'dns';
import dnsPromises from 'dns/promises';
import mongoose from 'mongoose';

// Node on Windows may use a broken local resolver (127.0.0.1); force public DNS for SRV lookups.
dns.setServers(['1.1.1.1', '8.8.8.8']);

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

type SrvRecord = { name: string; port: number; priority: number; weight: number };

async function resolveSrvViaDoh(hostname: string): Promise<SrvRecord[]> {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(`_mongodb._tcp.${hostname}`)}&type=SRV`;
    const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
    if (!res.ok) throw new Error(`DoH SRV lookup failed (${res.status})`);
    const data = (await res.json()) as {
        Answer?: Array<{ data: string }>;
    };
    return (data.Answer ?? []).map((answer) => {
        const [priority, weight, port, name] = answer.data.split(' ');
        return {
            priority: Number(priority),
            weight: Number(weight),
            port: Number(port),
            name: name.replace(/\.$/, ''),
        };
    });
}

async function resolveTxtViaDoh(hostname: string): Promise<string[]> {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=TXT`;
    const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
        Answer?: Array<{ data: string }>;
    };
    return (data.Answer ?? []).map((answer) => answer.data.replace(/^"|"$/g, ''));
}

async function resolveSrvRecords(hostname: string): Promise<SrvRecord[]> {
    try {
        const records = await dnsPromises.resolveSrv(`_mongodb._tcp.${hostname}`);
        if (records.length) return records;
    } catch {
        // Fall through to DNS-over-HTTPS (needed under Next.js on some Windows setups).
    }
    return resolveSrvViaDoh(hostname);
}

async function resolveTxtRecords(hostname: string): Promise<string[]> {
    try {
        const records = await dnsPromises.resolveTxt(hostname);
        return records.map((chunks) => chunks.join(''));
    } catch {
        return resolveTxtViaDoh(hostname);
    }
}

/**
 * Convert mongodb+srv:// to a direct mongodb:// URI by resolving SRV/TXT ourselves.
 * The MongoDB driver's querySrv can still hit the broken system resolver under Next.js.
 */
async function resolveSrvUri(uri: string): Promise<string> {
    if (!uri.startsWith('mongodb+srv://')) return uri;

    const withoutProtocol = uri.slice('mongodb+srv://'.length);
    const atIndex = withoutProtocol.lastIndexOf('@');
    if (atIndex === -1) throw new Error('Invalid MONGODB_URI: missing credentials');

    const userInfo = withoutProtocol.slice(0, atIndex);
    const hostAndRest = withoutProtocol.slice(atIndex + 1);
    const slashIndex = hostAndRest.indexOf('/');
    const host = slashIndex === -1 ? hostAndRest.split('?')[0] : hostAndRest.slice(0, slashIndex);
    const pathAndQuery = slashIndex === -1 ? '/' : hostAndRest.slice(slashIndex);
    const [pathname, query = ''] = pathAndQuery.split('?');

    const srvRecords = await resolveSrvRecords(host);
    if (!srvRecords.length) throw new Error(`No SRV records found for ${host}`);

    const hosts = srvRecords
        .sort((a, b) => a.priority - b.priority || b.weight - a.weight)
        .map((r) => `${r.name}:${r.port}`)
        .join(',');

    const params = new URLSearchParams(query);
    for (const txt of await resolveTxtRecords(host)) {
        for (const part of txt.split('&')) {
            const [key, value] = part.split('=');
            if (key && value && !params.has(key)) params.set(key, value);
        }
    }

    if (!params.has('tls') && !params.has('ssl')) params.set('tls', 'true');

    const qs = params.toString();
    return `mongodb://${userInfo}@${hosts}${pathname || '/'}${qs ? `?${qs}` : ''}`;
}

export const connectToDatabase = async () => {
    if (!MONGODB_URI) throw new Error('MONGODB_URI must be set within .env');

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = (async () => {
            const uri = await resolveSrvUri(MONGODB_URI);
            return mongoose.connect(uri, { bufferCommands: false });
        })();
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    console.log(`Connected to database ${process.env.NODE_ENV} - ${cached.conn.connection.host}`);

    return cached.conn;
}
