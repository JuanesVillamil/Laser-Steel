import { Resend } from "resend";

// Destinatario de prueba mientras se valida el flujo.
// Cuando el cliente confirme, cambiar a comercial@lasersteel.com.co
const RECIPIENT = "juanesvillamil@outlook.com";
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB — límite de Vercel Functions (Hobby)

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Falta configurar RESEND_API_KEY en las variables de entorno de Vercel." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();

    const get = (key) => (formData.get(key) || "").toString().trim();

    const nombre = get("nombre");
    const empresa = get("empresa");
    const cargo = get("cargo");
    const ciudad = get("ciudad");
    const telefono = get("telefono");
    const email = get("email");
    const requerimiento = get("requerimiento");
    const material = get("material");
    const cantidad = get("cantidad");
    const fecha = get("fecha");
    const ciudadEntrega = get("ciudadEntrega");
    const mensaje = get("mensaje");

    if (!nombre || !telefono || !email) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios (nombre, teléfono, correo)." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const files = formData.getAll("archivo").filter((f) => f && typeof f === "object" && f.size > 0);
    const attachments = [];

    if (files.length) {
      const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
      if (totalBytes > MAX_FILE_BYTES) {
        return new Response(JSON.stringify({ error: "Los archivos adjuntos superan el límite de 4 MB en total." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      for (const f of files) {
        const buffer = Buffer.from(await f.arrayBuffer());
        attachments.push({ filename: f.name, content: buffer });
      }
    }

    const rows = [
      ["Nombre", nombre],
      ["Empresa", empresa],
      ["Cargo", cargo],
      ["Ciudad", ciudad],
      ["Teléfono", telefono],
      ["Correo", email],
      ["Tipo de requerimiento", requerimiento],
      ["Material", material],
      ["Cantidad requerida", cantidad],
      ["Fecha estimada", fecha],
      ["Ciudad de entrega", ciudadEntrega],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666;font-family:sans-serif;">${escapeHtml(k)}</td><td style="padding:6px 12px;font-family:sans-serif;"><strong>${escapeHtml(v)}</strong></td></tr>`)
      .join("");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color:#d0122a;">Nueva solicitud de cotización — Laser Steel</h2>
        <table style="border-collapse:collapse; width:100%;">${rows}</table>
        ${mensaje ? `<p style="font-family:sans-serif;"><strong>Descripción del proyecto:</strong><br/>${escapeHtml(mensaje).replace(/\n/g, "<br/>")}</p>` : ""}
        ${attachments.length ? `<p style="font-family:sans-serif; color:#666;">Archivos adjuntos: ${attachments.map((a) => escapeHtml(a.filename)).join(", ")}</p>` : ""}
      </div>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Laser Steel Web <onboarding@resend.dev>",
      to: RECIPIENT,
      replyTo: email,
      subject: `Nueva cotización — ${nombre}${empresa ? " (" + empresa + ")" : ""}`,
      html,
      attachments,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message || "Error enviando el correo." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Error inesperado." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
