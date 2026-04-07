import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const checkPseudoSchema = z.object({
  pseudo: z.string({ error: "Le pseudo est requis." }).trim().min(1, "Le pseudo est requis."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkPseudoSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten();
      const pseudoErrors = errors.fieldErrors.pseudo ?? [];
      return NextResponse.json(
        {
          error: pseudoErrors[0] ?? "Requete invalide.",
          fieldErrors: errors.fieldErrors,
        },
        { status: 400 },
      );
    }

    const pseudo = parsed.data.pseudo;

    /* const user = await prisma.user.findUnique({
      where: { username: pseudo },
      select: { id: true },
    }); */

    return NextResponse.json({ exists: true });
  } catch (error) {
    console.error("Erreur lors de la verification du pseudo:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la verification du pseudo." },
      { status: 500 },
    );
  }
}
