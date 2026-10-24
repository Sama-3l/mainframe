import { NextResponse } from "next/server";
import { PairRequestSchema } from "./schema";
import { consumePairingToken } from "../../../../../../shared/src/pairing";
import type { PairingResult } from "../../../../../../shared/src/types";

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: "invalid_request",
                message: "Request body must contain valid JSON.",
            },
            { status: 400 }
        );
    }

    const parsed = PairRequestSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                success: false,
                error: "invalid_request",
                message: "Request body doesn't match the expected schema.",
            },
            { status: 400 }
        );
    }

    const { platform, name, pairingToken } = parsed.data;

    const result: PairingResult | null = consumePairingToken(
        pairingToken,
        { name, platform }
    );

    if (!result) {
        return NextResponse.json(
            {
                success: false,
                error: "invalid_pairing_token",
                message: "Invalid or expired pairing token.",
            },
            { status: 401 }
        );
    }

    return NextResponse.json(
        {
            success: true,
            data: result,
            message: "Authentication successful.",
        },
        { status: 200 }
    );
}