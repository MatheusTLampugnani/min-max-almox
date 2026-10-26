import { createClient } from '@supabase/supabase-js';

// Polyfill defensivo para Node.js < 22 no Render ou Docker sem WebSocket nativo
if (typeof globalThis.WebSocket === 'undefined') {
  class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  }
  globalThis.WebSocket = DummyWebSocket;
}

let supabaseClient = null;

export function getSupabase() {
  const dataSource = (process.env.DATA_SOURCE || '').toLowerCase().trim();

  // Se configurado explicitamente como mock, não ativa o Supabase
  if (dataSource === 'mock') {
    return null;
  }

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabaseClient;
}
