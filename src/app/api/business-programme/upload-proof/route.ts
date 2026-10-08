import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please login first." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data, error: authError } = await admin.auth.getUser(token);
    if (authError || !data.user) return NextResponse.json({ error: "Your login session has expired." }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("proof");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Please upload your business proof." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Business proof must be 5 MB or smaller." }, { status: 400 });

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) return NextResponse.json({ error: "Upload a JPG, PNG, WEBP or PDF file." }, { status: 400 });

    const bucket = "business-programme-proofs";
    const { error: bucketError } = await admin.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: allowed,
    });
    if (bucketError && !/already exists|duplicate/i.test(bucketError.message || "")) throw bucketError;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
    const path = data.user.id + "/" + Date.now() + "-" + safeName;
    const { error: uploadError } = await admin.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    return NextResponse.json({ success: true, proofPath: path });
  } catch (error) {
    console.error("Business proof upload failed:", error);
    return NextResponse.json({ error: "Could not upload business proof. Please try again." }, { status: 400 });
  }
}
