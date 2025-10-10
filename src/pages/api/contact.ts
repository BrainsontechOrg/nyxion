import type { APIRoute } from "astro";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

function escapeHTML(input: unknown) {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email: string) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 5000;
const MIN_MESSAGE_LENGTH = 10;

export const POST: APIRoute = async ({ request }) => {
  try {

    const origin = request.headers.get("origin");

    if (!origin || !origin.includes(import.meta.env.PUBLIC_SITE_URL)) {
      console.warn("[Seguridad] Solicitud bloqueada: origen no permitido =>", origin);
      return new Response(
        JSON.stringify({ success: false, error: "Origen no permitido." }),
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ success: false, error: "Solicitud no válida." }),
        { status: 415 }
      );
    }

    const data = await request.json().catch(() => null);
    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "Datos enviados no válidos." }),
        { status: 400 }
      );
    }

    if (data.website) {
      console.warn("[Antispam] Intento bloqueado por honeypot");
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: import.meta.env.RECAPTCHA_SECRET_KEY,
        response: data.token,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success || verifyData.score < 0.5) {
      return new Response(JSON.stringify({ success: false, error: "Captcha inválido o sospechoso." }), { status: 400 });
    }


    const { name, email, phone, service, message } = data;

    // --- Validaciones ---
    if (!name || !email || !phone || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Por favor, completa todos los campos obligatorios." }),
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "El correo electrónico no tiene un formato válido." }),
        { status: 400 }
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "El nombre es demasiado largo." }),
        { status: 400 }
      );
    }

    if (message.length < MIN_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "El mensaje es demasiado corto." }),
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "El mensaje supera el tamaño permitido." }),
        { status: 400 }
      );
    }

    if (phone && !/^(?:\+34|0034)?\s?[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3}$/.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Introduce un número de teléfono válido" }),
        { status: 400 }
      );
    }


    const ALLOWED_SERVICES = new Set([
      "preventiva",
      "reactiva",
      "avanzada",
      "formacion",
      "consulta"
    ]);

    if (!service || service === "interes") {
      return new Response(
        JSON.stringify({ success: false, error: "Debes seleccionar un servicio." }),
        { status: 400 }
      );
    }

    if (!ALLOWED_SERVICES.has(service)) {
      return new Response(
        JSON.stringify({ success: false, error: "El servicio seleccionado no es válido." }),
        { status: 400 }
      );
    }

    if (phone) {
      const cleanPhone = phone.replace(/[\s-]/g, "");

      const isValidSpanishPhone = /^(?:\+34|0034)?[6789]\d{8}$/.test(cleanPhone);

      if (!isValidSpanishPhone) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Introduce un número de teléfono válido de España.",
          }),
          { status: 400 }
        );
      }
    }

    // --- Escapado seguro ---
    const safeName = escapeHTML(name);
    const safeEmail = escapeHTML(email);
    const safeMessage = escapeHTML(message);
    const safePhone = escapeHTML(phone || "—");

    const SERVICE_LABELS: Record<string, string> = {
      preventiva: "Ciberseguridad Preventiva",
      reactiva: "Ciberseguridad Reactiva",
      avanzada: "Ciberseguridad Avanzada",
      formacion: "Formación y Concienciación",
      consulta: "Consulta General"
    };
    const readableService = SERVICE_LABELS[service] || "Otro";

    // --- Enviar correo ---
    await resend.emails.send({
      from: "Nyxion <info@nyxionsec.com>",
      to: ["info@nyxionsec.com"],
      subject: `NYXION - Nueva consulta desde la web`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 20px; border-radius: 8px; color: #333;">
          <h2 style="color: #6A5BF0;">Nueva consulta desde <strong>NYXION</strong></h2>
          <p><strong>Nombre:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Teléfono:</strong> ${safePhone}</p>
          <p><strong>Servicio:</strong> ${readableService}</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
          <p><strong>Mensaje:</strong></p>
          <p style="white-space:pre-line;">${safeMessage}</p>
        </div>`,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("[Contact API] Error interno:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor." }),
      { status: 500 }
    );
  }
};
