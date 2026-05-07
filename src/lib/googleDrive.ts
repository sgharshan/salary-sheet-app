import type { Shift, Payout, Settings } from '../types'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const FILE_NAME = 'shiftlog-data.json'

export interface DriveData {
  shifts: Shift[]
  payouts: Payout[]
  settings: Partial<Settings>
  lastModified: string
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let accessToken: string | null = null
let tokenExpiry = 0  // epoch ms when current token expires

export function hasValidToken(): boolean {
  return !!accessToken && Date.now() < tokenExpiry
}

export function loadGsiScript(): Promise<void> {
  return new Promise(resolve => {
    if (document.getElementById('gsi-script')) { resolve(); return }
    const s = document.createElement('script')
    s.id = 'gsi-script'
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

export async function initTokenClient(clientId: string): Promise<void> {
  if (tokenClient) return
  await loadGsiScript()
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: () => {},
  })
}

// interactive=true  → shows account picker (first connect)
// interactive=false → silent attempt (auto-sync)
export function requestAccessToken(interactive = false): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error('Not initialised')); return }
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return }
      accessToken = resp.access_token
      tokenExpiry = Date.now() + 55 * 60 * 1000   // tokens last 1h, refresh at 55m
      resolve(resp.access_token)
    }
    tokenClient.requestAccessToken({ prompt: interactive ? 'select_account' : '' })
  })
}

async function findFile(): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  const json = await res.json()
  return json.files?.[0]?.id ?? null
}

export async function uploadData(data: DriveData): Promise<void> {
  if (!accessToken) return
  const body = JSON.stringify(data)
  const fileId = await findFile()

  if (fileId) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body,
    })
  } else {
    const meta = new Blob([JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' })], { type: 'application/json' })
    const content = new Blob([body], { type: 'application/json' })
    const form = new FormData()
    form.append('metadata', meta)
    form.append('file', content)
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    })
  }
}

export async function downloadData(): Promise<DriveData | null> {
  if (!accessToken) return null
  const fileId = await findFile()
  if (!fileId) return null
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}
