import { describe, test, expect, beforeEach, vi } from "vitest";
import { smtpAdapter } from "../src/smtpAdapter.js";
import { EmailStatus } from "../src/type.js";
import { LegacySmtpClient } from "../src/legacySistem.js";

describe("smtpAdapter", () => {
  let mockClient: LegacySmtpClient;
  let adapter: smtpAdapter;

  beforeEach(() => {
    mockClient = {
      connect: vi.fn().mockReturnValue(0),
      disconnect: vi.fn().mockReturnValue(0),
      sendRaw: vi.fn(),
    } as unknown as LegacySmtpClient;

    adapter = new smtpAdapter(mockClient, "smtp.test.com", 25);
  });

  test("se conecta automáticamente al crearse", () => {
    expect(mockClient.connect).toHaveBeenCalledWith("smtp.test.com", 25);
  });

  test("send envía correctamente un email", () => {
    (mockClient.sendRaw as any).mockReturnValue(0);

    const result = adapter.send({
      from: "a@test.com",
      to: ["b@test.com"],
      subject: "Test",
      body: "Hello",
      isHTML: false,
    });

    expect(mockClient.sendRaw).toHaveBeenCalledWith(
      "a@test.com",
      "b@test.com",
      "Test",
      "Hello",
      false
    );

    expect(result.status).toBe(EmailStatus.sent);
    expect(result.messageID).toMatch(/^MSG-/);
  });

  test("convierte múltiples destinatarios correctamente", () => {
    (mockClient.sendRaw as any).mockReturnValue(0);

    adapter.send({
      from: "a@test.com",
      to: ["b@test.com", "c@test.com"],
      subject: "Test",
      body: "Hello",
      isHTML: false,
    });

    expect(mockClient.sendRaw).toHaveBeenCalledWith(
      "a@test.com",
      "b@test.com;c@test.com",
      "Test",
      "Hello",
      false
    );
  });

  test("mapea correctamente estados de enviado", () => {
    (mockClient.sendRaw as any).mockReturnValue(0);

    const result = adapter.send({
      from: "a@test.com",
      to: ["b@test.com"],
      subject: "Test",
      body: "Hello",
      isHTML: false,
    });

    expect(result.status).toBe(EmailStatus.sent);
  });

  test("mapea correctamente estados de fallo", () => {
    (mockClient.sendRaw as any).mockReturnValue(1);

    const result = adapter.send({
      from: "a@test.com",
      to: ["b@test.com"],
      subject: "Test",
      body: "Hello",
      isHTML: false,
    });

    expect(result.status).toBe(EmailStatus.fail);
  });

  test("mapea correctamente estados de espera", () => {
    (mockClient.sendRaw as any).mockReturnValue(2);

    const result = adapter.send({
      from: "a@test.com",
      to: ["b@test.com"],
      subject: "Test",
      body: "Hello",
      isHTML: false,
    });

    expect(result.status).toBe(EmailStatus.wait);
  });

  test("mapea correctamente estados desconocidos", () => {
    (mockClient.sendRaw as any).mockReturnValue(3);

    const result = adapter.send({
      from: "a@test.com",
      to: ["b@test.com"],
      subject: "Test",
      body: "Hello",
      isHTML: false,
    });

    expect(result.status).toBe(EmailStatus.fail);
  });

  test("sendBulk envía múltiples emails", () => {
    (mockClient.sendRaw as any).mockReturnValue(0);

    const results = adapter.sendBulk([
      {
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "1",
        body: "msg1",
        isHTML: false,
      },
      {
        from: "a@test.com",
        to: ["c@test.com"],
        subject: "2",
        body: "msg2",
        isHTML: false,
      },
    ]);

    expect(results.length).toBe(2);
    expect(mockClient.sendRaw).toHaveBeenCalledTimes(2);
  });

  test("sendBulk continúa si un envío falla", () => {
    (mockClient.sendRaw as any)
      .mockImplementationOnce(() => {
        throw new Error("fail");
      })
      .mockReturnValueOnce(0);

    const results = adapter.sendBulk([
      {
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "1",
        body: "msg1",
        isHTML: false,
      },
      {
        from: "a@test.com",
        to: ["c@test.com"],
        subject: "2",
        body: "msg2",
        isHTML: false,
      },
    ]);

    expect(results.length).toBe(2);
    expect(results[0].status).toBe(EmailStatus.fail);
    expect(results[1].status).toBe(EmailStatus.sent);
  });

  test("sendBulk envia mensajes con status aleatorios", () => {
    (mockClient.sendRaw as any).mockImplementation(() => Math.floor(Math.random() * 3));
    const results = adapter.sendBulk([
      {
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "1",
        body: "msg1",
        isHTML: false,
      },
      {
        from: "a@test.com",
        to: ["c@test.com"],
        subject: "2",
        body: "msg2",
        isHTML: false,
      },
      {
        from: "a@test.com",
        to: ["d@test.com"],
        subject: "3",
        body: "msg3",
        isHTML: false,
      },
    ]);

    expect(results.length).toBe(3);
    const validStatuses = [EmailStatus.sent, EmailStatus.fail, EmailStatus.wait];
    expect(validStatuses).toContain(results[0].status);
    expect(validStatuses).toContain(results[1].status);
    expect(validStatuses).toContain(results[2].status);
  });

  test("getStatus devuelve el estado correcto", () => {
    (mockClient.sendRaw as any).mockReturnValue(0);

    const result = adapter.send({
      from: "a@test.com",
      to: ["b@test.com"],
      subject: "Test",
      body: "Hello",
      isHTML: false,
    });

    const status = adapter.getStatus(result.messageID);

    expect(status).toBe(EmailStatus.sent);
  });

  test("getStatus devuelve fail si no existe", () => {
    const status = adapter.getStatus("fake-id");

    expect(status).toBe(EmailStatus.fail);
  });

  test("filter devuelve resultados por estado", () => {
    (mockClient.sendRaw as any)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1);

    adapter.send({
      from: "a@test.com",
      to: ["b@test.com"],
      subject: "1",
      body: "msg1",
      isHTML: false,
    });

    adapter.send({
      from: "a@test.com",
      to: ["c@test.com"],
      subject: "2",
      body: "msg2",
      isHTML: false,
    });

    const sent = adapter.filter(EmailStatus.sent);
    const failed = adapter.filter(EmailStatus.fail);

    expect(sent.length).toBe(1);
    expect(failed.length).toBe(1);
  });

  test("close cierra la conexión", () => {
    adapter.close();
    expect(mockClient.disconnect).toHaveBeenCalled();
  });
});