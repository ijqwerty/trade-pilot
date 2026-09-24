import 'dotenv/config';
import dns from 'dns';
import dnsPromises from 'dns/promises';
import mongoose from 'mongoose';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function resolveSrvViaDoh(hostname) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(`_mongodb._tcp.${hostname}`)}&type=SRV`;
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!res.ok) throw new Error(`DoH SRV lookup failed (${res.status})`);
  const data = await res.json();
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

async function resolveTxtViaDoh(hostname) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=TXT`;
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.Answer ?? []).map((answer) => answer.data.replace(/^"|"$/g, ''));
}

async function resolveSrvRecords(hostname) {
  try {
    const records = await dnsPromises.resolveSrv(`_mongodb._tcp.${hostname}`);
    if (records.length) return records;
  } catch {
    // Fall through to DoH.
  }
  return resolveSrvViaDoh(hostname);
}

async function resolveTxtRecords(hostname) {
  try {
    const records = await dnsPromises.resolveTxt(hostname);
    return records.map((chunks) => chunks.join(''));
  } catch {
    return resolveTxtViaDoh(hostname);
  }
}

async function resolveSrvUri(uri) {
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

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI must be set in .env');
    process.exit(1);
  }

  try {
    const startedAt = Date.now();
    const directUri = await resolveSrvUri(uri);
    await mongoose.connect(directUri, { bufferCommands: false });
    const elapsed = Date.now() - startedAt;

    const dbName = mongoose.connection?.name || '(unknown)';
    const host = mongoose.connection?.host || '(unknown)';

    console.log(`OK: Connected to MongoDB [db="${dbName}", host="${host}", time=${elapsed}ms]`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR: Database connection failed');
    console.error(err);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  }
}

main();
