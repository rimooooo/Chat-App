import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("CLERK_WEBHOOK_SECRET not set");

    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    const body = await request.text();

    const wh = new Webhook(webhookSecret);
    let event: WebhookEvent;

    try {
      event = wh.verify(body, {
        "svix-id": svix_id!,
        "svix-timestamp": svix_timestamp!,
        "svix-signature": svix_signature!,
      }) as WebhookEvent;
    } catch {
      return new Response("Invalid webhook", { status: 400 });
    }

    if (event.type === "user.created") {
      const { id, email_addresses, full_name, image_url } = event.data as any;

      await ctx.runMutation(api.users.createUser, {
        clerkId: id,
        email: email_addresses[0].email_address,
        name: full_name || "User",
        imageUrl: image_url || "",
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
