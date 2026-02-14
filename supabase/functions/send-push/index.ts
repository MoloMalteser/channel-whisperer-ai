import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64url encoding helper
function base64urlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Create JWT for VAPID
async function createVapidJwt(endpoint: string, subject: string, privateKeyPem: string): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  };
  
  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  // Import private key
  const b64 = privateKeyPem.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const keyBytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
  const key = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  );

  // Convert DER signature to raw r||s
  const derSig = new Uint8Array(sig);
  let offset = 3;
  const rLen = derSig[offset]; offset++;
  const r = derSig.slice(offset, offset + rLen); offset += rLen + 1;
  const sLen = derSig[offset]; offset++;
  const s = derSig.slice(offset, offset + sLen);
  
  const rawR = r.length > 32 ? r.slice(r.length - 32) : new Uint8Array(32 - r.length).fill(0).concat(r) as unknown as Uint8Array;
  const rawS = s.length > 32 ? s.slice(s.length - 32) : new Uint8Array(32 - s.length).fill(0).concat(s) as unknown as Uint8Array;
  
  const rawSig = new Uint8Array(64);
  rawSig.set(rawR.length === 32 ? rawR : r.slice(-32), 0);
  rawSig.set(rawS.length === 32 ? rawS : s.slice(-32), 32);

  return `${unsigned}.${base64urlEncode(rawSig)}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
) {
  const jwt = await createVapidJwt(subscription.endpoint, "mailto:noreply@socialtracker.app", vapidPrivateKey);
  
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body: new TextEncoder().encode(payload),
  });
  
  if (!response.ok) {
    throw Object.assign(new Error(`Push failed: ${response.status}`), { status: response.status });
  }
  return response;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';

    const { userId, title, body, url } = await req.json();

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = JSON.stringify({ title, body, url });
    let sent = 0;

    for (const sub of subscriptions) {
      try {
        await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
        );
        sent++;
      } catch (err: any) {
        console.error('Push failed for', sub.endpoint, err);
        if (err?.status === 404 || err?.status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
