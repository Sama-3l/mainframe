import { NextResponse } from "next/server";
import { PairRequestSchema } from "./schema";
import { consumePairingToken, PairingResult } from "../../../../../../shared/src";

export async function POST(request: Request){
    const parsed = PairRequestSchema.safeParse(request.body);
    if (!parsed.success) {
        return NextResponse.json({ 
            success : false, 
            error: "invalid_request", 
            message: " Request Body doesn't match " 
        }, 
        { status: 400 });
    }

    const { platform, name, pairingToken } = parsed.data;
    const result : PairingResult | null = consumePairingToken(pairingToken, { name: name, platform: platform });

    if(!result){
        return NextResponse.json({
            success: true, 
            data: result, 
            message: "Authentication Successful" 
        }, 
        { status: 200 });
    } else {
        return NextResponse.json({ 
            success : false, 
            error: "invalid_request", 
            message: " Invalid Pairing Token " 
        }, 
        { status: 400 });
    }
}