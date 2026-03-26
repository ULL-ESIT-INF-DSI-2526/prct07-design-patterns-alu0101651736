export class LegacySmtpClient {
  private _connected: boolean = false;
  private _host: string = "";
  private _port: number = -1;
  connect(host: string, port: number): number {
    if (this._connected) {
      throw Error(
        `[SMTP] Client already connected to ${this._host}:${this._port}`,
      );
    }
    console.log(`[SMTP] Connected to ${host}:${port}`);
    this._host = host;
    this._port = port;
    this._connected = true;
    return 0;
  }

  disconnect(): number {
    if (!this._connected) {
      console.log("HERE");
      throw Error("[SMTP] The client is not connected. Nothing to disconnect");
    }
    console.log(`[SMTP] Disconnected`);
    this._connected = false;
    this._host = "";
    this._port = -1;
    return 0;
  }

  sendRaw(
    from: string,
    to: string,
    subject: string,
    body: string,
    isHtml: boolean,
  ): number {
    // 0 = success, 1 = error, 2 = pending
    if (this._connected) {
      console.log(this._connected);
      console.log(
        `[SMTP] Sending from ${from} to [${to}] | subject: "${subject}"`,
      );
      return Math.floor(Math.random() * 3);
    } else {
      throw new Error(`[SMTP] Client not connected yet!`);
    }
  }
}