// Validate before Next.js compiles pages. Never log environment values.
require('@next/env').loadEnvConfig(process.cwd(), false);

const names = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = names.filter(name => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Deployment configuration missing: ${missing.join(', ')}.`);
  console.error('In Vercel, open Project Settings > Environment Variables. Add the real Supabase values for Production (and Preview if used), then redeploy. Locally use .env.local.');
  process.exitCode = 1;
} else {
  const placeholders = names.filter(name => /your-project|your-public-supabase-key/.test(process.env[name]));
  if (placeholders.length) {
    console.error(`Replace example values with real Supabase project settings: ${placeholders.join(', ')}.`);
    process.exitCode = 1;
  } else {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid URL');
      console.log('Supabase build configuration verified.');
    } catch {
      console.error('NEXT_PUBLIC_SUPABASE_URL must be a valid http(s) project URL.');
      process.exitCode = 1;
    }
  }
}
