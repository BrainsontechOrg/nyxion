import { defineAction, ActionError } from "astro:actions";
import { Resend } from "resend";
import { z } from "astro:schema";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const server = {
  send: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      email: z.string().email(),
      service: z.string().optional(),
      message: z.string(),
    }),
    handler: async ({ name, email, service, message }) => {
      console.log("📩 Acción ejecutada correctamente");
      console.log({ name, email, service, message });

      try {
        /*
        await resend.emails.send({
          from: "Nyxion <info@nyxioncybersecurity.com>",
          to: ["info@nyxioncybersecurity.com"],
          subject: `Nueva consulta de ${name}`,
          html: `
            <h3>Nueva consulta desde el sitio web</h3>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Servicio:</strong> ${service || ""}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${message}</p>
          `,
        });
        */

        // Devuelve algo simple solo para debug
        return { success: true };
      } catch (err: any) {
        console.error("❌ Error en la acción:", err);
        throw new ActionError({
          code: "BAD_REQUEST",
          message: err.message,
        });
      }
    },
  }),
};
