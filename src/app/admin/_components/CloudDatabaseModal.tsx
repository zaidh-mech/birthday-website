'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Database, Loader2, RotateCcw, X } from 'lucide-react'
import {
  checkCloudConnection,
  clearSupabaseCredentials,
  getSupabaseCredentials,
  isValidSupabaseUrl,
  saveSupabaseCredentials,
} from '@/lib/supabase'
import { Banner, ui, type Notice } from './ui'

export const SUPABASE_SETUP_SQL = `-- Run this in Supabase SQL Editor:
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  occasion text not null,
  date timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text not null,
  image_path text not null,
  date timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.polaroids (
  id text primary key,
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

-- Grant permissions to anonymous and authenticated web visitors
grant all on table public.letters to anon, authenticated, service_role;
grant all on table public.memories to anon, authenticated, service_role;
grant all on table public.polaroids to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter table public.letters enable row level security;
alter table public.memories enable row level security;
alter table public.polaroids enable row level security;

drop policy if exists "public_read_letters" on public.letters;
drop policy if exists "public_write_letters" on public.letters;
create policy "public_read_letters" on public.letters for select using (true);
create policy "public_write_letters" on public.letters for all using (true) with check (true);

drop policy if exists "public_read_memories" on public.memories;
drop policy if exists "public_write_memories" on public.memories;
create policy "public_read_memories" on public.memories for select using (true);
create policy "public_write_memories" on public.memories for all using (true) with check (true);

drop policy if exists "public_read_polaroids" on public.polaroids;
drop policy if exists "public_write_polaroids" on public.polaroids;
create policy "public_read_polaroids" on public.polaroids for select using (true);
create policy "public_write_polaroids" on public.polaroids for all using (true) with check (true);

-- Storage bucket and policies
insert into storage.buckets (id, name, public) values ('memories', 'memories', true) on conflict (id) do update set public = true;

drop policy if exists "public_read_storage" on storage.objects;
drop policy if exists "public_write_storage" on storage.objects;
drop policy if exists "public_update_storage" on storage.objects;
drop policy if exists "public_delete_storage" on storage.objects;

create policy "public_read_storage" on storage.objects for select using (bucket_id = 'memories');
create policy "public_write_storage" on storage.objects for insert with check (bucket_id = 'memories');
create policy "public_update_storage" on storage.objects for update using (bucket_id = 'memories');
create policy "public_delete_storage" on storage.objects for delete using (bucket_id = 'memories');`

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export default function CloudDatabaseModal({ onClose, onStatusChange }: { onClose: () => void; onStatusChange: (online: boolean) => void }) {
  const [url, setUrl] = useState(() => getSupabaseCredentials().url)
  const [key, setKey] = useState(() => getSupabaseCredentials().key)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [checks, setChecks] = useState<Record<string, string | null> | null>(null)
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  const runCheck = async () => {
    const result = await checkCloudConnection()
    setChecks(result.checks)
    onStatusChange(result.ok)
    return result.ok
  }

  const handleTest = async () => {
    setBusy(true)
    setNotice(null)
    try {
      const ok = await runCheck()
      setNotice(ok ? { tone: 'success', text: 'Everything answers. The cloud is connected.' } : { tone: 'error', text: 'Some parts of the cloud database did not answer. Details below.' })
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async () => {
    if (!isValidSupabaseUrl(url)) {
      setNotice({ tone: 'error', text: 'The project URL should look like https://xxxx.supabase.co' })
      return
    }
    if (key.trim().length < 20) {
      setNotice({ tone: 'error', text: 'The anon / publishable key looks too short.' })
      return
    }
    setBusy(true)
    setNotice(null)
    saveSupabaseCredentials(url, key)
    try {
      const ok = await runCheck()
      if (ok) {
        setNotice({ tone: 'success', text: 'Connected! Reloading so every page uses the new project…' })
        window.setTimeout(() => window.location.reload(), 900)
      } else {
        setNotice({ tone: 'error', text: 'Saved on this device, but the project did not answer correctly. Check the URL/key, or run the setup SQL below.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async () => {
    clearSupabaseCredentials()
    const creds = getSupabaseCredentials()
    setUrl(creds.url)
    setKey(creds.key)
    setBusy(true)
    try {
      const ok = await runCheck()
      setNotice({ tone: ok ? 'success' : 'error', text: ok ? 'Back on the built-in project. Reloading…' : 'Back on the built-in project, but it did not answer.' })
      if (ok) window.setTimeout(() => window.location.reload(), 900)
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async () => {
    const ok = await copyText(SUPABASE_SETUP_SQL)
    setCopied(ok)
    if (!ok) setNotice({ tone: 'error', text: 'Copy failed. Open "Show the SQL" and copy it by hand.' })
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-gray-900/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloud-db-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 outline-none"
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="pr-8">
          <h2 id="cloud-db-title" className="font-serif text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-rose-500 shrink-0" aria-hidden="true" /> Cloud Database
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Letters, memories, polaroids and settings sync through Supabase, so every phone and computer sees the same thing.
          </p>
        </div>

        <Banner notice={notice} onClose={() => setNotice(null)} />

        <div className="space-y-3">
          <div>
            <label htmlFor="supa-url" className={ui.label}>
              Supabase project URL
            </label>
            <input id="supa-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" className={ui.input} />
          </div>
          <div>
            <label htmlFor="supa-key" className={ui.label}>
              Anon / publishable key
            </label>
            <textarea id="supa-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOi…" rows={3} className={ui.mono} />
            <p className={`${ui.hint} mt-1`}>Saved on this device only. The deployed site uses the project from the build settings.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={handleSave} disabled={busy} className={`${ui.primaryButton} flex-1`}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Save &amp; connect
            </button>
            <button type="button" onClick={handleTest} disabled={busy} className={ui.secondaryButton}>
              Test connection
            </button>
          </div>
          <button type="button" onClick={handleReset} disabled={busy} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Use the built-in project again
          </button>
        </div>

        {checks && (
          <ul className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-1.5 text-xs">
            {Object.entries(checks).map(([name, problem]) => (
              <li key={name} className="flex items-start gap-2">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${problem ? 'bg-red-500' : 'bg-emerald-500'}`} aria-hidden="true" />
                <span className="font-semibold text-gray-700 capitalize">{name}</span>
                <span className="text-gray-500 min-w-0 break-words">{problem ?? 'OK'}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-gray-800">1-minute database setup</span>
            <button type="button" onClick={handleCopy} className="flex items-center gap-1 text-xs text-rose-600 font-medium hover:underline">
              {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              {copied ? 'Copied!' : 'Copy SQL'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Paste it into your Supabase dashboard → <strong>SQL Editor</strong> → Run. It creates the tables, the public &quot;memories&quot; photo bucket and the permissions.
          </p>
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-800 select-none">Show the SQL</summary>
            <pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-gray-900 text-gray-100 p-3 text-[10px] leading-relaxed whitespace-pre">{SUPABASE_SETUP_SQL}</pre>
          </details>
        </div>
      </div>
    </div>
  )
}
