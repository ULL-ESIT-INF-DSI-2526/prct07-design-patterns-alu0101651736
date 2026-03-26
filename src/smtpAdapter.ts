import { LegacySmtpClient } from "./legacySistem.js";
import {
  EmailMessage,
  EmailService,
  EmailResult,
  EmailStatus,
} from "./type.js";

/**
 * Clase adaptadora para LegacySmtpClient
 * @param _cliente el cliente en el sistema de legado
 * @param _results un mapa que contiene el ID del mensaje y su resultado
 * @param _counter contador para calcular los IDs de mensajes
 */
export class smtpAdapter implements EmailService {
  private _cliente: LegacySmtpClient;
  private _results: Map<string, EmailResult> = new Map();
  private _counter: number = 0;

  /**
   * Constructor del adaptador, guarda la clase de legado del sistema
   * @param cliente el objeto cliente
   * @param host ID del host
   * @param port numero del puerto
   */
  constructor(cliente: LegacySmtpClient, host: string, port: number) {
    this._cliente = cliente;
    this._cliente.connect(host, port);
  }

  /**
   * Cierra la conexion con el cliente
   */
  close(): void {
    this._cliente.disconnect();
  }

  /**
   * crea una ID de mensaje usando el tiempo actual y un contador
   * @returns el ID del mensaje
   */
  private generateMessageID(): string {
    this._counter++;
    return `MSG-${Date.now()}-${this._counter}`;
  }

  /**
   * funcion que toma un codigo numerico y lo pasa a el enumerado de estado
   * @param code codigo de estado
   * @returns El resultado en el enumerado
   */
  private mapStatus(code: number): EmailStatus {
    switch (code) {
      case 0:
        return EmailStatus.sent;
      case 1:
        return EmailStatus.fail;
      case 2:
        return EmailStatus.wait;
      default:
        return EmailStatus.fail;
    }
  }

  /**
   * Adaptacion para poder enviar mensajes usando el sistema de legado
   * @param message mensaje a enviar
   * @returns el resultado del envio
   */
  send(message: EmailMessage): EmailResult {
    const messageId = this.generateMessageID();
    const toString = message.to.join(";");

    const code = this._cliente.sendRaw(
      message.from,
      toString,
      message.subject,
      message.body,
      message.isHTML,
    );

    const status = this.mapStatus(code);

    const result: EmailResult = {
      messageID: messageId,
      status: status,
      recipients: message.to,
    };

    this._results.set(messageId, result);

    return result;
  }

  /**
   * Funcion que permite enviar multiples mensajes a la vez
   * @param messages mensajes a enviar
   * @returns un vector con los resultados de los envios
   */
  sendBulk(messages: EmailMessage[]): EmailResult[] {
    const results: EmailResult[] = [];

    for (const message of messages) {
      try {
        const result = this.send(message);
        results.push(result);
      } catch (error) {
        console.error("Error enviando email:", error);

        const failedMessage: EmailResult = {
          messageID: this.generateMessageID(),
          status: EmailStatus.fail,
          recipients: message.to,
        };

        this._results.set(failedMessage.messageID, failedMessage);
        results.push(failedMessage);
      }
    }
    return results;
  }

  /**
   * Busca el estado de un mensaje en concreto
   * @param messageID ID del mensaje a buscar
   * @returns El estado del mensaje
   */
  getStatus(messageID: string): EmailStatus {
    const result = this._results.get(messageID);

    if (!result) {
      console.warn(`ID de mensaje ${messageID} no se encontro`);
      return EmailStatus.fail;
    }

    return result.status;
  }

  /**
   * Funcion de filtrado de estados
   * @param status Tipo de estado que queremos buscar
   * @returns Los resultados de los mensaje que son del tipo status
   */
  filter(status: EmailStatus): EmailResult[] {
    return Array.from(this._results.values()).filter(
      (result) => result.status === status,
    );
  }
}
