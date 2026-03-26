export enum EmailStatus {
  sent = "enviado",
  fail = "fallido",
  wait = "pendiente",
}

export type EmailMessage = {
  from: string;
  subject: string;
  body: string;
  to: string[];
  isHTML: boolean;
};

export type EmailResult = {
  messageID: string;
  status: EmailStatus;
  recipients: string[];
};

export interface EmailService {
  send(message: EmailMessage): EmailResult;

  sendBulk(messages: EmailMessage[]): EmailResult[];

  getStatus(messageID: string): EmailStatus;
}
