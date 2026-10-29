import { Injectable } from '@angular/core';

export interface ContactPayload {
  name: string;
  email: string;
  company: string;
  message: string;
}

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

@Injectable({ providedIn: 'root' })
export class ContactService {
  async submit(payload: ContactPayload): Promise<void> {
    const accessKey = (
      globalThis as { __WEB3FORMS_ACCESS_KEY__?: string }
    ).__WEB3FORMS_ACCESS_KEY__?.trim();

    if (!accessKey) {
      throw new Error('The contact form is not configured yet.');
    }

    const response = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: 'New message from the Jencolink website',
        from_name: 'Jencolink website',
        name: payload.name,
        email: payload.email,
        company: payload.company,
        message: payload.message,
      }),
    });

    const body = (await response.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;
    if (!response.ok || !body?.success) {
      throw new Error(body?.message || 'Message could not be sent. Please try again.');
    }
  }
}
