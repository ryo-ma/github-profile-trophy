abstract class BaseError {
  readonly status!: number;
  readonly message!: string;

  render(): string {
    return this.renderPage();
  }

  protected renderPage(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.status} — GitHub Profile Trophy</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: #f9f9f8;
      color: #18181b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 24px;
    }
    .code {
      font-size: 80px;
      font-weight: 200;
      letter-spacing: -0.04em;
      line-height: 1;
      color: #18181b;
      margin-bottom: 16px;
    }
    .label {
      font-size: 15px;
      color: #71717a;
      margin-bottom: 8px;
    }
    .detail {
      font-size: 13px;
      color: #a1a1aa;
      margin-bottom: 40px;
    }
    a.back {
      display: inline-block;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #71717a;
      text-decoration: none;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 2px;
      transition: color 0.15s, border-color 0.15s;
    }
    a.back:hover { color: #18181b; border-color: #18181b; }
  </style>
</head>
<body>
  <p class="eyebrow">GitHub Profile Trophy</p>
  <h1 class="code">${this.status}</h1>
  <p class="label">${this.message}</p>
  ${this.renderContent()}
  <a class="back" href="/">Return home</a>
</body>
</html>`;
  }

  protected renderContent(): string {
    return "";
  }
}

export class Error400 extends BaseError {
  readonly status = 400;
  readonly message = "Bad Request";

  constructor(private readonly baseUrl = "/") {
    super();
  }

  render(): string {
    const base = JSON.stringify(this.baseUrl);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Profile Trophy</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #f9f9f8;
      --surface: #ffffff;
      --text: #18181b;
      --muted: #71717a;
      --subtle: #a1a1aa;
      --border: #e4e4e7;
      --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      --mono: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px 48px;
    }
    header {
      text-align: center;
      margin-bottom: 40px;
    }
    .wordmark {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--subtle);
      margin-bottom: 20px;
    }
    header h1 {
      font-size: 26px;
      font-weight: 300;
      letter-spacing: -0.02em;
      color: var(--text);
      line-height: 1.3;
      margin-bottom: 8px;
    }
    header p {
      font-size: 14px;
      color: var(--muted);
    }
    main {
      width: 100%;
      max-width: 460px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 28px 32px;
    }
    .panel-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--subtle);
      margin-bottom: 14px;
    }
    .url-wrap {
      display: flex;
      align-items: stretch;
      border: 1px solid var(--border);
    }
    .url-text {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text);
      padding: 10px 14px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: var(--bg);
      line-height: 1.5;
    }
    .copy-btn {
      font-family: var(--font);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0 16px;
      background: var(--surface);
      color: var(--muted);
      border: none;
      border-left: 1px solid var(--border);
      cursor: pointer;
      transition: color 0.15s;
      white-space: nowrap;
    }
    .copy-btn:hover { color: var(--text); }
    .copy-feedback {
      font-size: 11px;
      color: var(--subtle);
      margin-top: 8px;
      height: 16px;
      letter-spacing: 0.04em;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--subtle);
    }
    input {
      font-family: var(--font);
      font-size: 14px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      outline: none;
      -webkit-appearance: none;
      border-radius: 0;
      transition: border-color 0.15s;
    }
    input:focus { border-color: var(--text); }
    input::placeholder { color: #c4c4c8; }
    .hint {
      font-size: 12px;
      color: var(--subtle);
      line-height: 1.5;
    }
    .hint a {
      color: var(--muted);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .hint a:hover { color: var(--text); }
    button[type="submit"] {
      font-family: var(--font);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 11px 24px;
      background: var(--text);
      color: var(--surface);
      border: none;
      cursor: pointer;
      align-self: flex-start;
      transition: opacity 0.15s;
    }
    button[type="submit"]:hover { opacity: 0.75; }
  </style>
</head>
<body>
  <header>
    <p class="wordmark">GitHub Profile Trophy</p>
    <h1>Generate your trophy card</h1>
    <p>Display your GitHub stats as trophies in your profile README</p>
  </header>
  <main>
    <div class="panel">
      <p class="panel-label">Your URL</p>
      <div class="url-wrap">
        <span class="url-text" id="url-display">${this.baseUrl}?username=USERNAME</span>
        <button class="copy-btn" type="button" id="copy-btn">Copy</button>
      </div>
      <p class="copy-feedback" id="copy-feedback"></p>
    </div>
    <div class="panel">
      <p class="panel-label">Get trophies</p>
      <form action="${this.baseUrl}" method="get">
        <div class="field">
          <label for="username">GitHub username</label>
          <input
            type="text"
            name="username"
            id="username"
            placeholder="e.g. torvalds"
            required
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
          >
        </div>
        <div class="field">
          <label for="theme">Theme <span style="opacity:0.4;font-weight:400;letter-spacing:0;">optional</span></label>
          <input type="text" name="theme" id="theme" placeholder="e.g. onedark, nord, flat">
          <p class="hint">Browse all themes in the <a href="https://github.com/ryo-ma/github-profile-trophy?tab=readme-ov-file#apply-theme" target="_blank" rel="noopener">documentation</a></p>
        </div>
        <button type="submit">View trophies</button>
      </form>
    </div>
  </main>
  <script>
    const copyBtn = document.getElementById('copy-btn');
    const feedback = document.getElementById('copy-feedback');
    const usernameInput = document.getElementById('username');
    const urlDisplay = document.getElementById('url-display');
    const base = ${base};

    usernameInput.addEventListener('input', () => {
      const val = usernameInput.value.trim();
      urlDisplay.textContent = val
        ? base + '?username=' + encodeURIComponent(val)
        : base + '?username=USERNAME';
    });

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(urlDisplay.textContent).then(() => {
        feedback.textContent = 'Copied to clipboard';
        setTimeout(() => { feedback.textContent = ''; }, 2000);
      });
    });
  </script>
</body>
</html>`;
  }
}

export class Error419 extends BaseError {
  readonly status = 419;
  readonly message = "Rate Limit Exceeded";

  protected renderContent(): string {
    return `<p class="detail">Too many requests. Please wait a moment and try again.</p>`;
  }
}

export class Error404 extends BaseError {
  readonly status = 404;
  readonly message = "Not Found";

  constructor(readonly content?: string) {
    super();
  }

  protected renderContent(): string {
    return this.content ? `<p class="detail">${this.content}</p>` : "";
  }
}
