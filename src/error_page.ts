abstract class BaseError {
  readonly status!: number;
  readonly message!: string;
  constructor(readonly content?: string) {}
  render() {
    return this.renderPage();
  }

  private renderPage() {
    return `<!DOCTYPE html>
    <html lang="en"><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GitHub Profile Trophy</title>
      <meta name="description" content="🏆 Add dynamically generated GitHub Stat Trophies on your readme">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        h1,
        h2 {
          color: #333;
        }
        p {
          color: #666;
        }
        #back-link {
          display: flex;
          justify-content: center;
          text-decoration: none;
        }
        #back-link:hover {
          text-decoration: underline;
        }
        section {
          width: 80%;
          margin: 0 auto;
          padding: 20px;
        }
        div {
          background-color: #fff;
          border-radius: 5px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
        }
        form {
          display: flex;
          flex-direction: column;
        }
        label {
          margin-bottom: 10px;
        }
        input {
          padding: 12px;
          margin-bottom: 20px;
          border-radius: 5px;
          border: 1px solid #ddd;
        }
        button {
          padding: 10px 20px;
          background-color: #333;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        #base-show {
          font-size: 16px;
          color: #333;
          background-color: #f4f4f4;
          padding: 10px;
          border-radius: 5px;
          text-align: center;
          margin: 10px 0;
        }
        button:hover {
          background-color: #444;
        }
        @media (max-width: 768px) {
          #base-show {
            font-size: 14px;
          }
        }
        @media (max-width: 480px) {
          #base-show {
            font-size: 8px;
          }
        }
        @media (min-width: 768px) {
          section {
            width: 60%;
          }
        }
        @media (min-width: 1024px) {
          section {
            width: 50%;
          }
        }
      </style>
    </head>
    <body>
      <h1 style="text-align: center;">${this.status} - ${this.message}</h1>
      <p style="text-align: center;">${this.content ?? ""}</p>
      ${
      this.content &&
      '<a id="back-link" href="/">Go back</a>'
    }
    </body>
    </html>`;
  }
}

export class Error400 extends BaseError {
  readonly status = 400;
  readonly message = "Bad Request";
}

export class Error419 extends BaseError {
  readonly status = 419;
  readonly message = "Rate Limit Exceeded";
}

export class Error404 extends BaseError {
  readonly status = 404;
  readonly message = "Not Found";
}
