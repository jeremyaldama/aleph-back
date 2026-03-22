import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api-spec')
  @Header('content-type', 'text/html; charset=utf-8')
  getApiSpecSite(): string {
    const docsPath = process.env.SWAGGER_PATH ?? 'docs';
    const jsonPath = `/${docsPath}-json`;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Aleph API Spec</title>
    <style>
      :root {
        --bg: #0f172a;
        --card: #111827;
        --line: #1f2937;
        --text: #e5e7eb;
        --muted: #9ca3af;
        --accent: #22c55e;
      }
      body {
        margin: 0;
        background: radial-gradient(circle at top left, #1e293b, var(--bg) 45%);
        color: var(--text);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      }
      .wrap {
        max-width: 980px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
      .card {
        border: 1px solid var(--line);
        border-radius: 16px;
        background: linear-gradient(180deg, #111827, #0b1220);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
        padding: 1rem;
      }
      h1 {
        margin: 0 0 0.5rem;
        font-size: 1.6rem;
      }
      p {
        margin: 0.3rem 0;
        color: var(--muted);
      }
      .actions {
        margin: 1rem 0;
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      a,
      button {
        border: 1px solid var(--line);
        background: #111827;
        color: var(--text);
        border-radius: 10px;
        padding: 0.6rem 0.85rem;
        text-decoration: none;
        cursor: pointer;
      }
      button.primary {
        border-color: #14532d;
        background: #14532d;
      }
      button.primary:hover {
        background: #166534;
      }
      pre {
        margin-top: 0.8rem;
        max-height: 65vh;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #0b1220;
        padding: 0.85rem;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.8rem;
      }
      .ok {
        color: var(--accent);
      }
      .err {
        color: #f87171;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>Aleph Swagger JSON</h1>
        <p>OpenAPI JSON endpoint: <strong>${jsonPath}</strong></p>
        <p>Swagger UI endpoint: <strong>/${docsPath}</strong></p>

        <div class="actions">
          <a href="/${docsPath}" target="_blank" rel="noreferrer">Open Swagger UI</a>
          <a href="${jsonPath}" target="_blank" rel="noreferrer">Open Raw JSON</a>
          <button id="download" class="primary">Download openapi.json</button>
        </div>

        <p id="status">Loading specification...</p>
        <pre id="json">Loading...</pre>
      </div>
    </div>

    <script>
      const jsonPath = ${JSON.stringify(jsonPath)};
      const statusEl = document.getElementById('status');
      const preEl = document.getElementById('json');
      const downloadBtn = document.getElementById('download');

      let specData = null;

      async function loadSpec() {
        try {
          const response = await fetch(jsonPath, { headers: { accept: 'application/json' } });
          if (!response.ok) {
            throw new Error('Could not load OpenAPI JSON. Status: ' + response.status);
          }

          specData = await response.json();
          preEl.textContent = JSON.stringify(specData, null, 2);
          statusEl.textContent = 'Specification loaded successfully.';
          statusEl.className = 'ok';
        } catch (error) {
          preEl.textContent = String(error?.message ?? error);
          statusEl.textContent = 'Failed to load specification.';
          statusEl.className = 'err';
        }
      }

      downloadBtn.addEventListener('click', () => {
        if (!specData) {
          return;
        }
        const blob = new Blob([JSON.stringify(specData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'openapi.json';
        a.click();
        URL.revokeObjectURL(url);
      });

      loadSpec();
    </script>
  </body>
</html>`;
  }
}
