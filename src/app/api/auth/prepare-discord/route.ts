import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const prepareDiscordSchema = z.object({
  pseudo: z
    .string({ error: "Le pseudo est requis." })
    .trim()
    .min(1, "Le pseudo est requis."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = prepareDiscordSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten();
      return NextResponse.json(
        { error: errors.fieldErrors.pseudo?.[0] ?? "Requete invalide." },
        { status: 400 },
      );
    }

    const pseudo = parsed.data.pseudo;

    const user = await prisma.user.findFirst({
      where: { username: pseudo },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Pseudo introuvable." }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("validated_pseudo", pseudo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("Erreur lors de la preparation Discord:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la preparation Discord." },
      { status: 500 },
    );
  }
}
