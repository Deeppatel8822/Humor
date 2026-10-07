import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner } from "@/lib/marketingPartner";

async function getUser(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Please login first." }, { status: 401 });
  return NextResponse.json({
    partner: getPartner(user),
    application: user.user_metadata?.marketing_partner_application ?? null,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Please login first." }, { status: 401 });

    const formData = await request.formData();
    const businessName = String(formData.get("businessName") || "").trim();
    const gstPan = String(formData.get("gstPan") || "").trim().toUpperCase();
    const address = String(formData.get("address") || "").trim();
    const mobile = String(formData.get("mobile") || "").trim();
    const photos = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0).slice(0, 3);

    if (!businessName || !gstPan || !address || !mobile || photos.length !== 3) {
      return NextResponse.json({ error: "Please complete all details and upload exactly 3 business photos." }, { status: 400 });
    }
    if (photos.some((photo) => !photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024)) {
      return NextResponse.json({ error: "Each business photo must be an image up to 5 MB." }, { status: 400 });
    }

    const current = getPartner(user);
    if (current?.status === "approved") return NextResponse.json({ error: "You are already an approved Marketing Partner." }, { status: 409 });
    if (current?.status === "pending") return NextResponse.json({ error: "Your Marketing Partner application is already under review." }, { status: 409 });

    const admin = supabaseAdmin();
    const bucket = "vendor-business-photos";
    const { error: bucketError } = await admin.storage.createBucket(bucket, { public: false, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] });
    if (bucketError && !/already exists|duplicate/i.test(bucketError.message || "")) throw bucketError;

    const photoPaths: string[] = [];
    for (let index = 0; index < photos.length; index++) {
      const photo = photos[index];
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
      const path = `${user.id}/${Date.now()}-${index + 1}-${safeName}`;
      const { error: uploadError } = await admin.storage.from(bucket).upload(path, photo, {
        contentType: photo.type,
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      photoPaths.push(path);
    }

    const application = {
      status: "pending",
      businessName,
      gstPan,
      address,
      mobile,
      photoPaths,
      appliedAt: new Date().toISOString(),
    };

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        marketing_partner_application: application,
      },
    });
    if (error) throw error;

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Marketing partner application error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit application." }, { status: 400 });
  }
}
